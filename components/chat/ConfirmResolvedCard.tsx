interface Props {
  url: string;
  approved: boolean;
}

export function ConfirmResolvedCard({ url, approved }: Props) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${
        approved
          ? "border-accent/30 bg-accent/5 text-accent"
          : "border-border bg-panel/60 text-muted"
      }`}
    >
      <span>{approved ? "✓" : "✕"}</span>
      <span>
        {approved ? "Approved" : "Denied"} scanning{" "}
        <span className="font-mono">{url}</span>
      </span>
    </div>
  );
}
