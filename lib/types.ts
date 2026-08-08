import type { InferUITool, UIMessage } from "ai";
import type { tools } from "./tools";
import type { ScanResult } from "./security-check";

export type { ConfirmationOutput } from "./tools";

// Derive the exact UI-facing input/output types straight from the tool
// definitions, so the client and server can never drift out of sync.
type AppTools = {
  requestScanConfirmation: InferUITool<(typeof tools)["requestScanConfirmation"]>;
  scanHeaders: InferUITool<(typeof tools)["scanHeaders"]>;
};

export type AppUIMessage = UIMessage<never, never, AppTools>;

export type { ScanResult };
