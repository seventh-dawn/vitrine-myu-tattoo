import type { FlashStatus } from "@/lib/flash";

const LABELS: Record<FlashStatus, string> = {
  disponible: "Disponible",
  reserve: "Réservé",
  realise: "Réalisé",
};

const STYLES: Record<FlashStatus, string> = {
  disponible: "bg-accent text-background",
  reserve: "bg-muted/80 text-background",
  realise: "bg-surface text-muted border border-muted/50",
};

export function StatusBadge({ status }: { status: FlashStatus }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
