'use server';

import { AuditAction, Prisma, Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createSession, destroySession, hashPassword, requireAdmin, requireUser, verifyPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateBookingSlot } from '@/lib/booking';
import { writeAuditLog } from '@/lib/audit';

const authSchema = z.object({
  login: z.string().min(3).max(32),
  password: z.string().min(6).max(64)
});

function withMessage(path: string, type: 'error' | 'ok', text: string) {
  return `${path}?${type}=${encodeURIComponent(text)}`;
}

function toSlotKey(startAt: Date) {
  return Math.floor(startAt.getTime() / 60000);
}

async function createBookingWithLock(userId: string, startAt: Date, endAt: Date) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(${toSlotKey(startAt)})`;

    const overlap = await tx.booking.findFirst({
      where: {
        status: 'ACTIVE',
        startAt: { lt: endAt },
        endAt: { gt: startAt }
      }
    });

    if (overlap) {
      throw new Error('Этот слот уже занят');
    }

    return tx.booking.create({
      data: { userId, startAt, endAt }
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

async function updateBookingWithLock(bookingId: string, userId: string, startAt: Date, endAt: Date) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(${toSlotKey(startAt)})`;

    const booking = await tx.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.status !== 'ACTIVE') {
      throw new Error('Запись не найдена');
    }
    if (booking.userId !== userId) {
      throw new Error('Нельзя менять чужую запись');
    }

    const overlap = await tx.booking.findFirst({
      where: {
        status: 'ACTIVE',
        id: { not: bookingId },
        startAt: { lt: endAt },
        endAt: { gt: startAt }
      }
    });

    if (overlap) {
      throw new Error('Этот слот уже занят');
    }

    return tx.booking.update({
      where: { id: bookingId },
      data: { startAt, endAt }
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function registerAction(formData: FormData) {
  const parsed = authSchema.safeParse({
    login: formData.get('login'),
    password: formData.get('password')
  });

  if (!parsed.success) {
    redirect(withMessage('/register', 'error', 'Проверьте логин и пароль'));
  }

  const login = parsed.data.login.trim().toLowerCase();
  const exists = await prisma.user.findUnique({ where: { login } });
  if (exists) {
    redirect(withMessage('/register', 'error', 'Пользователь уже существует'));
  }

  const user = await prisma.user.create({
    data: {
      login,
      passwordHash: await hashPassword(parsed.data.password),
      role: Role.USER
    }
  });

  await writeAuditLog({
    actorUserId: user.id,
    action: AuditAction.REGISTER,
    entityType: 'User',
    entityId: user.id
  });

  await createSession(user.id);
  redirect(withMessage('/booking', 'ok', 'Регистрация успешна'));
}

export async function loginAction(formData: FormData) {
  const parsed = authSchema.safeParse({
    login: formData.get('login'),
    password: formData.get('password')
  });

  if (!parsed.success) {
    redirect(withMessage('/login', 'error', 'Неверные данные входа'));
  }

  const login = parsed.data.login.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { login } });
  if (!user || !user.isActive) {
    redirect(withMessage('/login', 'error', 'Пользователь не найден или отключен'));
  }

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) {
    redirect(withMessage('/login', 'error', 'Неверный пароль'));
  }

  await createSession(user.id);
  await writeAuditLog({
    actorUserId: user.id,
    action: AuditAction.LOGIN,
    entityType: 'Session'
  });

  redirect('/booking');
}

export async function logoutAction() {
  await destroySession();
  redirect('/');
}

export async function createBookingAction(formData: FormData) {
  const user = await requireUser();
  const slot = String(formData.get('slot') || '');

  let prepared: Awaited<ReturnType<typeof validateBookingSlot>> | null = null;
  try {
    prepared = await validateBookingSlot(slot);
  } catch (error) {
    redirect(withMessage('/booking', 'error', error instanceof Error ? error.message : 'Ошибка создания записи'));
  }

  if (!prepared) {
    redirect(withMessage('/booking', 'error', 'Ошибка создания записи'));
  }

  try {
    const booking = await createBookingWithLock(user.id, prepared.startAt, prepared.endAt);

    await writeAuditLog({
      actorUserId: user.id,
      action: AuditAction.BOOKING_CREATE,
      entityType: 'Booking',
      entityId: booking.id,
      meta: { startAt: prepared.startAt.toISOString() }
    });

    revalidatePath('/booking');
    revalidatePath('/my-bookings');
    redirect(withMessage('/my-bookings', 'ok', 'Запись создана'));
  } catch (error) {
    redirect(withMessage('/booking', 'error', error instanceof Error ? error.message : 'Ошибка создания записи'));
  }
}

export async function updateBookingAction(formData: FormData) {
  const user = await requireUser();
  const bookingId = String(formData.get('bookingId') || '');
  const slot = String(formData.get('slot') || '');

  let prepared: Awaited<ReturnType<typeof validateBookingSlot>> | null = null;
  try {
    prepared = await validateBookingSlot(slot, bookingId);
  } catch (error) {
    redirect(withMessage('/my-bookings', 'error', error instanceof Error ? error.message : 'Ошибка обновления'));
  }

  if (!prepared) {
    redirect(withMessage('/my-bookings', 'error', 'Ошибка обновления'));
  }

  try {
    const updated = await updateBookingWithLock(bookingId, user.id, prepared.startAt, prepared.endAt);

    await writeAuditLog({
      actorUserId: user.id,
      action: AuditAction.BOOKING_UPDATE,
      entityType: 'Booking',
      entityId: updated.id,
      meta: { startAt: prepared.startAt.toISOString() }
    });

    revalidatePath('/booking');
    revalidatePath('/my-bookings');
    redirect(withMessage('/my-bookings', 'ok', 'Запись обновлена'));
  } catch (error) {
    redirect(withMessage('/my-bookings', 'error', error instanceof Error ? error.message : 'Ошибка обновления'));
  }
}

export async function deleteBookingAction(formData: FormData) {
  const user = await requireUser();
  const bookingId = String(formData.get('bookingId') || '');

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.status !== 'ACTIVE') {
    redirect(withMessage('/my-bookings', 'error', 'Запись не найдена'));
  }
  if (booking.userId !== user.id) {
    redirect(withMessage('/my-bookings', 'error', 'Нельзя удалить чужую запись'));
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'CANCELLED', cancelledAt: new Date() }
  });

  await writeAuditLog({
    actorUserId: user.id,
    action: AuditAction.BOOKING_DELETE,
    entityType: 'Booking',
    entityId: bookingId
  });

  revalidatePath('/booking');
  revalidatePath('/my-bookings');
  redirect(withMessage('/my-bookings', 'ok', 'Запись удалена'));
}

export async function adminDeleteAnyBookingAction(formData: FormData) {
  const admin = await requireAdmin();
  const bookingId = String(formData.get('bookingId') || '');

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'CANCELLED', cancelledAt: new Date() }
  });

  await writeAuditLog({
    actorUserId: admin.id,
    action: AuditAction.ADMIN_BOOKING_DELETE,
    entityType: 'Booking',
    entityId: bookingId
  });

  revalidatePath('/admin');
  revalidatePath('/booking');
}

export async function updateSettingsAction(formData: FormData) {
  const admin = await requireAdmin();

  const bookingDurationMin = Number(formData.get('bookingDurationMin'));
  const maxDaysAhead = Number(formData.get('maxDaysAhead'));
  const minNoticeMinutes = Number(formData.get('minNoticeMinutes'));
  const rulesText = String(formData.get('rulesText') || '').trim();

  if (
    !Number.isInteger(bookingDurationMin) ||
    bookingDurationMin < 30 ||
    bookingDurationMin > 240 ||
    !Number.isInteger(maxDaysAhead) ||
    maxDaysAhead < 1 ||
    maxDaysAhead > 60 ||
    !Number.isInteger(minNoticeMinutes) ||
    minNoticeMinutes < 0 ||
    minNoticeMinutes > 1440 ||
    !rulesText
  ) {
    redirect(withMessage('/admin', 'error', 'Некорректные настройки'));
  }

  await prisma.courtSettings.upsert({
    where: { id: 'default' },
    update: {
      bookingDurationMin,
      maxDaysAhead,
      minNoticeMinutes,
      rulesText
    },
    create: {
      id: 'default',
      bookingDurationMin,
      maxDaysAhead,
      minNoticeMinutes,
      rulesText
    }
  });

  await writeAuditLog({
    actorUserId: admin.id,
    action: AuditAction.SETTINGS_UPDATE,
    entityType: 'CourtSettings',
    entityId: 'default'
  });

  revalidatePath('/admin');
  revalidatePath('/rules');
  redirect(withMessage('/admin', 'ok', 'Настройки обновлены'));
}

export async function createTimeBlockAction(formData: FormData) {
  const admin = await requireAdmin();
  const startAt = new Date(String(formData.get('startAt')) + ':00+03:00');
  const endAt = new Date(String(formData.get('endAt')) + ':00+03:00');
  const reason = String(formData.get('reason') || '').trim();

  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt || !reason) {
    redirect(withMessage('/admin', 'error', 'Неверный период блокировки'));
  }

  const block = await prisma.timeBlock.create({
    data: {
      startAt,
      endAt,
      reason,
      createdById: admin.id
    }
  });

  await writeAuditLog({
    actorUserId: admin.id,
    action: AuditAction.TIMEBLOCK_CREATE,
    entityType: 'TimeBlock',
    entityId: block.id
  });

  revalidatePath('/admin');
  revalidatePath('/booking');
  redirect(withMessage('/admin', 'ok', 'Блокировка добавлена'));
}

export async function deleteTimeBlockAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get('timeBlockId') || '');

  await prisma.timeBlock.update({
    where: { id },
    data: { isActive: false }
  });

  await writeAuditLog({
    actorUserId: admin.id,
    action: AuditAction.TIMEBLOCK_DELETE,
    entityType: 'TimeBlock',
    entityId: id
  });

  revalidatePath('/admin');
  revalidatePath('/booking');
  redirect(withMessage('/admin', 'ok', 'Блокировка снята'));
}
