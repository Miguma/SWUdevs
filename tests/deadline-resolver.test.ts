import { describe, it, expect } from "vitest";
import { resolveDeadline } from "../src/server/services/deadline-resolver";

describe("Deadline Resolver (Bilingual English & Cebuano)", () => {
  const meetingDate = "2026-10-23"; // Friday

  it("resolves 'ugma' relative to meeting date as next day", () => {
    const res = resolveDeadline({
      phrase: "ugma",
      meetingDate,
      timezone: "Asia/Manila",
    });
    expect(res.date).toBe("2026-10-24");
    expect(res.isAmbiguous).toBe(false);
  });

  it("resolves 'ugma sa hapon' with 17:00 time", () => {
    const res = resolveDeadline({
      phrase: "ugma sa hapon",
      meetingDate,
      timezone: "Asia/Manila",
    });
    expect(res.date).toBe("2026-10-24");
    expect(res.time).toBe("17:00");
  });

  it("resolves 'tomorrow morning' with 09:00 time", () => {
    const res = resolveDeadline({
      phrase: "tomorrow morning",
      meetingDate,
      timezone: "Asia/Manila",
    });
    expect(res.date).toBe("2026-10-24");
    expect(res.time).toBe("09:00");
  });

  it("resolves 'sa sunod adlaw' as +2 days", () => {
    const res = resolveDeadline({
      phrase: "sa sunod adlaw",
      meetingDate,
      timezone: "Asia/Manila",
    });
    expect(res.date).toBe("2026-10-25");
  });

  it("resolves 'next Monday' / 'sa lunes' to upcoming Monday", () => {
    const res = resolveDeadline({
      phrase: "sa lunes",
      meetingDate, // 2026-10-23 is Friday
      timezone: "Asia/Manila",
    });
    expect(res.date).toBe("2026-10-26");
  });

  it("preserves 'before' relation in 'before Oct 28'", () => {
    const res = resolveDeadline({
      phrase: "before October 28",
      meetingDate,
      timezone: "Asia/Manila",
    });
    expect(res.date).toBe("2026-10-28");
    expect(res.relation).toBe("before");
  });

  it("preserves 'by' relation in 'kutob Oct 30'", () => {
    const res = resolveDeadline({
      phrase: "kutob October 30",
      meetingDate,
      timezone: "Asia/Manila",
    });
    expect(res.date).toBe("2026-10-30");
    expect(res.relation).toBe("by");
  });

  it("marks date as ambiguous if meetingDate is unknown and phrase is relative", () => {
    const res = resolveDeadline({
      phrase: "ugma",
      meetingDate: null, // Unknown meeting date
      timezone: "Asia/Manila",
    });
    expect(res.date).toBeNull();
    expect(res.isAmbiguous).toBe(true);
    expect(res.originalText).toBe("ugma");
  });

  it("returns null deadline if phrase is empty", () => {
    const res = resolveDeadline({
      phrase: null,
      meetingDate,
      timezone: "Asia/Manila",
    });
    expect(res.date).toBeNull();
    expect(res.originalText).toBeNull();
  });
});
