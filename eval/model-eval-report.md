# Tambayayong live model evaluation

Ground truth is used only for scoring. Empty predictions remain empty; failed inference never becomes a prediction.

Metrics cover successful inference only; inspect errors and coverage before quoting scores. Null means no denominator. Lexical matching is an approximation.

```json
{
  "benchmarkDate": "2026-10-20T07:33:02.994Z",
  "mode": "LIVE_MODEL_INFERENCE",
  "provider": "huggingface",
  "model": "Qwen/Qwen3-32B",
  "datasetSha256": "40328656d6e2b04dc2e5a2a592302d1477ab9b0a7344ef0593ca0b76a0d20965",
  "totalTestCases": 20,
  "matcher": "Maximum one-to-one lexical token Dice >= 0.6; multilingual paraphrases require human audit.",
  "status": "NOT_RUN",
  "reason": "Set HF_TOKEN on the server to enable cloud analysis.",
  "evaluatedSampleCount": 0,
  "metrics": null
}
```
