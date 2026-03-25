import { createBookingAction } from '@/app/actions';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatSlotMoscow, toInputValueMoscow } from '@/lib/time';
import { getSettings } from '@/lib/booking';
import { Alert } from '@/components/Alert';

function buildQuickSlots(durationMin: number) {
  const now = new Date();
  const currentMinute = now.getMinutes();
  const rounded = new Date(now);
  rounded.setSeconds(0, 0);
  rounded.setMinutes(currentMinute <= 30 ? 30 : 60, 0, 0);

  return Array.from({ length: 6 }, (_, i) => {
    const slot = new Date(rounded.getTime() + i * durationMin * 60_000);
    return {
      inputValue: toInputValueMoscow(slot),
      label: formatSlotMoscow(slot)
    };
  });
}

export default async function BookingPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  await requireUser();

  const [{ error, ok }, settings, bookings, blocks] = await Promise.all([
    searchParams,
    getSettings(),
    prisma.booking.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { startAt: 'asc' },
      include: { user: { select: { login: true } } },
      take: 40
    }),
    prisma.timeBlock.findMany({
      where: { isActive: true },
      orderBy: { startAt: 'asc' },
      take: 20
    })
  ]);

  const quickSlots = buildQuickSlots(settings.bookingDurationMin);

  return (
    <>
      <section className="card">
        <h1>Бронирование корта</h1>
        <Alert type="error" text={error} />
        <Alert type="ok" text={ok} />
        <p className="muted">
          Слот: {settings.bookingDurationMin} мин · Окно: {settings.maxDaysAhead} дней · Минимум за {settings.minNoticeMinutes} мин до
          начала
        </p>

        <form action={createBookingAction}>
          <label>
            Выберите дату и время (МСК)
            <input name="slot" type="datetime-local" required />
          </label>
          <button className="btn" type="submit">
            Забронировать
          </button>
        </form>
      </section>

      <section className="card">
        <h2 className="sectionTitle">Быстрый выбор слота</h2>
        <div className="quickSlots">
          {quickSlots.map((slot) => (
            <form action={createBookingAction} key={slot.inputValue}>
              <input type="hidden" name="slot" value={slot.inputValue} />
              <button className="btn ghost" type="submit">
                {slot.label}
              </button>
            </form>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="sectionTitle">Недоступные периоды</h2>
        {blocks.length === 0 ? (
          <p className="muted">Нет блокировок.</p>
        ) : (
          <ul>
            {blocks.map((item) => (
              <li key={item.id}>
                {formatSlotMoscow(item.startAt)} – {formatSlotMoscow(item.endAt)}: {item.reason}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2 className="sectionTitle">Занятые слоты</h2>
        {bookings.length === 0 ? (
          <p className="muted">Пока свободно.</p>
        ) : (
          <div>
            {bookings.map((item) => (
              <article key={item.id} className="bookingCard">
                <div className="bookingHeader">
                  <strong>
                    {formatSlotMoscow(item.startAt)} – {formatSlotMoscow(item.endAt)}
                  </strong>
                  <span className="muted">@{item.user.login}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
