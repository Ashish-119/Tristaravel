// Admin-only: review and approve (or reject) driver sign-ups.
//
// Drivers who use the public /driver/signup page are created INACTIVE and can't
// sign in until approved here.
//
//   List everyone awaiting approval:
//     bun scripts/approve-driver.mjs --list
//
//   Approve a driver (lets them sign in):
//     bun scripts/approve-driver.mjs --email ravi@example.com
//
//   Reject a pending sign-up (deletes the account):
//     bun scripts/approve-driver.mjs --email spammer@example.com --reject
//
// DATABASE_URL is read from the environment (locally, bun auto-loads .env). For
// the live Railway database, use its Public Network URL + ?sslmode=require:
//   DATABASE_URL="postgres://...rlwy.net:PORT/railway?sslmode=require" \
//     bun scripts/approve-driver.mjs --list
import postgres from "postgres";

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}
function flag(name) {
  return process.argv.includes(`--${name}`);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set (expected in .env or the environment).");
  process.exit(1);
}

const sql = postgres(url, {
  ssl: /sslmode=require/i.test(url) ? "require" : false,
});

try {
  if (flag("list")) {
    const rows = await sql`
      SELECT id, name, email, phone, created_at
      FROM drivers
      WHERE is_active = false
      ORDER BY created_at DESC
    `;
    if (rows.length === 0) {
      console.log("✅ No drivers awaiting approval.");
    } else {
      console.log(`⏳ ${rows.length} driver(s) awaiting approval:`);
      console.table(
        rows.map((r) => ({
          id: r.id,
          name: r.name,
          email: r.email,
          phone: r.phone ?? "—",
          signed_up: r.created_at,
        })),
      );
      console.log("Approve with: bun scripts/approve-driver.mjs --email <email>");
    }
    process.exit(0);
  }

  const email = arg("email");
  if (!email) {
    console.error(
      "Usage:\n" +
        "  bun scripts/approve-driver.mjs --list\n" +
        "  bun scripts/approve-driver.mjs --email someone@example.com [--reject]",
    );
    process.exit(1);
  }
  const normalized = email.toLowerCase().trim();

  if (flag("reject")) {
    const rows = await sql`
      DELETE FROM drivers
      WHERE email = ${normalized} AND is_active = false
      RETURNING id, name, email
    `;
    if (rows.length === 0) {
      console.error(`❌ No pending (unapproved) driver found with email ${normalized}.`);
      process.exitCode = 1;
    } else {
      console.log("🗑️  Rejected and removed pending sign-up:");
      console.table(rows[0]);
    }
  } else {
    const rows = await sql`
      UPDATE drivers
      SET is_active = true
      WHERE email = ${normalized}
      RETURNING id, name, email, phone, is_active
    `;
    if (rows.length === 0) {
      console.error(`❌ No driver found with email ${normalized}.`);
      process.exitCode = 1;
    } else {
      console.log("✅ Driver approved — they can now sign in:");
      console.table(rows[0]);
    }
  }
} catch (err) {
  console.error(`❌ Failed: ${err.message}`);
  process.exitCode = 1;
} finally {
  await sql.end();
}