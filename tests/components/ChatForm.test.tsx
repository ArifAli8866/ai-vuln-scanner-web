import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Page from "@/app/page";

// Mock useChat hook from @ai-sdk/react
const mockSendMessage = vi.fn();
const mockAddToolResult = vi.fn();
const mockRegenerate = vi.fn();

vi.mock("@ai-sdk/react", () => ({
    useChat: () => ({
        messages: [],
        sendMessage: mockSendMessage,
        addToolResult: mockAddToolResult,
        regenerate: mockRegenerate,
        error: undefined,
        status: "ready",
    }),
}));

describe("Page Chat Form & Accessibility", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders page header and suggestion buttons", () => {
        render(<Page />);

        expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/AI VULN SCANNER/i);
        expect(screen.getByText("Scan https://example.com")).toBeInTheDocument();
    });

    it("finds chat input by accessible placeholder and verifies send button disabled state for empty input", () => {
        render(<Page />);

        const input = screen.getByPlaceholderText("Scan https://example.com…");
        const sendButton = screen.getByRole("button", { name: "Send" });

        expect(input).toBeInTheDocument();
        expect(sendButton).toBeInTheDocument();
        expect(sendButton).toBeDisabled();
    });

    it("enables send button when valid URL is typed and submits message on click", async () => {
        const user = userEvent.setup();
        render(<Page />);

        const input = screen.getByPlaceholderText("Scan https://example.com…");
        const sendButton = screen.getByRole("button", { name: "Send" });

        await user.type(input, "https://target-domain.com");
        expect(sendButton).not.toBeDisabled();

        await user.click(sendButton);
        expect(mockSendMessage).toHaveBeenCalledWith({ text: "https://target-domain.com" });
        expect(input).toHaveValue("");
    });

    it("clicking a suggestion button sends message automatically", async () => {
        const user = userEvent.setup();
        render(<Page />);

        const suggestionBtn = screen.getByText("Scan https://example.com");
        await user.click(suggestionBtn);

        expect(mockSendMessage).toHaveBeenCalledWith({ text: "Scan https://example.com" });
    });
});
