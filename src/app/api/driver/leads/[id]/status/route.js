import sql from "@/app/api/utils/sql";
import { getDriverFromRequest } from "@/app/api/driver/utils/auth";

// A driver may cancel a lead they have claimed.
const ALLOWED = new Set(["cancelled"]);

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
    const { status, trip_type } = body;

    if (!ALLOWED.has(status)) {
      return Response.json(
        { error: `Unsupported status: ${status}` },
        { status: 400 },
      );
    }

    if (trip_type === "round_trip") {
      const rows = await sql`
        UPDATE round_trip_quotes
        SET status = ${status},
            cancelled_at = CASE WHEN ${status} = 'cancelled' THEN now() ELSE cancelled_at END,
            updated_at = now()
        WHERE id = ${id} AND assigned_driver_id = ${driver.id}
        RETURNING id, full_name, phone, email, pickup, dropoff, car_type,
                  distance, price, price_max, pricing_basis,
                  travel_date, pickup_time, num_days,
                  status, assigned_driver_id, picked_at, created_at
      `;

      if (rows.length === 0) {
        return Response.json(
          { error: "Lead not found or not assigned to you" },
          { status: 404 },
        );
      }

      return Response.json({ lead: { ...rows[0], trip_type: "round_trip" } });
    }

    // Default: update quotes (one-way)
    const rows = await sql`
      UPDATE quotes
      SET status = ${status},
          cancelled_at = CASE WHEN ${status} = 'cancelled' THEN now() ELSE cancelled_at END,
          updated_at = now()
      WHERE id = ${id} AND assigned_driver_id = ${driver.id}
      RETURNING id, full_name, phone, email, pickup, dropoff, car_type,
                distance, price, status, assigned_driver_id, picked_at, created_at
    `;

    if (rows.length === 0) {
      return Response.json(
        { error: "Lead not found or not assigned to you" },
        { status: 404 },
      );
    }

    return Response.json({ lead: { ...rows[0], trip_type: "one_way" } });
  } catch (error) {
    console.error("Driver status error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
