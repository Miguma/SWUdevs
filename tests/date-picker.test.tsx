import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DatePicker } from "../src/components/DatePicker";

describe("Date picker", () => {
  it("renders a HugeIcons calendar trigger with the formatted date", () => {
    const html = renderToStaticMarkup(
      <DatePicker
        id="meeting-date"
        value="2026-10-23"
        onChange={() => undefined}
      />
    );

    expect(html).toContain('id="meeting-date"');
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain("Oct 23, 2026");
    expect(html).toContain("<svg");
    expect(html).not.toContain('role="dialog"');
    expect(html).not.toContain('type="date"');
  });

  it("shows the placeholder and respects the disabled state", () => {
    const html = renderToStaticMarkup(
      <DatePicker value="" onChange={() => undefined} disabled />
    );

    expect(html).toContain("Select date");
    expect(html).toContain("disabled");
  });
});
