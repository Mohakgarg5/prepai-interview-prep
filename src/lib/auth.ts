import { NextAuthOptions, getServerSession as nextAuthGetServerSession } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'

/** Safe wrapper — returns null on DB/connection errors instead of crashing */
export async function getSession() {
  try {
    return await nextAuthGetServerSession(authOptions)
  } catch {
    return null
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session: async ({ session, user }) => {
      if (session.user) {
        (session.user as { id?: string }).id = user.id
      }
      return session
    },
  },
  pages: {
    signIn: '/signin',
    newUser: '/onboarding',
  },
}
