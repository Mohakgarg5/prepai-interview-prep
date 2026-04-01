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

    const story = await prisma.behavioralStory.findFirst({
      where: { id, userId },
    })

    if (!story) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ story })
  } catch (error) {
    console.error('Story fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch story' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = (session.user as { id?: string }).id!
    const { id } = await params

    const existing = await prisma.behavioralStory.findFirst({ where: { id, userId } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const { title, rawContent, situation, task, action, result, themes, companies, strength } = body

    const companiesArray = companies
      ? (typeof companies === 'string'
          ? companies.split(',').map((c: string) => c.trim()).filter(Boolean)
          : companies)
      : existing.companies

    const story = await prisma.behavioralStory.update({
      where: { id },
      data: {
        title: title ?? existing.title,
        rawContent: rawContent ?? existing.rawContent,
        situation: situation !== undefined ? situation : existing.situation,
        task: task !== undefined ? task : existing.task,
        action: action !== undefined ? action : existing.action,
        result: result !== undefined ? result : existing.result,
        themes: themes ?? existing.themes,
        companies: companiesArray,
        strength: strength ? Math.min(5, Math.max(1, Number(strength))) : existing.strength,
      },
    })

    return NextResponse.json({ story })
  } catch (error) {
    console.error('Story update error:', error)
    return NextResponse.json({ error: 'Failed to update story' }, { status: 500 })
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

    const existing = await prisma.behavioralStory.findFirst({ where: { id, userId } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.behavioralStory.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Story delete error:', error)
    return NextResponse.json({ error: 'Failed to delete story' }, { status: 500 })
  }
}
