import React, { useState, useRef } from "react";
import {
  MapPin,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Compass,
  Footprints,
  ArrowRight,
} from "lucide-react";
import DESTINATIONS from "@/app/plan-your-trip/destinations";

// Build a themed, keyless image URL from a set of keywords. loremflickr's
// `/all` mode matches *any* of the comma-separated tags, so a slide never ends
// up blank; the `lock` seed keeps each slide's image stable across re-renders
// and distinct from its siblings.
function slideImage(words, seed) {
  const tags = words
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join(",");
  return `https://loremflickr.com/800/520/${tags}/all?lock=${seed}`;
}

// Turn a destination's `nearby` + `thingsToDo` lists into carousel slides.
function buildSlides(place, baseSeed) {
  const nearby = place.nearby.map((title) => ({
    kind: "Nearby",
    title,
    words: `${title} india`,
  }));
  const todo = place.thingsToDo.map((title) => ({
    kind: "To Do",
    title,
    words: `${place.name} india travel`,
  }));
  return [...nearby, ...todo].map((s, i) => ({
    ...s,
    img: slideImage(s.words, baseSeed + i),
  }));
}

function PlaceCard({ place, baseSeed }) {
  const slides = useRef(buildSlides(place, baseSeed)).current;
  const [index, setIndex] = useState(0);
  const [interacted, setInteracted] = useState(false);
  const touchStartX = useRef(null);

  const markInteracted = () => setInteracted(true);

  const go = (dir) => {
    markInteracted();
    setIndex((i) => (i + dir + slides.length) % slides.length);
  };

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) go(delta < 0 ? 1 : -1);
    else markInteracted();
    touchStartX.current = null;
  };

  const slide = slides[index];
  const quoteHref = `/?trip=round&advised=1&dest=${encodeURIComponent(place.dest)}`;

  return (
    <div className="bg-white rounded-[28px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500 flex flex-col">
      {/* ── Carousel ─────────────────────────────────────────────────────── */}
      <div
        className="relative h-64 select-none cursor-pointer bg-slate-100"
        onClick={markInteracted}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {slides.map((s, i) => (
          <img
            key={i}
            src={s.img}
            alt={`${s.title} — ${place.name}`}
            loading="lazy"
            draggable={false}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              i === index ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          />
        ))}

        {/* Gradient + caption */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm">
          <span className="text-[11px] font-bold text-[#1E293B] uppercase tracking-widest">
            {place.name}
          </span>
        </div>
        <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mb-1.5 ${
              slide.kind === "Nearby"
                ? "bg-[#FBBF24] text-[#1E293B]"
                : "bg-[#c1121f] text-white"
            }`}
          >
            {slide.kind === "Nearby" ? (
              <Compass className="w-2.5 h-2.5" />
            ) : (
              <Footprints className="w-2.5 h-2.5" />
            )}
            {slide.kind === "Nearby" ? "Nearby" : "Things to do"}
          </span>
          <p className="text-white font-bold text-base leading-tight drop-shadow">
            {slide.title}
          </p>
        </div>

        {/* Arrows */}
        <button
          type="button"
          aria-label="Previous"
          onClick={(e) => {
            e.stopPropagation();
            go(-1);
          }}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 hover:bg-white text-[#1E293B] flex items-center justify-center shadow transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          aria-label="Next"
          onClick={(e) => {
            e.stopPropagation();
            go(1);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 hover:bg-white text-[#1E293B] flex items-center justify-center shadow transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Dots */}
        <div className="absolute top-4 right-4 flex gap-1">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`block h-1.5 rounded-full transition-all ${
                i === index ? "w-4 bg-white" : "w-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
          <MapPin className="w-3.5 h-3.5 text-[#FBBF24]" />
          {place.state}
        </div>
        <h3 className="text-xl font-bold text-[#1E293B]">{place.name}</h3>
        <p className="text-sm text-slate-500 mt-1 mb-4">{place.tagline}</p>

        <p className="text-[11px] text-slate-400 mb-4">
          Swipe or tap the gallery to explore {slides.length} spots & experiences.
        </p>

        {/* Get Quote — pops up once the user interacts with the carousel */}
        <div
          className={`mt-auto grid transition-all duration-300 ${
            interacted
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <a
              href={quoteHref}
              className="w-full bg-[#c1121f] hover:bg-[#a50f1a] text-white py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-900/20"
            >
              Get Quote for {place.name}
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlanYourTripPage() {
  return (
    <div className="bg-[#F8FAFC]">
      {/* Header */}
      <section className="bg-[#1E293B] py-24 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_40%,#334155_0%,transparent_60%)]" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#FBBF24] bg-[#FBBF24]/10 px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Curated Destinations · India
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Plan Your Trip
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Explore India's most loved destinations — swipe through nearby gems
            and unmissable experiences, then get an instant quote for your
            journey.
          </p>
        </div>
      </section>

      {/* Destinations grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {DESTINATIONS.map((place, i) => (
              <PlaceCard key={place.id} place={place} baseSeed={(i + 1) * 50} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
