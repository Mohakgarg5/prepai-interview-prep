import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = (session.user as { id?: string }).id!

    const { id } = await params

    const debrief = await prisma.debrief.findFirst({ where: { id, userId } })
    if (!debrief) return NextResponse.json({ error: 'Debrief not found' }, { status: 404 })

    return NextResponse.json({ debrief })
  } catch (error) {
    console.error('Debrief get error:', error)
    return NextResponse.json({ error: 'Failed to fetch debrief' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = (session.user as { id?: string }).id!

    const { id } = await params

    const existing = await prisma.debrief.findFirst({ where: { id, userId } })
    if (!existing) return NextResponse.json({ error: 'Debrief not found' }, { status: 404 })

    await prisma.debrief.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Debrief delete error:', error)
    return NextResponse.json({ error: 'Failed to delete debrief' }, { status: 500 })
  }
}
