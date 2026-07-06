import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/db';
import clientPromise from '@/lib/mongodb-client';
import User from '@/models/User';
import { authConfig } from './auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username or Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          await connectToDatabase();

          const input = (credentials.username as string).toLowerCase().trim();
          const user = await User.findOne({
            $or: [{ username: input }, { email: input }],
          });

          if (!user) {
            console.warn('[AUTH] No user found for:', input);
            return null;
          }

          const isValidPassword = await bcrypt.compare(
            credentials.password as string,
            user.passwordHash
          );

          if (!isValidPassword) {
            console.warn('[AUTH] Invalid password for user:', input);
            return null;
          }

          if (user.status === 'pending_approval' || user.status === 'deactivated') {
            console.warn('[AUTH] User status not active:', user.status);
            return null;
          }

          // Update last login timestamp
          user.lastLoginAt = new Date();
          await user.save();

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            username: user.username,
            department: user.department,
            role: user.role,
            status: user.status,
          };
        } catch (err) {
          console.error('[AUTH_AUTHORIZE_ERROR]:', err);
          return null;
        }
      },
    }),
  ],
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
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.SESSION_SECRET || '9f8c14e7a25b3901d8e3c4f6b21a8d05e9c731b4028fa65e123d4e5f6789abcd',
  trustHost: true,
});
