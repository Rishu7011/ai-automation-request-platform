import type { NextAuthConfig } from 'next-auth';
import NextAuth from 'next-auth';

export const authConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.SESSION_SECRET || '9f8c14e7a25b3901d8e3c4f6b21a8d05e9c731b4028fa65e123d4e5f6789abcd',
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
} satisfies NextAuthConfig;

export const { auth } = NextAuth(authConfig);
