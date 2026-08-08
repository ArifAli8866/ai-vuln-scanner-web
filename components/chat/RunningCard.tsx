interface Props {
  url: string;
}

// STATE: input-available (server tool is executing)
// Answers: "with what input, and is it working right now?"
// Visual language: solid card, spinning ring, committed input value shown plainly.
export function RunningCard({ url }: Props) {
  return (
    <div className="rounded-lg border border-accent2/30 bg-accent2/5 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="relative flex h-4 w-4">
          <span className="absolute inline-flex h-full w-full animate-spin rounded-full border-2 border-accent2/30 border-t-accent2" />
        </span>
        <div>
          <div className="text-sm text-accent2">Scanning headers…</div>
          <div className="font-mono text-xs text-muted mt-0.5">{url}</div>
        </div>
      </div>
    </div>
  );
}
