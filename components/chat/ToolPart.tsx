import type { AppUIMessage } from "@/lib/types";
import { InputStreamingCard } from "./InputStreamingCard";
import { RunningCard } from "./RunningCard";
import { ConfirmCard } from "./ConfirmCard";
import { ConfirmResolvedCard } from "./ConfirmResolvedCard";
import { ScoreCard } from "./ScoreCard";
import { FindingsTable } from "./FindingsTable";
import { ErrorCard } from "./ErrorCard";

type AppMessagePart = AppUIMessage["parts"][number];
export type ToolPartType = Extract<
  AppMessagePart,
  { type: "tool-requestScanConfirmation" | "tool-scanHeaders" }
>;

interface Props {
  part: ToolPartType;
  onApprove: (toolCallId: string, url: string) => void;
  onDeny: (toolCallId: string, url: string) => void;
  onRetry: (url: string) => void;
}

/**
 * The four-state machine every tool part passes through:
 *
 *   input-streaming  -> "what is it doing?"        (InputStreamingCard)
 *   input-available  -> "with what input, running?" (RunningCard / ConfirmCard)
 *   output-available -> "what came back?"           (ScoreCard + FindingsTable / ConfirmResolvedCard)
 *   output-error      -> "what went wrong?"          (ErrorCard)
 *
 * Each state is a visually distinct component, not a relabeled JSON dump.
 */
export function ToolPart({ part, onApprove, onDeny, onRetry }: Props) {
  if (part.type === "tool-requestScanConfirmation") {
    switch (part.state) {
      case "input-streaming":
        return (
          <InputStreamingCard
            toolLabel="Requesting permission"
            partialUrl={part.input?.url}
          />
        );
      case "input-available":
        return (
          <ConfirmCard
            url={part.input.url}
            onApprove={() => onApprove(part.toolCallId, part.input.url)}
            onDeny={() => onDeny(part.toolCallId, part.input.url)}
          />
        );
      case "output-available":
        return (
          <ConfirmResolvedCard
            url={part.input.url}
            approved={Boolean(part.output?.approved)}
          />
        );
      case "output-error":
        return <ErrorCard message={part.errorText} />;
    }
  }

  if (part.type === "tool-scanHeaders") {
    switch (part.state) {
      case "input-streaming":
        return (
          <InputStreamingCard toolLabel="Preparing scan" partialUrl={part.input?.url} />
        );
      case "input-available":
        return <RunningCard url={part.input.url} />;
      case "output-available":
        return (
          <div className="space-y-2">
            <ScoreCard result={part.output} />
            <FindingsTable result={part.output} />
          </div>
        );
      case "output-error":
        return (
          <ErrorCard
            url={part.input?.url}
            message={part.errorText}
            onRetry={part.input?.url ? () => onRetry(part.input!.url) : undefined}
          />
        );
    }
  }

  return null;
}
