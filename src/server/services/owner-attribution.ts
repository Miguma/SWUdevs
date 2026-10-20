import type { Evidence } from "@/types/meeting";
import { verifyEvidenceQuote } from "./evidence-verifier";

export interface SpeakerTurn {
  speaker: string;
  startOffset: number;
  headerEndOffset: number;
}
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const genericSpeaker = /^(?:speaker|participant|unknown|anonymous)(?:\s*\d+)?$/iu;
const headerWord = /\b(?:meeting|agenda|topic|notes|transcript|summary|action|decision|date|time|venue|participants|attendees|title|petsa|oras|lugar)\b/iu;

export function extractAllSpeakerTurns(rawText: string): SpeakerTurn[] {
  // Horizontal whitespace inside names is intentional: PDF line breaks must
  // never join a prior statement to the next speaker's name.
  const name = String.raw`[\p{L}][\p{L}\p{N} ._'’-]{0,50}?`;
  const prefix = String.raw`(?:^|[\r\n]|(?<=[.!?]["'”’]?[ \t]+))[ \t]*(?:[-*•][ \t]+|\d+[.)][ \t]+)?(?:\[\d{1,2}:\d{2}(?::\d{2})?\][ \t]*)?`;
  const label = String.raw`(?:\[(${name})\]|\((${name})\)|(?:\*{1,2}|_{1,2})?(${name})(?:\*{1,2}|_{1,2})?[ \t]*(?::|[–—-]|said[:,]?))`;
  const pattern = new RegExp(prefix + label + String.raw`[ \t]*:?[ \t]*`, "gimu");
  return Array.from(rawText.matchAll(pattern), match => ({
    speaker: (match[1] || match[2] || match[3]).trim(),
    startOffset: match.index!,
    headerEndOffset: match.index! + match[0].length,
  }));
}

function identifiedSpeaker(label: string, rawText: string): string | null {
  if (headerWord.test(label)) return null;
  if (!genericSpeaker.test(label)) return label;
  // Resolve anonymized labels only from an explicit identity key in the notes.
  // A participants list or proximity to another name is not an identity mapping.
  const mapping = new RegExp(
    `^\\s*${escape(label)}\\s*=\\s*([\\p{L}][\\p{L} .’'-]{0,50})\\s*$`, "imu",
  ).exec(rawText);
  return mapping && !genericSpeaker.test(mapping[1]) ? mapping[1].trim() : null;
}

function hasSingularCommitment(speech: string): boolean {
  const text = speech.replace(/^[\s"'“”‘’]+/, "").trim();
  // Do not turn quoted reports, past updates, collective suggestions or refusals
  // into individual ownership. This deliberately supports a bounded grammar.
  if (/\b(?:not|never|won['’]t|don['’]t|didn['’]t|dili|di|hindi|ayaw)\b/iu.test(text)) return false;
  if (/\b(?:said|says|told|niingon|nagsabi|sinabi)\b/iu.test(text)) return false;
  return /\b(?:i\s+(?:will|shall|can|am going to)\s+(?!not\b)[\p{L}]|i['’]ll\s+[\p{L}]|ako\s+(?:(?:na|ang|mo|mismo|bahala)\s+)*(?:ang\s+)?(?:mag[\p{L}-]+|mo[\p{L}-]+|mu[\p{L}-]+|gag[\p{L}-]+|aako|bahala)|(?:mangita|mag[\p{L}-]+|mo[\p{L}-]+|mu[\p{L}-]+|gag[\p{L}-]+|aayusin|aasikasuhin)\s+(?:na\s+)?(?:ko|ako)\b)/iu.test(text);
}

function explicitAssignment(speech: string, name: string): boolean {
  const n = escape(name);
  // A name mention ("talked to Jun", "si Jun attended") is insufficient.
  if (/\b(?:not|never|won['’]t|dili|hindi|ayaw)\b/iu.test(speech)) return false;
  return new RegExp(
    `(?<![\\p{L}\\p{N}])(?:${n}\\s+(?:will|shall)\\s+|assigned\\s+to\\s+${n}(?![\\p{L}\\p{N}])|(?:si\\s+${n}\\s+(?:(?:na|daw|kuno)\\s+)*(?:ang|sa|mag[\\p{L}-]*|mo[\\p{L}-]*|mu[\\p{L}-]*|bahala|na\\s+lang))|bahala\\s+si\\s+${n}(?![\\p{L}\\p{N}])|(?:pwede|puwede)\\s+si\\s+${n}(?![\\p{L}\\p{N}]))`,
    "iu",
  ).test(speech);
}

interface CitedSpeech { speaker: string | null; speech: string }
function citedSpeeches(rawText: string, entries: Evidence[]): CitedSpeech[] {
  const turns = extractAllSpeakerTurns(rawText);
  const segments: CitedSpeech[] = [];
  for (const ev of entries) {
    if (!ev.isVerified || ev.startOffset === null || ev.endOffset === null ||
      rawText.slice(ev.startOffset, ev.endOffset) !== ev.quote) continue;
    // The evidence matcher anchors the first textual match. A repeated
    // speakerless quote cannot establish WHICH speaker said this task.
    if (verifyEvidenceQuote(rawText.slice(ev.endOffset), ev.quote).isVerified) continue;
    for (let i = 0; i < turns.length; i++) {
      const turn = turns[i];
      const end = turns[i + 1]?.startOffset ?? rawText.length;
      if (turn.startOffset >= ev.endOffset || end <= ev.startOffset) continue;
      const start = Math.max(turn.headerEndOffset, ev.startOffset);
      if (start >= Math.min(end, ev.endOffset)) continue;
      // Respect the exact citation, but reject a citation trimmed past a
      // refusal in the same clause ("I will NOT ...").
      const prefix = rawText.slice(turn.headerEndOffset, start).split(/[.!?\r\n]/).pop() || "";
      const speech = rawText.slice(start, Math.min(end, ev.endOffset));
      segments.push({
        speaker: identifiedSpeaker(turn.speaker, rawText),
        speech: /\b(?:not|never|dili|hindi|won['’]t)\b/iu.test(prefix) ? "" : speech,
      });
    }
  }
  return segments;
}

export function resolveOwners(rawText: string, candidates: string[], evidence: Evidence[]) {
  const verified = evidence.filter(ev => ev.isVerified && ev.startOffset !== null && ev.endOffset !== null);
  const segments = citedSpeeches(rawText, evidence);
  const committingSpeakers = [...new Set(segments
    .filter(s => s.speaker && hasSingularCommitment(s.speech))
    .map(s => s.speaker!.toLocaleLowerCase()))];
  const supported = (name: string) =>
    !genericSpeaker.test(name) && (
      (committingSpeakers.length === 1 && committingSpeakers[0] === name.toLocaleLowerCase()) ||
      verified.some(ev => explicitAssignment(ev.quote, name))
    );
  const candidateIdentity = (name: string) =>
    genericSpeaker.test(name.trim()) ? identifiedSpeaker(name.trim(), rawText) : name.trim();
  const accepted = [...new Set(candidates.map(candidateIdentity).filter((n): n is string => Boolean(n && supported(n))))];
  const rejected = candidates.filter(n => !accepted.includes(candidateIdentity(n) || "")).map(name => ({
    name, reason: verified.length ? "no_unambiguous_assignment_in_citation" : "unverified_evidence",
  }));
  // Recover an omitted owner only for a single cited speaker with a singular
  // commitment. Never replace a contradictory model owner or guess across turns.
  if (candidates.length === 0 && segments.length === 1 &&
      segments[0].speaker && hasSingularCommitment(segments[0].speech)) {
    accepted.push(segments[0].speaker);
  }
  return { accepted, rejected, detectedSpeakers: segments.map(s => s.speaker).filter((s): s is string => Boolean(s)) };
}

export function validateAssignee(rawText: string, name: string, _quote: string, evidence: Evidence[]): boolean {
  return resolveOwners(rawText, [name], evidence).accepted.length > 0;
}
