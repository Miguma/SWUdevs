import { describe, it, expect } from "vitest";
import { resolveDeadline } from "../src/server/services/deadline-resolver";

describe("Deadline Resolver (Bilingual English & Cebuano)", () => {
  const meetingDate = "2026-10-23"; // Friday
  it("resolves day after tomorrow before the shorter tomorrow phrase", () => {
    expect(resolveDeadline({ phrase: "day after tomorrow", meetingDate }).date).toBe("2026-10-25");
  });
  it("does not turn invalid 12-hour times into impossible clock values", () => {
    expect(resolveDeadline({ phrase: "tomorrow at 13pm", meetingDate }).time).toBeNull();
  });

  it("resolves 'ugma' relative to meeting date as next day", () => {
    const res = resolveDeadline({
      phrase: "ugma",
      meetingDate,
      timezone: "Asia/Manila",
    });
    expect(res.date).toBe("2026-10-24");
    expect(res.time).toBeNull();
    expect(res.isAmbiguous).toBe(false);
  });

  it("does NOT fabricate exact 17:00 timestamp for vague daypart 'ugma sa hapon'", () => {
    const res = resolveDeadline({
      phrase: "ugma sa hapon",
      meetingDate,
      timezone: "Asia/Manila",
    });
    expect(res.date).toBe("2026-10-24");
    // Time should NOT be arbitrarily fabricated as 17:00 for vague dayparts
    expect(res.time).toBeNull();
    expect(res.originalText).toBe("ugma sa hapon");
  });

  it("extracts explicit time when specified like 'tomorrow at 5:00 pm'", () => {
    const res = resolveDeadline({
      phrase: "tomorrow at 5:00 pm",
      meetingDate,
      timezone: "Asia/Manila",
    });
    expect(res.date).toBe("2026-10-24");
    expect(res.time).toBe("17:00");
  });

  it("resolves 'sa sunod adlaw' as the next day", () => {
    const res = resolveDeadline({
      phrase: "sa sunod adlaw",
      meetingDate,
      timezone: "Asia/Manila",
    });
    expect(res.date).toBe("2026-10-24");
  });

  it("resolves 'sa lunes' (coming Monday) from Friday", () => {
    const res = resolveDeadline({
      phrase: "sa lunes",
      meetingDate, // 2026-10-23 is Friday
      timezone: "Asia/Manila",
    });
    expect(res.date).toBe("2026-10-26");
  });

  it("resolves 'karong biyernes' on Friday to the same day (today)", () => {
    const res = resolveDeadline({
      phrase: "karong biyernes",
      meetingDate, // 2026-10-23 is Friday
      timezone: "Asia/Manila",
    });
    expect(res.date).toBe("2026-10-23");
  });

  it("resolves 'sunod biyernes' on Friday to Friday next week (+7 days)", () => {
    const res = resolveDeadline({
      phrase: "sunod biyernes",
      meetingDate, // 2026-10-23 is Friday
      timezone: "Asia/Manila",
    });
    expect(res.date).toBe("2026-10-30");
  });

  it("marks generic 'next week' / 'sunod semana' as ambiguous without fabricating a specific date", () => {
    const res = resolveDeadline({
      phrase: "next week",
      meetingDate,
      timezone: "Asia/Manila",
    });
    expect(res.date).toBeNull();
    expect(res.isAmbiguous).toBe(true);
    expect(res.relation).toBe("by");
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

  it("rejects invalid calendar dates like 'February 31'", () => {
    const res = resolveDeadline({
      phrase: "February 31",
      meetingDate,
      timezone: "Asia/Manila",
    });
    expect(res.date).toBeNull();
    expect(res.isAmbiguous).toBe(true);
  });

  it("marks date without year as ambiguous if meetingDate is unknown", () => {
    const res = resolveDeadline({
      phrase: "October 25",
      meetingDate: null, // Unknown meeting date
      timezone: "Asia/Manila",
    });
    // Should NOT assume arbitrary year default
    expect(res.date).toBeNull();
    expect(res.isAmbiguous).toBe(true);
  });

  it("resolves explicit date with year even if meetingDate is unknown", () => {
    const res = resolveDeadline({
      phrase: "October 25, 2027",
      meetingDate: null,
      timezone: "Asia/Manila",
    });
    expect(res.date).toBe("2027-10-25");
    expect(res.isAmbiguous).toBe(false);
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

  describe("Multilingual (Tagalog, Cebuano, Bislish, Taglish) Expressions", () => {
    it("resolves Tagalog 'bukas' as next day", () => {
      const res = resolveDeadline({ phrase: "bukas", meetingDate });
      expect(res.date).toBe("2026-10-24");
      expect(res.isAmbiguous).toBe(false);
    });

    it("resolves Tagalog 'sa makalawa' as day after tomorrow (+2 days)", () => {
      const res = resolveDeadline({ phrase: "sa makalawa", meetingDate });
      expect(res.date).toBe("2026-10-25");
      expect(res.isAmbiguous).toBe(false);
    });

    it("resolves Tagalog/Bisaya 'ngayon' / 'karon' / 'mamaya' / 'unya' as meeting date", () => {
      expect(resolveDeadline({ phrase: "ngayon", meetingDate }).date).toBe("2026-10-23");
      expect(resolveDeadline({ phrase: "karon", meetingDate }).date).toBe("2026-10-23");
      expect(resolveDeadline({ phrase: "mamaya", meetingDate }).date).toBe("2026-10-23");
      expect(resolveDeadline({ phrase: "unya", meetingDate }).date).toBe("2026-10-23");
    });

    it("resolves Tagalog/Bisaya 'kahapon' / 'gahapon' as previous day", () => {
      expect(resolveDeadline({ phrase: "kahapon", meetingDate }).date).toBe("2026-10-22");
      expect(resolveDeadline({ phrase: "gahapon", meetingDate }).date).toBe("2026-10-22");
    });

    it("marks Tagalog 'susunod na linggo' as ambiguous without inventing precise date", () => {
      const res = resolveDeadline({ phrase: "susunod na linggo", meetingDate });
      expect(res.date).toBeNull();
      expect(res.isAmbiguous).toBe(true);
      expect(res.relation).toBe("by");
    });

    it("resolves Tagalog 'ngayong biyernes' to today (Oct 23)", () => {
      const res = resolveDeadline({ phrase: "ngayong biyernes", meetingDate });
      expect(res.date).toBe("2026-10-23");
    });

    it("resolves 'next Friday' / 'susunod na biyernes' to next week Friday (Oct 30)", () => {
      expect(resolveDeadline({ phrase: "next Friday", meetingDate }).date).toBe("2026-10-30");
      expect(resolveDeadline({ phrase: "susunod na biyernes", meetingDate }).date).toBe("2026-10-30");
    });

    it("resolves 'sa Lunes' / 'sa lunes' (upcoming Monday) from Friday", () => {
      expect(resolveDeadline({ phrase: "sa Lunes", meetingDate }).date).toBe("2026-10-26");
    });

    it("recognizes Tagalog preposition relations like 'bago mag' and 'hanggang'", () => {
      const resBefore = resolveDeadline({ phrase: "bago mag 5:00 pm", meetingDate });
      expect(resBefore.relation).toBe("before");
      expect(resBefore.time).toBe("17:00");

      const resBy = resolveDeadline({ phrase: "hanggang bukas", meetingDate });
      expect(resBy.relation).toBe("by");
      expect(resBy.date).toBe("2026-10-24");
    });
  });
});
