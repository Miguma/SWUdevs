import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import PrivacyPage, {
  metadata as privacyMetadata,
} from "../src/app/privacy/page";
import TermsPage, { metadata as termsMetadata } from "../src/app/terms/page";

describe("Legal pages", () => {
  it("renders the privacy policy with the actual storage and provider behavior", () => {
    const html = renderToStaticMarkup(<PrivacyPage />);

    expect(html).toContain("Privacy policy");
    expect(html).toContain("Last updated 23 October 2026");
    expect(html).toContain("tambayayong_guest_db");
    expect(html).toContain("tambayayong_active_draft");
    expect(html).toContain("IndexedDB");
    expect(html).toContain("Signed-in meetings");
    expect(html).toContain("Supabase");
    expect(html).not.toContain("There are no accounts");
    expect(html).toContain("Draft my action plan");
    expect(html).toContain("qwen/qwen3.8-27b");
    expect(html).toContain("PDF uploads");
    expect(html).toContain("10 per minute");
    expect(html).toContain('href="/terms"');
    expect(html).toContain('aria-current="page"');
    expect(privacyMetadata.title).toBe("Privacy policy");
  });

  it("renders the terms with human-review, acceptable-use, and licensing disclosures", () => {
    const html = renderToStaticMarkup(<TermsPage />);

    expect(html).toContain("Terms of service");
    expect(html).toContain("Last updated 23 October 2026");
    expect(html).toContain("AI output needs human review");
    expect(html).toContain("A located quotation");
    expect(html).toContain("Acceptable use");
    expect(html).toContain("Disclaimers");
    expect(html).toContain("Apache License 2.0");
    expect(html).toContain("Guest storage, accounts, and backups");
    expect(html).toContain('href="/privacy"');
    expect(html).toContain('aria-current="page"');
    expect(termsMetadata.title).toBe("Terms of service");
  });
});
