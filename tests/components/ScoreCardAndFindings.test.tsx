import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ScoreCard } from "@/components/chat/ScoreCard";
import { FindingsTable } from "@/components/chat/FindingsTable";
import { mockSuccessScanResult } from "../fixtures/mock-data";

describe("ScoreCard Component", () => {
    it("renders risk score, risk level badge, and URL details", () => {
        render(<ScoreCard result={mockSuccessScanResult} />);

        expect(screen.getByText("7.5")).toBeInTheDocument();
        expect(screen.getByText("/ 10")).toBeInTheDocument();
        expect(screen.getByText("High risk")).toBeInTheDocument();
        expect(screen.getByText("https://example.com")).toBeInTheDocument();
        expect(screen.getByText("HTTP 200")).toBeInTheDocument();
        expect(screen.getByText("HTTPS ✓")).toBeInTheDocument();
        expect(screen.getByText("Server: nginx/1.18.0")).toBeInTheDocument();
    });
});

describe("FindingsTable Component", () => {
    it("renders table column headers and all findings properly", () => {
        render(<FindingsTable result={mockSuccessScanResult} />);

        expect(screen.getByText("Severity")).toBeInTheDocument();
        expect(screen.getByText("Check")).toBeInTheDocument();
        expect(screen.getByText("Detail")).toBeInTheDocument();

        // Check missing high/medium severity findings
        expect(screen.getByText("High")).toBeInTheDocument();
        expect(screen.getByText("content-security-policy")).toBeInTheDocument();
        expect(
            screen.getByText(
                "No CSP set. The page has no defense-in-depth against injected scripts (XSS)."
            )
        ).toBeInTheDocument();

        expect(screen.getByText("Medium")).toBeInTheDocument();
        expect(screen.getByText("strict-transport-security")).toBeInTheDocument();

        // Check passed info finding
        expect(screen.getByText("OK")).toBeInTheDocument();
        expect(screen.getByText("x-content-type-options")).toBeInTheDocument();
    });

    it("renders fallback message when there are no findings", () => {
        const emptyResult = {
            ...mockSuccessScanResult,
            findings: [],
        };
        render(<FindingsTable result={emptyResult} />);

        expect(screen.getByText("No header data returned for this target.")).toBeInTheDocument();
    });
});
