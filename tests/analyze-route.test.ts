import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { InferenceError } from "../src/server/services/extraction-core";
import { POST } from "../src/app/api/meetings/analyze/route";
import { executeHuggingFaceExtraction } from "../src/server/services/huggingface-client";

vi.mock("../src/server/services/huggingface-client", async (original) => ({
  ...(await original<typeof import("../src/server/services/huggingface-client")>()),
  executeHuggingFaceExtraction: vi.fn(),
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
  model: "Qwen/Qwen3-32B",
  provider: "huggingface",
  cloudConsent: true,
  dateUnknown: true,
  meetingDate: "2026-10-23",
};

describe("Analyze API contract", () => {
  it("preserves original source bytes and date-unknown for cloud inference", async () => {
    vi.mocked(executeHuggingFaceExtraction).mockResolvedValue({ id: "result" } as never);
    expect((await POST(request(JSON.stringify(payload)))).status).toBe(200);
    expect(executeHuggingFaceExtraction).toHaveBeenCalledWith(
      expect.objectContaining({
        rawText: payload.rawText,
        model: payload.model,
        meetingDate: undefined,
      }),
    );
  });
  it("requires confirmation before routing notes", async () => {
    expect((await POST(request(JSON.stringify({ ...payload, cloudConsent: false })))).status).toBe(400);
    expect(executeHuggingFaceExtraction).not.toHaveBeenCalled();
  });
  it("rejects the removed Ollama provider", async () => {
    expect((await POST(request(JSON.stringify({ ...payload, provider: "ollama" })))).status).toBe(400);
    expect(executeHuggingFaceExtraction).not.toHaveBeenCalled();
  });
  it("rejects malformed JSON and invalid calendar dates and timezones before inference", async () => {
    expect((await POST(request("{"))).status).toBe(400);
    for (const changes of [
      { meetingDate: "2026-02-31" },
      { timezone: "not/a-zone" },
      { title: "   " },
      { provider: "other" },
    ])
      expect((await POST(request(JSON.stringify({ ...payload, ...changes })))).status).toBe(400);
    expect(executeHuggingFaceExtraction).not.toHaveBeenCalled();
  });
  it.each([402, 413, 422, 429, 502, 503, 504])(
    "returns actionable cloud inference failure status %s",
    async (status) => {
      vi.mocked(executeHuggingFaceExtraction).mockRejectedValue(
        new InferenceError("Actionable cloud error", status),
      );
      const result = await POST(request(JSON.stringify(payload)));
      expect(result.status).toBe(status);
      expect((await result.json()).message).toBe("Actionable cloud error");
    },
  );
  it("enforces request size even without a content-length header", async () => {
    expect((await POST(request("x".repeat(1024 * 1024 + 1)))).status).toBe(413);
    expect(executeHuggingFaceExtraction).not.toHaveBeenCalled();
  });
});
