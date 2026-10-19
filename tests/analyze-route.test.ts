import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  executeOllamaExtraction,
  InferenceError,
} from "../src/server/services/ollama-client";
import { POST } from "../src/app/api/meetings/analyze/route";
vi.mock("../src/server/services/ollama-client", async (original) => ({
  ...(await original<typeof import("../src/server/services/ollama-client")>()),
  executeOllamaExtraction: vi.fn(),
}));
afterEach(() => vi.clearAllMocks());
const request = (body: string) =>
  new NextRequest("http://localhost/api/meetings/analyze", {
    method: "POST",
    body,
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": crypto.randomUUID(),
    },
  });
const payload = {
  title: "Sync",
  rawText: "  Maria will draft notes.\r\nJun will review them.  ",
  model: "qwen3:4b",
  dateUnknown: true,
  meetingDate: "2026-10-23",
};

describe("Analyze API contract", () => {
  it("preserves original source bytes and forwards explicit model and date-unknown", async () => {
    vi.mocked(executeOllamaExtraction).mockResolvedValue({
      id: "result",
    } as never);
    expect((await POST(request(JSON.stringify(payload)))).status).toBe(200);
    expect(executeOllamaExtraction).toHaveBeenCalledWith(
      expect.objectContaining({
        rawText: payload.rawText,
        model: payload.model,
        meetingDate: undefined,
      }),
    );
  });
  it("rejects malformed JSON and invalid calendar dates and timezones before inference", async () => {
    expect((await POST(request("{"))).status).toBe(400);
    for (const changes of [
      { meetingDate: "2026-02-31" },
      { timezone: "not/a-zone" },
      { title: "   " },
    ])
      expect(
        (await POST(request(JSON.stringify({ ...payload, ...changes }))))
          .status,
      ).toBe(400);
    expect(executeOllamaExtraction).not.toHaveBeenCalled();
  });
  it.each([413, 422, 429, 502, 503, 504])(
    "returns actionable inference failure status %s",
    async (status) => {
      vi.mocked(executeOllamaExtraction).mockRejectedValue(
        new InferenceError("Actionable local error", status),
      );
      const result = await POST(request(JSON.stringify(payload)));
      expect(result.status).toBe(status);
      expect((await result.json()).message).toBe("Actionable local error");
    },
  );
  it("enforces request size even without a content-length header", async () => {
    expect((await POST(request("x".repeat(1024 * 1024 + 1)))).status).toBe(413);
    expect(executeOllamaExtraction).not.toHaveBeenCalled();
  });
});
