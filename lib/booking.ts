import { prisma } from '@/lib/prisma';
import { parseSlotToUtc } from '@/lib/time';

export async function getSettings() {
  const settings = await prisma.courtSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default' }
  });

  return settings;
}

export async function validateBookingSlot(slotRaw: string, ignoreBookingId?: string) {
  const settings = await getSettings();
  const startAt = parseSlotToUtc(slotRaw);
  const endAt = new Date(startAt.getTime() + settings.bookingDurationMin * 60 * 1000);
  const now = new Date();

  if (startAt <= now) {
    throw new Error('Нельзя бронировать в прошедшее время');
  }

  const minAllowed = new Date(now.getTime() + settings.minNoticeMinutes * 60 * 1000);
  if (startAt < minAllowed) {
    throw new Error(`Бронирование минимум за ${settings.minNoticeMinutes} минут до начала`);
  }

  const maxAllowed = new Date(now.getTime() + settings.maxDaysAhead * 24 * 60 * 60 * 1000);
  if (startAt > maxAllowed) {
    throw new Error(`Нельзя бронировать дальше чем на ${settings.maxDaysAhead} дней вперед`);
  }

  const overlapBooking = await prisma.booking.findFirst({
    where: {
      status: 'ACTIVE',
      id: ignoreBookingId ? { not: ignoreBookingId } : undefined,
      startAt: { lt: endAt },
      endAt: { gt: startAt }
    }
  });

  if (overlapBooking) {
    throw new Error('Этот слот уже занят');
  }

  const overlapBlock = await prisma.timeBlock.findFirst({
    where: {
      isActive: true,
      startAt: { lt: endAt },
      endAt: { gt: startAt }
    }
  });

  if (overlapBlock) {
    throw new Error('Этот слот недоступен по правилам корта');
  }

  return { settings, startAt, endAt };
}
