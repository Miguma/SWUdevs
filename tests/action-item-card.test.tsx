import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ActionItemCard } from "../src/components/review/ActionItemCard";
import { INITIAL_SAMPLE_EXTRACTION } from "../src/components/SampleMeetingData";
import type { ActionItem } from "../src/types/meeting";

const pendingTask = INITIAL_SAMPLE_EXTRACTION.actionItems.find(
  (t) => t.reviewStatus === "pending"
)!;
const approvedTask = INITIAL_SAMPLE_EXTRACTION.actionItems.find(
  (t) => t.reviewStatus === "approved"
)!;
const rejectedTask: ActionItem = { ...pendingTask, reviewStatus: "rejected" };
const noop = () => undefined;

function renderCard(task: ActionItem) {
  return renderToStaticMarkup(
    <ActionItemCard
      task={task}
      onSetStatus={noop}
      onEdit={noop}
      onDelete={noop}
      onInspectEvidence={noop}
    />
  );
}

describe("Action item decision row", () => {
  it("offers Approve and Dismiss on the card for a pending task", () => {
    const html = renderCard(pendingTask);

    expect(html).toContain(">Approve<");
    expect(html).toContain(">Dismiss<");
    expect(html).not.toContain(">Approved<");
    expect(html).not.toContain(">Dismissed<");
  });

  it("marks the Approve decision as pressed for an approved task", () => {
    const html = renderCard(approvedTask);

    expect(html).toContain(">Approved<");
    expect(html).toContain('aria-pressed="true"');
  });

  it("marks the Dismiss decision as pressed for a dismissed task", () => {
    const html = renderCard(rejectedTask);

    expect(html).toContain(">Dismissed<");
    expect(html).toContain('aria-pressed="true"');
  });
});

describe("Action item row presentation", () => {
  it("uses a flat row with no capsule badges or tinted hint surfaces", () => {
    const html = renderCard(pendingTask);

    expect(html).not.toContain("rounded-full");
    expect(html).not.toContain("bg-primary-light");
    expect(html).not.toContain("bg-warning-light");
    expect(html).not.toContain("bg-danger-light");
    expect(html).not.toContain("ring-1");
    expect(html).not.toContain("ring-2");
  });

  it("names missing details in plain text rather than an aggregate warning badge", () => {
    const html = renderCard(pendingTask);

    expect(html).toContain(">No date<");
    expect(html).toContain(">Proposed<");
  });

  it("hides review decisions and shows the execution status on tracker rows", () => {
    const html = renderToStaticMarkup(
      <ActionItemCard
        task={approvedTask}
        onSetStatus={noop}
        onSetExecutionStatus={noop}
        onEdit={noop}
        onDelete={noop}
        onInspectEvidence={noop}
        showExecutionControls
        showReviewControls={false}
      />
    );

    expect(html).not.toContain(">Approve<");
    expect(html).not.toContain(">Approved<");
    expect(html).toContain(">To do<");
    expect(html).toContain(">Completed<");
  });
});
