import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminLogin = process.env.ADMIN_LOGIN;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminLogin || !adminPassword) {
    throw new Error('Set ADMIN_LOGIN and ADMIN_PASSWORD in environment before seeding.');
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { login: adminLogin },
    update: {
      passwordHash,
      role: Role.ADMIN,
      isActive: true
    },
    create: {
      login: adminLogin,
      passwordHash,
      role: Role.ADMIN,
      isActive: true
    }
  });

  await prisma.courtSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      courtName: 'Теннисный корт, парк Беличий',
      timezone: 'Europe/Moscow',
      bookingDurationMin: 60,
      maxDaysAhead: 14,
      minNoticeMinutes: 30,
      rulesText: 'Один слот = 60 минут. Приходите за 5–10 минут до начала и соблюдайте чистоту.'
    }
  });

  console.log(`Admin user ensured: ${admin.login}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
