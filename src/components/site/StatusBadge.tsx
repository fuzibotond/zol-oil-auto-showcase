import { STATUS_LABEL } from "@/lib/site";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone =
    status === "disponibil" ? "bg-success/15 text-success border-success/30"
    : status === "rezervat" ? "bg-warning/20 text-warning-foreground border-warning/40"
    : status === "vandut" ? "bg-muted text-muted-foreground border-border"
    : status === "nou-sosit" ? "bg-foreground text-background border-foreground"
    : "bg-secondary text-secondary-foreground border-border";
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", tone, className)}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
