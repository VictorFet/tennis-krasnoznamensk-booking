import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <section className="card">
      <h1>Бесплатный теннисный корт в парке Беличий</h1>
      <p>
        Онлайн-запись для жителей Краснознаменска. Интерфейс сделан в mobile-first стиле: удобно бронировать даже со
        смартфона.
      </p>
      <div className="row">
        {user ? (
          <>
            <Link href="/booking" className="btn">
              Забронировать
            </Link>
            <Link href="/my-bookings" className="btn ghost">
              Мои записи
            </Link>
          </>
        ) : (
          <>
            <Link href="/register" className="btn">
              Регистрация
            </Link>
            <Link href="/login" className="btn ghost">
              Вход
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
