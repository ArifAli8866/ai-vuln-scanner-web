"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import type { AppUIMessage } from "@/lib/types";
import { ToolPart, type ToolPartType } from "@/components/chat/ToolPart";

const SUGGESTIONS = [
  "Scan https://example.com",
  "Audit the security headers on https://neverssl.com",
  "Check headers for a made-up-domain-1234.test",
];

export default function Page() {
  const [input, setInput] = useState("");

  const {
    messages,
    sendMessage,
    addToolResult,
    regenerate,
    error,
    status,
  } = useChat<AppUIMessage>({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    // Once the user resolves a client-side tool (the confirmation card),
    // automatically continue the conversation so the model can react.
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  const isBusy = status === "submitted" || status === "streaming";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isBusy) return;
    sendMessage({ text: input });
    setInput("");
  }

  function handleApprove(toolCallId: string, url: string) {
    addToolResult({
      tool: "requestScanConfirmation",
      toolCallId,
      output: { approved: true },
    });
  }

  function handleDeny(toolCallId: string, url: string) {
    addToolResult({
      tool: "requestScanConfirmation",
      toolCallId,
      output: { approved: false },
    });
  }

  function handleRetry(url: string) {
    if (isBusy) return;

    sendMessage({
      text: `Please try scanning ${url} again.`,
    });
  }

  return (
    <main className="mx-auto flex h-dvh max-w-2xl flex-col px-4">
      <header className="shrink-0 border-b border-border py-4">
        <h1 className="text-sm font-semibold tracking-wide text-gray-100">
          ⬡ AI VULN SCANNER <span className="text-muted font-normal">· generative UI</span>
        </h1>
        <p className="mt-1 text-xs text-muted">
          Ask it to scan a URL. The assistant asks permission, then runs a real
          HTTP header audit and renders the result as components — not JSON.
        </p>
      </header>

      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2 pt-4">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage({ text: s })}
                className="rounded-full border border-border px-3 py-1.5 text-xs text-muted hover:border-accent2/50 hover:text-accent2 transition"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={message.role === "user" ? "flex justify-end" : ""}>
            <div className={message.role === "user" ? "max-w-[85%]" : "w-full"}>
              {message.role === "user" ? (
                <div className="rounded-lg bg-accent2/10 border border-accent2/20 px-3 py-2 text-sm text-gray-100">
                  {message.parts
                    .filter((p) => p.type === "text")
                    .map((p, i) => (
                      <span key={i}>{(p as { text: string }).text}</span>
                    ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {message.parts.map((part, i) => {
                    if (part.type === "text") {
                      return part.text ? (
                        <p key={i} className="text-sm leading-relaxed text-gray-200">
                          {part.text}
                        </p>
                      ) : null;
                    }
                    if (
                      part.type === "tool-requestScanConfirmation" ||
                      part.type === "tool-scanHeaders"
                    ) {
                      return (
                        <ToolPart
                          key={i}
                          part={part as ToolPartType}
                          onApprove={handleApprove}
                          onDeny={handleDeny}
                          onRetry={handleRetry}
                        />
                      );
                    }
                    return null;
                  })}
                </div>
              )}
            </div>
          </div>
        ))}

        {status === "submitted" && (
          <div className="text-xs text-muted animate-pulseSlow">
            thinking…
          </div>
        )}

        {status === "error" && error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-red-300">
                Something went wrong
              </p>

              <p className="mt-1 text-xs text-gray-400">
                {error.message || "The AI request failed. Please try again."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => regenerate()}
              className="rounded-md border border-red-400/30 px-3 py-1.5 text-xs text-red-200 hover:bg-red-500/10 transition"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="shrink-0 border-t border-border py-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Scan https://example.com…"
            className="flex-1 rounded-md border border-border bg-panel px-3 py-2 text-sm text-gray-100 placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent2/50"
          />
          <button
            type="submit"
            disabled={isBusy || !input.trim()}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-bg disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </form>
    </main>
  );
}
