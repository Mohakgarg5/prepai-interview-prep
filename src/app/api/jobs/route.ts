import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = (session.user as { id?: string }).id!

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const jobs = await prisma.savedJob.findMany({
      where: {
        userId,
        ...(status && status !== 'ALL' ? { status: status as never } : {}),
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ jobs })
  } catch (error) {
    console.error('Jobs fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = (session.user as { id?: string }).id!

    const body = await req.json()
    const { title, company, location, url, jdContent, keyRequirements, suggestedPrep, matchScore, status } = body

    if (!title || !company) {
      return NextResponse.json({ error: 'Title and company are required' }, { status: 400 })
    }

    const job = await prisma.savedJob.create({
      data: {
        userId,
        title: title.trim(),
        company: company.trim(),
        location: location || null,
        url: url || null,
        jdContent: jdContent || null,
        keyRequirements: keyRequirements || [],
        suggestedPrep: suggestedPrep || null,
        matchScore: matchScore ? Number(matchScore) : null,
        status: status || 'SAVED',
      },
    })

    return NextResponse.json({ job }, { status: 201 })
  } catch (error) {
    console.error('Job create error:', error)
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 })
  }
}
