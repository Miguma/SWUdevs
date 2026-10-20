import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  MeetingExtraction,
  ActionItem,
  MeetingDecision,
  OpenQuestion,
} from "@/types/meeting";
import {
  getExecutionProgress,
  getClarificationReasons,
  isTaskOverdue,
} from "@/lib/meeting-workflow";
import { formatDateDisplay } from "@/lib/utils";

export interface PdfExportOptions {
  includePending?: boolean;
}

// Brand Colors (matching Tailwind config and Tambayayong visual system)
const COLORS = {
  primary: [36, 125, 89] as [number, number, number], // #247D59 (Forest green)
  primaryDark: [23, 43, 36] as [number, number, number], // #172B24 (Deep slate)
  primaryLight: [234, 245, 237] as [number, number, number], // #EAF5ED (Light green tint)
  muted: [82, 102, 91] as [number, number, number], // #52665B (Muted green/gray)
  border: [222, 232, 225] as [number, number, number], // #DEE8E1
  cardBg: [248, 250, 248] as [number, number, number], // #F8FAF8
  white: [255, 255, 255] as [number, number, number],
  amber: [168, 110, 25] as [number, number, number], // #A86E19
  amberLight: [254, 247, 232] as [number, number, number], // #FEF7E8
  danger: [180, 35, 24] as [number, number, number], // #B42318
  dangerLight: [254, 243, 242] as [number, number, number], // #FEF3F2
  teal: [44, 140, 137] as [number, number, number], // #2C8C89
};

/**
 * Common Unicode symbol mappings to readable, printable ASCII / Latin-1 equivalents.
 */
const UNICODE_SYMBOL_MAP: Record<string, string> = {
  // Currency symbols
  "\u20B1": "PHP ", // Philippine Peso
  "\u20AC": "EUR ", // Euro
  "\u00A3": "GBP ", // British Pound
  "\u00A5": "JPY ", // Japanese Yen
  "\u20BD": "RUB ", // Russian Ruble
  "\u20B9": "INR ", // Indian Rupee
  "\u20A9": "KRW ", // Korean Won
  "\u20AB": "VND ", // Vietnamese Dong
  "\u0E3F": "THB ", // Thai Baht

  // Typographic / curly quotes and dashes
  "\u201C": '"',
  "\u201D": '"',
  "\u2018": "'",
  "\u2019": "'",
  "\u201A": ",",
  "\u201E": '"',
  "\u00AB": '"',
  "\u00BB": '"',
  "\u2014": " - ", // Em dash
  "\u2013": " - ", // En dash
  "\u2026": "...", // Ellipsis
  "\u2022": "*", // Bullet
  "\u2023": "*",
  "\u25E6": "*",
  "\u2043": "*",

  // Common arrows & math symbols
  "\u2192": "->",
  "\u21D2": "->",
  "\u2794": "->",
  "\u2190": "<-",
  "\u21D0": "<-",
  "\u2194": "<->",
  "\u21D4": "<=>",
  "\u2265": ">=",
  "\u2264": "<=",
  "\u2260": "!=",
  "\u2248": "~",
  "\u00D7": "x",
  "\u00F7": "/",
  "\u2122": "(TM)",
  "\u00A9": "(c)",
  "\u00AE": "(R)",

  // Status & UI markers
  "\u2713": "[Done]",
  "\u2714": "[Done]",
  "\u2611": "[Done]",
  "\u2705": "[Done]",
  "\u2717": "[X]",
  "\u2718": "[X]",
  "\u2612": "[X]",
  "\u274C": "[X]",
  "\u2753": "[?]",
  "\u2754": "[?]",
  "\u26A0": "[!]",
  "\uD83D\uDEA8": "[Warning]",
  "\uD83D\uDCCC": "[Pin]",
  "\uD83D\uDCAC": "[Note]",
};

/**
 * Sanitizes and normalizes text for PDF output:
 * - Preserves evidence quotes verbatim (formula injection prefixes like =, +, @, - are NOT stripped)
 * - Normalizes Unicode symbols, currencies, dashes, and quotes to standard printable representations
 * - Preserves full Latin-1 character set (ñ, Ñ, accented vowels)
 * - Decomposes extended Latin letters with diacritics
 * - Never silently deletes unsupported characters: non-WinAnsi code points are rendered visibly as [U+XXXX]
 * - Strips dangerous binary control characters that would corrupt PDF syntax
 */
export function sanitizePdfText(text: unknown): string {
  if (text === null || text === undefined) return "";
  let str = String(text);

  // 1. Map known Unicode symbols, currencies, quotes, and punctuation
  for (const [symbol, replacement] of Object.entries(UNICODE_SYMBOL_MAP)) {
    if (str.includes(symbol)) {
      str = str.split(symbol).join(replacement);
    }
  }

  // 2. Transliterate or represent remaining characters outside WinAnsi (0x20-0x7E, 0xA0-0xFF)
  // Instead of silently deleting unsupported characters, we:
  // a) Decompose Latin characters with diacritics to their base Latin letter
  // b) For any unmapped code point > 255, represent it visibly as [U+XXXX] so no data is silently lost
  const result: string[] = [];
  for (const char of str) {
    const code = char.codePointAt(0) ?? 0;

    // Standard printable ASCII or Latin-1 (including ñ, Ñ, accented vowels, ¿, ¡)
    if (
      (code >= 0x20 && code <= 0x7e) ||
      (code >= 0xa0 && code <= 0xff) ||
      char === "\n" ||
      char === "\r" ||
      char === "\t"
    ) {
      result.push(char);
      continue;
    }

    // Attempt Latin decomposition for accented letters not in Latin-1 (e.g. ā, č, š)
    const decomposed = char.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (
      decomposed.length > 0 &&
      decomposed.charCodeAt(0) >= 0x20 &&
      decomposed.charCodeAt(0) <= 0x7e
    ) {
      result.push(decomposed);
      continue;
    }

    // Skip binary control characters
    if (
      (code >= 0x00 && code <= 0x08) ||
      code === 0x0b ||
      code === 0x0c ||
      (code >= 0x0e && code <= 0x1f) ||
      code === 0x7f
    ) {
      continue;
    }

    // Visible fallback: render code point token so reader sees the exact character without silent deletion
    const hex = code.toString(16).toUpperCase().padStart(4, "0");
    result.push(`[U+${hex}]`);
  }

  return result.join("").trim();
}

function formatTaskStatusDisplay(status?: string): string {
  switch (status) {
    case "in_progress":
      return "In Progress";
    case "blocked":
      return "Blocked";
    case "completed":
      return "Completed";
    case "todo":
    default:
      return "To Do";
  }
}

/**
 * Ensures sufficient vertical space on the current page before starting a new section.
 * If remaining space is too small, adds a new page and returns the top margin.
 */
function ensurePageSpace(
  doc: jsPDF,
  currentY: number,
  requiredSpaceMm = 28
): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  const bottomMargin = 22; // Guard margin above running footer (footer is at 286mm)
  if (currentY + requiredSpaceMm > pageHeight - bottomMargin) {
    doc.addPage();
    return 20; // Top margin for new page
  }
  return currentY;
}

/**
 * Draws a stylized section header with a forest green accent bar.
 */
function drawSectionHeading(
  doc: jsPDF,
  title: string,
  startY: number
): number {
  const y = ensurePageSpace(doc, startY, 26);
  doc.setFillColor(...COLORS.primary);
  doc.rect(14, y, 2.5, 5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...COLORS.primaryDark);
  doc.text(title, 18, y + 4.2);

  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.2);
  doc.line(14, y + 7, 196, y + 7);

  return y + 10;
}

/**
 * Pure generator function: Constructs a branded, professional A4 PDF
 * using jsPDF and jspdf-autotable.
 */
export function generateMeetingPdf(
  meeting: MeetingExtraction,
  options: PdfExportOptions = {}
): jsPDF {
  const { includePending = false } = options;

  // Filter items according to approved/pending options
  // Rejected items are never included in formal exports
  const approvedTasks = meeting.actionItems.filter(
    (t) => t.reviewStatus === "approved"
  );
  const tasksToExport = meeting.actionItems.filter((t) => {
    if (t.reviewStatus === "approved") return true;
    if (includePending && t.reviewStatus === "pending") return true;
    return false;
  });

  const decisionsToExport = meeting.decisions.filter((d) => {
    if (d.reviewStatus === "approved") return true;
    if (includePending && d.reviewStatus === "pending") return true;
    return false;
  });

  const questionsToExport = meeting.openQuestions.filter((q) => {
    if (q.reviewStatus === "approved") return true;
    if (includePending && q.reviewStatus === "pending") return true;
    return false;
  });

  // Calculate statistics
  const execProgress = getExecutionProgress(meeting);
  const tasksRequiringClarification = tasksToExport.filter(
    (t) => getClarificationReasons(t).length > 0
  );

  // Initialize jsPDF A4 portrait
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: false, // uncompressed vector text ensures 100% searchability and reliability
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182mm

  // 1. Top Decorative Brand Bar
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 4, "F");

  let cursorY = 13;

  // 2. Header: Logo, Tagline, and Document Type Badge
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.primary);
  doc.text("TAMBAYAYONG", marginX, cursorY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text("Meeting Intelligence & Action Tracking • Walay mabilin!", marginX, cursorY + 4.5);

  // Document Badge (Right aligned)
  const badgeLabel = includePending
    ? "DRAFT & PENDING REVIEW"
    : "OFFICIAL ACTION REPORT";
  const badgeColor = includePending ? COLORS.amber : COLORS.primary;
  const badgeBg = includePending ? COLORS.amberLight : COLORS.primaryLight;

  doc.setFillColor(...badgeBg);
  doc.setDrawColor(...badgeColor);
  doc.setLineWidth(0.3);
  const badgeWidth = 48;
  const badgeHeight = 6.5;
  const badgeX = pageWidth - marginX - badgeWidth;
  doc.roundedRect(badgeX, cursorY - 4.5, badgeWidth, badgeHeight, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...badgeColor);
  doc.text(badgeLabel, badgeX + badgeWidth / 2, cursorY - 0.5, { align: "center" });

  cursorY += 9;

  // Divider line
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(marginX, cursorY, marginX + contentWidth, cursorY);

  cursorY += 6;

  // 3. Meeting Title & Key Metadata
  const cleanTitle = sanitizePdfText(meeting.title) || "Untitled Meeting Session";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...COLORS.primaryDark);

  const titleLines = doc.splitTextToSize(cleanTitle, contentWidth);
  doc.text(titleLines, marginX, cursorY);
  cursorY += titleLines.length * 6 + 2;

  // Metadata Grid / Key-Values
  const dateFormatted = meeting.meetingDate
    ? formatDateDisplay(meeting.meetingDate)
    : "Not specified";
  const tzFormatted = meeting.timezone ? `(${meeting.timezone})` : "";
  const orgFormatted = sanitizePdfText(meeting.organization) || "General / Not specified";
  const participantsFormatted = sanitizePdfText(meeting.participants) || "Not recorded";

  autoTable(doc, {
    startY: cursorY,
    margin: { left: marginX, right: marginX },
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 1.5,
      textColor: COLORS.primaryDark,
      overflow: "linebreak",
    },
    columnStyles: {
      0: { fontStyle: "bold", textColor: COLORS.muted, cellWidth: 26 },
      1: { cellWidth: 65 },
      2: { fontStyle: "bold", textColor: COLORS.muted, cellWidth: 26 },
      3: { cellWidth: 65 },
    },
    body: [
      [
        "Meeting Date:",
        `${dateFormatted} ${tzFormatted}`,
        "Organization:",
        orgFormatted,
      ],
      [
        "Attendees:",
        participantsFormatted,
        "Report Date:",
        `${new Date().toISOString().slice(0, 10)} • Verified Provenance`,
      ],
    ],
  });

  cursorY = ((doc as any).lastAutoTable?.finalY || cursorY) + 5;

  // 4. Executive Summary Box (Rendered via autoTable for multi-page overflow immunity)
  const summaryText = sanitizePdfText(meeting.summary) ||
    "No executive summary provided for this session.";

  autoTable(doc, {
    startY: cursorY,
    margin: { left: marginX, right: marginX },
    theme: "plain",
    pageBreak: "auto",
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: { top: 3.5, right: 4, bottom: 3.5, left: 6 },
      textColor: COLORS.primaryDark,
      fillColor: COLORS.cardBg,
      lineColor: COLORS.border,
      lineWidth: 0.25,
      overflow: "linebreak",
    },
    body: [
      [
        {
          content: `EXECUTIVE SUMMARY\n\n${summaryText}`,
          styles: {
            fontStyle: "normal",
          },
        },
      ],
    ],
    didDrawCell: (data) => {
      if (data.section === "body" && data.column.index === 0) {
        // Draw forest green accent bar on the left edge of the summary card
        doc.setFillColor(...COLORS.primary);
        doc.rect(data.cell.x, data.cell.y, 2.5, data.cell.height, "F");
      }
    },
  });

  cursorY = ((doc as any).lastAutoTable?.finalY || cursorY) + 5;

  // 5. Compact Meeting Statistics (KPI Row)
  cursorY = ensurePageSpace(doc, cursorY, 20);

  const statCardWidth = (contentWidth - 9) / 4; // 4 cards with 3mm gaps
  const statCardHeight = 13.5;
  const stats = [
    {
      label: "Action Items",
      value: `${approvedTasks.length} Approved`,
      sub: `${tasksToExport.length} total displayed`,
    },
    {
      label: "Work Progress",
      value: `${execProgress.percent}% Completed`,
      sub: `${execProgress.completed}/${execProgress.totalApproved} finished`,
    },
    {
      label: "Decisions",
      value: `${decisionsToExport.length} Confirmed`,
      sub: "Formal resolutions",
    },
    {
      label: "Open Questions",
      value: `${questionsToExport.length} Items`,
      sub: questionsToExport.some((q) => q.status === "open")
        ? "Needs resolution"
        : "All answered",
    },
  ];

  stats.forEach((st, idx) => {
    const cardX = marginX + idx * (statCardWidth + 3);
    doc.setFillColor(...COLORS.cardBg);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.2);
    doc.roundedRect(cardX, cursorY, statCardWidth, statCardHeight, 1, 1, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.text(st.label, cardX + 3, cursorY + 3.8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.primary);
    doc.text(st.value, cardX + 3, cursorY + 7.8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.muted);
    doc.text(st.sub, cardX + 3, cursorY + 11.4);
  });

  cursorY += statCardHeight + 7;

  // 6. SECTION 1: Confirmed Decisions
  cursorY = drawSectionHeading(doc, "1. Confirmed Decisions", cursorY);

  if (decisionsToExport.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text("No formal decisions were recorded in this session.", marginX + 3, cursorY);
    cursorY += 6;
  } else {
    const decisionRows = decisionsToExport.map((d, i) => {
      const decisionText = sanitizePdfText(d.decision);
      const isPending = d.reviewStatus === "pending";
      const statusNote = isPending ? "Pending Review (Draft)" : "Approved";

      let evidenceText = "";
      if (d.evidence && d.evidence.length > 0 && d.evidence[0].quote) {
        const prov = d.evidence[0].provenance || "unverified";
        evidenceText = `Source Evidence (${prov}): "${sanitizePdfText(d.evidence[0].quote)}"`;
      }

      return [
        String(i + 1),
        evidenceText
          ? `${decisionText}\n${evidenceText}`
          : decisionText,
        statusNote,
      ];
    });

    autoTable(doc, {
      startY: cursorY,
      margin: { left: marginX, right: marginX },
      theme: "striped",
      pageBreak: "auto",
      showHead: "everyPage",
      styles: {
        font: "helvetica",
        fontSize: 7.8,
        cellPadding: 2,
        textColor: COLORS.primaryDark,
        lineColor: COLORS.border,
        lineWidth: 0.2,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontStyle: "bold",
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: COLORS.cardBg,
      },
      columnStyles: {
        0: { cellWidth: 8, halign: "center", fontStyle: "bold" },
        1: { cellWidth: 146 },
        2: { cellWidth: 28, halign: "center", fontStyle: "bold" },
      },
      head: [["#", "Decision & Provenance", "Review Status"]],
      body: decisionRows,
    });

    cursorY = ((doc as any).lastAutoTable?.finalY || cursorY) + 7;
  }

  // 7. SECTION 2: Action Items & Work Assignment
  cursorY = drawSectionHeading(doc, "2. Action Items & Work Assignment", cursorY);

  if (tasksToExport.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text("No action items available for export.", marginX + 3, cursorY);
    cursorY += 6;
  } else {
    const taskRows = tasksToExport.map((task, i) => {
      const cleanTaskTitle = sanitizePdfText(task.title);
      const cleanDesc = sanitizePdfText(task.description);

      // Provenance citation
      let evidenceQuote = "";
      if (task.evidence && task.evidence.length > 0 && task.evidence[0].quote) {
        const prov = task.evidence[0].provenance || "unverified";
        evidenceQuote = `Source (${prov}): "${sanitizePdfText(task.evidence[0].quote)}"`;
      }

      // Title cell with context and evidence
      const titleCellParts = [cleanTaskTitle];
      if (cleanDesc) {
        titleCellParts.push(`Context: ${cleanDesc}`);
      }
      if (evidenceQuote) {
        titleCellParts.push(evidenceQuote);
      }

      // Assignee / Owner (Never invent an assignee)
      const ownerCell =
        task.assignees && task.assignees.length > 0
          ? sanitizePdfText(task.assignees.join(", "))
          : "Not assigned";

      // Deadline (Display clear status, never invent)
      let deadlineCell = "Not specified";
      if (task.deadline.date) {
        const relation = task.deadline.relation ? ` (${task.deadline.relation})` : "";
        const timeStr = task.deadline.time ? ` at ${task.deadline.time}` : "";
        deadlineCell = `${task.deadline.date}${timeStr}${relation}`;
      } else if (task.deadline.originalText) {
        deadlineCell = sanitizePdfText(task.deadline.originalText);
      }

      if (task.deadline.isAmbiguous) {
        deadlineCell += " [Ambiguous]";
      }

      if (isTaskOverdue(task, meeting.timezone)) {
        deadlineCell += "\n[OVERDUE]";
      }

      // Execution status
      const execStatusCell = formatTaskStatusDisplay(task.status);

      // Review status (Never present draft as approved)
      const reviewStatusCell =
        task.reviewStatus === "approved"
          ? "Approved"
          : "Pending Review\n(Draft)";

      // Clarification warnings
      const warnings = getClarificationReasons(task);
      const clarificationCell =
        warnings.length > 0 ? warnings.join("\n") : "Clear";

      return [
        String(i + 1),
        titleCellParts.join("\n"),
        ownerCell,
        deadlineCell,
        execStatusCell,
        reviewStatusCell,
        clarificationCell,
      ];
    });

    autoTable(doc, {
      startY: cursorY,
      margin: { left: marginX, right: marginX },
      theme: "striped",
      showHead: "everyPage",
      pageBreak: "auto",
      styles: {
        font: "helvetica",
        fontSize: 7.2,
        cellPadding: 2,
        textColor: COLORS.primaryDark,
        lineColor: COLORS.border,
        lineWidth: 0.2,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontStyle: "bold",
        fontSize: 7.6,
      },
      alternateRowStyles: {
        fillColor: COLORS.cardBg,
      },
      columnStyles: {
        0: { cellWidth: 7, halign: "center", fontStyle: "bold" },
        1: { cellWidth: 63 }, // Title + Context + Evidence
        2: { cellWidth: 26 }, // Owner
        3: { cellWidth: 28 }, // Due Date
        4: { cellWidth: 20, halign: "center" }, // Execution
        5: { cellWidth: 20, halign: "center", fontStyle: "bold" }, // Review
        6: { cellWidth: 18, halign: "center" }, // Clarification
      },
      head: [
        [
          "#",
          "Task Title & Evidence",
          "Assignee",
          "Due Date",
          "Work Status",
          "Review Status",
          "Attention",
        ],
      ],
      body: taskRows,
    });

    cursorY = ((doc as any).lastAutoTable?.finalY || cursorY) + 7;
  }

  // 8. SECTION 3: Items Requiring Clarification & Attention
  cursorY = drawSectionHeading(
    doc,
    "3. Items Requiring Clarification & Attention",
    cursorY
  );

  if (tasksRequiringClarification.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text(
      "All action items have confirmed assignees, verified evidence, and clear deadlines. No immediate clarification required.",
      marginX + 3,
      cursorY
    );
    cursorY += 6;
  } else {
    const clarificationRows = tasksRequiringClarification.map((t, idx) => {
      const reasons = getClarificationReasons(t);
      const ownerStatus =
        t.assignees && t.assignees.length > 0
          ? sanitizePdfText(t.assignees.join(", "))
          : "Not assigned";
      const commitmentNote =
        t.commitmentStatus === "confirmed"
          ? "Confirmed"
          : "Not confirmed (Proposed/Unclear)";

      return [
        String(idx + 1),
        sanitizePdfText(t.title),
        reasons.join(", "),
        ownerStatus,
        commitmentNote,
      ];
    });

    autoTable(doc, {
      startY: cursorY,
      margin: { left: marginX, right: marginX },
      theme: "striped",
      pageBreak: "auto",
      showHead: "everyPage",
      styles: {
        font: "helvetica",
        fontSize: 7.4,
        cellPadding: 2,
        textColor: COLORS.primaryDark,
        lineColor: COLORS.border,
        lineWidth: 0.2,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: COLORS.amber,
        textColor: COLORS.white,
        fontStyle: "bold",
        fontSize: 7.8,
      },
      alternateRowStyles: {
        fillColor: COLORS.amberLight,
      },
      columnStyles: {
        0: { cellWidth: 7, halign: "center", fontStyle: "bold" },
        1: { cellWidth: 60, fontStyle: "bold" },
        2: { cellWidth: 45, textColor: COLORS.danger },
        3: { cellWidth: 35 },
        4: { cellWidth: 35 },
      },
      head: [
        [
          "#",
          "Task Title",
          "Clarification Reason",
          "Current Owner",
          "Commitment",
        ],
      ],
      body: clarificationRows,
    });

    cursorY = ((doc as any).lastAutoTable?.finalY || cursorY) + 7;
  }

  // 9. SECTION 4: Open Questions & Follow-ups
  cursorY = drawSectionHeading(doc, "4. Open Questions & Follow-ups", cursorY);

  if (questionsToExport.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text("No open questions or follow-up items recorded.", marginX + 3, cursorY);
    cursorY += 6;
  } else {
    const questionRows = questionsToExport.map((q, idx) => {
      const questionText = sanitizePdfText(q.question);
      const isAnswered = q.status === "answered";
      const statusText = isAnswered ? "Answered / Resolved" : "Open / Needs Resolution";

      const parts = [questionText];
      if (q.answer) {
        parts.push(`Resolution: ${sanitizePdfText(q.answer)}`);
      }
      if (q.evidence && q.evidence.length > 0 && q.evidence[0].quote) {
        const prov = q.evidence[0].provenance || "unverified";
        parts.push(`Evidence (${prov}): "${sanitizePdfText(q.evidence[0].quote)}"`);
      }

      return [
        String(idx + 1),
        parts.join("\n"),
        statusText,
      ];
    });

    autoTable(doc, {
      startY: cursorY,
      margin: { left: marginX, right: marginX },
      theme: "striped",
      pageBreak: "auto",
      showHead: "everyPage",
      styles: {
        font: "helvetica",
        fontSize: 7.5,
        cellPadding: 2,
        textColor: COLORS.primaryDark,
        lineColor: COLORS.border,
        lineWidth: 0.2,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: COLORS.teal,
        textColor: COLORS.white,
        fontStyle: "bold",
        fontSize: 7.8,
      },
      alternateRowStyles: {
        fillColor: COLORS.cardBg,
      },
      columnStyles: {
        0: { cellWidth: 7, halign: "center", fontStyle: "bold" },
        1: { cellWidth: 140 },
        2: { cellWidth: 35, halign: "center", fontStyle: "bold" },
      },
      head: [["#", "Question & Recorded Resolution", "Status"]],
      body: questionRows,
    });

    cursorY = ((doc as any).lastAutoTable?.finalY || cursorY) + 7;
  }

  // 10. SECTION 5: Next Scheduled Meeting (if present)
  if (
    meeting.nextMeeting &&
    (meeting.nextMeeting.date || meeting.nextMeeting.originalText)
  ) {
    cursorY = drawSectionHeading(doc, "5. Next Scheduled Session", cursorY);
    const nextDue = meeting.nextMeeting.date
      ? `${meeting.nextMeeting.date}${
          meeting.nextMeeting.time ? ` at ${meeting.nextMeeting.time}` : ""
        }`
      : sanitizePdfText(meeting.nextMeeting.originalText);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.primaryDark);
    doc.text(`Next meeting scheduled for: ${nextDue}`, marginX + 3, cursorY);
    cursorY += 6;
  }

  // 11. Two-pass Running Headers (pages 2+) & Footers (all pages)
  const totalPages = doc.getNumberOfPages();
  const safeShortTitle = sanitizePdfText(meeting.title).slice(0, 45) || "Meeting Report";
  const dateStr = meeting.meetingDate || new Date().toISOString().slice(0, 10);

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    doc.setPage(pageNum);

    // Running Header (only on page 2 and later)
    if (pageNum > 1) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...COLORS.primary);
      doc.text("TAMBAYAYONG", marginX, 10);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.muted);
      doc.text(` •  ${safeShortTitle}`, marginX + 24, 10);
      doc.text(dateStr, pageWidth - marginX, 10, { align: "right" });

      doc.setDrawColor(...COLORS.border);
      doc.setLineWidth(0.2);
      doc.line(marginX, 12.5, pageWidth - marginX, 12.5);
    }

    // Running Footer (on all pages)
    const footerY = 286;
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.2);
    doc.line(marginX, footerY, pageWidth - marginX, footerY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.text(
      "Tambayayong — Verifiable meeting minutes with source provenance • Confidential",
      marginX,
      footerY + 4.2
    );

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.primaryDark);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - marginX, footerY + 4.2, {
      align: "right",
    });
  }

  return doc;
}

/**
 * Triggers a browser download of the generated PDF document.
 * In non-browser environments (e.g. testing), returns the PDF Blob.
 */
export async function exportMeetingToPdf(
  meeting: MeetingExtraction,
  options: PdfExportOptions = {}
): Promise<Blob> {
  const doc = generateMeetingPdf(meeting, options);
  const blob = doc.output("blob");

  if (typeof window !== "undefined" && typeof document !== "undefined") {
    const safeTitle = (meeting.title || "meeting")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .slice(0, 40);
    const dateStr = meeting.meetingDate || new Date().toISOString().slice(0, 10);
    const filename = `tambayayong-${safeTitle}-${dateStr}.pdf`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return blob;
}
