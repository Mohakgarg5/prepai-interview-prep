import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = (session.user as { id?: string }).id!

    const body = await request.json()
    const { pathSlug } = body as { pathSlug: string }

    if (!pathSlug) {
      return NextResponse.json({ error: 'pathSlug is required' }, { status: 400 })
    }

    const path = await prisma.learningPath.findUnique({ where: { slug: pathSlug } })
    if (!path) return NextResponse.json({ error: 'Path not found' }, { status: 404 })

    const enrollment = await prisma.userPathEnrollment.upsert({
      where: { userId_pathId: { userId, pathId: path.id } },
      update: {}, // no-op if already enrolled
      create: {
        userId,
        pathId: path.id,
        currentWeek: 1,
      },
    })

    return NextResponse.json({ success: true, enrollment })
  } catch (error) {
    console.error('Enroll API error:', error)
    return NextResponse.json({ error: 'Failed to enroll' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = (session.user as { id?: string }).id!

    const enrollments = await prisma.userPathEnrollment.findMany({
      where: { userId },
      include: { path: { select: { slug: true, title: true } } },
    })

    return NextResponse.json(enrollments)
  } catch (error) {
    console.error('Enroll GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 })
  }
}
