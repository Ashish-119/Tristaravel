import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Loader2, LogIn, Mail, Lock } from "lucide-react";

export default function DriverLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/driver/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      return data;
    },
    onSuccess: () => {
      toast.success("Welcome back!");
      navigate("/driver");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Enter your email and password");
      return;
    }
    loginMutation.mutate();
  };

  const inputCls =
    "w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-[#FBBF24] focus:border-[#FBBF24] transition-all outline-none";

  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1E293B]">Driver Sign In</h1>
          <p className="text-slate-500 text-sm mt-1">
            View available leads and pick your rides.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="email"
              placeholder="Email"
              autoComplete="username"
              className={inputCls}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="password"
              placeholder="Password"
              autoComplete="current-password"
              className={inputCls}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full bg-[#1E293B] hover:bg-[#334155] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-70"
          >
            {loginMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Sign In <LogIn className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-[11px] text-slate-400 mt-5 text-center leading-relaxed">
          Driver accounts are created by the Tristaravel team. Contact admin if
          you need access.
        </p>
      </div>
    </div>
  );
}
