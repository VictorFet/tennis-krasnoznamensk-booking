import Link from 'next/link';
import { loginAction } from '@/app/actions';
import { Alert } from '@/components/Alert';

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <section className="card">
      <h1>Вход</h1>
      <Alert type="error" text={error} />
      <form action={loginAction}>
        <label>
          Логин
          <input name="login" type="text" required minLength={3} maxLength={32} />
        </label>
        <label>
          Пароль
          <input name="password" type="password" required minLength={6} maxLength={64} />
        </label>
        <button className="btn" type="submit">
          Войти
        </button>
      </form>
      <p className="muted">
        Нет аккаунта? <Link href="/register">Зарегистрироваться</Link>
      </p>
    </section>
  );
}
