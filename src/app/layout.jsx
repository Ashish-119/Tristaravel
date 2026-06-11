import React, { useState } from "react";
import { useLocation } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Car,
  MapPin,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Twitter,
  Menu,
  X,
} from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Services" },
  { href: "/rent", label: "Rent a Car" },
  { href: "/contact", label: "Contact" },
];

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group">
            <div className="bg-[#1E293B] p-2 rounded-lg group-hover:bg-[#334155] transition-colors">
              <Car className="text-[#FBBF24] w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-[#1E293B]">
              Tristar<span className="text-[#FBBF24]">avel.com</span>
            </span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-600 hover:text-[#1E293B] transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href="/contact"
              className="bg-[#1E293B] text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[#334155] transition-all shadow-lg shadow-slate-200"
            >
              Book Now
            </a>
          </div>

          {/* Mobile Burger Button */}
          <button
            className="md:hidden p-2 rounded-xl text-[#1E293B] hover:bg-slate-100 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 shadow-xl">
          <div className="flex flex-col px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-sm font-semibold text-slate-700 hover:text-[#1E293B] hover:bg-slate-50 px-4 py-3 rounded-xl transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href="/contact"
              onClick={() => setMenuOpen(false)}
              className="mt-2 bg-[#1E293B] text-white text-center px-5 py-3 rounded-xl text-sm font-semibold hover:bg-[#334155] transition-all"
            >
              Book Now
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}

export default function RootLayout({ children }) {
  const { pathname } = useLocation();
  // The /driver portal has its own chrome — hide the public marketing
  // navbar/footer there while keeping React Query for all routes.
  const isDriver = pathname?.startsWith("/driver");
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
        {!isDriver && <Navbar />}

        {/* Content */}
        <main>{children}</main>

        {/* Footer */}
        {!isDriver && (
        <footer className="bg-[#1E293B] text-slate-300 pt-16 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
              {/* Brand */}
              <div className="col-span-1">
                <a href="/" className="flex items-center gap-2 mb-6">
                  <Car className="text-[#FBBF24] w-6 h-6" />
                  <span className="text-xl font-bold tracking-tight text-white">
                    Tristar<span className="text-[#FBBF24]">avel.com</span>
                  </span>
                </a>
                <p className="text-sm leading-relaxed mb-6">
                  Premium intercity travel solutions for tourists and travelers.
                  Safe, reliable, and comfortable journeys across India.
                </p>
                <div className="flex space-x-4">
                  <a
                    href="#"
                    className="hover:text-[#FBBF24] transition-colors"
                  >
                    <Facebook size={20} />
                  </a>
                  <a
                    href="#"
                    className="hover:text-[#FBBF24] transition-colors"
                  >
                    <Twitter size={20} />
                  </a>
                  <a
                    href="#"
                    className="hover:text-[#FBBF24] transition-colors"
                  >
                    <Instagram size={20} />
                  </a>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="text-white font-semibold mb-6">Quick Links</h4>
                <ul className="space-y-4 text-sm">
                  <li>
                    <a
                      href="/about"
                      className="hover:text-white transition-colors"
                    >
                      Our Story
                    </a>
                  </li>
                  <li>
                    <a
                      href="/services"
                      className="hover:text-white transition-colors"
                    >
                      Services
                    </a>
                  </li>
                  <li>
                    <a
                      href="/rent"
                      className="hover:text-white transition-colors"
                    >
                      Fleet
                    </a>
                  </li>
                  <li>
                    <a
                      href="/contact"
                      className="hover:text-white transition-colors"
                    >
                      Support
                    </a>
                  </li>
                </ul>
              </div>

              {/* Services */}
              <div>
                <h4 className="text-white font-semibold mb-6">Services</h4>
                <ul className="space-y-4 text-sm">
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Intercity Travel
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Airport Transfers
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Tourist Packages
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Luxury Fleet
                    </a>
                  </li>
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h4 className="text-white font-semibold mb-6">Contact Us</h4>
                <ul className="space-y-4 text-sm">
                  <li className="flex items-center gap-3">
                    <MapPin size={18} className="text-[#FBBF24] shrink-0" />
                    <span>New Delhi, India</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Phone size={18} className="text-[#FBBF24] shrink-0" />
                    <span>+91 98765 43210</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Mail size={18} className="text-[#FBBF24] shrink-0" />
                    <span>tristaraveltours@gmail.com</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Footer Bottom — fully centered */}
            <div className="border-t border-slate-700/50 pt-8 flex flex-col items-center gap-3 text-xs font-medium text-center">
              <p className="text-slate-400">
                &copy; 2026 Tristaravel.com. All rights reserved.
              </p>
              <div className="flex gap-6">
                <a href="#" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  Terms of Service
                </a>
              </div>
            </div>
          </div>
        </footer>
        )}
      </div>
    </QueryClientProvider>
  );
}
