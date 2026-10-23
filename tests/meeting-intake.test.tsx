import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MeetingIntake } from "../src/components/MeetingIntake";

function renderIntake() {
  return renderToStaticMarkup(
    <MeetingIntake onExtractionComplete={() => undefined} />
  );
}

describe("Meeting intake form", () => {
  it("keeps the intake copy and all three input modes", () => {
    const html = renderIntake();

    expect(html).toContain("Meeting title");
    expect(html).toContain("Meeting details");
    expect(html).toContain("Draft my action plan");
    expect(html).toContain("Choose input");
    expect(html).toContain(">Text<");
    expect(html).toContain(">File<");
    expect(html).toContain(">Sample<");
  });

  it("keeps the explicit Groq transfer confirmation beside the submit button", () => {
    const html = renderIntake();

    expect(html).toContain('type="checkbox"');
    expect(html).toContain("okay to send my notes to Groq to draft my plan");
  });

  it("uses the flat intake surfaces instead of capsules and tinted panels", () => {
    const html = renderIntake();

    expect(html).not.toContain("rounded-full");
    expect(html).not.toContain("bg-primary-light");
    expect(html).not.toContain("bg-danger-light");
    expect(html).not.toContain("shadow-lg");
  });

  it("renders the notes field and details disclosure with flat styling", () => {
    const html = renderIntake();

    expect(html).toContain(
      'class="ui-input min-h-[180px] resize-y text-[13px] leading-relaxed"'
    );
    expect(html).toContain("border-t border-border pt-4");
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-controls="meeting-details-content"');
    expect(html).toContain("motion-reduce:transition-none");

    const detailsContent =
      html.match(/<div id="meeting-details-content"[^>]*>/)?.[0] ?? "";
    expect(detailsContent).toContain('aria-hidden="true"');
    expect(detailsContent).toContain("transition-[grid-template-rows,opacity]");
    expect(detailsContent).toContain("grid-rows-[0fr]");

    const textTab = html.match(/<button[^>]*>Text<\/button>/)?.[0] ?? "";
    expect(textTab).toContain('aria-pressed="true"');
    expect(textTab).toContain("border-primary");
  });

  it("wraps the input modes in a height-animated measurement panel", () => {
    const html = renderIntake();

    const tabPanel =
      html.match(/<div class="overflow-hidden motion-reduce:transition-none[^"]*"[^>]*>/)?.[0] ?? "";
    expect(tabPanel).toContain("overflow-hidden");
    expect(tabPanel).toContain("motion-reduce:transition-none");
    // The measured height is client-only, so the server render must stay auto-sized.
    expect(tabPanel).not.toContain("style=");
    expect(html).toContain("flow-root pb-1 pt-4");
  });

  it("renders the timezone as an animated listbox instead of a native select", () => {
    const html = renderIntake();

    expect(html).not.toContain("<select");
    expect(html).toContain('aria-haspopup="listbox"');
    expect(html).toContain('aria-controls="meeting-timezone-menu"');

    const menu =
      html.match(/<div[^>]*id="meeting-timezone-menu"[^>]*>/)?.[0] ?? "";
    expect(menu).toContain('role="listbox"');
    expect(menu).toContain('aria-hidden="true"');
    expect(menu).toContain("max-h-0");
    expect(menu).toContain("transition-[max-height,opacity,transform]");

    expect(html).toContain("Philippines (GMT+8)");
    expect(html).toContain("Singapore (GMT+8)");
    expect(html).toContain("transition-transform");
  });
});
