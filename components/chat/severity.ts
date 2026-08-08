import type { Severity } from "@/lib/security-check";

export const SEVERITY_STYLES: Record<
  Severity,
  { label: string; text: string; bg: string; ring: string }
> = {
  critical: {
    label: "Critical",
    text: "text-danger",
    bg: "bg-danger/10",
    ring: "ring-danger/40",
  },
  high: {
    label: "High",
    text: "text-danger",
    bg: "bg-danger/10",
    ring: "ring-danger/30",
  },
  medium: {
    label: "Medium",
    text: "text-warn",
    bg: "bg-warn/10",
    ring: "ring-warn/30",
  },
  low: {
    label: "Low",
    text: "text-accent2",
    bg: "bg-accent2/10",
    ring: "ring-accent2/30",
  },
  info: {
    label: "Info",
    text: "text-muted",
    bg: "bg-muted/10",
    ring: "ring-muted/30",
  },
};

export function riskLevelColor(level: string) {
  switch (level) {
    case "Critical":
    case "High":
      return "text-danger";
    case "Medium":
      return "text-warn";
    case "Low":
      return "text-accent2";
    default:
      return "text-muted";
  }
}
