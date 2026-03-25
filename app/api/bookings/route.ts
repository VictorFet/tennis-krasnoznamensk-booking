import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const bookings = await prisma.booking.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { startAt: 'asc' },
    include: {
      user: { select: { login: true } }
    }
  });

  return NextResponse.json({ bookings });
}
