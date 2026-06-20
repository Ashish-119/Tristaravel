import React, { useState, useEffect, useRef } from "react";
import { MapPin, Sparkles } from "lucide-react";

// ── Popular Indian destinations + major cities ───────────────────────────────
// Two jobs:
//   1. Baseline suggestions shown before the user types anything specific —
//      popular places to travel to.
//   2. The dictionary for offline "did-you-mean" spelling correction, so common
//      typos of famous places snap to the right name even when the misspelling
//      happens to match some obscure village (where a raw geocoder would fail).
export const POPULAR_CITIES = [
  // Hill stations & tourist towns
  "Manali, Himachal Pradesh",
  "Shimla, Himachal Pradesh",
  "Dharamshala, Himachal Pradesh",
  "Kasol, Himachal Pradesh",
  "Dalhousie, Himachal Pradesh",
  "Spiti, Himachal Pradesh",
  "Rishikesh, Uttarakhand",
  "Haridwar, Uttarakhand",
  "Nainital, Uttarakhand",
  "Mussoorie, Uttarakhand",
  "Dehradun, Uttarakhand",
  "Auli, Uttarakhand",
  "Darjeeling, West Bengal",
  "Gangtok, Sikkim",
  "Shillong, Meghalaya",
  "Ooty, Tamil Nadu",
  "Kodaikanal, Tamil Nadu",
  "Munnar, Kerala",
  "Wayanad, Kerala",
  "Alleppey, Kerala",
  "Coorg, Karnataka",
  "Chikmagalur, Karnataka",
  "Hampi, Karnataka",
  "Mahabaleshwar, Maharashtra",
  "Lonavala, Maharashtra",
  "Mount Abu, Rajasthan",
  "Leh, Ladakh",
  "Srinagar, Jammu and Kashmir",
  "Gulmarg, Jammu and Kashmir",
  "Pahalgam, Jammu and Kashmir",
  // Heritage & pilgrimage
  "Agra, Uttar Pradesh",
  "Varanasi, Uttar Pradesh",
  "Ayodhya, Uttar Pradesh",
  "Mathura, Uttar Pradesh",
  "Amritsar, Punjab",
  "Pushkar, Rajasthan",
  "Ajmer, Rajasthan",
  "Bodh Gaya, Bihar",
  "Tirupati, Andhra Pradesh",
  "Madurai, Tamil Nadu",
  "Rameswaram, Tamil Nadu",
  "Khajuraho, Madhya Pradesh",
  "Ujjain, Madhya Pradesh",
  "Dwarka, Gujarat",
  "Somnath, Gujarat",
  "Shirdi, Maharashtra",
  // Beaches & coast
  "Goa",
  "Pondicherry",
  "Gokarna, Karnataka",
  "Varkala, Kerala",
  "Kovalam, Kerala",
  "Andaman and Nicobar Islands",
  // Royal Rajasthan
  "Jaipur, Rajasthan",
  "Udaipur, Rajasthan",
  "Jaisalmer, Rajasthan",
  "Jodhpur, Rajasthan",
  "Bikaner, Rajasthan",
  "Ranthambore, Rajasthan",
  // Metros & major cities
  "Delhi",
  "New Delhi",
  "Mumbai, Maharashtra",
  "Pune, Maharashtra",
  "Nagpur, Maharashtra",
  "Bangalore, Karnataka",
  "Mysore, Karnataka",
  "Mangalore, Karnataka",
  "Chennai, Tamil Nadu",
  "Coimbatore, Tamil Nadu",
  "Hyderabad, Telangana",
  "Kolkata, West Bengal",
  "Ahmedabad, Gujarat",
  "Surat, Gujarat",
  "Vadodara, Gujarat",
  "Rajkot, Gujarat",
  "Lucknow, Uttar Pradesh",
  "Kanpur, Uttar Pradesh",
  "Noida, Uttar Pradesh",
  "Ghaziabad, Uttar Pradesh",
  "Chandigarh",
  "Bhopal, Madhya Pradesh",
  "Indore, Madhya Pradesh",
  "Patna, Bihar",
  "Ranchi, Jharkhand",
  "Bhubaneswar, Odisha",
  "Guwahati, Assam",
  "Raipur, Chhattisgarh",
  "Visakhapatnam, Andhra Pradesh",
  "Vijayawada, Andhra Pradesh",
  "Kochi, Kerala",
  "Thiruvananthapuram, Kerala",
  "Jammu, Jammu and Kashmir",
  "Gurgaon, Haryana",
  "Faridabad, Haryana",
];

// First token of each label (the place name, before any ", Region").
const POPULAR_INDEX = POPULAR_CITIES.map((label) => ({
  label,
  key: label.split(",")[0].trim().toLowerCase(),
}));

// ── Tiny Levenshtein distance (no dependency) ────────────────────────────────
function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

// Offline "did-you-mean": rank popular destinations against the typed text.
// Prefix matches rank first; otherwise close spellings (small edit distance
// relative to the word length) are surfaced so e.g. "jaypur" → "Jaipur".
function matchPopular(query) {
  const q = query
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  if (!q) return [];

  const scored = [];
  for (const { label, key } of POPULAR_INDEX) {
    if (key === q) {
      scored.push({ label, score: 0 });
      continue;
    }
    if (key.startsWith(q) || q.startsWith(key)) {
      scored.push({ label, score: 0.5 });
      continue;
    }
    const dist = levenshtein(q, key);
    // Allow ~1 edit per 3 characters of the (longer) word, min 1.
    const tolerance = Math.max(1, Math.floor(Math.max(q.length, key.length) * 0.34));
    if (dist <= tolerance) scored.push({ label, score: 1 + dist });
  }

  scored.sort((a, b) => a.score - b.score || a.label.length - b.label.length);
  return scored.map((s) => s.label);
}

// ── Live, India-wide long-tail suggestions (villages, obscure towns) ─────────
// Photon (https://photon.komoot.io) is a free, key-less OSM geocoder. Stray
// punctuation (e.g. the ';' in "Dharmasha;la") is stripped first; only Indian
// results are kept.
async function fetchCitySuggestions(query, signal) {
  const q = query.replace(/[^\p{L}\p{N}\s,.-]/gu, " ").replace(/\s+/g, " ").trim();
  if (q.length < 2) return [];
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=en`;
  const res = await fetch(url, { signal });
  if (!res.ok) return [];
  const data = await res.json();
  const seen = new Set();
  const out = [];
  for (const f of data.features ?? []) {
    const p = f.properties ?? {};
    if (p.countrycode !== "IN") continue; // India only
    const name = p.name;
    if (!name) continue;
    const region = p.state || p.county || p.city || "";
    const label = region && region !== name ? `${name}, ${region}` : name;
    if (seen.has(label)) continue;
    seen.add(label);
    out.push(label);
  }
  return out;
}

function dedupe(list, max) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const k = item.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(item);
    if (out.length >= max) break;
  }
  return out;
}

// A text input with a custom suggestions dropdown anchored directly below it.
// As the user types it shows, in order: offline spelling-corrected popular
// destinations, then live India-wide results from Photon. Short/empty input
// shows popular destinations. Supports mouse + keyboard (↑/↓/Enter/Esc).
export default function LocationInput({
  Icon,
  value,
  onChange,
  placeholder,
  required,
  className,
  name,
}) {
  const [options, setOptions] = useState(() => POPULAR_CITIES.slice(0, 8));
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const wrapRef = useRef(null);

  const isEmptyQuery = (value || "").trim().length < 2;

  // Recompute suggestions as the typed value changes.
  useEffect(() => {
    clearTimeout(debounceRef.current);
    setHighlight(-1);
    const q = (value || "").trim();

    if (q.length < 2) {
      setOptions(POPULAR_CITIES.slice(0, 8));
      return;
    }

    // Instant, offline "did-you-mean" from the curated list.
    const curated = matchPopular(q);
    setOptions(dedupe(curated, 8));

    // Then enrich with live long-tail results, keeping curated matches on top.
    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const live = await fetchCitySuggestions(q, controller.signal);
        setOptions(dedupe([...curated, ...live], 8));
      } catch {
        // Aborted or offline — keep the curated matches already shown.
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [value]);

  // Close the dropdown when clicking outside the field.
  useEffect(() => {
    function onDocPointer(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocPointer);
    return () => document.removeEventListener("mousedown", onDocPointer);
  }, []);

  const emit = (val) => onChange({ target: { name, value: val } });

  const choose = (val) => {
    emit(val);
    setOpen(false);
    setHighlight(-1);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) return setOpen(true);
      setHighlight((h) => Math.min(options.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      if (open && highlight >= 0 && options[highlight]) {
        e.preventDefault();
        choose(options[highlight]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showList = open && options.length > 0;

  return (
    <div className="relative" ref={wrapRef}>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 z-10" />
        )}
        <input
          type="text"
          name={name}
          placeholder={placeholder}
          required={required}
          className={className}
          value={value}
          onChange={(e) => {
            onChange(e);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          role="combobox"
          aria-expanded={showList}
          aria-autocomplete="list"
        />
      </div>

      {showList && (
        <ul
          className="absolute left-0 right-0 top-full mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-xl shadow-black/10 overflow-hidden max-h-72 overflow-y-auto"
          role="listbox"
        >
          {isEmptyQuery && (
            <li className="flex items-center gap-2 px-4 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <Sparkles className="w-3 h-3 text-[#FBBF24]" />
              Popular Destinations
            </li>
          )}
          {options.map((opt, i) => {
            const [place, region] = opt.split(/,(.+)/);
            return (
              <li key={opt} role="option" aria-selected={i === highlight}>
                <button
                  type="button"
                  // onMouseDown (not onClick) so selection runs before the input
                  // blur would otherwise close the list.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(opt);
                  }}
                  onMouseEnter={() => setHighlight(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                    i === highlight ? "bg-slate-100" : "hover:bg-slate-50"
                  }`}
                >
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-slate-800 font-medium">{place.trim()}</span>
                  {region && (
                    <span className="text-xs text-slate-400 truncate">
                      {region.trim()}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
