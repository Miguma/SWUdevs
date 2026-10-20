import { RawExtractionResponseSchema, type MeetingExtraction } from "@/types/meeting";
import {
  assembleMeetingExtraction,
  buildExtractionPrompt,
  EXTRACTION_JSON_SCHEMA,
  EXTRACTION_SYSTEM_PROMPT,
  InferenceError,
  type AnalyzeInput,
} from "./extraction-core";

// One open-weight model is pinned on Groq's free tier. Never route meeting
// notes to another model or provider without a deliberate user choice.
export const GROQ_MODEL = "qwen/qwen3.8-27b";
export const GROQ_PROVIDER = "groq";
const API_URL = "https://api.groq.com/openai/v1";
const MAX_PROMPT_CHARS = 24000;
const INFERENCE_TIMEOUT_MS = 120000;
let activeCloudInferences = 0;

export interface GroqHealthStatus {
  configured: boolean;
  modelAvailable: boolean;
  model: string;
  provider: string;
  error?: string;
}

export async function checkGroqHealth(): Promise<GroqHealthStatus> {
  const token = process.env.GROQ_API_KEY?.trim();
  const status: GroqHealthStatus = {
    configured: Boolean(token),
    modelAvailable: false,
    model: GROQ_MODEL,
    provider: GROQ_PROVIDER,
  };
  if (!status.configured) {
    status.error = "Set GROQ_API_KEY in the server's .env.local file, then restart it to enable free-tier cloud analysis.";
    return status;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(`${API_URL}/models`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
      cache: "no-store",
    });
    if (response.status === 401 || response.status === 403) {
      status.error = "Groq rejected the server API key. Check GROQ_API_KEY and your Groq account access.";
      return status;
    }
    if (!response.ok) throw new Error("Model catalog unavailable");
    const catalog = await response.json();
    status.modelAvailable = Boolean(Array.isArray(catalog.data) &&
      catalog.data.some((entry: { id?: string; active?: boolean }) =>
        entry.id === GROQ_MODEL && entry.active !== false));
    if (!status.modelAvailable) {
      status.error = "The pinned Qwen model is not available to this Groq account right now.";
    }
  } catch {
    status.error = "Could not verify the Groq model catalog. Refresh and try again.";
  } finally {
    clearTimeout(timeout);
  }
  return status;
}

export async function executeGroqExtraction(
  input: AnalyzeInput,
): Promise<MeetingExtraction> {
  if (input.model !== GROQ_MODEL) {
    throw new InferenceError("Choose the configured open-weight cloud model explicitly.", 422);
  }
  if (input.rawText.length > MAX_PROMPT_CHARS) {
    throw new InferenceError(
      `Meeting notes exceed the cloud model limit (${MAX_PROMPT_CHARS} characters). Split the notes into smaller meetings; no notes were discarded.`,
      413,
    );
  }
  const token = process.env.GROQ_API_KEY?.trim();
  if (!token) {
    throw new InferenceError("Cloud AI is not configured. Set GROQ_API_KEY on the server and restart it.", 503);
  }
  if (activeCloudInferences >= 2) {
    throw new InferenceError("Cloud AI is busy. Please retry shortly.", 429);
  }

  activeCloudInferences++;
  try {
    const health = await checkGroqHealth();
    if (!health.modelAvailable) {
      throw new InferenceError(health.error || "The selected cloud model is unavailable.", 503);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), INFERENCE_TIMEOUT_MS);
    let response: Response;
    let result: any;
    try {
      response = await fetch(`${API_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
            { role: "user", content: buildExtractionPrompt(input) },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "meeting_extraction",
              strict: true,
              schema: EXTRACTION_JSON_SCHEMA,
            },
          },
          stream: false,
          temperature: 0,
          reasoning_effort: "none",
          max_tokens: 4096,
        }),
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new InferenceError("Groq rejected the server API key or account access. Check GROQ_API_KEY.", 503);
        }
        if (response.status === 429) {
          throw new InferenceError("Groq's free-tier limit was reached. Please retry after the limit resets.", 429);
        }
        throw new InferenceError(`The pinned cloud provider returned HTTP ${response.status}. No other model was tried.`, 502);
      }
      result = await response.json();
    } catch (error) {
      if (error instanceof InferenceError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new InferenceError("Cloud inference timed out. Your notes were kept.", 504);
      }
      throw new InferenceError("Could not reach the pinned cloud provider. Your notes were kept.", 503);
    } finally {
      clearTimeout(timeout);
    }

    if (result.model && result.model !== GROQ_MODEL) {
      throw new InferenceError("The cloud provider returned a different model identity. No result was saved.", 502);
    }
    if (result.choices?.[0]?.finish_reason === "length") {
      throw new InferenceError("The cloud model response was truncated. Use shorter notes.", 502);
    }
    const content = result.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new InferenceError("The cloud model returned no structured result. Your notes were kept.", 502);
    }
    let parsed;
    try {
      parsed = RawExtractionResponseSchema.parse(JSON.parse(content));
    } catch {
      throw new InferenceError("The cloud model returned invalid structured data. Your notes were kept.", 502);
    }
    const extraction = assembleMeetingExtraction(input, parsed);
    extraction.analysis = {
      provider: "groq",
      model: GROQ_MODEL,
      analyzedAt: new Date().toISOString(),
    };
    return extraction;
  } finally {
    activeCloudInferences = Math.max(0, activeCloudInferences - 1);
  }
}
