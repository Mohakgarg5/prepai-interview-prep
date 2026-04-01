import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as { id?: string }).id!

  const body = await req.json()
  const { name, tier, notes } = body

  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
  }

  const company = await prisma.targetCompany.create({
    data: {
      userId,
      name: name.trim(),
      tier: tier ?? 'MID_STAGE',
      notes: notes ?? null,
    },
  })

  return NextResponse.json({ company })
}

export async function DELETE(req: Request) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as { id?: string }).id!

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Company id is required' }, { status: 400 })
  }

  // Verify ownership before deleting
  const company = await prisma.targetCompany.findUnique({ where: { id } })
  if (!company || company.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.targetCompany.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
