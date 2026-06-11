import { deleteSession, clearCookie, readCookie } from "@/app/api/driver/utils/auth";

export async function POST(request) {
  try {
    const token = readCookie(request);
    await deleteSession(token);
    return Response.json(
      { success: true },
      { headers: { "Set-Cookie": clearCookie(request) } },
    );
  } catch (error) {
    console.error("Driver logout error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
