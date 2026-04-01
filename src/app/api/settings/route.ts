import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as { id?: string }).id!

  const [user, companies] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        targetRole: true,
        experienceLevel: true,
        interviewTimeline: true,
        weakAreas: true,
        name: true,
        email: true,
        image: true,
      },
    }),
    prisma.targetCompany.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return NextResponse.json({ user, companies })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as { id?: string }).id!
  const body = await req.json()

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      targetRole: body.targetRole,
      experienceLevel: body.experienceLevel,
      interviewTimeline: body.interviewTimeline ? new Date(body.interviewTimeline) : null,
      weakAreas: body.weakAreas ?? [],
    },
  })

  return NextResponse.json({ user })
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as { id?: string }).id!
  const body = await req.json()

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      targetRole: body.targetRole,
      experienceLevel: body.experienceLevel,
      interviewTimeline: body.interviewTimeline ? new Date(body.interviewTimeline) : null,
      weakAreas: body.weakAreas ?? [],
    },
  })

  return NextResponse.json({ user })
}
