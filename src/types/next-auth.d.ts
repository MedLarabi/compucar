import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      firstName?: string;
      lastName?: string;
      newsletter?: boolean;
      createdAt?: Date;
      isAdmin?: boolean;  // Add isAdmin flag
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
    firstName?: string;
    lastName?: string;
    newsletter?: boolean;
    createdAt?: Date;
    isAdmin?: boolean;  // Add isAdmin flag
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    firstName?: string;
    lastName?: string;
    newsletter?: boolean;
    createdAt?: Date;
    isAdmin?: boolean;  // Add isAdmin flag
  }
}
