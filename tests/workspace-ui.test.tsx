import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import HomePage from "../src/app/page";

describe("Workspace first visit", () => {
  it("starts with empty notes, an explicit model field, and no preapproved sample plan", () => {
    const html = renderToStaticMarkup(<HomePage />);

    expect(html).toContain("Nothing to review yet");
    expect(html).toContain('id="local-model"');
    expect(html).toContain("Explore example");
    expect(html).not.toContain("Finish event poster");
    expect(html).not.toContain("4 of 7 reviewed");
  });
});
