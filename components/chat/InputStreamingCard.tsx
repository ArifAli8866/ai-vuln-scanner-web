interface Props {
  toolLabel: string;
  partialUrl?: string;
}

// STATE: input-streaming
// Answers: "what is it doing?" — the model is still deciding/typing arguments.
// Visual language: thin shimmer bar, no icon commitment yet, url shown as it streams in.
export function InputStreamingCard({ toolLabel, partialUrl }: Props) {
  return (
    <div className="rounded-lg border border-border bg-panel/60 px-4 py-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-muted animate-pulseSlow" />
        {toolLabel} · drafting request
      </div>
      <div className="mt-2 h-4 w-2/3 overflow-hidden rounded bg-gradient-to-r from-border via-panel to-border bg-[length:200%_100%] animate-shimmer" />
      {partialUrl ? (
        <div className="mt-2 font-mono text-xs text-muted/80 truncate">
          {partialUrl}
          <span className="animate-pulseSlow">▍</span>
        </div>
      ) : null}
    </div>
  );
}
