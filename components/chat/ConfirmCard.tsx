interface Props {
  url: string;
  onApprove: () => void;
  onDeny: () => void;
  disabled?: boolean;
}

// This renders the same logical state as "input-available" but for a tool
// with no execute — i.e. it's waiting on the HUMAN, not the server. It gets
// its own component because it answers a different question than RunningCard:
// "do you want this to happen?" rather than "is it happening?"
export function ConfirmCard({ url, onApprove, onDeny, disabled }: Props) {
  return (
    <div className="rounded-lg border border-warn/40 bg-warn/5 px-4 py-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-warn">
        <span className="h-1.5 w-1.5 rounded-full bg-warn" />
        Permission needed
      </div>
      <p className="mt-2 text-sm text-gray-200">
        The assistant wants to scan <span className="font-mono text-warn">{url}</span> —
        this sends a real HTTP request to that host. Allow it?
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={onApprove}
          disabled={disabled}
          className="rounded-md bg-accent text-bg text-sm font-medium px-3 py-1.5 hover:opacity-90 disabled:opacity-40 transition"
        >
          Allow scan
        </button>
        <button
          onClick={onDeny}
          disabled={disabled}
          className="rounded-md border border-border text-sm px-3 py-1.5 text-gray-300 hover:bg-panel disabled:opacity-40 transition"
        >
          Deny
        </button>
      </div>
    </div>
  );
}
