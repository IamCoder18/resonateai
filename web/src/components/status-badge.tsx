import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";

export function StatusBadge({ status }: { status: string }) {
  if (status === "ready") {
    return (
      <span className="inline-flex items-center gap-2 border border-accent-40 bg-accent-10 px-2.5 py-1 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-accent">
        <CheckCircle2 className="h-3 w-3" strokeWidth={1.5} />
        Ready
      </span>
    );
  }
  if (status === "failed" || status === "rejected") {
    return (
      <span className="inline-flex items-center gap-2 border border-line bg-panel-30 px-2.5 py-1 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-bone-80">
        <AlertTriangle className="h-3 w-3" strokeWidth={1.5} />
        {status === "rejected" ? "Rejected" : "Failed"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 border border-line bg-panel-30 px-2.5 py-1 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-bone-80">
      <Clock className="h-3 w-3 text-accent" strokeWidth={1.5} />
      In progress
    </span>
  );
}