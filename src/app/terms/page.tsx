import React from "react";
import type { Metadata } from "next";
import {
  LegalCode,
  LegalLink,
  LegalPage,
  type LegalSection,
} from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of service",
  description:
    "Terms for using Tambayayong, including human review of AI output, acceptable use, guest storage, and third-party processing.",
};

const sections: LegalSection[] = [
  {
    heading: "Acceptance and eligibility",
    paragraphs: [
      <>
        These terms govern your use of the Tambayayong reference app. By using
        the app, you agree to these terms and to the{" "}
        <LegalLink href="/privacy">privacy policy</LegalLink>. If you do not
        agree, do not use the app.
      </>,
      <>
        Tambayayong is open-source software. If you use a copy hosted by another
        person or organization, that operator may add its own terms and privacy
        practices. If you use the app on behalf of an organization, you confirm
        that you have authority to accept these terms for it.
      </>,
      <>
        You must be at least 13 years old, or the age of digital consent where
        you live, to use the app. If you are below that age, use it only with a
        parent, guardian, or teacher.
      </>,
    ],
  },
  {
    heading: "What Tambayayong is",
    paragraphs: [
      <>
        Tambayayong helps turn meeting notes into a draft action plan. It uses a
        pinned open-weight model through Groq to suggest actions, decisions, and
        open questions, and it checks suggested quotations against the notes.
        The result is a review aid, not a finished record.
      </>,
      <>
        The app is a preview. It is not a system of record, an official minutes
        service, or a substitute for legal, medical, financial, employment, or
        other professional advice. Do not use it for emergencies or
        safety-critical decisions.
      </>,
    ],
  },
  {
    heading: "AI output needs human review",
    paragraphs: [
      <>
        AI output can be wrong, incomplete, or misleading. A located quotation
        proves only that the words appear in the source you provided. It does
        not prove the task, owner, deadline, commitment, or approval that the
        app suggests. You must review, edit, and approve every item before you
        rely on it or share it.
      </>,
      <>
        Do not use the app to make decisions about people in employment,
        housing, credit, education, healthcare, insurance, or other high-impact
        areas without qualified human review. You remain responsible for the
        decisions you make and for any plan you export.
      </>,
    ],
  },
  {
    heading: "Your content and permissions",
    paragraphs: [
      <>
        You keep whatever rights you have in the meeting details, notes, and
        other content you submit. You give the operator permission to process
        that content to provide the app, including sending it to Groq for
        analysis when you choose to analyze it. The operator does not claim
        ownership of your content.
      </>,
      <>
        You represent that you have the rights and permissions needed to submit
        the content, including any consent required from meeting participants.
        Do not submit sensitive personal information, trade secrets, or
        confidential information unless you are authorized to do so and accept
        the risk of third-party processing.
      </>,
    ],
  },
  {
    heading: "Acceptable use",
    bullets: [
      <>
        Do not use the app for unlawful, infringing, harassing, deceptive, or
        harmful purposes, or to surveil people without proper authority.
      </>,
      <>
        Do not upload malware, attempt to access another person&apos;s data, or
        try to obtain the server&apos;s Groq API key or other secrets.
      </>,
      <>
        Do not bypass rate limits, overload the service, probe the API for
        vulnerabilities, or interfere with other users.
      </>,
      <>
        Do not present AI-generated output as human-approved, verified, or
        official when it has not been reviewed.
      </>,
      <>
        Do not use the app to make high-impact decisions about people without
        qualified human review and a lawful basis.
      </>,
    ],
  },
  {
    heading: "Third-party processing",
    paragraphs: [
      <>
        Analysis uses Groq&apos;s API and the pinned model{" "}
        <LegalCode>qwen/qwen3.8-27b</LegalCode>. The app does not fall back to a
        different model or provider. Groq&apos;s own terms and privacy practices
        apply to its processing. The service may be unavailable, rate-limited,
        or changed by the provider.
      </>,
      <>
        The site loads JetBrains Mono from Google Fonts, and the source and issue
        tracker are hosted on GitHub. Those services have their own terms and
        privacy practices. Links to third-party sites are provided for
        convenience and do not mean the operator endorses them.
      </>,
    ],
  },
  {
    heading: "Guest storage, accounts, and backups",
    paragraphs: [
      <>
        Accounts are optional when configured by the operator. Signed-in meetings
        sync through Supabase; signing in does not upload existing guest records.
        Drafts and guest meetings are stored in IndexedDB in your browser, with
        a small localStorage key for the active draft. Clearing browser data,
        using a private session, or deleting a saved meeting can remove them.
      </>,
      <>
        You are responsible for exporting and backing up anything you need to
        keep. The current Share screen generates PDF, Markdown, meeting-minutes,
        and CSV files in your browser. Treat exports as sensitive if they contain
        personal or confidential information.
      </>,
      <>
        The hand-authored sample meeting is a temporary preview. Loading it does
        not save it as a guest meeting or send it for AI analysis. If you edit
        its notes and choose to analyze them, the revised notes follow the
        normal analysis path.
      </>,
    ],
  },
  {
    heading: "Open-source license",
    paragraphs: [
      <>
        The Tambayayong source code is licensed under the Apache License 2.0.
        The license governs your use, modification, and distribution of the
        source code. These terms govern your use of the hosted app and do not
        replace or restrict the source-code license.
      </>,
      <>
        Third-party libraries, fonts, icons, and services have their own
        licenses and terms. See the repository at{" "}
        <LegalLink href="https://github.com/Miguma/SWUdevs" external>
          github.com/Miguma/SWUdevs
        </LegalLink>{" "}
        for the current license and notices.
      </>,
    ],
  },
  {
    heading: "Availability and changes",
    paragraphs: [
      <>
        The app is provided as a preview. The operator may change, suspend, or
        stop a hosted copy at any time, and does not promise uptime, data
        retention, or continued access to the model provider. Rate limits and
        provider outages can prevent analysis.
      </>,
      <>
        We may update these terms as the app changes. The date at the top of
        this page shows the latest revision. If a change is material, we will
        post it on this page. Continued use after a change means you accept the
        revised terms.
      </>,
    ],
  },
  {
    heading: "Disclaimers",
    paragraphs: [
      <>
        To the maximum extent permitted by law, the app is provided{" "}
        <strong className="font-semibold text-foreground">
          as is and as available
        </strong>
        , without warranties of any kind, whether express, implied, or
        statutory. This includes implied warranties of merchantability, fitness
        for a particular purpose, title, non-infringement, accuracy, and
        uninterrupted or secure operation.
      </>,
      <>
        The operator does not warrant that the app will be error-free, that AI
        output will be accurate or complete, or that browser storage will
        preserve your data. Some jurisdictions do not allow certain disclaimers,
        so parts of this section may not apply to you.
      </>,
    ],
  },
  {
    heading: "Limitation of liability",
    paragraphs: [
      <>
        To the maximum extent permitted by law, the operator is not liable for
        indirect, incidental, special, consequential, exemplary, or punitive
        damages, or for lost data, lost profits, lost opportunities, or reliance
        on AI output, even if the operator was advised that such harm was
        possible.
      </>,
      <>
        To the maximum extent permitted by law, the operator&apos;s total
        liability for claims arising out of or relating to the app is limited to
        the greater of the amount you paid the operator to use the app, which is
        zero for the free preview, or the minimum amount required by applicable
        law. Nothing in these terms limits rights that cannot be limited by law.
      </>,
    ],
  },
  {
    heading: "Indemnity",
    paragraphs: [
      <>
        To the extent permitted by law, you agree to indemnify and hold the
        operator harmless from claims, losses, and expenses, including
        reasonable legal fees, arising from your content, your misuse of the
        app, or your violation of these terms or another person&apos;s rights.
      </>,
    ],
  },
  {
    heading: "Governing law",
    paragraphs: [
      <>
        These terms are governed by the laws that apply to the operator of the
        copy you use, without regard to conflict-of-law rules. If you use a
        hosted copy, check with its operator for the governing jurisdiction.
        Nothing here limits mandatory consumer or data-protection rights you
        have where you live.
      </>,
    ],
  },
  {
    heading: "Contact",
    paragraphs: [
      <>
        For questions about these terms or the reference app, open an issue at{" "}
        <LegalLink href="https://github.com/Miguma/SWUdevs/issues" external>
          github.com/Miguma/SWUdevs/issues
        </LegalLink>
        . For a hosted copy, contact its operator. Do not post private meeting
        notes, names, or other sensitive information in a public issue.
      </>,
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of service"
      updated="23 October 2026"
      current="terms"
      intro={
        <p>
          These terms cover the Tambayayong reference app and the guest meeting
          workflow. They explain what the app does, what you can expect from AI
          output, and the rules for using the service. Read them together with
          the privacy policy.
        </p>
      }
      sections={sections}
    />
  );
}
