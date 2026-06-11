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

    // Atomic, first-to-claim wins: the WHERE clause only matches an unclaimed,
    // still-open lead, so concurrent claims can't both succeed.
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
      // Either it doesn't exist, or another driver already claimed it.
      return Response.json(
        { error: "This lead is no longer available" },
        { status: 409 },
      );
    }

    return Response.json({ lead: rows[0] });
  } catch (error) {
    console.error("Driver claim error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
