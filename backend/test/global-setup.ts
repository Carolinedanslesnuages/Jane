import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Reads DATABASE_URL from the environment or from the repository .env file. */
function readDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  const envFile = join(__dirname, '..', '..', '.env');
  if (existsSync(envFile)) {
    const match = readFileSync(envFile, 'utf8').match(/^DATABASE_URL=(.+)$/m);
    if (match) {
      return match[1].trim();
    }
  }
  throw new Error('DATABASE_URL est introuvable : démarrez PostgreSQL et copiez .env.example vers .env');
}

/** Points the tests at a dedicated "test" schema and applies the migrations to it. */
export default async function globalSetup(): Promise<void> {
  const url = new URL(readDatabaseUrl());
  url.searchParams.set('schema', 'test');
  process.env.DATABASE_URL = url.toString();
  execSync('npx prisma migrate deploy', {
    cwd: join(__dirname, '..'),
    env: process.env,
    stdio: 'pipe',
  });
}
