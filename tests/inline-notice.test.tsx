import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { InlineNotice } from "../src/components/InlineNotice";

describe("Inline notice", () => {
  it("renders the message inside the collapsible alert shell", () => {
    const html = renderToStaticMarkup(
      <InlineNotice message="Could not save this meeting." />
    );

    expect(html).toContain("notice-shell is-visible notice-enter");
    expect(html).toContain("notice-clip");
    expect(html).toContain('role="alert"');
    expect(html).toContain("Could not save this meeting.");
  });

  it("renders nothing when there is no message", () => {
    expect(renderToStaticMarkup(<InlineNotice message={null} />)).toBe("");
  });
});
