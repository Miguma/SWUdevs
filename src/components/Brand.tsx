import Link from "next/link";
import type { MouseEventHandler } from "react";

export function Brand({
  light = false,
  onClick,
}: {
  light?: boolean;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 rounded-lg ${light ? "text-white" : "text-foreground"}`}
      aria-label="Tambayayong home"
    >
      <span
        aria-hidden="true"
        className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl font-bold ${light ? "bg-white/15 text-white" : "bg-primary text-white"}`}
      >
        T<span className="text-emerald-200">.</span>
      </span>
      <span className="text-lg font-bold tracking-tight">
        Tambayayong
        <span className={light ? "text-emerald-200" : "text-primary"}>.</span>
      </span>
    </Link>
  );
}
