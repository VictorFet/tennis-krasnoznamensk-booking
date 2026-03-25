import Link from 'next/link';
import { registerAction } from '@/app/actions';
import { Alert } from '@/components/Alert';

export default async function RegisterPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <section className="card">
      <h1>Регистрация</h1>
      <Alert type="error" text={error} />
      <form action={registerAction}>
        <label>
          Логин
          <input name="login" type="text" required minLength={3} maxLength={32} />
        </label>
        <label>
          Пароль
          <input name="password" type="password" required minLength={6} maxLength={64} />
        </label>
        <button className="btn" type="submit">
          Создать аккаунт
        </button>
      </form>
      <p className="muted">
        Уже есть аккаунт? <Link href="/login">Войти</Link>
      </p>
    </section>
  );
}
