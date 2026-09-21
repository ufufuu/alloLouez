import { readFile } from 'node:fs/promises';
import { Client } from 'pg';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is not set; skipping database migration.');
  process.exit(1);
}

const client = new Client({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('render.com')
    ? { rejectUnauthorized: false }
    : undefined,
});

try {
  await client.connect();
  const schema = await readFile('/app/database/schema.sql', 'utf8');
  await client.query(schema);
  console.log('AlloLouez database schema applied successfully.');
} catch (error) {
  console.error('AlloLouez database migration failed:', error);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}
