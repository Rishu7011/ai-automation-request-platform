import type { NextAuthConfig } from 'next-auth';
import NextAuth from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as unknown as { username: string }).username;
        token.department = (user as unknown as { department: string }).department;
        token.role = (user as unknown as { role: string }).role;
        token.status = (user as unknown as { status: string }).status;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as unknown as { username: string }).username = token.username as string;
        (session.user as unknown as { department: string }).department = token.department as string;
        (session.user as unknown as { role: string }).role = token.role as string;
        (session.user as unknown as { status: string }).status = token.status as string;
      }
      return session;
    },
  },
  providers: [],
  session: {
    strategy: 'jwt',
  },
  secret: process.env.SESSION_SECRET || 'super-secret-random-key-change-in-production',
} satisfies NextAuthConfig;

export const { auth } = NextAuth(authConfig);
