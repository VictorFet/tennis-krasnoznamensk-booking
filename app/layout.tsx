import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';

export const metadata: Metadata = {
  title: 'Запись на теннисный корт — Краснознаменск',
  description: 'Бесплатное бронирование теннисного корта в парке Беличий.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <Header />
        <main className="container page">{children}</main>
      </body>
    </html>
  );
}
