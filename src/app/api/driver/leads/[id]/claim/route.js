import sql from "@/app/api/utils/sql";
import { getDriverFromRequest } from "@/app/api/driver/utils/auth";

export async function POST(request, { params }) {
  try {
    const driver = await getDriverFromRequest(request);
    if (!driver) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = Number(params.id);
    if (!Number.isInteger(id)) {
      return Response.json({ error: "Invalid lead id" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const tripType = body.trip_type ?? "one_way";

    if (tripType === "round_trip") {
      // Claim from round_trip_quotes
      const rows = await sql`
        UPDATE round_trip_quotes
        SET status = 'confirmed',
            assigned_driver_id = ${driver.id},
            picked_at = now(),
            updated_at = now()
        WHERE id = ${id}
          AND status IN ('new', 'pending')
          AND assigned_driver_id IS NULL
        RETURNING id, full_name, phone, email, pickup, dropoff, car_type,
                  distance, price, price_max, pricing_basis,
                  travel_date, pickup_time, num_days,
                  status, assigned_driver_id, picked_at, created_at
      `;

      if (rows.length === 0) {
        return Response.json(
          { error: "This lead is no longer available" },
          { status: 409 },
        );
      }

      return Response.json({ lead: { ...rows[0], trip_type: "round_trip" } });
    }

    // Default: claim from quotes (one-way)
    const rows = await sql`
      UPDATE quotes
      SET status = 'confirmed',
          assigned_driver_id = ${driver.id},
          picked_at = now(),
          updated_at = now()
      WHERE id = ${id}
        AND status IN ('new', 'pending')
        AND assigned_driver_id IS NULL
      RETURNING id, full_name, phone, email, pickup, dropoff, car_type,
                distance, price, status, assigned_driver_id, picked_at, created_at
    `;

    if (rows.length === 0) {
      return Response.json(
        { error: "This lead is no longer available" },
        { status: 409 },
      );
    }

    return Response.json({ lead: { ...rows[0], trip_type: "one_way" } });
  } catch (error) {
    console.error("Driver claim error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
