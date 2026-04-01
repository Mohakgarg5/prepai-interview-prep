import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = (session.user as { id?: string }).id!

    const companies = await prisma.targetCompany.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ companies })
  } catch (error) {
    console.error('Company prep fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = (session.user as { id?: string }).id!

    const body = await req.json()
    const { name, tier, notes } = body

    if (!name) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    const company = await prisma.targetCompany.create({
      data: {
        userId,
        name: name.trim(),
        tier: tier || 'MID_STAGE',
        notes: notes || null,
      },
    })

    await prisma.progressEntry.create({
      data: {
        userId,
        category: 'PRODUCT_SENSE',
        activity: 'COMPANY_RESEARCH',
        timeSpent: 2,
        metadata: { companyId: company.id, companyName: company.name },
      },
    })

    return NextResponse.json({ company }, { status: 201 })
  } catch (error) {
    console.error('Company prep create error:', error)
    return NextResponse.json({ error: 'Failed to add company' }, { status: 500 })
  }
}
