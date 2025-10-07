import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/database/prisma";
import { loginUserSchema } from "@/lib/validations";

// Production-safe auth configuration without OAuth dependencies
export const config = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Credentials Provider (Email/Password) - Always works
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Validate input using Zod
          const { email, password } = loginUserSchema.parse(credentials);

          // Find user in database
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            return null;
          }

          // Check if user has a password (OAuth users might not)
          if (!user.password) {
            return null;
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(password, user.password);
          if (!isPasswordValid) {
            return null;
          }

          // Return user object
          return {
            id: user.id,
            email: user.email,
            name: user.name || `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            image: user.image,
            newsletter: user.newsletter,
            createdAt: user.createdAt,
            isAdmin: user.isAdmin,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  
  pages: {
    signIn: "/auth/login",
    signUp: "/auth/register",
    error: "/auth/error",
  },
  
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  
  callbacks: {
    async jwt({ token, user, trigger }: { token: any; user: any; trigger?: string }) {
      // Persist user info to token
      if (user) {
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.newsletter = user.newsletter;
        token.createdAt = user.createdAt;
        token.isAdmin = user.isAdmin;
      }
      
      // Refresh user data from database if needed
      if (trigger === "update" || (token.sub && (token.newsletter === undefined || token.isAdmin === undefined))) {
        try {
          const freshUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: {
              role: true,
              firstName: true,
              lastName: true,
              newsletter: true,
              createdAt: true,
              isAdmin: true,
            },
          });
          
          if (freshUser) {
            token.role = freshUser.role;
            token.firstName = freshUser.firstName;
            token.lastName = freshUser.lastName;
            token.newsletter = freshUser.newsletter;
            token.createdAt = freshUser.createdAt;
            token.isAdmin = freshUser.isAdmin;
          }
        } catch (error) {
          console.error("Error refreshing user data in JWT:", error);
        }
      }
      
      // Handle credentials account login tracking
      if (user) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });
        } catch (error) {
          console.error("Error updating last login:", error);
        }
      }
      
      return token;
    },
    
    async session({ session, token }: { session: any; token: any }) {
      // Send properties to the client
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.newsletter = token.newsletter as boolean;
        session.user.createdAt = token.createdAt as Date;
        session.user.isAdmin = token.isAdmin as boolean;
      }
      
      return session;
    },
    
    async signIn({ user }: { user: any }) {
      // All sign-ins are through credentials provider
      return true;
    },
  },
  
  events: {
    async signIn({ user, isNewUser }: { user: any; isNewUser?: boolean }) {
      if (isNewUser) {
        console.log(`New user signed up: ${user.email}`);
      }
    },
  },
  
  // Enable debug only in development
  debug: process.env.NODE_ENV === "development",
  
  // Ensure proper error handling
  logger: {
    error(code: string, metadata?: any) {
      console.error(`NextAuth Error [${code}]:`, metadata);
    },
    warn(code: string) {
      console.warn(`NextAuth Warning [${code}]`);
    },
    debug(code: string, metadata?: any) {
      if (process.env.NODE_ENV === "development") {
        console.debug(`NextAuth Debug [${code}]:`, metadata);
      }
    },
  },
};

// Export for backward compatibility
export const authOptions = config;

export const { handlers, auth, signIn, signOut } = NextAuth(config);

// Export getServerSession function for backward compatibility
export const getServerSession = auth;
