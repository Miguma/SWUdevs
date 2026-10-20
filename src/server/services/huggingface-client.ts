import { RawExtractionResponseSchema, type MeetingExtraction } from "@/types/meeting";
import {
  assembleMeetingExtraction,
  buildExtractionPrompt,
  EXTRACTION_JSON_SCHEMA,
  EXTRACTION_SYSTEM_PROMPT,
  InferenceError,
  type AnalyzeInput,
} from "./extraction-core";

// This Apache-2.0 model and provider are deliberately pinned. No automatic
// provider or model routing is allowed for meeting notes.
export const HUGGING_FACE_MODEL = "Qwen/Qwen3-32B";
export const HUGGING_FACE_PROVIDER = "deepinfra";
const ROUTER_URL = "https://router.huggingface.co/v1";
const ROUTED_MODEL = `${HUGGING_FACE_MODEL}:${HUGGING_FACE_PROVIDER}`;
const MAX_PROMPT_CHARS = 24000;
const INFERENCE_TIMEOUT_MS = 120000;
let activeCloudInferences = 0;

export interface HuggingFaceHealthStatus {
  configured: boolean;
  modelAvailable: boolean;
  model: string;
  provider: string;
  error?: string;
}

export async function checkHuggingFaceHealth(): Promise<HuggingFaceHealthStatus> {
  const status: HuggingFaceHealthStatus = {
    configured: Boolean(process.env.HF_TOKEN?.trim()),
    modelAvailable: false,
    model: HUGGING_FACE_MODEL,
    provider: HUGGING_FACE_PROVIDER,
  };
  if (!status.configured) {
    status.error = "Set HF_TOKEN on the server to enable cloud analysis.";
    return status;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(`${ROUTER_URL}/models`, {
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Model catalog unavailable");
    const catalog = await response.json();
    const model = Array.isArray(catalog.data)
      ? catalog.data.find((entry: { id?: string }) => entry.id === HUGGING_FACE_MODEL)
      : undefined;
    status.modelAvailable = Boolean(
      model?.providers?.some(
        (entry: { provider?: string; status?: string; supports_structured_output?: boolean }) =>
          entry.provider === HUGGING_FACE_PROVIDER &&
          entry.status === "live" &&
          entry.supports_structured_output === true,
      ),
    );
    if (!status.modelAvailable) {
      status.error = "The pinned Qwen3-32B provider is not serving structured output right now.";
    }
  } catch {
    status.error = "Could not verify the Hugging Face model catalog. Refresh and try again.";
  } finally {
    clearTimeout(timeout);
  }
  return status;
}

export async function executeHuggingFaceExtraction(
  input: AnalyzeInput,
): Promise<MeetingExtraction> {
  if (input.model !== HUGGING_FACE_MODEL) {
    throw new InferenceError("Choose the configured open-weight cloud model explicitly.", 422);
  }
  if (input.rawText.length > MAX_PROMPT_CHARS) {
    throw new InferenceError(
      `Meeting notes exceed the cloud model limit (${MAX_PROMPT_CHARS} characters). Split the notes into smaller meetings; no notes were discarded.`,
      413,
    );
  }
  const token = process.env.HF_TOKEN?.trim();
  if (!token) {
    throw new InferenceError("Cloud AI is not configured. Set HF_TOKEN on the server and restart it.", 503);
  }
  if (activeCloudInferences >= 2) {
    throw new InferenceError("Cloud AI is busy. Please retry shortly.", 429);
  }

  activeCloudInferences++;
  try {
    const health = await checkHuggingFaceHealth();
    if (!health.modelAvailable) {
      throw new InferenceError(health.error || "The selected cloud model is unavailable.", 503);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), INFERENCE_TIMEOUT_MS);
    let response: Response;
    let result: any;
    try {
      response = await fetch(`${ROUTER_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: ROUTED_MODEL,
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
          max_tokens: 4096,
        }),
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new InferenceError("Hugging Face rejected the server token. Check HF_TOKEN permissions.", 503);
        }
        if (response.status === 429) {
          throw new InferenceError("The cloud provider is rate limited. Please retry later.", 429);
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

    if (result.model && result.model !== HUGGING_FACE_MODEL && result.model !== ROUTED_MODEL) {
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
      provider: "huggingface",
      model: HUGGING_FACE_MODEL,
      analyzedAt: new Date().toISOString(),
    };
    return extraction;
  } finally {
    activeCloudInferences = Math.max(0, activeCloudInferences - 1);
  }
}
