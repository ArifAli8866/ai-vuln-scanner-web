import { test, expect } from "@playwright/test";

test.describe("Security Header Scan E2E Flow", () => {
    test("user can request a scan, confirm permission, and view security scan score and findings", async ({
        page,
    }) => {
        let callCount = 0;

        // Intercept /api/chat route to mock AI responses deterministically
        await page.route("**/api/chat", async (route) => {
            callCount++;

            if (callCount === 1) {
                // First turn: Assistant asks permission via requestScanConfirmation tool
                const chunk = {
                    type: "tool-input-available",
                    toolCallId: "call_req_1",
                    toolName: "requestScanConfirmation",
                    input: { url: "https://example.com" },
                };

                const responseBody = `data: ${JSON.stringify(chunk)}\n\ndata: [DONE]\n\n`;

                await route.fulfill({
                    status: 200,
                    contentType: "text/event-stream",
                    headers: {
                        "x-vercel-ai-ui-message-stream": "v1",
                    },
                    body: responseBody,
                });
            } else {
                // Second turn: Client approved, return scanHeaders tool call & output
                const mockScanResult = {
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
                            detail:
                                "No CSP set. The page has no defense-in-depth against injected scripts (XSS).",
                        },
                        {
                            id: "F2",
                            header: "strict-transport-security",
                            status: "missing",
                            severity: "medium",
                            detail:
                                "HSTS is not set. Browsers may fall back to plain HTTP.",
                        },
                    ],
                    scannedAt: new Date().toISOString(),
                };

                const confirmResultChunk = {
                    type: "tool-output-available",
                    toolCallId: "call_req_1",
                    output: { approved: true },
                };

                const scanInputChunk = {
                    type: "tool-input-available",
                    toolCallId: "call_scan_1",
                    toolName: "scanHeaders",
                    input: { url: "https://example.com" },
                };

                const scanOutputChunk = {
                    type: "tool-output-available",
                    toolCallId: "call_scan_1",
                    output: mockScanResult,
                };

                const responseBody = [
                    `data: ${JSON.stringify(confirmResultChunk)}\n\n`,
                    `data: ${JSON.stringify(scanInputChunk)}\n\n`,
                    `data: ${JSON.stringify(scanOutputChunk)}\n\n`,
                    `data: [DONE]\n\n`,
                ].join("");

                await route.fulfill({
                    status: 200,
                    contentType: "text/event-stream",
                    headers: {
                        "x-vercel-ai-ui-message-stream": "v1",
                    },
                    body: responseBody,
                });
            }
        });

        // 1. Open the application
        await page.goto("/");

        // Verify header title
        await expect(page.getByRole("heading", { level: 1 })).toContainText("AI VULN SCANNER");

        // 2. Locate chat input and enter valid scan request
        const input = page.getByPlaceholder("Scan https://example.com…");
        await expect(input).toBeVisible();
        await input.fill("Scan https://example.com");

        // 3. Submit request
        const sendBtn = page.getByRole("button", { name: "Send" });
        await sendBtn.click();

        // 4. Permission card appears: handle confirmation step
        await expect(page.getByText("Permission needed")).toBeVisible();
        const allowBtn = page.getByRole("button", { name: /allow scan/i });
        await expect(allowBtn).toBeVisible();

        // 5. Click Allow scan
        await allowBtn.click();

        // 6. Verify result UI appears (ScoreCard & FindingsTable)
        await expect(page.getByText("High risk")).toBeVisible();
        await expect(page.getByText("7.5")).toBeVisible();
        await expect(page.getByText("content-security-policy")).toBeVisible();
        await expect(page.getByText("strict-transport-security")).toBeVisible();
    });
});
