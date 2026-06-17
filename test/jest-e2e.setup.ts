import { config } from 'dotenv';

config({ path: '.env' });

const testDatabaseUrl = process.env.DATABASE_URL_TEST;

if (!testDatabaseUrl) {
  throw new Error(
    'DATABASE_URL_TEST is not set. E2E tests must run against the test database, not blog_dev.',
  );
}

process.env.DATABASE_URL = testDatabaseUrl;
