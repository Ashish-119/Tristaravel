import React, { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Loader2,
  Instagram,
  Facebook,
  Twitter,
  CheckCircle,
} from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((r) => setTimeout(r, 1500));
      setIsSuccess(true);
      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <section className="bg-[#1E293B] py-24 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Contact Us
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Have questions about our routes or fleet? We're here to help 24/7.
          </p>
        </div>
      </section>

      <section className="py-24 -mt-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200 overflow-hidden border border-slate-100">
            <div className="flex flex-col lg:flex-row">
              {/* Contact Info */}
              <div className="lg:w-2/5 bg-[#1E293B] p-12 text-white">
                <h2 className="text-3xl font-bold mb-8">Get in Touch</h2>
                <p className="text-slate-400 mb-12">
                  Visit us at our office or contact us via phone or email for
                  immediate bookings.
                </p>

                <div className="space-y-10">
                  <div className="flex gap-6 items-start">
                    <div className="bg-[#FBBF24]/10 p-4 rounded-2xl text-[#FBBF24]">
                      <Phone size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-2">
                        Call Us
                      </h4>
                      <p className="text-xl font-bold">+91 98765 43210</p>
                      <p className="text-sm text-slate-400 mt-1">
                        Mon-Sun, 24/7 Support
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-6 items-start">
                    <div className="bg-[#FBBF24]/10 p-4 rounded-2xl text-[#FBBF24]">
                      <Mail size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-2">
                        Email Us
                      </h4>
                      <p className="text-xl font-bold">
                        hello@intercitycabs.com
                      </p>
                      <p className="text-sm text-slate-400 mt-1">
                        booking@intercitycabs.com
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-6 items-start">
                    <div className="bg-[#FBBF24]/10 p-4 rounded-2xl text-[#FBBF24]">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-2">
                        Visit Us
                      </h4>
                      <p className="text-xl font-bold">New Delhi, India</p>
                      <p className="text-sm text-slate-400 mt-1">
                        Terminal 3, IGI Airport
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-16 flex gap-6">
                  <a
                    href="#"
                    className="w-12 h-12 rounded-full border border-slate-700 flex items-center justify-center hover:bg-[#FBBF24] hover:text-[#1E293B] transition-all"
                  >
                    <Facebook size={20} />
                  </a>
                  <a
                    href="#"
                    className="w-12 h-12 rounded-full border border-slate-700 flex items-center justify-center hover:bg-[#FBBF24] hover:text-[#1E293B] transition-all"
                  >
                    <Twitter size={20} />
                  </a>
                  <a
                    href="#"
                    className="w-12 h-12 rounded-full border border-slate-700 flex items-center justify-center hover:bg-[#FBBF24] hover:text-[#1E293B] transition-all"
                  >
                    <Instagram size={20} />
                  </a>
                </div>
              </div>

              {/* Contact Form */}
              <div className="lg:w-3/5 p-12">
                {isSuccess ? (
                  <div className="h-full flex flex-col items-center justify-center text-center animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-8">
                      <CheckCircle size={48} />
                    </div>
                    <h2 className="text-3xl font-bold text-[#1E293B] mb-4">
                      Message Sent!
                    </h2>
                    <p className="text-slate-500 max-w-xs mx-auto mb-10">
                      Thank you for reaching out. Our team will get back to you
                      within 2 hours.
                    </p>
                    <button
                      onClick={() => setIsSuccess(false)}
                      className="text-[#1E293B] font-bold text-sm uppercase tracking-widest hover:underline"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-3xl font-bold text-[#1E293B] mb-4">
                      Send a Message
                    </h2>
                    <p className="text-slate-500 mb-10">
                      Fill out the form below and we'll respond as quickly as
                      possible.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                            Your Name
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Full Name"
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-[#FBBF24] outline-none transition-all"
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                            Email Address
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="email@example.com"
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-[#FBBF24] outline-none transition-all"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                email: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                          Message
                        </label>
                        <textarea
                          rows={6}
                          required
                          placeholder="How can we help you?"
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-[#FBBF24] outline-none transition-all resize-none"
                          value={formData.message}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              message: e.target.value,
                            })
                          }
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-[#1E293B] text-white py-5 px-10 rounded-2xl font-bold text-lg hover:bg-[#334155] transition-all shadow-xl shadow-slate-100 flex items-center gap-3 disabled:opacity-70"
                      >
                        {isSubmitting ? (
                          <Loader2 className="animate-spin" size={20} />
                        ) : (
                          <>
                            Send Message <Send size={20} />
                          </>
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
