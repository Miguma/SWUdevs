import { Deadline, DeadlineRelation } from "@/types/meeting";

interface ResolveDeadlineInput {
  phrase: string | null;
  meetingDate?: string | null; // Format: YYYY-MM-DD
  timezone?: string;
  explicitRelation?: DeadlineRelation;
}

const MULTILINGUAL_DAY_MAP: Record<string, number> = {
  dominggo: 0,
  sunday: 0,
  linggo: 0,
  lunes: 1,
  monday: 1,
  martes: 2,
  tuesday: 2,
  miyerkoles: 3,
  miyerkules: 3,
  wednesday: 3,
  huwebes: 4,
  thursday: 4,
  biyernes: 5,
  byernes: 5,
  friday: 5,
  sabado: 6,
  saturday: 6,
};

export function resolveDeadline(input: ResolveDeadlineInput): Deadline {
  const { phrase, meetingDate, timezone = "Asia/Manila", explicitRelation = null } = input;

  const defaultResult: Deadline = {
    originalText: phrase,
    date: null,
    time: null,
    timezone,
    relation: explicitRelation,
    isAmbiguous: false,
  };

  if (!phrase || phrase.trim() === "") {
    return defaultResult;
  }

  const clean = phrase.trim().toLowerCase();

  // Detect relation if not explicitly provided
  let detectedRelation: DeadlineRelation = explicitRelation;
  if (!detectedRelation) {
    if (
      clean.startsWith("before ") ||
      clean.startsWith("sa dili pa ") ||
      clean.startsWith("prior to ") ||
      clean.startsWith("bago mag ") ||
      clean.startsWith("bago ang ")
    ) {
      detectedRelation = "before";
    } else if (
      clean.startsWith("by ") ||
      clean.startsWith("kutob ") ||
      clean.startsWith("dili molapas sa ") ||
      clean.startsWith("until ") ||
      clean.startsWith("hanggang sa ") ||
      clean.startsWith("hanggang ")
    ) {
      detectedRelation = "by";
    } else if (clean.startsWith("on ") || clean.startsWith("sa ")) {
      detectedRelation = "on";
    } else if (
      clean.startsWith("after ") ||
      clean.startsWith("human sa ") ||
      clean.startsWith("pagkatapos ng ")
    ) {
      detectedRelation = "after";
    }
  }

  // Detect ONLY explicit time patterns (e.g. "5pm", "5:00 PM", "17:00")
  // Do NOT fabricate exact times from vague dayparts like "sa hapon" or "morning"!
  let detectedTime: string | null = null;
  const timeRegex = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i;
  const timeMatch = clean.match(timeRegex);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const meridian = timeMatch[3].toLowerCase();
    if (meridian === "pm" && hours < 12) hours += 12;
    if (meridian === "am" && hours === 12) hours = 0;
    if (Number(timeMatch[1]) >= 1 && Number(timeMatch[1]) <= 12 && minutes <= 59) detectedTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  } else {
    // 24-hour pattern e.g. "17:00", "09:30"
    const militaryTimeMatch = clean.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
    if (militaryTimeMatch) {
      detectedTime = `${militaryTimeMatch[1].padStart(2, "0")}:${militaryTimeMatch[2]}`;
    }
  }

  // If meetingDate is not provided or unknown:
  // ONLY resolve if an unambiguous 4-digit ISO or explicit year is present in phrase.
  // DO NOT use an arbitrary default year like 2026!
  if (!meetingDate || meetingDate.trim() === "" || meetingDate === "unknown") {
    const explicitWithYear = parseExplicitDateWithYear(clean);
    if (explicitWithYear) {
      return {
        originalText: phrase,
        date: explicitWithYear,
        time: detectedTime,
        timezone,
        relation: detectedRelation,
        isAmbiguous: false,
      };
    }
    // Relative phrase or date without year when meetingDate is unknown -> mark ambiguous!
    return {
      originalText: phrase,
      date: null,
      time: detectedTime,
      timezone,
      relation: detectedRelation,
      isAmbiguous: true,
    };
  }

  // Meeting date is known - parse anchor
  const anchor = parseIsoDate(meetingDate);
  if (!anchor) {
    return {
      originalText: phrase,
      date: null,
      time: detectedTime,
      timezone,
      relation: detectedRelation,
      isAmbiguous: true,
    };
  }

  const anchorYear = anchor.getUTCFullYear();

  // 1. Check for explicit dates with or without explicit year (anchor to meetingDate year)
  const explicitDate = parseExplicitDate(clean, anchorYear);
  if (explicitDate) {
    return {
      originalText: phrase,
      date: explicitDate,
      time: detectedTime,
      timezone,
      relation: detectedRelation,
      isAmbiguous: false,
    };
  }

  // 2. Relative: Today / Karong adlawa / Ngayong araw / Karon / Ngayon / Mamaya / Unya
  if (
    clean.includes("today") ||
    clean.includes("karong adlawa") ||
    clean.includes("ngayong araw") ||
    clean === "karon" ||
    clean === "ngayon" ||
    clean === "mamaya" ||
    clean === "unya" ||
    clean.includes("karong hapon") ||
    clean.includes("ngayong hapon") ||
    clean.includes("karong buntag") ||
    clean.includes("ngayong umaga") ||
    clean.includes("karong gabii") ||
    clean.includes("ngayong gabi")
  ) {
    return {
      originalText: phrase,
      date: formatDateIso(anchor),
      time: detectedTime,
      timezone,
      relation: detectedRelation || "on",
      isAmbiguous: false,
    };
  }

  // 3. Relative: Day after tomorrow / Sa makalawa / Human sa ugma
  if (
    clean.includes("day after tomorrow") ||
    clean.includes("sa makalawa") ||
    clean.includes("samakalawa") ||
    clean.includes("adlaw human ugma") ||
    clean.includes("human sa ugma") ||
    clean.includes("adlaw human sa ugma")
  ) {
    const date = new Date(anchor.getTime());
    date.setUTCDate(date.getUTCDate() + 2);
    return {
      ...defaultResult,
      date: formatDateIso(date),
      time: detectedTime,
      relation: detectedRelation || "by",
    };
  }

  // 4. Relative: Tomorrow / Ugma / Bukas / Sa sunod adlaw
  if (
    clean.includes("ugma") ||
    clean.includes("bukas") ||
    clean.includes("tomorrow") ||
    clean.includes("sa sunod adlaw")
  ) {
    const nextDay = new Date(anchor.getTime());
    nextDay.setUTCDate(anchor.getUTCDate() + 1);
    return {
      originalText: phrase,
      date: formatDateIso(nextDay),
      time: detectedTime,
      timezone,
      relation: detectedRelation || "by",
      isAmbiguous: false,
    };
  }

  // 5. Relative: Yesterday / Gahapon / Kahapon
  if (
    clean.includes("gahapon") ||
    clean.includes("kahapon") ||
    clean.includes("yesterday")
  ) {
    const prevDay = new Date(anchor.getTime());
    prevDay.setUTCDate(anchor.getUTCDate() - 1);
    return {
      originalText: phrase,
      date: formatDateIso(prevDay),
      time: detectedTime,
      timezone,
      relation: detectedRelation || "on",
      isAmbiguous: false,
    };
  }

  // 6. Generic "next week" / "sunod semana" / "susunod na linggo" WITHOUT a specific day:
  // Rule: Do NOT invent an exact date for "next week"! Keep date = null, isAmbiguous = true.
  if (
    clean.includes("sunod semana") ||
    clean.includes("next week") ||
    clean.includes("susunod na linggo") ||
    clean.includes("susunod linggo")
  ) {
    return {
      originalText: phrase,
      date: null,
      time: detectedTime,
      timezone,
      relation: detectedRelation || "by",
      isAmbiguous: true, // Specific day of next week was not stated
    };
  }

  // 7. Relative day of week (e.g. "karong biyernes", "ngayong biyernes", "this Friday", "next Monday", "sa lunes", "susunod na biyernes", "next Friday")
  for (const [dayName, targetDayIndex] of Object.entries(MULTILINGUAL_DAY_MAP)) {
    if (clean.includes(dayName)) {
      const currentDayIndex = anchor.getUTCDay();
      let diff = 0;
      const isNext =
        clean.includes("next") ||
        clean.includes("sunod") ||
        clean.includes("susunod");

      if (targetDayIndex === currentDayIndex) {
        diff = isNext ? 7 : 0; // "karong biyernes" / "ngayong biyernes" on a Friday means today; "sunod biyernes" / "next Friday" means next week
      } else if (targetDayIndex > currentDayIndex) {
        diff = isNext
          ? targetDayIndex - currentDayIndex + 7
          : targetDayIndex - currentDayIndex;
      } else {
        diff = targetDayIndex - currentDayIndex + 7;
      }

      const targetDate = new Date(anchor.getTime());
      targetDate.setUTCDate(anchor.getUTCDate() + diff);

      return {
        originalText: phrase,
        date: formatDateIso(targetDate),
        time: detectedTime,
        timezone,
        relation: detectedRelation || "by",
        isAmbiguous: false,
      };
    }
  }

  // 8. Fallback for unparsed phrases
  return {
    originalText: phrase,
    date: null,
    time: detectedTime,
    timezone,
    relation: detectedRelation,
    isAmbiguous: true,
  };
}

function parseIsoDate(str: string): Date | null {
  const parts = str.split("-");
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
    const dt = new Date(Date.UTC(y, m, d));
    // Verify valid calendar date (e.g. reject Feb 31)
    if (dt.getUTCFullYear() === y && dt.getUTCMonth() === m && dt.getUTCDate() === d) {
      return dt;
    }
  }
  return null;
}

function formatDateIso(d: Date): string {
  const year = d.getUTCFullYear();
  const month = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = d.getUTCDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const MONTH_MAP: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

function isValidDateParts(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const dt = new Date(Date.UTC(year, month - 1, day));
  return dt.getUTCFullYear() === year && dt.getUTCMonth() === month - 1 && dt.getUTCDate() === day;
}

function parseExplicitDateWithYear(text: string): string | null {
  // ISO format YYYY-MM-DD
  const isoMatch = text.match(/\b(20\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10);
    const d = parseInt(isoMatch[3], 10);
    if (isValidDateParts(y, m, d)) return isoMatch[0];
  }

  // Month Day Year e.g. "Oct 25, 2026" or "25 October 2026"
  const mDayYearMatch = text.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(20\d{2})\b/i);
  if (mDayYearMatch) {
    const month = MONTH_MAP[mDayYearMatch[1].toLowerCase()];
    const day = parseInt(mDayYearMatch[2], 10);
    const year = parseInt(mDayYearMatch[3], 10);
    if (month && isValidDateParts(year, month, day)) {
      return `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    }
  }

  const dayMYearMatch = text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*,?\s+(20\d{2})\b/i);
  if (dayMYearMatch) {
    const day = parseInt(dayMYearMatch[1], 10);
    const month = MONTH_MAP[dayMYearMatch[2].toLowerCase()];
    const year = parseInt(dayMYearMatch[3], 10);
    if (month && isValidDateParts(year, month, day)) {
      return `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    }
  }

  return null;
}

function parseExplicitDate(text: string, anchorYear: number): string | null {
  // First try with explicit 4-digit year
  const withYear = parseExplicitDateWithYear(text);
  if (withYear) return withYear;

  // Month Day without year (anchored to anchorYear)
  const mDayMatch = text.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?\b/i);
  if (mDayMatch) {
    const monthStr = mDayMatch[1].toLowerCase();
    const monthNum = MONTH_MAP[monthStr];
    const day = parseInt(mDayMatch[2], 10);
    if (monthNum && isValidDateParts(anchorYear, monthNum, day)) {
      return `${anchorYear}-${monthNum.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    }
  }

  const dayMMatch = text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\b/i);
  if (dayMMatch) {
    const day = parseInt(dayMMatch[1], 10);
    const monthStr = dayMMatch[2].toLowerCase();
    const monthNum = MONTH_MAP[monthStr];
    if (monthNum && isValidDateParts(anchorYear, monthNum, day)) {
      return `${anchorYear}-${monthNum.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    }
  }

  return null;
}
