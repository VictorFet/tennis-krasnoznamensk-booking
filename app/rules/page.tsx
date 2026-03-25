import { getSettings } from '@/lib/booking';

export default async function RulesPage() {
  const settings = await getSettings();

  return (
    <section className="card">
      <h1>Правила корта</h1>
      <ul>
        <li>Один слот = {settings.bookingDurationMin} минут.</li>
        <li>Бронирование возможно не позже, чем за {settings.minNoticeMinutes} минут до начала.</li>
        <li>Максимальное окно бронирования: {settings.maxDaysAhead} дней.</li>
        <li>Нельзя бронировать занятый или заблокированный слот.</li>
      </ul>
      <p>{settings.rulesText}</p>
    </section>
  );
}
