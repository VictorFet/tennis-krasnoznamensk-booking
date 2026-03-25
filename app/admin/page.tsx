import {
  adminDeleteAnyBookingAction,
  createTimeBlockAction,
  deleteTimeBlockAction,
  updateSettingsAction
} from '@/app/actions';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatSlotMoscow, toInputValueMoscow } from '@/lib/time';
import { getSettings } from '@/lib/booking';
import { Alert } from '@/components/Alert';
import { BookingCard } from '@/components/BookingCard';

export default async function AdminPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  await requireAdmin();
  const { error, ok } = await searchParams;

  const [settings, users, bookings, blocks, logs] = await Promise.all([
    getSettings(),
    prisma.user.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.booking.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { startAt: 'asc' },
      include: { user: { select: { login: true } } }
    }),
    prisma.timeBlock.findMany({ where: { isActive: true }, orderBy: { startAt: 'asc' } }),
    prisma.auditLog.findMany({ take: 30, orderBy: { createdAt: 'desc' }, include: { actor: true } })
  ]);

  return (
    <>
      <section className="card">
        <h1>Админ-панель</h1>
        <Alert type="error" text={error} />
        <Alert type="ok" text={ok} />
        <p className="muted">Пользователей: {users.length}</p>
      </section>

      <section className="card">
        <h2 className="sectionTitle">Настройки корта</h2>
        <form action={updateSettingsAction}>
          <label>
            Длительность брони (мин)
            <input name="bookingDurationMin" type="number" defaultValue={settings.bookingDurationMin} min={30} max={240} required />
          </label>
          <label>
            Макс. дней вперёд
            <input name="maxDaysAhead" type="number" defaultValue={settings.maxDaysAhead} min={1} max={60} required />
          </label>
          <label>
            Мин. минут до начала
            <input name="minNoticeMinutes" type="number" defaultValue={settings.minNoticeMinutes} min={0} max={1440} required />
          </label>
          <label>
            Текст правил
            <textarea name="rulesText" defaultValue={settings.rulesText} rows={3} required />
          </label>
          <button className="btn" type="submit">
            Сохранить настройки
          </button>
        </form>
      </section>

      <section className="card">
        <h2 className="sectionTitle">Блокировки времени</h2>
        <form action={createTimeBlockAction}>
          <label>
            Начало (МСК)
            <input name="startAt" type="datetime-local" defaultValue={toInputValueMoscow(new Date())} required />
          </label>
          <label>
            Конец (МСК)
            <input name="endAt" type="datetime-local" defaultValue={toInputValueMoscow(new Date(Date.now() + 60 * 60 * 1000))} required />
          </label>
          <label>
            Причина
            <input name="reason" type="text" placeholder="Турнир / обслуживание" required />
          </label>
          <button className="btn" type="submit">
            Добавить блокировку
          </button>
        </form>

        {blocks.length > 0 && (
          <div style={{ marginTop: '0.8rem' }}>
            {blocks.map((block) => (
              <article key={block.id} className="bookingCard">
                <div className="bookingHeader">
                  <strong>
                    {formatSlotMoscow(block.startAt)} – {formatSlotMoscow(block.endAt)}
                  </strong>
                  <span className="muted">{block.reason}</span>
                </div>
                <form action={deleteTimeBlockAction}>
                  <input type="hidden" name="timeBlockId" value={block.id} />
                  <button className="btn ghost" type="submit">
                    Снять блокировку
                  </button>
                </form>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <h2 className="sectionTitle">Все активные бронирования</h2>
        {bookings.length === 0 ? (
          <p className="muted">Бронирований нет.</p>
        ) : (
          bookings.map((booking) => (
            <div key={booking.id}>
              <BookingCard booking={booking} ownerLogin={booking.user.login} />
              <form action={adminDeleteAnyBookingAction} style={{ marginBottom: '0.9rem' }}>
                <input type="hidden" name="bookingId" value={booking.id} />
                <button type="submit" className="btn ghost danger">
                  Отменить запись
                </button>
              </form>
            </div>
          ))
        )}
      </section>

      <section className="card">
        <h2 className="sectionTitle">Журнал аудита (последние 30)</h2>
        <ul>
          {logs.map((log) => (
            <li key={log.id}>
              {new Date(log.createdAt).toLocaleString('ru-RU')} — {log.action} — @{log.actor?.login || 'system'}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
