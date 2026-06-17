import sql from "@/app/api/utils/sql";
import { getDriverFromRequest } from "@/app/api/driver/utils/auth";

export async function GET(request) {
  try {
    const driver = await getDriverFromRequest(request);
    if (!driver) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Lazy promotion: any lead still 'new' after 1 hour becomes 'pending'.
    await sql`
      UPDATE quotes
      SET status = 'pending', updated_at = now()
      WHERE status = 'new' AND created_at < now() - interval '1 hour'
    `;
    await sql`
      UPDATE round_trip_quotes
      SET status = 'pending', updated_at = now()
      WHERE status = 'new' AND created_at < now() - interval '1 hour'
    `;

    // Unclaimed one-way leads
    const owAvailable = await sql`
      SELECT id, full_name, phone, email, pickup, dropoff, car_type,
             distance, price, status, assigned_driver_id, picked_at, created_at,
             NULL::date        AS travel_date,
             NULL::text        AS pickup_time,
             NULL::integer     AS num_days,
             NULL::integer     AS price_max,
             NULL::text        AS pricing_basis,
             'one_way'::text   AS trip_type
      FROM quotes
      WHERE status IN ('new', 'pending') AND assigned_driver_id IS NULL
      ORDER BY created_at DESC
    `;

    // Unclaimed round-trip leads
    const rtAvailable = await sql`
      SELECT id, full_name, phone, email, pickup, dropoff, car_type,
             distance, price, status, assigned_driver_id, picked_at, created_at,
             travel_date, pickup_time, num_days, price_max, pricing_basis,
             'round_trip'::text AS trip_type
      FROM round_trip_quotes
      WHERE status IN ('new', 'pending') AND assigned_driver_id IS NULL
      ORDER BY created_at DESC
    `;

    // One-way leads this driver has claimed
    const owMine = await sql`
      SELECT id, full_name, phone, email, pickup, dropoff, car_type,
             distance, price, status, assigned_driver_id, picked_at, created_at,
             NULL::date        AS travel_date,
             NULL::text        AS pickup_time,
             NULL::integer     AS num_days,
             NULL::integer     AS price_max,
             NULL::text        AS pricing_basis,
             'one_way'::text   AS trip_type
      FROM quotes
      WHERE assigned_driver_id = ${driver.id}
      ORDER BY picked_at DESC NULLS LAST, created_at DESC
    `;

    // Round-trip leads this driver has claimed
    const rtMine = await sql`
      SELECT id, full_name, phone, email, pickup, dropoff, car_type,
             distance, price, status, assigned_driver_id, picked_at, created_at,
             travel_date, pickup_time, num_days, price_max, pricing_basis,
             'round_trip'::text AS trip_type
      FROM round_trip_quotes
      WHERE assigned_driver_id = ${driver.id}
      ORDER BY picked_at DESC NULLS LAST, created_at DESC
    `;

    // Merge and sort by created_at descending
    const available = [...owAvailable, ...rtAvailable].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );
    const mine = [...owMine, ...rtMine].sort(
      (a, b) =>
        new Date(b.picked_at ?? b.created_at) -
        new Date(a.picked_at ?? a.created_at),
    );

    return Response.json({ available, mine });
  } catch (error) {
    console.error("Driver leads error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
