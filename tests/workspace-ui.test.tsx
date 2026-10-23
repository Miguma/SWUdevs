import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import LandingPage from "../src/app/page";

describe("Single-page site", () => {
  it("renders the workspace alone with links to the section pages", () => {
    const html = renderToStaticMarkup(<LandingPage />);

    expect(html).toContain('href="/what-is"');
    expect(html).toContain('href="/how-it-works"');
    expect(html).not.toContain('id="what-is"');
    expect(html).not.toContain('id="how-it-works"');
    expect(html).toContain("Choose input");
    expect(html).toContain("Meeting title");
    expect(html).toContain("Meeting details");
    expect(html).toContain("Draft my action plan");
    expect(html).toContain(">Text<");
    expect(html).toContain(">File<");
    expect(html).toContain(">Sample<");
    expect(html).toContain('href="#start"');
    expect(html).toContain(">Tool<");
    expect(html).not.toContain("Start now");
    expect(html).toContain("Free and open source.");
    expect(html).not.toContain("Made for shared purpose.");
    expect(html).not.toContain("always reviewed by people");
    // First visit shows only the notes step: no review screens or share options.
    expect(html).not.toContain("Your action plan starts here");
    expect(html).not.toContain("Source checked");
    expect(html).not.toContain("Action tracker");
    expect(html).not.toContain("Share your plan");
    expect(html).not.toContain("My Ollama server");
    expect(html).not.toContain("Finish event poster");
    expect(html).not.toContain("4 of 7 reviewed");
    expect(html).not.toContain('href="/workspace"');
  });

  it("renders the light default theme with a text wordmark and no hardcoded surfaces", () => {
    const html = renderToStaticMarkup(<LandingPage />);

    // Wordmark is text-only: no logo tile image or icon tile beside the name.
    expect(html).toContain("tambayayong<span");
    // The theme is token-driven, so first-visit markup carries no raw
    // background, slate fill, or white-on-accent text utilities.
    expect(html).not.toContain("bg-white");
    expect(html).not.toContain("bg-slate-");
    expect(html).not.toContain("text-white");
    expect(html).not.toContain("border-slate-");
  });

  it("starts with the workspace and keeps the hero removed", () => {
    const html = renderToStaticMarkup(<LandingPage />);

    // The marketing hero and its tagline are gone; the workspace opens the page.
    expect(html).not.toContain("From conversations to");
    expect(html).not.toContain("community progress.");
    expect(html).not.toContain("Walay mabilin.");
    expect(html).toContain('id="start"');
    expect(html).toContain("Meeting notes");
  });

  it("keeps the landing flat with a single accent", () => {
    const html = renderToStaticMarkup(<LandingPage />);

    // The tinted washes stay gone; the primary tint lives only in the
    // deliberate pill CTAs (New meeting).
    expect(html).not.toContain("bg-warning-light");
    expect(html).not.toContain("bg-accent-teal-light");
  });

  it("uses the logo's mono face for display text instead of the serif", () => {
    const html = renderToStaticMarkup(<LandingPage />);

    expect(html).not.toContain("font-serif");
    expect(html).toContain("font-brand text-base font-semibold");
    expect(html).toContain("font-brand text-[12px] font-medium");
  });

  it("disables New meeting on a first visit with nothing to clear", () => {
    const html = renderToStaticMarkup(<LandingPage />);
    const newMeeting =
      html.match(/<button[^>]*aria-label="New meeting"[^>]*>/)?.[0] ?? "";

    expect(newMeeting).toContain("disabled");
    expect(html).toContain("Nothing to clear yet");
  });

  it("links the landing nav to the section pages", () => {
    const html = renderToStaticMarkup(<LandingPage />);
    const navStart = html.indexOf('aria-label="Landing"');
    const nav = html.slice(navStart, html.indexOf("</nav>", navStart));

    expect(nav).toContain(">Tool<");
    expect(nav).toContain(">What is this<");
    expect(nav).toContain(">How it works<");
    expect(nav).toContain('href="/#start"');
    expect(nav).toContain('href="/what-is"');
    expect(nav).toContain('href="/how-it-works"');
  });

  it("renders footer legal links without the removed taglines", () => {
    const html = renderToStaticMarkup(<LandingPage />);
    const footer = html.slice(html.indexOf("<footer"));

    expect(footer).toContain('aria-label="Footer"');
    expect(footer).toContain('href="#start"');
    expect(footer).toContain("What is this");
    expect(footer).toContain("How it works");
    expect(footer).toContain('href="/privacy"');
    expect(footer).toContain('href="/terms"');
    expect(footer).toContain("Privacy policy");
    expect(footer).toContain("Terms of service");
    expect(footer).toContain("Free and open source.");
    expect(footer).not.toContain('href="#"');
    expect(footer).not.toContain("Made for shared purpose.");
    expect(footer).not.toContain("always reviewed by people");
    expect(footer).not.toContain("Walay mabilin. No idea or teammate left behind.");
  });
});
