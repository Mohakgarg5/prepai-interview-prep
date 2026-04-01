import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = (session.user as { id?: string }).id!

    const stories = await prisma.behavioralStory.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ stories })
  } catch (error) {
    console.error('Stories fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = (session.user as { id?: string }).id!

    const body = await req.json()
    const { title, rawContent, situation, task, action, result, themes, companies, strength } = body

    if (!title || !rawContent) {
      return NextResponse.json({ error: 'Title and raw content are required' }, { status: 400 })
    }

    const companiesArray = companies
      ? (typeof companies === 'string'
          ? companies.split(',').map((c: string) => c.trim()).filter(Boolean)
          : companies)
      : []

    const story = await prisma.behavioralStory.create({
      data: {
        userId,
        title,
        rawContent,
        situation: situation || null,
        task: task || null,
        action: action || null,
        result: result || null,
        themes: themes || [],
        companies: companiesArray,
        strength: strength ? Math.min(5, Math.max(1, Number(strength))) : 3,
      },
    })

    // Record progress entry
    await prisma.progressEntry.create({
      data: {
        userId,
        category: 'BEHAVIORAL',
        activity: 'STORY_CRAFTING',
        timeSpent: 5,
        metadata: { storyId: story.id, title: story.title },
      },
    })

    return NextResponse.json({ story }, { status: 201 })
  } catch (error) {
    console.error('Story create error:', error)
    return NextResponse.json({ error: 'Failed to create story' }, { status: 500 })
  }
}
