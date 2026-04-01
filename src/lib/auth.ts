import { NextAuthOptions, getServerSession as nextAuthGetServerSession } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'

/** Safe wrapper — returns null instead of crashing */
export async function getSession() {
  try {
    return await nextAuthGetServerSession(authOptions)
  } catch {
    return null
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  // JWT strategy: sessions stored in encrypted cookie, NO DB round-trip on every page load.
  // Critical for Vercel serverless cold starts — eliminates the DB query that was crashing pages.
  session: { strategy: 'jwt' },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string
      }
      return session
    },
  },
  pages: {
    signIn: '/signin',
    newUser: '/onboarding',
  },
}
