import sql from "@/app/api/utils/sql";
import {
  verifyPassword,
  createSession,
  sessionCookie,
} from "@/app/api/driver/utils/auth";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const rows = await sql`
      SELECT id, name, email, password_hash, is_active
      FROM drivers
      WHERE email = ${String(email).toLowerCase().trim()}
      LIMIT 1
    `;
    const driver = rows[0];

    // Same generic response whether the email is unknown or the password is
    // wrong, so we don't leak which driver emails exist.
    if (!driver) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const ok = await verifyPassword(driver.password_hash, password);
    if (!ok) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Credentials are correct but the account hasn't been approved yet. We only
    // reveal the pending state after a valid password, so this can't be used to
    // enumerate emails.
    if (!driver.is_active) {
      return Response.json(
        {
          error:
            "Your account is awaiting admin approval. You'll be able to sign in once it's approved.",
        },
        { status: 403 },
      );
    }

    const { token, expires } = await createSession(driver.id);

    return Response.json(
      { driver: { id: driver.id, name: driver.name, email: driver.email } },
      { headers: { "Set-Cookie": sessionCookie(token, expires, request) } },
    );
  } catch (error) {
    console.error("Driver login error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
