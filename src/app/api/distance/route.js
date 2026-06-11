export async function POST(request) {
  try {
    const { pickup, dropoff } = await request.json();

    if (!pickup || !dropoff) {
      return Response.json(
        { error: "Pickup and dropoff locations are required" },
        { status: 400 },
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(pickup)}&destinations=${encodeURIComponent(dropoff)}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      throw new Error(data.error_message || "Failed to calculate distance");
    }

    const element = data.rows[0].elements[0];
    if (element.status !== "OK") {
      return Response.json(
        { error: "Could not find a route between these locations" },
        { status: 404 },
      );
    }

    const distanceInKm = element.distance.value / 1000;
    const duration = element.duration.text;

    return Response.json({ distance: distanceInKm, duration });
  } catch (error) {
    console.error("Distance calculation error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
