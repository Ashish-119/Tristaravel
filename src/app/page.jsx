import React, { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Car,
  Navigation,
  User,
  Phone,
  Mail,
  MapPin,
  Loader2,
  IndianRupee,
  ShieldCheck,
  Clock,
  ChevronDown,
  AlertCircle,
} from "lucide-react";

// ── Free geocoding via Nominatim ──────────────────────────────────────────────
async function getCoordinates(place) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}`,
    { headers: { "Accept-Language": "en" } },
  );
  const data = await res.json();
  if (!data.length) return null;
  return { lat: data[0].lat, lon: data[0].lon };
}

// ── Free routing via OSRM ─────────────────────────────────────────────────────
async function getRouteDistance(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.routes || !data.routes.length) return null;
  return data.routes[0].distance / 1000; // metres → km
}

// ── Price calculation ─────────────────────────────────────────────────────────
function calcFare(distanceKM, vehicleType) {
  if (vehicleType === "Small Sedan") return Math.round(distanceKM * 11);
  if (vehicleType === "Large SUV") return Math.round(distanceKM * 15);
  return null; // Traveller → custom
}

export default function HomePage() {
  const [formData, setFormData] = useState({
    pickup_location: "",
    drop_location: "",
    vehicle_type: "Small Sedan",
    full_name: "",
    email: "",
    phone: "",
  });

  const [distanceKM, setDistanceKM] = useState(null);
  const [fare, setFare] = useState(null);
  const [calcStatus, setCalcStatus] = useState("idle"); // idle | loading | done | error
  const [calcMessage, setCalcMessage] = useState("");
  const debounceRef = useRef(null);

  const field = (key) => (e) =>
    setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  // ── Live calculation whenever pickup / drop / vehicle changes ────────────────
  useEffect(() => {
    clearTimeout(debounceRef.current);
    const { pickup_location, drop_location, vehicle_type } = formData;

    if (!pickup_location.trim() || !drop_location.trim()) {
      setCalcStatus("idle");
      setDistanceKM(null);
      setFare(null);
      return;
    }

    // Recalculate fare immediately when vehicle changes, if distance already known
    if (distanceKM !== null && calcStatus === "done") {
      setFare(calcFare(distanceKM, vehicle_type));
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setCalcStatus("loading");
      setCalcMessage("Calculating…");
      try {
        const [from, to] = await Promise.all([
          getCoordinates(pickup_location),
          getCoordinates(drop_location),
        ]);
        if (!from || !to) {
          setCalcStatus("error");
          setCalcMessage(
            "One or both locations could not be found. Please check the city names.",
          );
          return;
        }
        const km = await getRouteDistance(from, to);
        if (!km) {
          setCalcStatus("error");
          setCalcMessage("No driving route found between these locations.");
          return;
        }
        setDistanceKM(km);
        setFare(calcFare(km, vehicle_type));
        setCalcStatus("done");
      } catch (err) {
        console.error(err);
        setCalcStatus("error");
        setCalcMessage("Something went wrong. Please try again.");
      }
    }, 800);

    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.pickup_location, formData.drop_location]);

  // Update fare instantly on vehicle type change (no re-fetch needed)
  useEffect(() => {
    if (distanceKM !== null) {
      setFare(calcFare(distanceKM, formData.vehicle_type));
    }
  }, [formData.vehicle_type, distanceKM]);

  // ── Quote submission ─────────────────────────────────────────────────────────
  const quoteMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to submit quote");
      return res.json();
    },
    onSuccess: () => {
      alert("Quote requested successfully! We will contact you soon.");
      setFormData({
        pickup_location: "",
        drop_location: "",
        vehicle_type: "Small Sedan",
        full_name: "",
        email: "",
        phone: "",
      });
      setDistanceKM(null);
      setFare(null);
      setCalcStatus("idle");
    },
    onError: (err) => alert(err.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.phone.trim()) {
      alert("Full Name and Phone are mandatory.");
      return;
    }
    quoteMutation.mutate({
      ...formData,
      distance: distanceKM ? parseFloat(distanceKM.toFixed(1)) : null,
      price: fare,
    });
  };

  // ── Shared input class ───────────────────────────────────────────────────────
  const inputCls =
    "w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-[#FBBF24] focus:border-[#FBBF24] transition-all outline-none";

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Hero / Booking Section ─────────────────────────────────────────── */}
      <section className="relative pt-16 pb-24 overflow-hidden bg-[#1E293B]">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_40%,#334155_0%,transparent_60%)]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left — Hero copy */}
            <div className="pt-6 lg:pt-16">
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#FBBF24] bg-[#FBBF24]/10 px-4 py-2 rounded-full mb-6">
                Intercity Travel · India
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Premium Travel,
                <br />
                <span className="text-[#FBBF24]">Any City. Any Time.</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-300 mb-10 max-w-lg leading-relaxed">
                Seamless intercity journeys for tourists — verified drivers,
                transparent pricing, and a fleet that never lets you down.
              </p>
              <div className="flex flex-wrap gap-6 text-sm font-medium text-slate-300">
                {[
                  {
                    icon: <ShieldCheck className="text-[#FBBF24] w-5 h-5" />,
                    text: "Verified Drivers",
                  },
                  {
                    icon: <Clock className="text-[#FBBF24] w-5 h-5" />,
                    text: "24/7 Availability",
                  },
                  {
                    icon: <Car className="text-[#FBBF24] w-5 h-5" />,
                    text: "Modern Fleet",
                  },
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {b.icon}
                    {b.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Booking Form */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/30 border border-slate-100">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-[#1E293B]">
                  Plan Your Journey
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  Get an instant fare estimate — no sign-up needed
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Pickup & Drop — stacked on mobile, side-by-side on sm+ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Pickup Location
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        name="pickup_location"
                        placeholder="City / Town / Village"
                        required
                        className={inputCls}
                        value={formData.pickup_location}
                        onChange={field("pickup_location")}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Drop Location
                    </label>
                    <div className="relative">
                      <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        name="drop_location"
                        placeholder="City / Town / Village"
                        required
                        className={inputCls}
                        value={formData.drop_location}
                        onChange={field("drop_location")}
                      />
                    </div>
                  </div>
                </div>

                {/* Vehicle Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Vehicle Type
                  </label>
                  <div className="relative">
                    <Car className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                    <select
                      name="vehicle_type"
                      className={
                        inputCls + " pr-10 appearance-none cursor-pointer"
                      }
                      value={formData.vehicle_type}
                      onChange={field("vehicle_type")}
                    >
                      <option value="Small Sedan">
                        Small Sedan — Dzire, Aura, Xcent
                      </option>
                      <option value="Large SUV">
                        Large SUV — Innova, Ertiga, Crysta
                      </option>
                      <option value="Traveller">
                        Traveller — Tempo Traveller (Custom)
                      </option>
                    </select>
                  </div>
                </div>

                {/* ── Quote Box (mirrors the provided CSS style) ───────────── */}
                {calcStatus !== "idle" && (
                  <div
                    style={{
                      background: "#ffffff",
                      borderRadius: "18px",
                      borderLeft: "5px solid #c1121f",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                    }}
                    className="p-5"
                  >
                    {calcStatus === "loading" && (
                      <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
                        <Loader2 className="w-5 h-5 animate-spin text-[#c1121f]" />
                        Calculating distance & fare…
                      </div>
                    )}

                    {calcStatus === "error" && (
                      <div className="flex items-start gap-3 text-red-600 text-sm">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <span>{calcMessage}</span>
                      </div>
                    )}

                    {calcStatus === "done" && distanceKM !== null && (
                      <>
                        <h3 className="text-base font-bold text-[#222] mb-3 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[#c1121f]" />
                          Your Journey Summary
                        </h3>

                        <div className="grid grid-cols-2 gap-3">
                          {/* Distance card */}
                          <div className="bg-slate-50 rounded-xl p-3 text-center">
                            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                              Total Distance
                            </p>
                            <p
                              id="distanceText"
                              className="text-xl font-bold text-[#1E293B]"
                            >
                              {distanceKM.toFixed(1)}{" "}
                              <span className="text-sm font-semibold text-slate-500">
                                KM
                              </span>
                            </p>
                          </div>

                          {/* Fare card */}
                          <div className="bg-[#1E293B] rounded-xl p-3 text-center">
                            <p className="text-[10px] uppercase tracking-widest text-[#FBBF24] font-bold mb-1">
                              Approx. Fare
                            </p>
                            {fare !== null ? (
                              <p
                                id="fareText"
                                className="text-xl font-bold text-white flex items-center justify-center gap-0.5"
                              >
                                <IndianRupee className="w-4 h-4" />
                                {fare.toLocaleString("en-IN")}
                              </p>
                            ) : (
                              <p
                                id="fareText"
                                className="text-sm font-bold text-[#FBBF24] leading-tight mt-1"
                              >
                                Custom Pricing — Contact Us
                              </p>
                            )}
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
                          * Estimate based on road distance. Tolls, state taxes
                          &amp; driver allowance may apply.
                        </p>
                      </>
                    )}
                  </div>
                )}

                {/* ── Divider ───────────────────────────────────────────────── */}
                <div className="border-t border-slate-100 pt-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                    Your Details
                  </p>

                  <div className="space-y-4">
                    {/* Full Name */}
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        name="full_name"
                        placeholder="Full Name *"
                        required
                        className={inputCls}
                        value={formData.full_name}
                        onChange={field("full_name")}
                      />
                    </div>

                    {/* Email + Phone — side by side on sm+ */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="email"
                          name="email"
                          placeholder="Email (Optional)"
                          className={inputCls}
                          value={formData.email}
                          onChange={field("email")}
                        />
                      </div>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="tel"
                          name="phone"
                          placeholder="Phone *"
                          required
                          className={inputCls}
                          value={formData.phone}
                          onChange={field("phone")}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={quoteMutation.isPending}
                  style={{
                    borderRadius: "12px",
                    fontSize: "18px",
                    padding: "16px",
                  }}
                  className="w-full bg-[#c1121f] hover:bg-[#a50f1a] text-white font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-red-900/20 disabled:opacity-70"
                >
                  {quoteMutation.isPending ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      Get Quote <Car className="w-5 h-5 opacity-80" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#1E293B] mb-3">
              Why Choose Tristaravel.com?
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-sm leading-relaxed">
              We provide the most reliable intercity taxi services for tourists,
              ensuring comfort and safety throughout your journey.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {[
              {
                icon: <ShieldCheck className="w-10 h-10 text-[#FBBF24]" />,
                title: "Safety First",
                desc: "All vehicles are GPS tracked and drivers go through rigorous background checks.",
              },
              {
                icon: <Car className="w-10 h-10 text-[#FBBF24]" />,
                title: "Premium Fleet",
                desc: "Well-maintained Sedans, SUVs, and Tempo Travellers — spotlessly clean every ride.",
              },
              {
                icon: <IndianRupee className="w-10 h-10 text-[#FBBF24]" />,
                title: "Transparent Pricing",
                desc: "No hidden charges. What you see is what you pay — tolls clearly communicated upfront.",
              },
            ].map((f, i) => (
              <div key={i} className="text-center group">
                <div className="inline-block p-5 bg-slate-50 rounded-2xl mb-5 group-hover:bg-[#1E293B] transition-all duration-300">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-[#1E293B] mb-2">
                  {f.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
