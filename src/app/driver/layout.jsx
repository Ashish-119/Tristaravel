import React from "react";
import { Car } from "lucide-react";

// Self-contained shell for the driver portal. The public marketing navbar/footer
// (from src/app/layout.jsx) are hidden on /driver paths, so this provides the
// driver area's own chrome.
export default function DriverLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-[#1E293B] text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-2">
          <div className="bg-[#FBBF24]/10 p-2 rounded-lg">
            <Car className="text-[#FBBF24] w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            Tristar<span className="text-[#FBBF24]">avel</span>
            <span className="ml-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
              Driver
            </span>
          </span>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
