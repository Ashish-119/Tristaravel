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
  Menu,
  X,
} from "lucide-react";

function WhatsAppIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

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
  { href: "/plan-your-trip", label: "Plan Your Trip" },
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
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
                    href="https://www.facebook.com/share/19Dd3skvFV/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#FBBF24] transition-colors"
                    aria-label="Facebook"
                  >
                    <Facebook size={20} />
                  </a>
                  <a
                    href="https://wa.me/919868724879"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#FBBF24] transition-colors"
                    aria-label="WhatsApp"
                  >
                    <WhatsAppIcon size={20} />
                  </a>
                  <a
                    href="https://www.instagram.com/ig_tristaravel?igsh=MjN1Z2cyOGhvc3k5"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#FBBF24] transition-colors"
                    aria-label="Instagram"
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
                      href="/plan-your-trip"
                      className="hover:text-white transition-colors"
                    >
                      Plan Your Trip
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
