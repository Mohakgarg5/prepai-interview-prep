import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = (session.user as { id?: string }).id!

    const { id } = await params
    const body = await req.json()
    const { status, title, company, location, url, jdContent, keyRequirements, suggestedPrep, matchScore } = body

    const existing = await prisma.savedJob.findFirst({ where: { id, userId } })
    if (!existing) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    const job = await prisma.savedJob.update({
      where: { id },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(title !== undefined ? { title: title.trim() } : {}),
        ...(company !== undefined ? { company: company.trim() } : {}),
        ...(location !== undefined ? { location: location || null } : {}),
        ...(url !== undefined ? { url: url || null } : {}),
        ...(jdContent !== undefined ? { jdContent: jdContent || null } : {}),
        ...(keyRequirements !== undefined ? { keyRequirements } : {}),
        ...(suggestedPrep !== undefined ? { suggestedPrep: suggestedPrep || null } : {}),
        ...(matchScore !== undefined ? { matchScore: matchScore !== null ? Number(matchScore) : null } : {}),
      },
    })

    return NextResponse.json({ job })
  } catch (error) {
    console.error('Job update error:', error)
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 })
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

    const existing = await prisma.savedJob.findFirst({ where: { id, userId } })
    if (!existing) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    await prisma.savedJob.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Job delete error:', error)
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 })
  }
}
