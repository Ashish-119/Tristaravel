import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const {
      pickup_location,
      drop_location,
      vehicle_type,
      distance,
      price,
      full_name,
      email,
      phone,
    } = await request.json();

    if (
      !pickup_location ||
      !drop_location ||
      !vehicle_type ||
      !full_name ||
      !phone
    ) {
      return Response.json(
        { error: "Missing mandatory fields" },
        { status: 400 },
      );
    }

    // Coerce optional fields to null. The `postgres` driver (used for a plain
    // PostgreSQL like the one we run in production) rejects `undefined` with
    // "UNDEFINED_VALUE", unlike Neon's driver which silently treats it as null.
    // distance/price are nullable (custom "Traveller" quotes) and email is
    // optional, so a missing value must become an explicit NULL.
    const result = await sql`
      INSERT INTO quotes (pickup, dropoff, car_type, distance, price, full_name, email, phone)
      VALUES (${pickup_location}, ${drop_location}, ${vehicle_type}, ${distance ?? null}, ${price ?? null}, ${full_name}, ${email ?? null}, ${phone})
      RETURNING id
    `;

    return Response.json({ success: true, quoteId: result[0].id });
  } catch (error) {
    console.error("Quote submission error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
