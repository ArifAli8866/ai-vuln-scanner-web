import type { ScanResult } from "@/lib/security-check";
import { riskLevelColor } from "./severity";

export function ScoreCard({ result }: { result: ScanResult }) {
  const pct = Math.min(100, (result.riskScore / 10) * 100);

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-panel px-4 py-3">
      <div className="relative h-16 w-16 shrink-0">
        <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
          <circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-border"
          />
          <circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${(pct / 100) * 97.4} 97.4`}
            strokeLinecap="round"
            className={riskLevelColor(result.riskLevel)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-semibold text-gray-100">
            {result.riskScore.toFixed(1)}
          </span>
          <span className="text-[9px] text-muted">/ 10</span>
        </div>
      </div>

      <div className="min-w-0">
        <div className={`text-sm font-semibold ${riskLevelColor(result.riskLevel)}`}>
          {result.riskLevel} risk
        </div>
        <div className="mt-0.5 truncate font-mono text-xs text-muted">
          {result.finalUrl}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted">
          <span>HTTP {result.statusCode}</span>
          <span>{result.httpsEnforced ? "HTTPS ✓" : "HTTPS ✕"}</span>
          {result.server ? <span>Server: {result.server}</span> : null}
        </div>
      </div>
    </div>
  );
}
