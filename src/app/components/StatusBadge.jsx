import React from "react";
import { Sparkles, Clock, CheckCircle2, XCircle } from "lucide-react";

// Visual style for each lead status. Stored values are lowercase; labels shown title-cased.
const STYLES = {
  new: { label: "New", cls: "bg-blue-100 text-blue-700", Icon: Sparkles },
  pending: { label: "Pending", cls: "bg-amber-100 text-amber-700", Icon: Clock },
  confirmed: {
    label: "Confirmed",
    cls: "bg-emerald-100 text-emerald-700",
    Icon: CheckCircle2,
  },
  cancelled: { label: "Cancelled", cls: "bg-rose-100 text-rose-700", Icon: XCircle },
};

export default function StatusBadge({ status }) {
  const s =
    STYLES[status] ?? {
      label: status ?? "—",
      cls: "bg-slate-100 text-slate-600",
      Icon: Clock,
    };
  const { label, cls, Icon } = s;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}
