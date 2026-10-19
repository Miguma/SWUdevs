import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { MeetingIntakeSchema } from "../src/types/meeting";

const date = MeetingIntakeSchema.shape.meetingDate;
const CaseSchema = z.object({
  id: z.string().min(1),
  language: z.enum(["english", "cebuano", "mixed"]),
  category: z.string().min(1),
  meetingDate: date.nullable(),
  timezone: MeetingIntakeSchema.shape.timezone,
  notes: z.string().min(10),
  groundTruth: z.object({
    expectedTasks: z.array(
      z.object({
        title: z.string().min(1),
        assignees: z.array(z.string().min(1)),
        expectedDeadlineDate: date.nullable(),
        status: z.enum(["confirmed", "proposed", "unclear"]),
      }),
    ),
    expectedDecisions: z.array(z.string().min(1)),
    expectedOpenQuestions: z.array(z.string().min(1)),
  }),
});

const dataset = z
  .array(CaseSchema)
  .min(1)
  .parse(
    JSON.parse(
      fs.readFileSync(path.resolve(__dirname, "dataset.json"), "utf8"),
    ),
  );
const ids = new Set<string>();
for (const tc of dataset) {
  if (ids.has(tc.id)) throw new Error(`Duplicate benchmark ID: ${tc.id}`);
  ids.add(tc.id);
  for (const task of tc.groundTruth.expectedTasks) {
    for (const owner of task.assignees)
      if (!tc.notes.toLowerCase().includes(owner.toLowerCase()))
        throw new Error(`${tc.id}: owner ${owner} is not in source`);
  }
}
console.log(
  `Validated ${dataset.length} dataset cases: ${["english", "cebuano", "mixed"].map((language) => `${dataset.filter((tc) => tc.language === language).length} ${language}`).join(", ")}.`,
);
console.log(
  "This checks annotation syntax and source names only. It does not measure model accuracy or prove semantic label correctness. Run npm test for deterministic rules and npm run eval:model for actual inference.",
);
