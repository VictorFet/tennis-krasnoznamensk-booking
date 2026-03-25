import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking || booking.status !== 'ACTIVE') return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (booking.userId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.booking.update({
    where: { id },
    data: { status: 'CANCELLED', cancelledAt: new Date() }
  });

  return NextResponse.json({ ok: true });
}
