// Admin-only: create (or update) a driver login for the /driver portal.
//
//   bun scripts/create-driver.mjs --name "Ravi Kumar" --email ravi@example.com --password secret123 [--phone 9811112233]
//
// Re-running with the same email resets that driver's name/phone/password and
// re-activates the account. DATABASE_URL is read from .env (bun auto-loads it).
import postgres from "postgres";
import { hash } from "argon2";

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

const name = arg("name");
const email = arg("email");
const phone = arg("phone") ?? null;
const password = arg("password");

if (!name || !email || !password) {
  console.error(
    'Usage: bun scripts/create-driver.mjs --name "Ravi Kumar" --email ravi@example.com --password secret [--phone 9811112233]',
  );
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set (expected in .env).");
  process.exit(1);
}

const sql = postgres(url, {
  ssl: /sslmode=require/i.test(url) ? "require" : false,
});

try {
  const password_hash = await hash(password);
  const rows = await sql`
    INSERT INTO drivers (name, email, phone, password_hash)
    VALUES (${name}, ${email.toLowerCase().trim()}, ${phone}, ${password_hash})
    ON CONFLICT (email) DO UPDATE SET
      name = EXCLUDED.name,
      phone = EXCLUDED.phone,
      password_hash = EXCLUDED.password_hash,
      is_active = true
    RETURNING id, name, email, phone, is_active, created_at
  `;
  console.log("✅ Driver saved:");
  console.table(rows[0]);
} catch (err) {
  console.error("❌ Failed to create driver:", err.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
