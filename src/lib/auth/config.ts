import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/database/prisma";
import { loginUserSchema } from "@/lib/validations";

export const config = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Credentials Provider (Email/Password)
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
    // @ts-ignore - NextAuth callback parameter types
    async jwt({ token, user, account, trigger, session }) {
      // Persist user info to token
      if (user) {
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.newsletter = user.newsletter;
        token.createdAt = user.createdAt;
        token.isAdmin = user.isAdmin;  // Add isAdmin to token
      }
      
      // Refresh user data from database if needed (on session update or if newsletter/isAdmin field is missing)
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
              isAdmin: true,  // Include isAdmin in refresh
            },
          });
          
          if (freshUser) {
            token.role = freshUser.role;
            token.firstName = freshUser.firstName;
            token.lastName = freshUser.lastName;
            token.newsletter = freshUser.newsletter;
            token.createdAt = freshUser.createdAt;
            token.isAdmin = freshUser.isAdmin;  // Update isAdmin
          }
        } catch (error) {
          console.error("Error refreshing user data in JWT:", error);
        }
      }
      
      // Handle credentials account login tracking
      if (account?.provider === "credentials" && user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
      }
      
      return token;
    },
    
    // @ts-ignore - NextAuth callback parameter types
    async session({ session, token }) {
      // Send properties to the client
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.newsletter = token.newsletter as boolean;
        session.user.createdAt = token.createdAt as Date;
        session.user.isAdmin = token.isAdmin as boolean;  // Add isAdmin to session
      }
      
      return session;
    },
    
    // @ts-ignore - NextAuth callback parameter types
    async signIn({ user, account }) {
      // All sign-ins are now through credentials provider
      // User validation and creation is handled in the authorize function
      return true;
    },
  },
  
  events: {
    // @ts-ignore - NextAuth callback parameter types
    async signIn({ user, isNewUser }) {
      if (isNewUser) {
        console.log(`New user signed up: ${user.email}`);
        // Here you could send a welcome email, track analytics, etc.
      }
    },
  },
  
  debug: process.env.NODE_ENV === "development",
};

// Export for backward compatibility
export const authOptions = config;

export const { handlers, auth, signIn, signOut } = NextAuth(config as any);

// Export getServerSession function for backward compatibility
export const getServerSession = auth;
