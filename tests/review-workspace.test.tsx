import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ReviewWorkspace } from "../src/components/ReviewWorkspace";
import { INITIAL_SAMPLE_EXTRACTION } from "../src/components/SampleMeetingData";
import type { MeetingExtraction } from "../src/types/meeting";

const noop = () => undefined;

function renderWorkspace(meeting: MeetingExtraction = INITIAL_SAMPLE_EXTRACTION) {
  return renderToStaticMarkup(
    <ReviewWorkspace meeting={meeting} onUpdateMeeting={noop} />
  );
}

describe("Action items workspace", () => {
  it("uses two text tabs and quiet filters instead of mode capsules", () => {
    const html = renderWorkspace();

    expect(html).toContain(">Review");
    expect(html).toContain(">Tracking");
    expect(html).toContain("To review");
    expect(html).toContain("Needs info");
    expect(html).not.toContain("Clarification queue");
    expect(html).not.toContain("Review List");
    expect(html).not.toContain("Action Board");
    expect(html).not.toContain("rounded-full");
  });

  it("removes duplicated progress panels from the header", () => {
    const html = renderWorkspace();

    expect(html).not.toContain("Review Completion");
    expect(html).not.toContain("Execution Progress");
    expect(html).not.toContain("Clarify");
  });

  it("keeps dismissed items out of All and reveals a Dismissed filter instead", () => {
    const meeting: MeetingExtraction = {
      ...INITIAL_SAMPLE_EXTRACTION,
      actionItems: INITIAL_SAMPLE_EXTRACTION.actionItems.map((task) =>
        task.id === "sample-act-4"
          ? { ...task, reviewStatus: "rejected" as const }
          : task
      ),
    };
    const html = renderWorkspace(meeting);

    expect(html).not.toContain("Find event sponsors");
    expect(html).toContain("Dismissed");
  });
});
