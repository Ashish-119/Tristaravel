import { neon } from '@neondatabase/serverless';
import postgres from 'postgres';

const NullishQueryFunction = () => {
  throw new Error(
    'No database connection string was provided. Perhaps process.env.DATABASE_URL has not been set'
  );
};
NullishQueryFunction.transaction = () => {
  throw new Error(
    'No database connection string was provided. Perhaps process.env.DATABASE_URL has not been set'
  );
};

const connectionString = process.env.DATABASE_URL;

// Pick the driver based on where the database lives:
//  - Neon (cloud, *.neon.tech) speaks SQL-over-HTTP, so it needs the `neon()`
//    serverless driver.
//  - A plain Postgres (e.g. the local Docker container in docker-compose.yml)
//    speaks the normal wire protocol, so it needs the `postgres` driver.
// Both expose the same tagged-template API — `sql`...`` resolves to an array of
// rows — so the rest of the app doesn't need to know which one is in use.
// Override the auto-detection with DB_DRIVER=neon|postgres if needed.
function selectSql(url) {
  if (!url) return NullishQueryFunction;

  const driver =
    process.env.DB_DRIVER ?? (/neon\.tech/i.test(url) ? 'neon' : 'postgres');

  if (driver === 'neon') {
    return neon(url);
  }

  return postgres(url, {
    // Keep the pool small for local dev; enable SSL only if the URL asks for it.
    max: 5,
    ssl: /sslmode=require/i.test(url) ? 'require' : false,
  });
}

const sql = selectSql(connectionString);

export default sql;
