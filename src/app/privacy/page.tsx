import React from "react";
import type { Metadata } from "next";
import {
  LegalCode,
  LegalLink,
  LegalPage,
  type LegalSection,
} from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "How Tambayayong handles meeting notes, browser storage, PDF uploads, exports, and AI processing through Groq.",
};

const sections: LegalSection[] = [
  {
    heading: "What this policy covers",
    paragraphs: [
      <>
        Tambayayong is a guest-first, open-source meeting assistant. This page
        explains what happens to the meeting details and notes you enter. The
        short version: drafts and guest meetings stay in this browser. Signed-in
        meetings sync to your account through Supabase. Notes are sent to Groq
        only when you ask the app to analyze them. Signing in does not upload
        existing guest meetings.
      </>,
      <>
        This policy describes the reference app in the{" "}
        <LegalLink href="https://github.com/Miguma/SWUdevs" external>
          Tambayayong repository
        </LegalLink>
        . Because the software is open source, the person or organization
        hosting the copy you use is the operator of that copy. A hosted copy may
        have its own privacy practices and infrastructure. If you self-host
        Tambayayong, you control the server, the provider key, and the logs.
      </>,
    ],
  },
  {
    heading: "What you enter",
    paragraphs: [
      <>
        You can enter a meeting title, an optional organization, a meeting date
        and timezone, participant names, and the meeting notes or transcript.
        Notes can be pasted as text or loaded from a{" "}
        <LegalCode>.txt</LegalCode>, <LegalCode>.md</LegalCode>,{" "}
        <LegalCode>.csv</LegalCode>, or <LegalCode>.pdf</LegalCode> file.
      </>,
      <>
        Do not submit content you do not have permission to share. Meeting notes
        often contain information about other people, and you are responsible
        for having the right to send that information to the app and to its
        AI provider.
      </>,
    ],
  },
  {
    heading: "What stays in your browser",
    paragraphs: [
      <>
        Drafts and guest meetings are stored in IndexedDB in this browser under
        the database <LegalCode>tambayayong_guest_db</LegalCode>. A small
        localStorage key, <LegalCode>tambayayong_active_draft</LegalCode>,
        remembers which draft you were editing. Loading the hand-authored sample
        meeting does not save it.
      </>,
      <>
        This data stays on your device until you delete a saved meeting in Saved
        work, clear this site&apos;s data in your browser, or use a private
        browsing session that discards it. Browser storage is not encrypted by
        Tambayayong, and anyone with access to your browser profile may be able
        to read it. Guest meetings are not synced to a Tambayayong account or a
        server-side meeting database in this preview.
      </>,
    ],
  },
  {
    heading: "Signed-in meetings",
    paragraphs: [<>
      When accounts are configured, Supabase handles authentication and stores
      signed-in meeting documents, including notes, participants, suggestions,
      source quotations and your edits. Row-level policies restrict these
      documents to their account owner. Session cookies keep you signed in.
      Drafts remain browser-local; guest meetings are not automatically copied
      to your account. Saved work lets you delete individual saved meetings.
    </>],
  },
  {
    heading: "When your notes leave the browser",
    paragraphs: [
      <>
        Analysis is a deliberate action. When you choose{" "}
        <strong className="font-semibold text-foreground">
          Draft my action plan
        </strong>
        , the app sends the meeting details you entered and your notes to its
        server, which forwards them to{" "}
        <LegalLink href="https://groq.com" external>
          Groq
        </LegalLink>
        &apos;s API at <LegalCode>api.groq.com</LegalCode>. The pinned model is{" "}
        <LegalCode>qwen/qwen3.8-27b</LegalCode>. The app does not fall back to
        another model or provider.
      </>,
      <>
        The server keeps <LegalCode>GROQ_API_KEY</LegalCode> server-side and
        does not expose it to the browser. Groq processes the request under its
        own terms and privacy practices. Review{" "}
        <LegalLink href="https://groq.com/privacy-policy/" external>
          Groq&apos;s privacy policy
        </LegalLink>{" "}
        and{" "}
        <LegalLink href="https://groq.com/terms-of-service/" external>
          Groq&apos;s terms
        </LegalLink>{" "}
        before submitting sensitive content. Tambayayong cannot control Groq&apos;s
        retention or use beyond the request.
      </>,
      <>
        If analysis fails, the app keeps your draft and does not save an AI
        result that was not returned. Re-analyzing a meeting sends the revised
        meeting details and notes again.
      </>,
    ],
  },
  {
    heading: "Files, exports, and rate limiting",
    paragraphs: [
      <>
        Text-based uploads (<LegalCode>.txt</LegalCode>,{" "}
        <LegalCode>.md</LegalCode>, and <LegalCode>.csv</LegalCode>) are read and
        parsed in your browser. PDF uploads are sent to the app server at{" "}
        <LegalCode>/api/transcript/parse</LegalCode> so the text can be
        extracted. The preview processes the PDF in memory and does not save the
        uploaded file to a server-side meeting database. The extracted text
        becomes your notes and is sent to Groq only if you choose to analyze it.
      </>,
      <>
        The Share screen generates PDF, Markdown, meeting-minutes, and CSV files
        in your browser from the meeting data already stored there. The current
        interface does not upload those files to the server. The repository also
        contains a server-side export endpoint; if a hosted copy uses that
        endpoint, the copy&apos;s server receives the meeting data to generate the
        file and does not keep the generated file.
      </>,
      <>
        The analysis endpoint uses your IP address in memory to limit requests
        to 10 per minute. That rate-limit record is not a user profile. A hosted
        copy and its infrastructure provider may process standard request logs,
        such as IP address, browser user agent, timestamps, and error details,
        for security and operations. Retention depends on the operator.
      </>,
    ],
  },
  {
    heading: "Third-party services",
    bullets: [
      <><strong className="font-semibold text-foreground">Supabase</strong> handles
        account authentication and signed-in meeting storage when configured by
        the operator of this app.</>,
      <>
        <strong className="font-semibold text-foreground">Groq</strong> receives
        the meeting details and notes you submit for analysis. Groq is based in
        the United States and may process data in other countries. Its privacy
        policy and service terms apply to its processing.
      </>,
      <>
        <strong className="font-semibold text-foreground">Google Fonts</strong>{" "}
        serves the JetBrains Mono typeface used by the site. A font request may
        send your IP address and browser information to Google. See{" "}
        <LegalLink href="https://policies.google.com/privacy" external>
          Google&apos;s privacy policy
        </LegalLink>
        .
      </>,
      <>
        <strong className="font-semibold text-foreground">GitHub</strong> hosts
        the source repository and issue tracker. Visiting those pages is subject
        to GitHub&apos;s terms and privacy statement.
      </>,
    ],
    paragraphs: [
      <>
        The preview does not include advertising or third-party analytics, and
        it does not set advertising or analytics cookies. A hosting provider may
        use its own infrastructure cookies or logs; check with the operator of
        the copy you use.
      </>,
    ],
  },
  {
    heading: "Your choices",
    bullets: [
      <>
        Do not submit notes for analysis if you do not want them sent to Groq.
        Loading the hand-authored sample does not send it for AI analysis. If
        you edit its notes and choose to analyze them, the revised notes follow
        the normal analysis path.
      </>,
      <>
        Delete saved meetings in Saved work, or clear this site&apos;s data in your
        browser. Because guest data is local, Tambayayong cannot delete it
        remotely for you.
      </>,
      <>
        Use a private browsing window if you do not want drafts to persist after
        the session. Check your browser&apos;s settings for how it treats
        IndexedDB and local storage.
      </>,
      <>
        For a hosted copy, contact its operator about server logs or provider
        configuration. For the reference app, open an issue in the repository.
        Do not include private meeting content in a public issue.
      </>,
    ],
  },
  {
    heading: "Children and international users",
    paragraphs: [
      <>
        Tambayayong is not directed to children under 13. If you are below the
        age of digital consent where you live, use the app only with a parent,
        guardian, or teacher.
      </>,
      <>
        Groq is based in the United States and may process data in other
        countries. If you use a hosted copy, its operator may also process data
        in other locations. Check the relevant provider policies before
        submitting content that is subject to data-location requirements.
      </>,
    ],
  },
  {
    heading: "Changes and contact",
    paragraphs: [
      <>
        We may update this policy as the app changes. The date at the top of
        this page shows the latest revision. If a change is material, we will
        post it on this page.
      </>,
      <>
        For questions about this reference app, open an issue at{" "}
        <LegalLink href="https://github.com/Miguma/SWUdevs/issues" external>
          github.com/Miguma/SWUdevs/issues
        </LegalLink>
        . For a hosted copy, contact its operator. Do not post private meeting
        notes, names, or other sensitive information in a public issue.
      </>,
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      updated="23 October 2026"
      current="privacy"
      intro={
        <p>
          Tambayayong is built to keep guest work close to you. This page
          describes where your meeting data goes, when it leaves your browser,
          and what choices you have. It covers the reference app; a hosted copy
          may add its own practices.
        </p>
      }
      sections={sections}
    />
  );
}
