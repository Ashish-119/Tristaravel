import { getDriverFromRequest } from "@/app/api/driver/utils/auth";

export async function GET(request) {
  try {
    const driver = await getDriverFromRequest(request);
    if (!driver) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    return Response.json({ driver });
  } catch (error) {
    console.error("Driver me error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
