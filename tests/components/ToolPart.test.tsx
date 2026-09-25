import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ToolPart } from "@/components/chat/ToolPart";
import {
    mockInputStreamingConfirmation,
    mockConfirmInputAvailable,
    mockConfirmOutputAvailable,
    mockScanHeadersRunning,
    mockScanHeadersResult,
    mockScanHeadersError,
} from "../fixtures/mock-data";

describe("ToolPart Component", () => {
    const onApprove = vi.fn();
    const onDeny = vi.fn();
    const onRetry = vi.fn();

    it("renders pending/input-streaming state correctly", () => {
        render(
            <ToolPart
                part={mockInputStreamingConfirmation}
                onApprove={onApprove}
                onDeny={onDeny}
                onRetry={onRetry}
            />
        );

        expect(screen.getByText(/Requesting permission · drafting request/i)).toBeInTheDocument();
    });

    it("renders input-available state for requestScanConfirmation and handles approval/denial", async () => {
        const user = userEvent.setup();
        render(
            <ToolPart
                part={mockConfirmInputAvailable}
                onApprove={onApprove}
                onDeny={onDeny}
                onRetry={onRetry}
            />
        );

        expect(screen.getByText("Permission needed")).toBeInTheDocument();
        expect(screen.getByText("https://example.com")).toBeInTheDocument();

        const allowButton = screen.getByRole("button", { name: /allow scan/i });
        const denyButton = screen.getByRole("button", { name: /deny/i });

        expect(allowButton).toBeInTheDocument();
        expect(denyButton).toBeInTheDocument();

        await user.click(allowButton);
        expect(onApprove).toHaveBeenCalledWith("call_456", "https://example.com");

        await user.click(denyButton);
        expect(onDeny).toHaveBeenCalledWith("call_456", "https://example.com");
    });

    it("renders output-available state for requestScanConfirmation when approved", () => {
        render(
            <ToolPart
                part={mockConfirmOutputAvailable}
                onApprove={onApprove}
                onDeny={onDeny}
                onRetry={onRetry}
            />
        );

        expect(screen.getByText(/Approved scanning/i)).toBeInTheDocument();
        expect(screen.getByText("https://example.com")).toBeInTheDocument();
    });

    it("renders input-available / running state for scanHeaders", () => {
        render(
            <ToolPart
                part={mockScanHeadersRunning}
                onApprove={onApprove}
                onDeny={onDeny}
                onRetry={onRetry}
            />
        );

        expect(screen.getByText("Scanning headers…")).toBeInTheDocument();
        expect(screen.getByText("https://example.com")).toBeInTheDocument();
    });

    it("renders output-available state with ScoreCard and FindingsTable for scanHeaders", () => {
        render(
            <ToolPart
                part={mockScanHeadersResult}
                onApprove={onApprove}
                onDeny={onDeny}
                onRetry={onRetry}
            />
        );

        // ScoreCard elements
        expect(screen.getByText("7.5")).toBeInTheDocument();
        expect(screen.getByText("High risk")).toBeInTheDocument();
        expect(screen.getByText("HTTP 200")).toBeInTheDocument();

        // FindingsTable elements
        expect(screen.getByText("content-security-policy")).toBeInTheDocument();
        expect(screen.getByText("strict-transport-security")).toBeInTheDocument();
        expect(screen.getByText("x-content-type-options")).toBeInTheDocument();
    });

    it("renders output-error state for scanHeaders and triggers retry callback", async () => {
        const user = userEvent.setup();
        render(
            <ToolPart
                part={mockScanHeadersError}
                onApprove={onApprove}
                onDeny={onDeny}
                onRetry={onRetry}
            />
        );

        expect(screen.getByText("Scan failed")).toBeInTheDocument();
        expect(screen.getByText("Target host timed out after 8s.")).toBeInTheDocument();

        const retryButton = screen.getByRole("button", { name: /retry scan/i });
        expect(retryButton).toBeInTheDocument();

        await user.click(retryButton);
        expect(onRetry).toHaveBeenCalledWith("https://example.com");
    });
});
