import { Deadline, DeadlineRelation } from "@/types/meeting";

interface ResolveDeadlineInput {
  phrase: string | null;
  meetingDate?: string | null; // Format: YYYY-MM-DD
  timezone?: string;
  explicitRelation?: DeadlineRelation;
}

const CEBUANO_DAY_MAP: Record<string, number> = {
  dominggo: 0,
  sunday: 0,
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
      clean.startsWith("prior to ")
    ) {
      detectedRelation = "before";
    } else if (
      clean.startsWith("by ") ||
      clean.startsWith("kutob ") ||
      clean.startsWith("dili molapas sa ") ||
      clean.startsWith("until ")
    ) {
      detectedRelation = "by";
    } else if (clean.startsWith("on ") || clean.startsWith("sa ")) {
      detectedRelation = "on";
    } else if (clean.startsWith("after ") || clean.startsWith("human sa ")) {
      detectedRelation = "after";
    }
  }

  // Detect time of day if present
  let detectedTime: string | null = null;
  if (clean.includes("buntag") || clean.includes("morning")) {
    detectedTime = "09:00";
  } else if (clean.includes("hapon") || clean.includes("afternoon")) {
    detectedTime = "17:00";
  } else if (clean.includes("gabii") || clean.includes("evening") || clean.includes("tonight") || clean.includes("night")) {
    detectedTime = "20:00";
  } else if (clean.includes("udto") || clean.includes("noon")) {
    detectedTime = "12:00";
  }

  // Check for explicit time pattern e.g. "5pm", "5:00 PM", "17:00"
  const timeRegex = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i;
  const timeMatch = clean.match(timeRegex);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const meridian = timeMatch[3].toLowerCase();
    if (meridian === "pm" && hours < 12) hours += 12;
    if (meridian === "am" && hours === 12) hours = 0;
    detectedTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }

  // If meetingDate is not provided or unknown, DO NOT use server current time!
  if (!meetingDate || meetingDate.trim() === "" || meetingDate === "unknown") {
    // Attempt only explicit absolute date parsing (e.g. 2026-10-25 or Oct 25)
    const explicitDate = parseExplicitDate(clean);
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
    // Relative phrases without meetingDate remain unresolved
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

  // 1. Check for explicit absolute dates in text (e.g., "2026-10-25" or "October 25")
  const explicitDate = parseExplicitDate(clean, anchor.getFullYear());
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

  // 2. Relative: Today / Karong adlawa
  if (clean.includes("today") || clean.includes("karong adlawa") || clean === "karong hapon" || clean === "karong buntag" || clean === "karong gabii") {
    return {
      originalText: phrase,
      date: formatDateIso(anchor),
      time: detectedTime,
      timezone,
      relation: detectedRelation || "on",
      isAmbiguous: false,
    };
  }

  // 3. Relative: Tomorrow / Ugma
  if (clean.includes("ugma") || clean.includes("tomorrow")) {
    const nextDay = new Date(anchor.getTime());
    nextDay.setDate(anchor.getDate() + 1);
    return {
      originalText: phrase,
      date: formatDateIso(nextDay),
      time: detectedTime,
      timezone,
      relation: detectedRelation || "by",
      isAmbiguous: false,
    };
  }

  // 4. Relative: Day after tomorrow / Sa sunod adlaw
  if (clean.includes("sa sunod adlaw") || clean.includes("day after tomorrow")) {
    const dayAfter = new Date(anchor.getTime());
    dayAfter.setDate(anchor.getDate() + 2);
    return {
      originalText: phrase,
      date: formatDateIso(dayAfter),
      time: detectedTime,
      timezone,
      relation: detectedRelation || "by",
      isAmbiguous: false,
    };
  }

  // 5. Relative day of week (e.g., "karong biyernes", "this Friday", "next Monday", "sa lunes")
  for (const [dayName, targetDayIndex] of Object.entries(CEBUANO_DAY_MAP)) {
    if (clean.includes(dayName)) {
      const currentDayIndex = anchor.getDay();
      let diff = targetDayIndex - currentDayIndex;

      const isNextWeek = clean.includes("next") || clean.includes("sunod");
      if (diff <= 0 || isNextWeek) {
        diff += 7;
      }

      const targetDate = new Date(anchor.getTime());
      targetDate.setDate(anchor.getDate() + diff);

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

  // 6. Generic "next week" / "sunod semana" (without specific day -> ambiguous)
  if (clean.includes("sunod semana") || clean.includes("next week")) {
    const nextWeekDate = new Date(anchor.getTime());
    nextWeekDate.setDate(anchor.getDate() + 7);
    return {
      originalText: phrase,
      date: formatDateIso(nextWeekDate),
      time: detectedTime,
      timezone,
      relation: detectedRelation || "by",
      isAmbiguous: true, // Specific day of next week was not stated
    };
  }

  // 7. Fallback for unparsed phrases
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
    const dt = new Date(Date.UTC(y, m, d));
    return isNaN(dt.getTime()) ? null : dt;
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

function parseExplicitDate(text: string, defaultYear = 2026): string | null {
  // Check ISO format YYYY-MM-DD
  const isoMatch = text.match(/\b(20\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/);
  if (isoMatch) {
    return isoMatch[0];
  }

  // Check Month Day formats e.g. "Oct 25", "October 25", "Oct 25, 2026", "25 October 2026"
  const mDayMatch = text.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?\b/i);
  if (mDayMatch) {
    const monthStr = mDayMatch[1].toLowerCase();
    const monthNum = MONTH_MAP[monthStr];
    const day = parseInt(mDayMatch[2], 10);
    const year = mDayMatch[3] ? parseInt(mDayMatch[3], 10) : defaultYear;
    if (monthNum && day >= 1 && day <= 31) {
      return `${year}-${monthNum.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    }
  }

  const dayMMatch = text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*(?:,?\s+(\d{4}))?\b/i);
  if (dayMMatch) {
    const day = parseInt(dayMMatch[1], 10);
    const monthStr = dayMMatch[2].toLowerCase();
    const monthNum = MONTH_MAP[monthStr];
    const year = dayMMatch[3] ? parseInt(dayMMatch[3], 10) : defaultYear;
    if (monthNum && day >= 1 && day <= 31) {
      return `${year}-${monthNum.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    }
  }

  return null;
}
