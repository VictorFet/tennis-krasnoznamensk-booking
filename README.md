# Tennis Krasnoznamensk Booking (MVP)

MVP-приложение на Next.js + Prisma для записи на теннисный корт.

## Важно для деплоя на Vercel
- Prisma использует `DATABASE_URL` из окружения. (`prisma/schema.prisma`)
- В репозитории есть `prisma/migrations/*`, поэтому Vercel может запускать `prisma migrate deploy`.
- `postinstall` запускает `prisma generate`.
- `vercel-build` запускает `prisma generate && prisma migrate deploy && next build`.

## Обязательные переменные окружения в Vercel
- `DATABASE_URL` — строка подключения к Prisma Postgres
- `ADMIN_LOGIN` — логин первого администратора (для seed)
- `ADMIN_PASSWORD` — пароль первого администратора (для seed)
- `NODE_ENV=production`
- `NEXT_TELEMETRY_DISABLED=1` (опционально)

## Scripts
```bash
npm run dev
npm run build
npm run start
npm run postinstall
npm run vercel-build
npm run prisma:generate
npm run prisma:migrate:deploy
npm run prisma:seed
```

## Что выбрать в Vercel
- **Framework Preset:** Next.js
- **Root Directory:** корень репозитория (`/`)
- **Build Command:** `npm run vercel-build` (уже зафиксировано в `vercel.json`)
- **Install Command:** `npm install` (по умолчанию)
- **Output Directory:** оставить пустым (по умолчанию для Next.js)

## Применение миграций
`npm run vercel-build` применяет миграции автоматически:
1. `prisma generate`
2. `prisma migrate deploy`
3. `next build`

## Seed admin
Если нужен первый admin, запускайте один раз после деплоя:
```bash
npm run prisma:seed
```

(можно выполнить через Vercel CLI или отдельный one-off run в окружении с теми же env переменными)
