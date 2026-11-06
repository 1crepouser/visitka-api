import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { experience, links, profile, projects, PROFILE_ID, skills } from './seed-data';

/** Порядок элементов в seed-data.ts становится значением sortOrder. */
function withSortOrder<T>(items: T[]) {
  return items.map((item, sortOrder) => ({ ...item, sortOrder }));
}

/** Удаление и создание в одной транзакции: повторный запуск даёт те же данные, а читатель не увидит пустую базу. */
export async function seed(prisma: PrismaClient) {
  await prisma.$transaction(async (tx) => {
    await tx.profile.deleteMany({ where: { id: PROFILE_ID } });
    await tx.profile.create({
      data: {
        ...profile,
        links: { create: withSortOrder(links) },
        skills: { create: withSortOrder(skills) },
        projects: { create: withSortOrder(projects) },
        experience: {
          create: experience.map(({ achievements, ...job }) => ({
            ...job,
            achievements: {
              create: withSortOrder(
                achievements.map((text, index) => ({ id: `${job.id}-achievement-${index + 1}`, text })),
              ),
            },
          })),
        },
      },
    });
  });
}

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  try {
    await seed(prisma);
    console.log('Сид выполнен');
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
