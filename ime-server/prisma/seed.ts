import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: {
      email: 'admin@ime.ru',
    },

    update: {},

    create: {
      email: 'admin@ime.ru',

      password,

      fullName: 'Администратор ННОУ',

      roles: {
        create: {
          role: Role.ADMIN,
        },
      },
    },
  });

  console.log('Admin created:', admin.email);
}

main()
  .then(() => {
    prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);

    await prisma.$disconnect();

    process.exit(1);
  });
