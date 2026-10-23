"use client";

import React, { useEffect, useRef, useState } from "react";
import { AlertCircle } from "@/components/icons";

const EXIT_MS = 220;

/**
 * Keeps a notice mounted long enough to collapse, then removes it. The
 * returned `rendered` message is the last non-empty value so the exit
 * transition has something to draw.
 */
export function useNoticePresence(message: string | null) {
  const [rendered, setRendered] = useState<string | null>(message);
  const [visible, setVisible] = useState(Boolean(message));
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (exitTimer.current) {
      clearTimeout(exitTimer.current);
      exitTimer.current = null;
    }

    if (message) {
      setRendered(message);
      setVisible(true);
      return;
    }

    setVisible(false);
    exitTimer.current = setTimeout(() => {
      setRendered(null);
      exitTimer.current = null;
    }, EXIT_MS);
  }, [message]);

  useEffect(() => {
    return () => {
      if (exitTimer.current) clearTimeout(exitTimer.current);
    };
  }, []);

  return { rendered, visible };
}

export function noticeShellClass(visible: boolean) {
  return `notice-shell${visible ? " is-visible notice-enter" : ""}`;
}

type NoticeTone = "danger" | "warning";

const toneClasses: Record<NoticeTone, string> = {
  danger: "border-danger text-danger",
  warning: "border-warning text-warning",
};

interface InlineNoticeProps {
  message: string | null;
  tone?: NoticeTone;
  className?: string;
}

export function InlineNotice({
  message,
  tone = "danger",
  className = "",
}: InlineNoticeProps) {
  const { rendered, visible } = useNoticePresence(message);

  if (!rendered) return null;

  return (
    <div
      className={noticeShellClass(visible)}
      aria-hidden={visible ? undefined : true}
    >
      <div className="notice-clip">
        <div className={className}>
          <div
            role={visible ? "alert" : undefined}
            className={`flex items-start gap-2 border-l-2 pl-3 text-xs ${toneClasses[tone]}`}
          >
            <AlertCircle
              className="mt-0.5 h-3.5 w-3.5 flex-shrink-0"
              aria-hidden="true"
            />
            <p className="font-medium leading-relaxed">{rendered}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
