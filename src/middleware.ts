import { NextResponse, NextRequest } from 'next/server'

// Optional: Upstash rate limiting (enabled only if env vars are present)
let upstashAvailable = false as boolean
let RatelimitCls: any = null
let RedisCls: any = null
let apiLimiter: any = null
let authLimiter: any = null

try {
  // Dynamically require to avoid bundling when not used
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Ratelimit } = require('@upstash/ratelimit')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Redis } = require('@upstash/redis')

  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const redis = Redis.fromEnv()
    RatelimitCls = Ratelimit
    RedisCls = Redis
    apiLimiter = new RatelimitCls({
      redis,
      limiter: RatelimitCls.slidingWindow(60, '1 m'), // 60 req/min per IP for /api
      analytics: true,
    })
    authLimiter = new RatelimitCls({
      redis,
      limiter: RatelimitCls.slidingWindow(30, '1 m'), // 30 req/min per IP for /api/auth
      analytics: true,
    })
    upstashAvailable = true
  }
} catch {
  upstashAvailable = false
}

function getClientIp(req: NextRequest): string {
  const xf = req.headers.get('x-forwarded-for')
  if (xf) return xf.split(',')[0].trim()
  const xr = req.headers.get('x-real-ip')
  if (xr) return xr
  // @ts-expect-error: ip may exist in some runtimes
  if (req.ip) return (req as any).ip
  return '127.0.0.1'
}

function applySecurityHeaders(res: NextResponse) {
  const headers = res.headers
  headers.set('X-Frame-Options', 'DENY')
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('Permissions-Policy', "camera=(), microphone=(), geolocation=(), payment=()")
  // HSTS (only enable after confirming HTTPS)
  headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  // Relaxed CSP to avoid breaking Next.js; tune for your domain(s)
  headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self' https: data: blob:",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
      "style-src 'self' 'unsafe-inline' https:",
      "img-src 'self' data: https:",
      "connect-src 'self' https: wss:",
      "frame-ancestors 'none'",
    ].join('; ')
  )
}

export async function middleware(req: NextRequest) {
  const { pathname } = new URL(req.url)

  // Basic health for HEAD/OPTIONS passthrough
  if (req.method === 'OPTIONS' || req.method === 'HEAD') {
    const pre = NextResponse.next()
    applySecurityHeaders(pre)
    return pre
  }

  // Rate limiting for API/Auth if Upstash configured
  if (upstashAvailable && (pathname.startsWith('/api') || pathname.startsWith('/auth'))) {
    const ip = getClientIp(req)
    const limiter = pathname.startsWith('/api/auth') || pathname.startsWith('/auth') ? authLimiter : apiLimiter
    try {
      const { success, limit, remaining, reset } = await limiter.limit(ip)
      if (!success) {
        const tooMany = NextResponse.json({ error: 'Too many requests' }, { status: 429 })
        tooMany.headers.set('X-RateLimit-Limit', String(limit))
        tooMany.headers.set('X-RateLimit-Remaining', String(Math.max(0, remaining)))
        tooMany.headers.set('X-RateLimit-Reset', String(reset))
        applySecurityHeaders(tooMany)
        return tooMany
      }
    } catch {
      // If limiter fails, continue without blocking
    }
  }

  const res = NextResponse.next()
  applySecurityHeaders(res)
  return res
}

export const config = {
  // Run on all routes so headers apply globally; rate limiting applies only to /api,/auth in code
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)'],
}


