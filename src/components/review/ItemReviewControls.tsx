import type { Evidence, ReviewStatus } from "@/types/meeting";

export function ItemReviewControls({
  label,
  status,
  onChange,
  evidence,
  onInspect,
}: {
  label: string;
  status: ReviewStatus;
  onChange: (status: ReviewStatus) => void;
  evidence?: Evidence;
  onInspect: (evidence: Evidence) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 pt-2">
      <select
        aria-label={`Review status: ${label}`}
        value={status}
        onChange={(event) => onChange(event.target.value as ReviewStatus)}
        className="max-w-full rounded-lg border border-border bg-card p-1.5 text-xs"
      >
        <option value="pending">Pending review</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>
      {evidence && (
        <button
          type="button"
          onClick={() => onInspect(evidence)}
          className="rounded-lg border border-border px-2 py-1.5 text-xs text-primary"
        >
          {evidence.provenance === "manual"
            ? "Manual entry"
            : evidence.isVerified
              ? "Inspect source quote"
              : "Unverified quote"}
        </button>
      )}
    </div>
  );
}
