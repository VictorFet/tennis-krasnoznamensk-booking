import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Alert } from '@/components/Alert';
import { BookingCard } from '@/components/BookingCard';

export default async function MyBookingsPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const user = await requireUser();
  const { error, ok } = await searchParams;

  const bookings = await prisma.booking.findMany({
    where: { userId: user.id, status: 'ACTIVE' },
    orderBy: { startAt: 'asc' }
  });

  return (
    <section className="card">
      <h1>Мои записи</h1>
      <Alert type="error" text={error} />
      <Alert type="ok" text={ok} />

      {bookings.length === 0 ? (
        <p className="muted">У вас пока нет активных записей.</p>
      ) : (
        <div>
          {bookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} editable />
          ))}
        </div>
      )}
    </section>
  );
}
