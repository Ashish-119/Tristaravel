import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const {
      pickup_location,
      drop_location,
      vehicle_type,
      travel_date,
      pickup_time,
      distance,
      price,
      price_max,
      full_name,
      email,
      phone,
      trip_advised,
    } = await request.json();

    if (
      !pickup_location ||
      !drop_location ||
      !vehicle_type ||
      !travel_date ||
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
      INSERT INTO quotes (
        pickup, dropoff, car_type, travel_date, pickup_time,
        distance, price, price_max, full_name, email, phone, trip_advised
      )
      VALUES (
        ${pickup_location}, ${drop_location}, ${vehicle_type},
        ${travel_date}, ${pickup_time ?? null},
        ${distance ?? null}, ${price ?? null}, ${price_max ?? null},
        ${full_name}, ${email ?? null}, ${phone}, ${trip_advised === true}
      )
      RETURNING id
    `;

    return Response.json({ success: true, quoteId: result[0].id });
  } catch (error) {
    console.error("Quote submission error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
