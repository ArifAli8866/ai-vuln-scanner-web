import type { ScanResult } from "@/lib/security-check";
import { SEVERITY_STYLES } from "./severity";

export function FindingsTable({ result }: { result: ScanResult }) {
  const issues = result.findings.filter((f) => f.status !== "present");
  const passed = result.findings.filter((f) => f.status === "present");

  if (result.findings.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-panel px-4 py-3 text-sm text-muted">
        No header data returned for this target.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-panel/80 text-[11px] uppercase tracking-wide text-muted">
            <th className="px-3 py-2 font-medium">Severity</th>
            <th className="px-3 py-2 font-medium">Check</th>
            <th className="px-3 py-2 font-medium hidden sm:table-cell">Detail</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((f) => {
            const s = SEVERITY_STYLES[f.severity];
            return (
              <tr key={f.id} className="border-b border-border/60 bg-panel/40">
                <td className="px-3 py-2 align-top">
                  <span
                    className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${s.bg} ${s.text} ${s.ring}`}
                  >
                    {s.label}
                  </span>
                </td>
                <td className="px-3 py-2 align-top font-mono text-xs text-gray-200">
                  {f.header}
                </td>
                <td className="px-3 py-2 align-top text-xs text-muted hidden sm:table-cell">
                  {f.detail}
                </td>
              </tr>
            );
          })}
          {passed.map((f) => {
            const s = SEVERITY_STYLES.info;
            return (
              <tr key={f.id} className="border-b border-border/40 last:border-b-0">
                <td className="px-3 py-2 align-top">
                  <span
                    className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${s.bg} ${s.text} ${s.ring}`}
                  >
                    OK
                  </span>
                </td>
                <td className="px-3 py-2 align-top font-mono text-xs text-gray-400">
                  {f.header}
                </td>
                <td className="px-3 py-2 align-top text-xs text-muted hidden sm:table-cell">
                  {f.detail}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
