import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { seed } from '../prisma/seed';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

export interface TestApp {
  app: INestApplication;
  prisma: PrismaService;
  /** SQL-запросы без служебных BEGIN и COMMIT. Тест очищает массив перед каждым запуском. */
  queries: string[];
  /** Служебные команды транзакций, учитываются отдельно. */
  transactionCommands: string[];
}

export async function createTestApp(): Promise<TestApp> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  await app.init();

  const prisma = app.get(PrismaService);
  await seed(prisma);

  const queries: string[] = [];
  const transactionCommands: string[] = [];
  prisma.$on('query', ({ query }) => {
    (/^(BEGIN|COMMIT|ROLLBACK)\b/i.test(query) ? transactionCommands : queries).push(query);
  });

  return { app, prisma, queries, transactionCommands };
}

export async function runGraphQL(app: INestApplication, query: string) {
  const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(200);
  return response.body as { data: any; errors?: { message: string; extensions?: { code?: string } }[] };
}

/** Какие таблицы затронул каждый запрос, например ["Profile", "Link"]. */
export function tablesOf(queries: string[]): string[] {
  return queries.map((query) => /FROM "public"\."(\w+)"/.exec(query)?.[1] ?? query);
}
