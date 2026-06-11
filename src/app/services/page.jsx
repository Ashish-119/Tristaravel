import React from "react";
import {
  Car,
  Plane,
  Hotel,
  MapPin,
  ShieldCheck,
  Clock,
  Headphones,
} from "lucide-react";

export default function ServicesPage() {
  const services = [
    {
      icon: <Car className="w-12 h-12" />,
      title: "Intercity One-Way",
      description:
        "Hassle-free one-way drops between cities at competitive rates. Pay only for the distance you travel.",
      features: ["No hidden costs", "GPS tracking", "AC Vehicles"],
    },
    {
      icon: <MapPin className="w-12 h-12" />,
      title: "Round Trip Packages",
      description:
        "Comprehensive multi-day trip packages for tourists exploring regional circuits and hill stations.",
      features: [
        "Unlimited sightseeing",
        "Driver allowance included",
        "Flexible route",
      ],
    },
    {
      icon: <Plane className="w-12 h-12" />,
      title: "Airport Transfers",
      description:
        "Timely airport pickups and drops from all major international airports with 'Meet & Greet' service.",
      features: [
        "Waiting time included",
        "Flight tracking",
        "Luggage assistance",
      ],
    },
    {
      icon: <Hotel className="w-12 h-12" />,
      title: "City Sightseeing",
      description:
        "Dedicated local city tours with knowledgeable drivers who know the best spots and shortcuts.",
      features: ["Fixed hourly rates", "Multiple stops", "Expert drivers"],
    },
  ];

  return (
    <div className="bg-white">
      {/* Header */}
      <section className="bg-[#1E293B] py-24 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Our Services
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Tailored transportation solutions designed for the modern tourist.
          </p>
        </div>
      </section>

      {/* Service List */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {services.map((service, index) => (
              <div
                key={index}
                className="flex flex-col md:flex-row gap-8 p-8 rounded-3xl border border-slate-100 hover:border-[#FBBF24]/30 hover:shadow-xl hover:shadow-slate-100 transition-all group"
              >
                <div className="flex-shrink-0 w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center text-[#1E293B] group-hover:bg-[#FBBF24] transition-colors">
                  {service.icon}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#1E293B] mb-4">
                    {service.title}
                  </h3>
                  <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                    {service.description}
                  </p>
                  <ul className="grid grid-cols-1 gap-3">
                    {service.features.map((f, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide"
                      >
                        <ShieldCheck className="w-4 h-4 text-[#FBBF24]" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[#F8FAFC]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center bg-[#1E293B] rounded-[40px] py-16 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-6">
              Need a Custom Travel Package?
            </h2>
            <p className="text-slate-400 mb-10 max-w-lg mx-auto">
              Contact our concierge team to design a personalized travel
              itinerary tailored to your group size and destinations.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <div className="flex items-center gap-3">
                <Headphones className="text-[#FBBF24]" />
                <span className="font-semibold">+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="text-[#FBBF24]" />
                <span className="font-semibold">24/7 Support</span>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FBBF24]/5 rounded-full -mr-32 -mt-32" />
        </div>
      </section>
    </div>
  );
}
