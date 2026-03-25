# Tennis Krasnoznamensk Booking (MVP)

Рабочий MVP для записи на бесплатный теннисный корт в Краснознаменске (парк Беличий).

## Что внутри
- Next.js 15 (App Router) + TypeScript
- PostgreSQL + Prisma ORM
- Регистрация/вход по логину и паролю
- Роли: `USER`, `ADMIN`
- Бронирование с проверкой занятости слота
- Защита от изменения/удаления чужих записей
- Запрет записи в прошедшее время
- Админ-панель (настройки, блокировки времени, аудит)

## Prisma модели
Схема лежит в `prisma/schema.prisma`:
- `User`
- `Session`
- `Booking`
- `CourtSettings`
- `TimeBlock`
- `AuditLog`

## Требования
1. Node.js 20+
2. npm 10+
3. PostgreSQL 15+

Проверьте версии:
```bash
node -v
npm -v
psql --version
```

## Настройка локально (для новичка)
1. Клонируйте репозиторий.
2. Создайте файл окружения:
   ```bash
   cp .env.example .env
   ```
3. Убедитесь, что PostgreSQL запущен и база `tennis_booking` существует.
4. Установите зависимости:
   ```bash
   npm install
   ```
5. Сгенерируйте Prisma Client:
   ```bash
   npm run prisma:generate
   ```
6. Примените миграцию (создаст структуру БД):
   ```bash
   npm run prisma:migrate:dev -- --name init
   ```
7. Выполните seed (создаст/обновит первого admin):
   ```bash
   npm run prisma:seed
   ```
8. Запустите приложение:
   ```bash
   npm run dev
   ```
9. Откройте `http://localhost:3000`.

## Команды проекта
```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run prisma:generate
npm run prisma:migrate:dev -- --name <migration_name>
npm run prisma:migrate:deploy
npm run prisma:migrate:reset
npm run prisma:seed
npm run prisma:studio
```

## Seed первого admin
Скрипт `prisma/seed.ts` берет данные из `.env`:
- `ADMIN_LOGIN`
- `ADMIN_PASSWORD`

И делает `upsert` пользователя с ролью `ADMIN` + создает дефолтные настройки корта.

## Миграции Prisma
- Локальная разработка: `npm run prisma:migrate:dev -- --name init`
- Прод-сервер: `npm run prisma:migrate:deploy`

## Деплой на обычный Node.js VPS
1. На сервере установить Node.js 20+, npm 10+, PostgreSQL.
2. Создать `.env` (на основе `.env.example`).
3. Выполнить:
   ```bash
   npm ci
   npm run prisma:generate
   npm run prisma:migrate:deploy
   npm run prisma:seed
   npm run build
   npm run start
   ```

---

## Пошаговый локальный запуск
```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate:dev -- --name init
npm run prisma:seed
npm run dev
```
