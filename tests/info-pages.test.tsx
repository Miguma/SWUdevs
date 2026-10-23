import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import WhatIsPage, {
  metadata as whatIsMetadata,
} from "../src/app/what-is/page";
import HowItWorksPage, {
  metadata as howItWorksMetadata,
} from "../src/app/how-it-works/page";

describe("Section pages", () => {
  it("renders the what-is page with its four ideas as its own page", () => {
    const html = renderToStaticMarkup(<WhatIsPage />);

    expect(html).toContain("What is Tambayayong?");
    expect(html).not.toContain("The idea");
    expect(html).toContain("Multilingual by default");
    expect(html).toContain("Every item shows its source");
    expect(html).toContain("Nothing counts until you approve it");
    expect(html).toContain("Leave with a plan you can share");
    expect(html).toContain('class="border-t border-border pt-4"');
    // One aligned column of hairline-topped blocks, with a next step.
    expect(html).toContain('class="max-w-2xl"');
    expect(html).toContain('href="/how-it-works"');
    expect(html).toContain("See how it works");
    // The what-is cards are icon-free text blocks.
    const mainOnly = html.slice(html.indexOf("<main"), html.indexOf("<footer"));
    expect(mainOnly).not.toContain("<svg");
    expect(html).toContain("Back to tool");
    expect(whatIsMetadata.title).toBe("What is this");
  });

  it("renders the how-it-works page with its three steps as its own page", () => {
    const html = renderToStaticMarkup(<HowItWorksPage />);

    expect(html).toContain("How does the AI meeting assistant work?");
    expect(html).not.toContain("The process");
    expect(html).toContain("Input your meeting");
    expect(html).toContain("AI drafts, you decide");
    expect(html).toContain("Receive your plan");
    // The steps are wired together instead of using icons.
    const mainOnly = html.slice(html.indexOf("<main"), html.indexOf("<footer"));
    expect(mainOnly).not.toContain("<svg");
    expect(mainOnly).toContain("absolute -bottom-7 left-[3px] top-2 w-px bg-border lg:hidden");
    expect(mainOnly).toContain("absolute -right-8 top-0 hidden h-px w-8 bg-border lg:block");
    // Nodes sit centred on the wire (not at the title line).
    expect(mainOnly).toContain("rounded-full bg-primary lg:top-0 lg:-translate-y-1/2");
    // Step numerals anchor the sequence.
    expect(mainOnly).toContain(">01<");
    expect(mainOnly).toContain(">03<");
    expect(html).toContain("Back to tool");
    expect(howItWorksMetadata.title).toBe("How it works");
  });

  it("keeps the section pages flat with a single accent", () => {
    for (const html of [
      renderToStaticMarkup(<WhatIsPage />),
      renderToStaticMarkup(<HowItWorksPage />),
    ]) {
      expect(html).not.toContain("bg-primary-light");
      expect(html).not.toContain("bg-warning-light");
      expect(html).not.toContain("bg-accent-teal-light");
    }
  });

  it("keeps the section pages on the brand spine and linked back to the tool", () => {
    for (const html of [
      renderToStaticMarkup(<WhatIsPage />),
      renderToStaticMarkup(<HowItWorksPage />),
    ]) {
      // Same shell as the legal pages: brand header, back link, legal footer.
      expect(html).toContain('href="/#start"');
      expect(html).toContain('href="/privacy"');
      expect(html).toContain('href="/terms"');
      expect(html).toContain("Free and open source.");
      expect(html).not.toContain('href="#"');
      expect(html).toContain("font-brand text-3xl font-semibold tracking-[-0.02em]");
      expect(html).toContain("font-brand text-[14px] font-semibold");
    }
  });
});
