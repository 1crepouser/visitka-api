import { execSync } from 'node:child_process';

/** Тесты перезаписывают данные, поэтому работают только с базой, в имени которой есть test. */
export default function globalSetup() {
  const url = process.env.DATABASE_URL;
  if (!url || !new URL(url).pathname.includes('test')) {
    throw new Error('Для тестов нужен DATABASE_URL на тестовую базу, в имени которой есть "test"');
  }
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
}
