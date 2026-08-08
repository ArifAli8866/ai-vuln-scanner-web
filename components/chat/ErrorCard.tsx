interface Props {
  url?: string;
  message: string;
  onRetry?: () => void;
}

// STATE: output-error
// Answers: "what went wrong, and what can I do about it?"
// Designed first, not bolted on: distinct red left-rail, human-readable
// message (never a raw stack trace), and a concrete retry action.
export function ErrorCard({ url, message, onRetry }: Props) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-danger/40 bg-danger/5 px-4 py-3">
      <span className="mt-0.5 text-danger">⚠</span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-danger">Scan failed</div>
        {url ? (
          <div className="mt-0.5 truncate font-mono text-xs text-muted">{url}</div>
        ) : null}
        <p className="mt-1 text-xs text-gray-300">{message}</p>
        {onRetry ? (
          <button
            onClick={onRetry}
            className="mt-2 rounded-md border border-danger/40 px-3 py-1 text-xs text-danger hover:bg-danger/10 transition"
          >
            Retry scan
          </button>
        ) : null}
      </div>
    </div>
  );
}
