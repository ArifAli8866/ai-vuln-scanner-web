import { anthropic } from "@ai-sdk/anthropic";
import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
} from "ai";
import { tools } from "@/lib/tools";

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are a security-headers assistant for a vulnerability scanner product.

You have two tools:
- requestScanConfirmation({ url }): ask the human to approve scanning a URL. ALWAYS call
  this first for any new target the user mentions, even if they already asked you to "scan"
  it — the user must explicitly confirm in the UI.
- scanHeaders({ url }): performs the real HTTP header audit. Only call this AFTER you have
  received a tool result from requestScanConfirmation with approved: true for that same URL.
  If approved is false, do not scan — acknowledge and stop.

After scanHeaders returns, summarize the findings in plain English: overall risk level,
the two or three most important issues, and one concrete next step. Do not restate every
finding as a bullet list — the UI already renders a findings table. Keep your summary to
a short paragraph.

If the user asks something unrelated to scanning a URL, just answer normally without tools.`;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(6),
  });

  return result.toUIMessageStreamResponse({
    onError: (error) => {
      console.error("AI stream error:", error);

      if (error instanceof Error) {
        return error.message;
      }

      return "The AI request failed. Please try again.";
    },
  });
}

