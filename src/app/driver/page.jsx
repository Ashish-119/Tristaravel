import React, { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  Loader2,
  LogOut,
  Phone,
  IndianRupee,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Inbox,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import StatusBadge from "@/app/components/StatusBadge";

function fmtDistance(d) {
  if (d === null || d === undefined) return "—";
  const n = Number(d);
  return Number.isFinite(n) ? `${n.toFixed(0)} km` : "—";
}

function fmtPrice(p) {
  if (p === null || p === undefined) return "Custom";
  return `₹${Number(p).toLocaleString("en-IN")}`;
}

function fmtAgo(ts) {
  try {
    return formatDistanceToNow(new Date(ts), { addSuffix: true });
  } catch {
    return "";
  }
}

export default function DriverDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("available");

  const handleUnauthorized = (res) => {
    if (res.status === 401) {
      navigate("/driver/login");
      throw new Error("unauthorized");
    }
  };

  const meQuery = useQuery({
    queryKey: ["driver-me"],
    queryFn: async () => {
      const res = await fetch("/api/driver/me");
      handleUnauthorized(res);
      if (!res.ok) throw new Error("Failed to load profile");
      return res.json();
    },
    retry: false,
  });

  const leadsQuery = useQuery({
    queryKey: ["driver-leads"],
    queryFn: async () => {
      const res = await fetch("/api/driver/leads");
      handleUnauthorized(res);
      if (!res.ok) throw new Error("Failed to load leads");
      return res.json();
    },
    enabled: meQuery.isSuccess,
    refetchInterval: 30000,
  });

  const claimMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/driver/leads/${id}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not claim this lead");
      return data;
    },
    onSuccess: () => {
      toast.success("Ride claimed — added to My Rides");
      queryClient.invalidateQueries({ queryKey: ["driver-leads"] });
    },
    onError: (err) => {
      toast.error(err.message);
      // Refresh so a now-taken lead disappears from the pool.
      queryClient.invalidateQueries({ queryKey: ["driver-leads"] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/driver/leads/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not cancel this ride");
      return data;
    },
    onSuccess: () => {
      toast.success("Ride cancelled");
      queryClient.invalidateQueries({ queryKey: ["driver-leads"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const handleLogout = async () => {
    try {
      await fetch("/api/driver/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
    } finally {
      navigate("/driver/login");
    }
  };

  if (meQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }
  // While redirecting an unauthenticated user, render nothing.
  if (!meQuery.isSuccess) return null;

  const driver = meQuery.data.driver;
  const data = leadsQuery.data ?? { available: [], mine: [] };
  const rows = tab === "available" ? data.available : data.mine;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Leads Dashboard</h1>
          <p className="text-slate-500 text-sm">
            Signed in as <span className="font-semibold">{driver.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["driver-leads"] })}
            className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${leadsQuery.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 bg-[#1E293B] hover:bg-[#334155] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { key: "available", label: "Available", count: data.available.length },
          { key: "mine", label: "My Rides", count: data.mine.length },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === t.key
                ? "bg-[#1E293B] text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {t.label}
            <span
              className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                tab === t.key ? "bg-white/20" : "bg-slate-100 text-slate-500"
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {leadsQuery.isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Inbox className="w-10 h-10 mb-3" />
            <p className="text-sm font-medium">
              {tab === "available"
                ? "No available leads right now."
                : "You haven't picked any rides yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="px-4 py-3 font-bold">Customer</th>
                  <th className="px-4 py-3 font-bold">Route</th>
                  <th className="px-4 py-3 font-bold">Vehicle</th>
                  <th className="px-4 py-3 font-bold">Distance</th>
                  <th className="px-4 py-3 font-bold">Fare</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold">Requested</th>
                  <th className="px-4 py-3 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60"
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{lead.full_name}</div>
                      <a
                        href={`tel:${lead.phone}`}
                        className="inline-flex items-center gap-1 text-xs text-[#c1121f] hover:underline"
                      >
                        <Phone className="w-3 h-3" />
                        {lead.phone}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <div className="font-medium">{lead.pickup}</div>
                      <div className="text-xs text-slate-400">↓ {lead.dropoff}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{lead.car_type}</td>
                    <td className="px-4 py-3 text-slate-600">{fmtDistance(lead.distance)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {fmtPrice(lead.price)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {fmtAgo(lead.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {tab === "available" ? (
                        <button
                          onClick={() => claimMutation.mutate(lead.id)}
                          disabled={claimMutation.isPending}
                          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors disabled:opacity-60"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Pick
                        </button>
                      ) : lead.status === "confirmed" ? (
                        <button
                          onClick={() => cancelMutation.mutate(lead.id)}
                          disabled={cancelMutation.isPending}
                          className="inline-flex items-center gap-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold px-3 py-2 rounded-lg transition-colors disabled:opacity-60"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Cancel
                        </button>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-[11px] text-slate-400 mt-4">
        Leads refresh automatically every 30s. New requests start as “New” and
        become “Pending” if not picked within 1 hour.
      </p>
    </div>
  );
}
