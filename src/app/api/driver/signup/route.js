
import sql from "@/app/api/utils/sql";
import { hashPassword } from "@/app/api/driver/utils/auth";

// Public driver sign-up. Creates the account as INACTIVE (is_active = false) and
// does NOT start a session — a stranger must not be able to see customer leads.
// An admin approves the account before the driver can sign in:
//   bun scripts/approve-driver.mjs --list
//   bun scripts/approve-driver.mjs --email someone@example.com
export async function POST(request) {
  try {
    const { name, email, phone, password } = await request.json();

    if (!name || !email || !password) {
      return Response.json(
        { error: "Name, email and password are required" },
        { status: 400 },
      );
    }
    if (typeof password !== "string" || password.length < 8) {
      return Response.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)) {
      return Response.json({ error: "Enter a valid email address" }, { status: 400 });
    }

    const existing = await sql`
      SELECT id FROM drivers WHERE email = ${normalizedEmail} LIMIT 1
    `;
    if (existing.length > 0) {
      return Response.json(
        {
          error:
            "An account with this email already exists. If you just signed up, it's awaiting admin approval.",
        },
        { status: 409 },
      );
    }

    const password_hash = await hashPassword(password);
    await sql`
      INSERT INTO drivers (name, email, phone, password_hash, is_active)
      VALUES (
        ${String(name).trim()},
        ${normalizedEmail},
        ${phone ? String(phone).trim() : null},
        ${password_hash},
        false
      )
    `;

    return Response.json({
      success: true,
      message:
        "Account created. An admin will review and approve it before you can sign in.",
    });
  } catch (error) {
    console.error("Driver signup error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
