import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ErrorCard } from "@/components/chat/ErrorCard";

describe("ErrorCard Component", () => {
    it("renders error message, header, and target URL when provided", () => {
        render(
            <ErrorCard
                url="https://example.com"
                message="DNS resolution failed"
            />
        );

        expect(screen.getByText("Scan failed")).toBeInTheDocument();
        expect(screen.getByText("https://example.com")).toBeInTheDocument();
        expect(screen.getByText("DNS resolution failed")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /retry scan/i })).not.toBeInTheDocument();
    });

    it("renders retry button and triggers callback when onRetry is provided", async () => {
        const user = userEvent.setup();
        const onRetry = vi.fn();

        render(
            <ErrorCard
                url="https://example.com"
                message="Connection timeout"
                onRetry={onRetry}
            />
        );

        const retryBtn = screen.getByRole("button", { name: /retry scan/i });
        expect(retryBtn).toBeInTheDocument();

        await user.click(retryBtn);
        expect(onRetry).toHaveBeenCalledTimes(1);
    });
});
