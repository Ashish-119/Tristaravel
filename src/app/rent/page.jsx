import React from "react";
import {
  Car,
  IndianRupee,
  Users,
  Briefcase,
  ChevronRight,
  Star,
} from "lucide-react";

export default function RentPage() {
  const fleet = [
    {
      category: "Small Sedan",
      price: "3,000",
      models: ["Maruti Suzuki Swift Dzire", "Hyundai Aura", "Honda Amaze"],
      image:
        "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=800",
      passengers: 4,
      luggage: 2,
      features: ["AC", "Music System", "Comfortable Seating"],
    },
    {
      category: "Large SUV",
      price: "5,000",
      models: [
        "Toyota Innova Crysta",
        "Maruti Suzuki Ertiga",
        "Mahindra XUV700",
      ],
      image:
        "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800",
      passengers: 7,
      luggage: 4,
      features: ["Spacious", "Dual AC", "Carrier Available"],
    },
    {
      category: "Tempo Traveller",
      price: "Custom",
      models: ["Force Traveller (12/17 Seater)", "Luxury Maharaja Seating"],
      image:
        "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800",
      passengers: "12-17",
      luggage: 10,
      features: ["Pushback Seats", "TV/Music", "Ample Legroom"],
    },
  ];

  return (
    <div className="bg-[#F8FAFC]">
      {/* Header */}
      <section className="bg-[#1E293B] py-24 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Rent a Car
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Choose from our professional fleet of Indian taxi cars.
            Well-maintained, clean, and safe for every journey.
          </p>
        </div>
      </section>

      {/* Fleet Grid */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {fleet.map((car, index) => (
              <div
                key={index}
                className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500 group"
              >
                <div className="h-64 overflow-hidden relative">
                  <img
                    src={car.image}
                    alt={car.category}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute top-6 left-6 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-sm">
                    <span className="text-xs font-bold text-[#1E293B] uppercase tracking-widest">
                      {car.category}
                    </span>
                  </div>
                </div>

                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-[#1E293B] mb-2">
                        {car.category}
                      </h3>
                      <div className="flex items-center gap-2 text-[#FBBF24]">
                        <Star size={14} fill="currentColor" />
                        <Star size={14} fill="currentColor" />
                        <Star size={14} fill="currentColor" />
                        <Star size={14} fill="currentColor" />
                        <Star size={14} fill="currentColor" />
                        <span className="text-slate-400 text-xs font-bold ml-1">
                          (4.9/5)
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-2xl font-black text-[#1E293B]">
                        {car.price !== "Custom" && (
                          <IndianRupee className="w-4 h-4" />
                        )}
                        <span>{car.price}</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        per day
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-6 mb-8 py-4 border-y border-slate-50">
                    <div className="flex items-center gap-2">
                      <Users size={18} className="text-slate-400" />
                      <span className="text-sm font-bold text-slate-600">
                        {car.passengers} Seats
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase size={18} className="text-slate-400" />
                      <span className="text-sm font-bold text-slate-600">
                        {car.luggage} Bags
                      </span>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                      Top Models
                    </h4>
                    <ul className="space-y-3">
                      {car.models.map((m, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-3 text-sm font-semibold text-slate-700"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-[#FBBF24]" />
                          {m}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <a
                    href="/"
                    className="w-full bg-[#1E293B] text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 group-hover:bg-[#FBBF24] group-hover:text-[#1E293B] transition-all duration-300"
                  >
                    Get Quote <ChevronRight size={18} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Standards */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold text-[#1E293B] mb-8">
                Our Standards are Up to the Mark
              </h2>
              <div className="space-y-8">
                {[
                  {
                    t: "Deep Cleaning",
                    d: "Every car is sanitized and deep cleaned before every pickup to ensure hygiene.",
                  },
                  {
                    t: "Verified Drivers",
                    d: "Chauffeurs are background-checked and trained in tourism-standard hospitality.",
                  },
                  {
                    t: "Roadside Assistance",
                    d: "24/7 technical support and immediate backup vehicle in case of breakdowns.",
                  },
                ].map((s, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 bg-[#FBBF24]/10 rounded-xl flex items-center justify-center text-[#FBBF24]">
                      <Star fill="currentColor" size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1E293B] mb-1">{s.t}</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        {s.d}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:w-1/2 grid grid-cols-2 gap-4">
              <img
                src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800"
                className="rounded-2xl h-48 w-full object-cover mt-8"
              />
              <img
                src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=800"
                className="rounded-2xl h-48 w-full object-cover"
              />
              <img
                src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=800"
                className="rounded-2xl h-48 w-full object-cover"
              />
              <img
                src="https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&q=80&w=800"
                className="rounded-2xl h-48 w-full object-cover -mt-8"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
