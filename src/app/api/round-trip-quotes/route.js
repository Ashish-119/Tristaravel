import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const {
      pickup_location,
      drop_location,
      vehicle_type,
      travel_date,
      pickup_time,
      num_days,
      distance,
      price,
      price_max,
      pricing_basis,
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
      !pickup_time ||
      !num_days ||
      !full_name ||
      !phone
    ) {
      return Response.json(
        { error: "Missing mandatory fields" },
        { status: 400 },
      );
    }

    const result = await sql`
      INSERT INTO round_trip_quotes (
        pickup, dropoff, car_type, travel_date, pickup_time, num_days,
        distance, price, price_max, pricing_basis,
        full_name, email, phone, trip_advised
      )
      VALUES (
        ${pickup_location}, ${drop_location}, ${vehicle_type},
        ${travel_date}, ${pickup_time}, ${num_days},
        ${distance ?? null}, ${price ?? null}, ${price_max ?? null},
        ${pricing_basis ?? "custom"},
        ${full_name}, ${email ?? null}, ${phone}, ${trip_advised === true}
      )
      RETURNING id
    `;

    return Response.json({ success: true, quoteId: result[0].id });
  } catch (error) {
    console.error("Round trip quote submission error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
