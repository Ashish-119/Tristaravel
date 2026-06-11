import sql from "@/app/api/utils/sql";
import { getDriverFromRequest } from "@/app/api/driver/utils/auth";

export async function GET(request) {
  try {
    const driver = await getDriverFromRequest(request);
    if (!driver) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Lazy promotion: any lead still 'new' after 1 hour becomes 'pending'.
    // Implements the "not picked within 1 hour" rule without a background job.
    await sql`
      UPDATE quotes
      SET status = 'pending', updated_at = now()
      WHERE status = 'new' AND created_at < now() - interval '1 hour'
    `;

    // Unclaimed leads anyone can pick.
    const available = await sql`
      SELECT id, full_name, phone, email, pickup, dropoff, car_type,
             distance, price, status, assigned_driver_id, picked_at, created_at
      FROM quotes
      WHERE status IN ('new', 'pending') AND assigned_driver_id IS NULL
      ORDER BY created_at DESC
    `;

    // Leads this driver has claimed.
    const mine = await sql`
      SELECT id, full_name, phone, email, pickup, dropoff, car_type,
             distance, price, status, assigned_driver_id, picked_at, created_at
      FROM quotes
      WHERE assigned_driver_id = ${driver.id}
      ORDER BY picked_at DESC NULLS LAST, created_at DESC
    `;

    return Response.json({ available, mine });
  } catch (error) {
    console.error("Driver leads error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
