"use client";

import React from "react";
import Link from "next/link";
import type { MouseEventHandler } from "react";

/**
 * The wordmark. It always points home; when the reader is already on the
 * landing page it glides back to the top instead of re-running the route and
 * snapping the scroll position, and it leaves modified clicks (new tab, new
 * window, download) to the browser.
 */
export function Brand({
  onClick,
}: {
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}) {
  const handleClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
    onClick?.(event);
    if (event.defaultPrevented) return;

    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    // Other routes: let <Link> navigate home (client-side, starts at the top).
    if (window.location.pathname !== "/") return;

    event.preventDefault();

    // Drop a stale #hash so a later refresh does not jump past the top.
    if (window.location.hash) {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <Link
      href="/"
      onClick={handleClick}
      className="tap-44 inline-flex items-center rounded-lg px-1 py-1 text-foreground"
      aria-label="Tambayayong home"
    >
      <span className="font-brand text-[21px] font-semibold leading-none tracking-[-0.02em]">
        tambayayong<span className="text-primary">.</span>
      </span>
    </Link>
  );
}
