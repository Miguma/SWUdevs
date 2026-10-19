# Spec 07: API Contracts & Interface Definitions

## 1. System Endpoints

### 1.1 `GET /api/health`
Checks backend service availability.
- **Method:** `GET`
- **Response 200 OK:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-10-19T13:00:00Z"
}
```

---

### 1.2 `GET /api/ai/health`
Checks Ollama connectivity, model readiness, and GPU/CPU status.
- **Method:** `GET`
- **Response 200 OK (Model Ready):**
```json
{
  "ollamaConnected": true,
  "modelAvailable": true,
  "configuredModel": "qwen3:4b-instruct",
  "availableModels": ["qwen3:4b-instruct", "qwen2.5:7b"],
  "inferenceHost": "http://localhost:11434"
}
```
- **Response 503 Service Unavailable (Ollama Down):**
```json
{
  "ollamaConnected": false,
  "modelAvailable": false,
  "configuredModel": "qwen3:4b-instruct",
  "error": "Cannot connect to Ollama daemon on http://localhost:11434. Please run `ollama serve`."
}
```

---

### 1.3 `POST /api/meetings/analyze`
Extracts action items, decisions, and open questions from meeting notes.
- **Method:** `POST`
- **Request Body:**
```json
{
  "title": "Hackathon Strategy Meeting",
  "organization": "SWUdevs",
  "meetingDate": "2026-10-23",
  "timezone": "Asia/Manila",
  "participants": ["Maria", "Mark", "Carlo", "Ana"],
  "rawText": "Standup notes... Si Ana sa poster. Ay, si Mark na lang diay kay busy si Ana..."
}
```
- **Response 200 OK:**
```json
{
  "id": "e4b2d354-9a1b-4f76-88cf-9a3b68018e10",
  "summary": "Team met to organize hackathon roles and deliverables. Mark took over poster design, while sponsorship outreach remains unassigned.",
  "actionItems": [
    {
      "id": "act-1",
      "title": "Design hackathon poster",
      "description": "Prepare primary promotional poster for the event",
      "assignees": ["Mark"],
      "deadline": {
        "originalText": "ugma sa hapon",
        "date": "2026-10-24",
        "time": "17:00",
        "timezone": "Asia/Manila",
        "relation": "by",
        "isAmbiguous": false
      },
      "commitmentStatus": "confirmed",
      "priority": "medium",
      "evidence": [
        {
          "quote": "si Mark na lang diay kay busy si Ana",
          "startOffset": 45,
          "endOffset": 82,
          "isVerified": true
        }
      ],
      "missingInformation": [],
      "needsReview": false,
      "reviewStatus": "pending"
    }
  ],
  "decisions": [
    {
      "id": "dec-1",
      "decision": "Physical shirts will not be ordered due to budget limits",
      "evidence": [
        {
          "quote": "Dili na ta mag-order ug shirts",
          "startOffset": 120,
          "endOffset": 150,
          "isVerified": true
        }
      ],
      "needsReview": false,
      "reviewStatus": "pending"
    }
  ],
  "openQuestions": [
    {
      "id": "q-1",
      "question": "Who will lead sponsorship outreach?",
      "evidence": [
        {
          "quote": "Wala pa tay assigned sa sponsors",
          "startOffset": 190,
          "endOffset": 222,
          "isVerified": true
        }
      ],
      "needsReview": true,
      "reviewStatus": "pending"
    }
  ],
  "nextMeeting": {
    "originalText": "next Monday 8pm",
    "date": "2026-10-26",
    "time": "20:00",
    "timezone": "Asia/Manila",
    "relation": "on",
    "isAmbiguous": false
  },
  "warnings": []
}
```
- **Error Codes:**
  - `400 Bad Request`: Validation failure (empty notes, missing title).
  - `413 Payload Too Large`: Notes exceed 100,000 characters.
  - `503 Service Unavailable`: Local Ollama unreachable.

---

### 1.4 `GET /api/meetings/:id/export?format=md|csv`
Exports the reviewed meeting action plan.
- **Parameters:**
  - `format`: `md` or `csv`
  - `includePending`: `true` or `false` (default: false, only approved items)
- **Response 200 OK:**
  - Headers:
    - `Content-Type: text/markdown; charset=utf-8` or `text/csv; charset=utf-8`
    - `Content-Disposition: attachment; filename="tambayayong-meeting-export-2026-10-23.md"`
