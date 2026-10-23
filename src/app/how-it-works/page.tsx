import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Three steps take your meeting notes to a reviewed action plan: input your meeting, AI drafts the items, you approve what counts.",
};

const howSteps = [
  {
    title: "Input your meeting",
    body: "Name it, then paste your notes, upload a transcript file, or load the sample. Drafts autosave in this browser as you type.",
  },
  {
    title: "AI drafts, you decide",
    body: "We read your notes and suggest the actions, decisions, and open questions we find. You check each one against the original words, then approve only what the team actually agreed to.",
  },
  {
    title: "Receive your plan",
    body: "In seconds, get an organized action plan with owners and dates, ready to review, export, and share right away.",
  },
];

export default function HowItWorksPage() {
  return (
    <InfoPage
      wide
      title="How does the AI meeting assistant work?"
      intro={
        <>
          Three steps take you from raw meeting notes to a plan your team has
          reviewed line by line.
        </>
      }
    >
      {/* One hairline wire connects the steps: a vertical timeline on small
          screens, a horizontal wire threaded through the columns at lg+. */}
      <div className="grid grid-cols-1 gap-y-7 lg:grid-cols-3 lg:gap-x-8">
        {howSteps.map(({ title, body }, index) => {
          const isLast = index === howSteps.length - 1;
          return (
            <div
              key={title}
              className={`relative pl-6 lg:pl-0 lg:pt-6 ${
                isLast ? "" : "lg:border-t lg:border-border"
              }`}
            >
              {/* Vertical timeline segment down to the next node (small screens). */}
              {!isLast && (
                <span
                  aria-hidden="true"
                  className="absolute -bottom-7 left-[3px] top-2 w-px bg-border lg:hidden"
                />
              )}
              {/* Horizontal bridge across the column gap (lg+). */}
              {!isLast && (
                <span
                  aria-hidden="true"
                  className="absolute -right-8 top-0 hidden h-px w-8 bg-border lg:block"
                />
              )}
              {/* Node, centred on the wire. */}
              <span
                aria-hidden="true"
                className="absolute left-0 top-1.5 h-1.5 w-1.5 rounded-full bg-primary lg:top-0 lg:-translate-y-1/2"
              />
              <p className="font-brand text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-2 font-brand text-[14px] font-semibold tracking-[-0.01em]">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {body}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-14 flex flex-col gap-5 border-t border-border pt-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-brand text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Ready when you are
          </p>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Your notes stay in this browser until you choose to analyze them.
          </p>
        </div>
        <Link href="/#start" className="ui-button-secondary w-full shrink-0 sm:w-auto">
          Start a meeting
        </Link>
      </div>
    </InfoPage>
  );
}
