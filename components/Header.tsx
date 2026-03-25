import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { logoutAction } from '@/app/actions';

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="header">
      <div className="container nav">
        <Link href="/" className="brand">
          🎾 Корт Беличий
        </Link>
        <nav className="links">
          <Link href="/rules">Правила</Link>
          {user && <Link href="/booking">Бронирование</Link>}
          {user && <Link href="/my-bookings">Мои записи</Link>}
          {user?.role === 'ADMIN' && <Link href="/admin">Админ</Link>}
        </nav>
        <div>
          {user ? (
            <form action={logoutAction}>
              <button className="btn ghost" type="submit">
                Выйти ({user.login})
              </button>
            </form>
          ) : (
            <Link href="/login" className="btn ghost">
              Вход
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
