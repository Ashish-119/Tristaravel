// Shared fire-and-forget notification helper.
// Called after a successful DB insert in both quote API routes.
// Requires these env vars (set in Railway dashboard):
//   RESEND_API_KEY        — from resend.com (free tier: 3k emails/month)
//   NOTIFICATION_EMAIL    — your email address to receive alerts
//   RESEND_FROM_EMAIL     — e.g. quotes@tristaravel.com (must be a verified Resend domain)
//   NTFY_TOPIC            — your private ntfy.sh topic, e.g. tristaravel-a8f3k2
// All four are optional — missing vars simply skip that channel.

function buildLines(quoteId, tripType, d) {
  const label = tripType === "round" ? "Round Trip" : "One Way";
  const fare =
    d.price != null
      ? `₹${Number(d.price).toLocaleString("en-IN")}${
          d.price_max != null
            ? ` – ₹${Number(d.price_max).toLocaleString("en-IN")}`
            : ""
        }`
      : "Custom pricing";

  const lines = [
    `Quote #${quoteId} — ${label}`,
    `Name : ${d.full_name}`,
    `Phone: ${d.phone}`,
    d.email ? `Email: ${d.email}` : null,
    `Route: ${d.pickup_location} → ${d.drop_location}`,
    `Date : ${d.travel_date}${d.pickup_time ? ` at ${d.pickup_time}` : ""}`,
    `Car  : ${d.vehicle_type}`,
    d.num_days != null ? `Days : ${d.num_days}` : null,
    d.distance != null ? `Dist : ${d.distance} km` : null,
    `Fare : ${fare}`,
    d.trip_advised ? "Source: Plan Your Trip page" : null,
  ];

  return lines.filter(Boolean);
}

export async function sendNotifications(quoteId, tripType, data) {
  const lines = buildLines(quoteId, tripType, data);
  const label = tripType === "round" ? "Round Trip" : "One Way";
  const subject = `New ${label} Quote — ${data.full_name} (${data.pickup_location} → ${data.drop_location})`;
  const plain = lines.join("\n");

  // ── Email via Resend ────────────────────────────────────────────────────────
  if (process.env.RESEND_API_KEY && process.env.NOTIFICATION_EMAIL) {
    // Strip bare angle brackets — Resend requires either "email@domain.com"
    // or "Name <email@domain.com>". A value like "<email@domain.com>" (no name)
    // is invalid and causes a silent 422 rejection.
    const rawFrom = process.env.RESEND_FROM_EMAIL ?? "";
    const from = rawFrom.trim().startsWith("<") && !rawFrom.includes(" ")
      ? rawFrom.replace(/[<>]/g, "").trim()
      : rawFrom || "Tristaravel <quotes@tristaravel.com>";

    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [process.env.NOTIFICATION_EMAIL],
        subject,
        html: `<pre style="font-family:sans-serif;font-size:14px;line-height:1.7">${plain}</pre>`,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.text();
          console.error(`[notify] Resend ${res.status}:`, body);
        } else {
          console.log("[notify] Email sent for quote #" + quoteId);
        }
      })
      .catch((err) => console.error("[notify] Resend network error:", err));
  }

  // ── Push via ntfy.sh ────────────────────────────────────────────────────────
  if (process.env.NTFY_TOPIC) {
    fetch(`https://ntfy.sh/${process.env.NTFY_TOPIC}`, {
      method: "POST",
      body: plain,
      headers: {
        Title: subject,
        Priority: "high",
        Tags: "car,bell",
      },
    }).catch((err) => console.error("[notify] ntfy error:", err));
  }
}
