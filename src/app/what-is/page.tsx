import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "What is this",
  description:
    "Mutual aid made practical: bilingual meeting intelligence for student groups, communities, and open-source teams, with human review behind every item.",
};

const whatIsPoints = [
  {
    title: "Multilingual by default",
    body: "English, Cebuano, Tagalog, and natural code-switching. Plans come out in clear English with original wording preserved.",
  },
  {
    title: "Every item shows its source",
    body: "Every action, decision, and question points to the exact words in your notes it came from. Seeing the words shows where it came from; your review decides what counts.",
  },
  {
    title: "Nothing counts until you approve it",
    body: "Review, edit, assign, and confirm each item. Missing owners and ambiguous dates are flagged before they slip through.",
  },
  {
    title: "Leave with a plan you can share",
    body: "Export a branded PDF report, meeting minutes, an action list, or a CSV for your tracker.",
  },
];

export default function WhatIsPage() {
  return (
    <InfoPage
      title="What is Tambayayong?"
      intro={
        <>
          Tambayayong is mutual aid made practical: bilingual meeting
          intelligence for student groups, communities, and open-source teams.
          Your drafts stay in this browser until you choose to analyze them,
          and every suggestion the AI makes must survive your review.
        </>
      }
    >
      <div className="max-w-2xl">
        <div className="grid grid-cols-1 gap-y-7">
          {whatIsPoints.map(({ title, body }) => (
            <div key={title} className="border-t border-border pt-4">
              <h3 className="font-brand text-[14px] font-semibold tracking-[-0.01em]">
                {title}
              </h3>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                {body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-border pt-6">
          <p className="font-brand text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Next
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            See how three steps turn raw meeting notes into a plan your team has
            reviewed line by line.
          </p>
          <Link href="/how-it-works" className="ui-button-secondary mt-4 w-full sm:w-auto">
            See how it works
          </Link>
        </div>
      </div>
    </InfoPage>
  );
}
