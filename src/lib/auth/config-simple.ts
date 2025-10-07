import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

export const config = {
  providers: [
    // Google OAuth Provider (optional - will work without credentials)
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "dummy",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy",
    }),
    
    // GitHub OAuth Provider (optional - will work without credentials)
    GitHub({
      clientId: process.env.GITHUB_ID || "dummy", 
      clientSecret: process.env.GITHUB_SECRET || "dummy",
    }),
  ],
  
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  callbacks: {
    // @ts-ignore - NextAuth callback parameter types
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.role = "CUSTOMER";
        token.firstName = user.name?.split(" ")[0] || "";
        token.lastName = user.name?.split(" ").slice(1).join(" ") || "";
      }
      return token;
    },
    
    // @ts-ignore - NextAuth callback parameter types
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
      }
      return session;
    },
  },
  
  debug: process.env.NODE_ENV === "development",
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);

























































