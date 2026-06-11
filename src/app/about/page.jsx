import React from "react";
import { ShieldCheck, Target, Users, Map } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-[#1E293B] py-24 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Our Journey
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Providing premium intercity travel experiences for global tourists
            exploring the heart of India.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-[#1E293B] mb-6">
                Redefining Tourist Travel in India
              </h2>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Founded in 2020, InterCity Cabs was born out of a simple
                observation: tourists need more than just a ride. They need a
                companion who knows the roads, respects their time, and ensures
                their safety in a foreign land.
              </p>
              <p className="text-slate-600 mb-8 leading-relaxed">
                We specialize in long-distance, intercity travel, connecting
                major tourist hubs with the hidden gems of India. Our drivers
                are trained specifically for tourist hospitality, making every
                journey informative and pleasant.
              </p>

              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="text-4xl font-bold text-[#FBBF24] mb-2">
                    50k+
                  </h4>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                    Happy Tourists
                  </p>
                </div>
                <div>
                  <h4 className="text-4xl font-bold text-[#FBBF24] mb-2">
                    200+
                  </h4>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                    Cities Covered
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square bg-slate-100 rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=1000"
                  alt="Tourist Bus"
                  className="w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-500"
                />
              </div>
              <div className="absolute -bottom-10 -left-10 bg-[#FBBF24] p-8 rounded-2xl hidden md:block">
                <p className="text-[#1E293B] font-bold text-xl italic leading-tight">
                  "Reliability is our <br /> strongest fuel."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-[#1E293B] mb-16">
            Our Core Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-left">
            {[
              {
                icon: <ShieldCheck className="w-8 h-8" />,
                title: "Safety",
                desc: "Your safety is non-negotiable. Every trip is monitored 24/7.",
              },
              {
                icon: <Target className="w-8 h-8" />,
                title: "Precision",
                desc: "Punctuality is our hallmark. We value your time as much as you do.",
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: "Hospitality",
                desc: "Drivers who speak your language and understand your needs.",
              },
              {
                icon: <Map className="w-8 h-8" />,
                title: "Discovery",
                desc: "Helping you find the soul of India beyond the guidebooks.",
              },
            ].map((v, i) => (
              <div
                key={i}
                className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-[#FBBF24] mb-6">{v.icon}</div>
                <h3 className="text-lg font-bold text-[#1E293B] mb-3">
                  {v.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
