import { checkOllamaHealth, type OllamaHealthStatus } from "./ollama-client";
import { checkHuggingFaceHealth, type HuggingFaceHealthStatus } from "./huggingface-client";

export interface AiHealthStatus extends OllamaHealthStatus {
  cloud: HuggingFaceHealthStatus;
}

export async function checkAiHealth(): Promise<AiHealthStatus> {
  const [local, cloud] = await Promise.all([
    checkOllamaHealth(),
    checkHuggingFaceHealth(),
  ]);
  return { ...local, cloud };
}
