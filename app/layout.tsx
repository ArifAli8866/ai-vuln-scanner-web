import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Vuln Scanner — Generative UI",
  description: "Tool-calling chat that renders security scan results as real components.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-gray-100 antialiased">{children}</body>
    </html>
  );
}
