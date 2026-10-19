# Tambayayong live model evaluation

Ground truth is used only for scoring. Empty predictions remain empty; failed inference never becomes a prediction.

Metrics cover successful inference only; inspect errors and coverage before quoting scores. Null means no denominator. Lexical matching is an approximation.

```json
{
  "benchmarkDate": "2026-10-19T14:13:35.116Z",
  "mode": "LIVE_MODEL_INFERENCE",
  "model": "qwen3:4b",
  "datasetSha256": "642ab8e189910e98156d8757858dad15cef7ca8cbfdc3ef84a6b1155a62afa5d",
  "totalTestCases": 20,
  "matcher": "Maximum one-to-one lexical token Dice >= 0.6; multilingual paraphrases require human audit.",
  "status": "NOT_RUN",
  "reason": "Ollama unreachable",
  "evaluatedSampleCount": 0,
  "metrics": null
}
```
