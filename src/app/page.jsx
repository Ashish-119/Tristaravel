import React, { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
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
  ArrowRight,
  RotateCcw,
  Calendar,
  Minus,
  Plus,
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

// ── One-way price calculation ─────────────────────────────────────────────────
// Same approach as the round-trip estimate: return a {min, max} range using a
// +5/km buffer on top of the base rate instead of a single approximate amount.
const OW_KM_RATE = { "Small Sedan": 11, "Large SUV": 15 };

function calcFare(distanceKM, vehicleType) {
  const rate = OW_KM_RATE[vehicleType];
  if (!rate) return null; // Traveller → custom
  return {
    min: Math.round(distanceKM * rate),
    max: Math.round(distanceKM * (rate + 5)),
  };
}

// ── Round-trip price calculation ──────────────────────────────────────────────
const RT_DAILY = { "Small Sedan": 3000, "Large SUV": 5000 };
const RT_KM_RATE = { "Small Sedan": 15, "Large SUV": 18 };

function calcRoundTripFare(oneWayKM, numDays, vehicleType) {
  const dailyRate = RT_DAILY[vehicleType];
  const kmRate = RT_KM_RATE[vehicleType];
  if (!dailyRate || !kmRate) return null; // Traveller → custom
  const totalKM = Math.round(oneWayKM * 2 + 100);
  const dayCost = numDays * dailyRate;
  const kmCost = Math.round(totalKM * kmRate);
  if (kmCost >= dayCost)
    return { basis: "km", min: kmCost, max: Math.round(totalKM * (kmRate + 5)), totalKM };
  return { basis: "day", amount: dayCost, totalKM };
}

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const [tripType, setTripType] = useState(
    searchParams.get("trip") === "round" ? "round_trip" : "one_way",
  );

  // ── One-way form state ───────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    pickup_location: "",
    drop_location: "",
    travel_date: "",
    pickup_time: "09:00",
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

  // ── Round-trip form state ────────────────────────────────────────────────────
  const [rtForm, setRtForm] = useState({
    pickup_location: "",
    drop_location: "",
    travel_date: "",
    pickup_time: "09:00",
    num_days: 2,
    vehicle_type: "Small Sedan",
    full_name: "",
    email: "",
    phone: "",
  });
  const [rtDistanceKM, setRtDistanceKM] = useState(null);
  const [rtFare, setRtFare] = useState(null);
  const [rtCalcStatus, setRtCalcStatus] = useState("idle");
  const [rtCalcMessage, setRtCalcMessage] = useState("");
  const rtDebounceRef = useRef(null);

  const rtField = (key) => (e) =>
    setRtForm((prev) => ({ ...prev, [key]: e.target.value }));

  // ── One-way: live distance + fare calc ───────────────────────────────────────
  useEffect(() => {
    clearTimeout(debounceRef.current);
    const { pickup_location, drop_location } = formData;

    if (!pickup_location.trim() || !drop_location.trim()) {
      setCalcStatus("idle");
      setDistanceKM(null);
      setFare(null);
      return;
    }

    if (distanceKM !== null && calcStatus === "done") {
      setFare(calcFare(distanceKM, formData.vehicle_type));
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
          setCalcMessage("One or both locations could not be found. Please check the city names.");
          return;
        }
        const km = await getRouteDistance(from, to);
        if (!km) {
          setCalcStatus("error");
          setCalcMessage("No driving route found between these locations.");
          return;
        }
        setDistanceKM(km);
        setFare(calcFare(km, formData.vehicle_type));
        setCalcStatus("done");
      } catch {
        setCalcStatus("error");
        setCalcMessage("Something went wrong. Please try again.");
      }
    }, 800);

    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.pickup_location, formData.drop_location]);

  useEffect(() => {
    if (distanceKM !== null) setFare(calcFare(distanceKM, formData.vehicle_type));
  }, [formData.vehicle_type, distanceKM]);

  // ── Round-trip: live distance + fare calc ────────────────────────────────────
  useEffect(() => {
    clearTimeout(rtDebounceRef.current);
    const { pickup_location, drop_location } = rtForm;

    if (!pickup_location.trim() || !drop_location.trim()) {
      setRtCalcStatus("idle");
      setRtDistanceKM(null);
      setRtFare(null);
      return;
    }

    rtDebounceRef.current = setTimeout(async () => {
      setRtCalcStatus("loading");
      try {
        const [from, to] = await Promise.all([
          getCoordinates(pickup_location),
          getCoordinates(drop_location),
        ]);
        if (!from || !to) {
          setRtCalcStatus("error");
          setRtCalcMessage("Location not found. Please check the city names.");
          return;
        }
        const km = await getRouteDistance(from, to);
        if (!km) {
          setRtCalcStatus("error");
          setRtCalcMessage("No driving route found between these locations.");
          return;
        }
        setRtDistanceKM(km);
        setRtFare(calcRoundTripFare(km, rtForm.num_days, rtForm.vehicle_type));
        setRtCalcStatus("done");
      } catch {
        setRtCalcStatus("error");
        setRtCalcMessage("Something went wrong. Please try again.");
      }
    }, 800);

    return () => clearTimeout(rtDebounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rtForm.pickup_location, rtForm.drop_location]);

  // Re-calc RT fare instantly when days or vehicle type changes (no re-fetch needed)
  useEffect(() => {
    if (rtDistanceKM !== null)
      setRtFare(calcRoundTripFare(rtDistanceKM, rtForm.num_days, rtForm.vehicle_type));
  }, [rtForm.num_days, rtForm.vehicle_type, rtDistanceKM]);

  // ── One-way submission ───────────────────────────────────────────────────────
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
        travel_date: "",
        pickup_time: "09:00",
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
    if (!formData.full_name.trim() || !formData.phone.trim() || !formData.travel_date) {
      alert("Full Name, Phone, and Travel Date are mandatory.");
      return;
    }
    quoteMutation.mutate({
      ...formData,
      distance: distanceKM ? parseFloat(distanceKM.toFixed(1)) : null,
      price: fare?.min ?? null,
      price_max: fare?.max ?? null,
    });
  };

  // ── Round-trip submission ────────────────────────────────────────────────────
  const rtMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/round-trip-quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to submit round trip request");
      return res.json();
    },
    onSuccess: () => {
      alert("Round trip requested! We will contact you soon.");
      setRtForm({
        pickup_location: "",
        drop_location: "",
        travel_date: "",
        pickup_time: "09:00",
        num_days: 2,
        vehicle_type: "Small Sedan",
        full_name: "",
        email: "",
        phone: "",
      });
      setRtDistanceKM(null);
      setRtFare(null);
      setRtCalcStatus("idle");
    },
    onError: (err) => alert(err.message),
  });

  const handleRtSubmit = (e) => {
    e.preventDefault();
    if (!rtForm.full_name.trim() || !rtForm.phone.trim() || !rtForm.travel_date) {
      alert("Name, phone, and travel date are required.");
      return;
    }
    rtMutation.mutate({
      ...rtForm,
      distance: rtDistanceKM ? parseFloat(rtDistanceKM.toFixed(1)) : null,
      price: rtFare?.basis === "km" ? rtFare.min : (rtFare?.amount ?? null),
      price_max: rtFare?.basis === "km" ? rtFare.max : null,
      pricing_basis: rtFare ? rtFare.basis : "custom",
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
                  { icon: <ShieldCheck className="text-[#FBBF24] w-5 h-5" />, text: "Verified Drivers" },
                  { icon: <Clock className="text-[#FBBF24] w-5 h-5" />, text: "24/7 Availability" },
                  { icon: <Car className="text-[#FBBF24] w-5 h-5" />, text: "Modern Fleet" },
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {b.icon}
                    {b.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Booking Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/30 border border-slate-100">
              <div className="mb-5">
                <h2 className="text-2xl font-bold text-[#1E293B]">Plan Your Journey</h2>
                <p className="text-slate-500 text-sm mt-1">
                  Get an instant fare estimate — no sign-up needed
                </p>
              </div>

              {/* ── Trip type toggle ─────────────────────────────────────── */}
              <div className="flex bg-slate-100 rounded-2xl p-1 mb-6">
                <button
                  type="button"
                  onClick={() => setTripType("one_way")}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    tripType === "one_way"
                      ? "bg-white text-[#1E293B] shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <ArrowRight className="w-4 h-4" /> One Way
                </button>
                <button
                  type="button"
                  onClick={() => setTripType("round_trip")}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    tripType === "round_trip"
                      ? "bg-white text-[#1E293B] shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <RotateCcw className="w-4 h-4" /> Round Trip
                </button>
              </div>

              {/* ── One-way form ─────────────────────────────────────────── */}
              {tripType === "one_way" && (
                <form onSubmit={handleSubmit} className="space-y-5">
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

                  {/* Travel Date & Pickup Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Travel Date
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="date"
                          required
                          className={inputCls}
                          value={formData.travel_date}
                          onChange={field("travel_date")}
                          min={new Date().toISOString().split("T")[0]}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Pickup Time
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <select
                          className={inputCls + " appearance-none cursor-pointer"}
                          value={formData.pickup_time}
                          onChange={field("pickup_time")}
                        >
                          {[
                            "06:00","07:00","08:00","09:00","10:00","11:00","12:00",
                            "13:00","14:00","15:00","16:00","17:00","18:00","19:00",
                            "20:00","21:00","22:00",
                          ].map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Vehicle Type
                    </label>
                    <div className="relative">
                      <Car className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                      <select
                        name="vehicle_type"
                        className={inputCls + " pr-10 appearance-none cursor-pointer"}
                        value={formData.vehicle_type}
                        onChange={field("vehicle_type")}
                      >
                        <option value="Small Sedan">Small Sedan — Dzire, Aura, Xcent</option>
                        <option value="Large SUV">Large SUV — Innova, Ertiga, Crysta</option>
                        <option value="Traveller">Traveller — Tempo Traveller (Custom)</option>
                      </select>
                    </div>
                  </div>

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
                            <MapPin className="w-4 h-4 text-[#c1121f]" /> Your Journey Summary
                          </h3>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 rounded-xl p-3 text-center">
                              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                                Total Distance
                              </p>
                              <p className="text-xl font-bold text-[#1E293B]">
                                {distanceKM.toFixed(1)}{" "}
                                <span className="text-sm font-semibold text-slate-500">KM</span>
                              </p>
                            </div>
                            <div className="bg-[#1E293B] rounded-xl p-3 text-center">
                              <p className="text-[10px] uppercase tracking-widest text-[#FBBF24] font-bold mb-1">
                                Approx. Fare
                              </p>
                              {fare !== null ? (
                                <p className="text-lg font-bold text-white leading-tight">
                                  ₹{fare.min.toLocaleString("en-IN")} – ₹
                                  {fare.max.toLocaleString("en-IN")}
                                </p>
                              ) : (
                                <p className="text-sm font-bold text-[#FBBF24] leading-tight mt-1">
                                  Custom Pricing — Contact Us
                                </p>
                              )}
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
                            * Estimate based on road distance. Tolls, state taxes &amp; driver
                            allowance may apply.
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  <div className="border-t border-slate-100 pt-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                      Your Details
                    </p>
                    <div className="space-y-4">
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

                  <button
                    type="submit"
                    disabled={quoteMutation.isPending}
                    style={{ borderRadius: "12px", fontSize: "18px", padding: "16px" }}
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
              )}

              {/* ── Round-trip form ──────────────────────────────────────── */}
              {tripType === "round_trip" && (
                <form onSubmit={handleRtSubmit} className="space-y-5">
                  {/* Pickup & Drop */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Pickup Location
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="City / Town / Village"
                          required
                          className={inputCls}
                          value={rtForm.pickup_location}
                          onChange={rtField("pickup_location")}
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
                          placeholder="City / Town / Village"
                          required
                          className={inputCls}
                          value={rtForm.drop_location}
                          onChange={rtField("drop_location")}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Travel Date & Pickup Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Travel Date
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="date"
                          required
                          className={inputCls}
                          value={rtForm.travel_date}
                          onChange={rtField("travel_date")}
                          min={new Date().toISOString().split("T")[0]}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Pickup Time
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <select
                          className={inputCls + " appearance-none cursor-pointer"}
                          value={rtForm.pickup_time}
                          onChange={rtField("pickup_time")}
                        >
                          {[
                            "06:00","07:00","08:00","09:00","10:00","11:00","12:00",
                            "13:00","14:00","15:00","16:00","17:00","18:00","19:00",
                            "20:00","21:00","22:00",
                          ].map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Number of Days */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Number of Days
                    </label>
                    <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setRtForm((p) => ({ ...p, num_days: Math.max(1, p.num_days - 1) }))}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors"
                      >
                        <Minus className="w-4 h-4 text-slate-600" />
                      </button>
                      <span className="flex-1 text-center font-bold text-[#1E293B] text-lg">
                        {rtForm.num_days}
                      </span>
                      <button
                        type="button"
                        onClick={() => setRtForm((p) => ({ ...p, num_days: Math.min(30, p.num_days + 1) }))}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors"
                      >
                        <Plus className="w-4 h-4 text-slate-600" />
                      </button>
                      <span className="text-sm text-slate-500 font-medium">
                        {rtForm.num_days === 1 ? "day" : "days"}
                      </span>
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
                        className={inputCls + " pr-10 appearance-none cursor-pointer"}
                        value={rtForm.vehicle_type}
                        onChange={rtField("vehicle_type")}
                      >
                        <option value="Small Sedan">Small Sedan — Dzire, Aura, Xcent</option>
                        <option value="Large SUV">Large SUV — Innova, Ertiga, Crysta</option>
                        <option value="Traveller">Traveller — Tempo Traveller (Custom)</option>
                      </select>
                    </div>
                  </div>

                  {/* Round-trip fare estimate */}
                  {rtCalcStatus !== "idle" && (
                    <div
                      style={{
                        background: "#ffffff",
                        borderRadius: "18px",
                        borderLeft: "5px solid #c1121f",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                      }}
                      className="p-5"
                    >
                      {rtCalcStatus === "loading" && (
                        <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
                          <Loader2 className="w-5 h-5 animate-spin text-[#c1121f]" />
                          Calculating distance & fare…
                        </div>
                      )}
                      {rtCalcStatus === "error" && (
                        <div className="flex items-start gap-3 text-red-600 text-sm">
                          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                          <span>{rtCalcMessage}</span>
                        </div>
                      )}
                      {rtCalcStatus === "done" && rtDistanceKM !== null && (
                        <>
                          <h3 className="text-base font-bold text-[#222] mb-3 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-[#c1121f]" /> Round Trip Summary
                          </h3>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 rounded-xl p-3 text-center">
                              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                                One-Way Distance
                              </p>
                              <p className="text-xl font-bold text-[#1E293B]">
                                {rtDistanceKM.toFixed(0)}{" "}
                                <span className="text-sm font-semibold text-slate-500">KM</span>
                              </p>
                              {rtFare && (
                                <p className="text-[10px] text-slate-400 mt-1">
                                  Total: ~{rtFare.totalKM} km
                                </p>
                              )}
                            </div>
                            <div className="bg-[#1E293B] rounded-xl p-3 text-center">
                              <p className="text-[10px] uppercase tracking-widest text-[#FBBF24] font-bold mb-1">
                                Approx. Fare
                              </p>
                              {rtFare !== null ? (
                                <p className="text-lg font-bold text-white leading-tight">
                                  {rtFare.basis === "km"
                                    ? `₹${rtFare.min.toLocaleString("en-IN")} – ₹${rtFare.max.toLocaleString("en-IN")}`
                                    : `₹${rtFare.amount.toLocaleString("en-IN")}`}
                                </p>
                              ) : (
                                <p className="text-sm font-bold text-[#FBBF24] leading-tight mt-1">
                                  Custom Pricing — Contact Us
                                </p>
                              )}
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
                            * Includes 100 km sightseeing buffer. Tolls &amp; driver allowance extra.
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {/* Your Details */}
                  <div className="border-t border-slate-100 pt-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                      Your Details
                    </p>
                    <div className="space-y-4">
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Full Name *"
                          required
                          className={inputCls}
                          value={rtForm.full_name}
                          onChange={rtField("full_name")}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                          <input
                            type="email"
                            placeholder="Email (Optional)"
                            className={inputCls}
                            value={rtForm.email}
                            onChange={rtField("email")}
                          />
                        </div>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                          <input
                            type="tel"
                            placeholder="Phone *"
                            required
                            className={inputCls}
                            value={rtForm.phone}
                            onChange={rtField("phone")}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={rtMutation.isPending}
                    style={{ borderRadius: "12px", fontSize: "18px", padding: "16px" }}
                    className="w-full bg-[#c1121f] hover:bg-[#a50f1a] text-white font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-red-900/20 disabled:opacity-70"
                  >
                    {rtMutation.isPending ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        Request Round Trip <RotateCcw className="w-5 h-5 opacity-80" />
                      </>
                    )}
                  </button>
                </form>
              )}
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
                <h3 className="text-lg font-bold text-[#1E293B] mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
