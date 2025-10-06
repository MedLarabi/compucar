import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dimensions: string[] }> }
) {
  try {
    const { dimensions } = await params;
    
    // Parse dimensions (e.g., ["600", "600"] or ["400", "400"])
    const width = parseInt(dimensions[0]) || 400;
    const height = parseInt(dimensions[1]) || width; // Square by default
    
    // Validate dimensions (reasonable limits)
    const maxDimension = 2000;
    const finalWidth = Math.min(Math.max(width, 50), maxDimension);
    const finalHeight = Math.min(Math.max(height, 50), maxDimension);
    
    // Create SVG placeholder
    const svg = `
      <svg width="${finalWidth}" height="${finalHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <rect x="20%" y="20%" width="60%" height="60%" fill="#e5e7eb" rx="8"/>
        <circle cx="35%" cy="35%" r="8%" fill="#d1d5db"/>
        <rect x="45%" y="30%" width="35%" height="4%" fill="#d1d5db" rx="2"/>
        <rect x="45%" y="38%" width="25%" height="4%" fill="#d1d5db" rx="2"/>
        <rect x="45%" y="46%" width="30%" height="4%" fill="#d1d5db" rx="2"/>
        <text x="50%" y="75%" text-anchor="middle" fill="#9ca3af" font-family="Arial, sans-serif" font-size="${Math.max(12, finalWidth / 30)}">
          ${finalWidth} × ${finalHeight}
        </text>
      </svg>
    `.trim();
    
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error('Placeholder API error:', error);
    
    // Return a simple fallback SVG
    const fallbackSvg = `
      <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" text-anchor="middle" fill="#9ca3af" font-family="Arial, sans-serif" font-size="16">
          No Image
        </text>
      </svg>
    `;
    
    return new NextResponse(fallbackSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }
}
