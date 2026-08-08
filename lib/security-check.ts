// lib/security-check.ts
//
// Real HTTP security-header audit. This is the domain logic behind the
// `scanHeaders` tool — ported from the original project's scanner.py
// (HTTP header + cookie + server-disclosure checks) into typed TS.
//
// No mocked data: this performs a real fetch() against the target URL.

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export interface Finding {
  id: string;
  header: string;
  status: "missing" | "present" | "weak";
  severity: Severity;
  detail: string;
}

export interface ScanResult {
  url: string;
  finalUrl: string;
  statusCode: number;
  server: string | null;
  httpsEnforced: boolean;
  riskScore: number; // 0-10
  riskLevel: "Critical" | "High" | "Medium" | "Low" | "Info";
  findings: Finding[];
  scannedAt: string;
}

const SECURITY_HEADERS: Array<{
  header: string;
  severityIfMissing: Severity;
  detailIfMissing: string;
}> = [
  {
    header: "strict-transport-security",
    severityIfMissing: "medium",
    detailIfMissing:
      "HSTS is not set. Browsers may fall back to plain HTTP, exposing traffic to downgrade attacks.",
  },
  {
    header: "content-security-policy",
    severityIfMissing: "high",
    detailIfMissing:
      "No CSP set. The page has no defense-in-depth against injected scripts (XSS).",
  },
  {
    header: "x-content-type-options",
    severityIfMissing: "low",
    detailIfMissing:
      "MIME sniffing is not disabled. Browsers may execute a response as a different content type than intended.",
  },
  {
    header: "x-frame-options",
    severityIfMissing: "medium",
    detailIfMissing:
      "No clickjacking protection. The page can be embedded in a hidden iframe on an attacker's site.",
  },
  {
    header: "referrer-policy",
    severityIfMissing: "low",
    detailIfMissing:
      "No referrer policy set. Full URLs (which can include tokens or paths) may leak to third parties on outbound links.",
  },
  {
    header: "permissions-policy",
    severityIfMissing: "info",
    detailIfMissing:
      "No permissions policy set. Browser features (camera, mic, geolocation) are not explicitly restricted.",
  },
];

function severityWeight(s: Severity): number {
  switch (s) {
    case "critical":
      return 10;
    case "high":
      return 7.5;
    case "medium":
      return 5;
    case "low":
      return 2.5;
    case "info":
      return 0.5;
  }
}

function riskLevelFromScore(score: number): ScanResult["riskLevel"] {
  if (score >= 8) return "Critical";
  if (score >= 6) return "High";
  if (score >= 3) return "Medium";
  if (score >= 1) return "Low";
  return "Info";
}

export class ScanTimeoutError extends Error {}
export class ScanNetworkError extends Error {}

/**
 * Fetches a URL and evaluates its HTTP response headers against a fixed
 * checklist of security headers, cookie flags, and server disclosure.
 * Throws ScanTimeoutError / ScanNetworkError on failure so callers (the
 * tool `execute` function) can surface a designed error state instead of
 * crashing.
 */
export async function scanTargetHeaders(rawUrl: string): Promise<ScanResult> {
  let url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new ScanNetworkError(`"${rawUrl}" is not a valid URL.`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  let res: Response;
  try {
    res = await fetch(parsed.toString(), {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "ai-vuln-scanner-web/1.0 (+headers-audit)" },
    });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new ScanTimeoutError(
        `Request to ${parsed.hostname} timed out after 8s.`
      );
    }
    throw new ScanNetworkError(
      `Could not reach ${parsed.hostname}: ${err?.message ?? "unknown network error"}`
    );
  } finally {
    clearTimeout(timeout);
  }

  const findings: Finding[] = [];
  let idCounter = 1;

  for (const check of SECURITY_HEADERS) {
    const value = res.headers.get(check.header);
    if (!value) {
      findings.push({
        id: `F${idCounter++}`,
        header: check.header,
        status: "missing",
        severity: check.severityIfMissing,
        detail: check.detailIfMissing,
      });
    } else {
      findings.push({
        id: `F${idCounter++}`,
        header: check.header,
        status: "present",
        severity: "info",
        detail: `Set to: ${value.slice(0, 120)}`,
      });
    }
  }

  // Server disclosure
  const server = res.headers.get("server");
  if (server) {
    findings.push({
      id: `F${idCounter++}`,
      header: "server",
      status: "weak",
      severity: "low",
      detail: `Server header discloses "${server}", which can help attackers fingerprint known vulnerabilities.`,
    });
  }

  // Cookie flags
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    const lower = setCookie.toLowerCase();
    if (!lower.includes("secure")) {
      findings.push({
        id: `F${idCounter++}`,
        header: "set-cookie (Secure)",
        status: "missing",
        severity: "medium",
        detail: "A cookie is set without the Secure flag and may be sent over plain HTTP.",
      });
    }
    if (!lower.includes("httponly")) {
      findings.push({
        id: `F${idCounter++}`,
        header: "set-cookie (HttpOnly)",
        status: "missing",
        severity: "medium",
        detail: "A cookie is set without HttpOnly and is readable by client-side JavaScript (XSS risk).",
      });
    }
  }

  const httpsEnforced = res.url.startsWith("https://");
  if (!httpsEnforced) {
    findings.push({
      id: `F${idCounter++}`,
      header: "scheme",
      status: "missing",
      severity: "high",
      detail: "The final response was served over plain HTTP, not HTTPS.",
    });
  }

  const relevant = findings.filter(
    (f) => f.status !== "present"
  );
  const rawScore =
    relevant.length === 0
      ? 0
      : relevant.reduce((sum, f) => sum + severityWeight(f.severity), 0) /
        Math.max(relevant.length, 1);
  const riskScore = Math.min(10, Math.round(rawScore * 10) / 10);

  return {
    url: parsed.toString(),
    finalUrl: res.url,
    statusCode: res.status,
    server,
    httpsEnforced,
    riskScore,
    riskLevel: riskLevelFromScore(riskScore),
    findings,
    scannedAt: new Date().toISOString(),
  };
}
