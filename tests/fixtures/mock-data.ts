import type { ScanResult } from "@/lib/types";
import type { ToolPartType } from "@/components/chat/ToolPart";

export const mockSuccessScanResult: ScanResult = {
    url: "https://example.com",
    finalUrl: "https://example.com",
    statusCode: 200,
    server: "nginx/1.18.0",
    httpsEnforced: true,
    riskScore: 7.5,
    riskLevel: "High",
    findings: [
        {
            id: "F1",
            header: "content-security-policy",
            status: "missing",
            severity: "high",
            detail: "No CSP set. The page has no defense-in-depth against injected scripts (XSS).",
        },
        {
            id: "F2",
            header: "strict-transport-security",
            status: "missing",
            severity: "medium",
            detail: "HSTS is not set. Browsers may fall back to plain HTTP.",
        },
        {
            id: "F3",
            header: "x-content-type-options",
            status: "present",
            severity: "info",
            detail: "Set to: nosniff",
        },
    ],
    scannedAt: "2026-09-25T12:00:00.000Z",
};

export const mockInputStreamingConfirmation: ToolPartType = {
    type: "tool-requestScanConfirmation",
    toolCallId: "call_123",
    state: "input-streaming",
    input: { url: "https://example" },
};

export const mockConfirmInputAvailable: ToolPartType = {
    type: "tool-requestScanConfirmation",
    toolCallId: "call_456",
    state: "input-available",
    input: { url: "https://example.com" },
};

export const mockConfirmOutputAvailable: ToolPartType = {
    type: "tool-requestScanConfirmation",
    toolCallId: "call_456",
    state: "output-available",
    input: { url: "https://example.com" },
    output: { approved: true },
};

export const mockScanHeadersRunning: ToolPartType = {
    type: "tool-scanHeaders",
    toolCallId: "call_789",
    state: "input-available",
    input: { url: "https://example.com" },
};

export const mockScanHeadersResult: ToolPartType = {
    type: "tool-scanHeaders",
    toolCallId: "call_789",
    state: "output-available",
    input: { url: "https://example.com" },
    output: mockSuccessScanResult,
};

export const mockScanHeadersError: ToolPartType = {
    type: "tool-scanHeaders",
    toolCallId: "call_789",
    state: "output-error",
    input: { url: "https://example.com" },
    errorText: "Target host timed out after 8s.",
};
