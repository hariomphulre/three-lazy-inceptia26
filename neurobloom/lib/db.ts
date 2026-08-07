import { readFile } from "fs/promises";
import path from "path";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL || process.env.NEON_DB_URL;

if (!connectionString) {
  throw new Error("Missing PostgreSQL connection string. Set DATABASE_URL or NEON_DB_URL.");
}

if (!/^postgres(ql)?:\/\//i.test(connectionString)) {
  throw new Error("DATABASE_URL must point to PostgreSQL, not MongoDB or another backend.");
}

const isLocalDatabase = /localhost|127\.0\.0\.1|::1/i.test(connectionString);

const pool = new Pool({
  connectionString,
  ...(isLocalDatabase
    ? {}
    : {
        ssl: {
          rejectUnauthorized: false,
        },
      }),
});

const query = pool.query.bind(pool);
type QueryArgs = Parameters<typeof query>;
let schemaInitPromise: Promise<void> | null = null;

async function ensureDatabaseSchema(): Promise<void> {
  if (!schemaInitPromise) {
    schemaInitPromise = (async () => {
      const schemaPath = path.resolve(process.cwd(), "..", "postgres-init", "init.sql");
      const schemaSql = await readFile(schemaPath, "utf8");
      await query(schemaSql);
    })();
  }

  await schemaInitPromise;
}

pool.query = (async (...args: QueryArgs) => {
  await ensureDatabaseSchema();
  return query(...args);
}) as typeof pool.query;

export { pool, ensureDatabaseSchema };
