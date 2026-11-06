import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // process.env, а не env(): `prisma generate` при сборке образа работает без DATABASE_URL.
  datasource: { url: process.env.DATABASE_URL },
});
