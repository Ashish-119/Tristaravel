import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router";
import { toast } from "sonner";
import {
  Loader2,
  UserPlus,
  User,
  Mail,
  Phone,
  Lock,
  CheckCircle2,
} from "lucide-react";

export default function DriverSignup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const field = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const signupMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/driver/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sign up failed");
      return data;
    },
    onSuccess: () => setSubmitted(true),
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      toast.error("Enter your name, email and a password");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    signupMutation.mutate();
  };

  const inputCls =
    "w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-[#FBBF24] focus:border-[#FBBF24] transition-all outline-none";

  if (submitted) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 text-center">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Request submitted</h1>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">
            Your driver account has been created and is <strong>awaiting admin
            approval</strong>. You'll be able to sign in once it's approved.
          </p>
          <Link
            to="/driver/login"
            className="inline-block mt-6 text-sm font-semibold text-[#1E293B] hover:text-[#FBBF24] transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1E293B]">Driver Sign Up</h1>
          <p className="text-slate-500 text-sm mt-1">
            Request a driver account. An admin approves it before you can sign in.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Full name"
              autoComplete="name"
              className={inputCls}
              value={form.name}
              onChange={field("name")}
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="email"
              placeholder="Email"
              autoComplete="username"
              className={inputCls}
              value={form.email}
              onChange={field("email")}
            />
          </div>

          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="tel"
              placeholder="Phone (optional)"
              autoComplete="tel"
              className={inputCls}
              value={form.phone}
              onChange={field("phone")}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="password"
              placeholder="Password (min 8 characters)"
              autoComplete="new-password"
              className={inputCls}
              value={form.password}
              onChange={field("password")}
            />
          </div>

          <button
            type="submit"
            disabled={signupMutation.isPending}
            className="w-full bg-[#1E293B] hover:bg-[#334155] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-70"
          >
            {signupMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Request Access <UserPlus className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-5 text-center">
          Already have an account?{" "}
          <Link
            to="/driver/login"
            className="font-semibold text-[#1E293B] hover:text-[#FBBF24] transition-colors"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}