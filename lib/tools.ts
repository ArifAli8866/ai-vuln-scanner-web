// lib/tools.ts
//
// Server-side tool definitions for the AI route. Each tool has a small,
// honest Zod input schema (every field is model-guessable, so we keep the
// surface area tiny) and, where relevant, a real `execute` function.
//
// Tool contract (also documented in README.md):
//
// 1. requestScanConfirmation
//    input:  { url: string }
//    output: { approved: boolean }
//    No `execute` -> this is a client-side / human-in-the-loop tool. The UI
//    renders a confirm/deny card and resolves it via addToolResult().
//
// 2. scanHeaders
//    input:  { url: string }
//    output: ScanResult (see lib/security-check.ts)
//    Has `execute` -> runs on the server, does a real fetch() against the
//    target and returns structured findings. Can throw, which the AI SDK
//    surfaces as a `tool-error` part for the client to render.

import { tool } from "ai";
import { z } from "zod";
import { scanTargetHeaders } from "./security-check";

export const requestScanConfirmationInput = z.object({
  url: z
    .string()
    .describe(
      "The exact target URL the assistant wants permission to scan, e.g. https://example.com"
    ),
});

export const scanHeadersInput = z.object({
  url: z
    .string()
    .describe(
      "Fully-qualified http(s) URL of the target to audit. Add https:// if the user didn't."
    ),
});

const confirmationOutput = z.object({ approved: z.boolean() });
export type ConfirmationOutput = z.infer<typeof confirmationOutput>;

export const tools = {
  requestScanConfirmation: tool({
    description:
      "Ask the human user for explicit permission before scanning a target URL. " +
      "Always call this BEFORE scanHeaders, once per new target. Do not call scanHeaders " +
      "without a prior 'approved: true' result from this tool for the same URL.",
    inputSchema: requestScanConfirmationInput,
    outputSchema: confirmationOutput,
    // Intentionally no `execute`: this makes it a client-side tool. The
    // conversation pauses until the browser calls addToolResult().
  }),

  scanHeaders: tool({
    description:
      "Fetch a target URL and audit its HTTP response for missing/weak security headers, " +
      "cookie flags, server-header disclosure, and HTTPS enforcement. Only call this after " +
      "the user has approved via requestScanConfirmation for the same URL.",
    inputSchema: scanHeadersInput,
    execute: async ({ url }) => {
      // Real network call, real errors — no mocked success path.
      return await scanTargetHeaders(url);
    },
  }),
};
