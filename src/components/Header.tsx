"use client";

import React, { useEffect, useState } from "react";
import { History, Plus } from "lucide-react";
import type { GroqHealthStatus } from "@/server/services/groq-client";

interface HeaderProps {
  onOpenHistory: () => void;
  savedMeetingsCount: number;
  onResetHome: () => void;
}

export function Header({ onOpenHistory, savedMeetingsCount, onResetHome }: HeaderProps) {
  const [aiStatus, setAiStatus] = useState<GroqHealthStatus | null>(null);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/ai/health");
        const status: GroqHealthStatus = await response.json();
        if (active) setAiStatus(status);
      } catch {
        if (active) setAiStatus(null);
      }
    };
    refresh();
    const timer = setInterval(refresh, 30000);
    return () => { active = false; clearInterval(timer); };
  }, []);

  const cloudReady = Boolean(aiStatus?.modelAvailable);
  const aiLabel = !aiStatus
    ? "Checking cloud AI"
    : cloudReady
      ? "Cloud model available"
      : aiStatus.configured
        ? "Cloud AI unavailable"
        : "Cloud AI setup needed";

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between gap-3 px-4 sm:px-8">
        <button type="button" onClick={onResetHome} className="flex min-w-0 items-center gap-3 rounded-lg text-left" aria-label="Tambayayong, new meeting">
          <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-xl font-bold text-white">T<span className="text-emerald-200">.</span></span>
          <span className="truncate text-base font-bold tracking-tight sm:text-lg">Tambayayong<span className="text-primary">.</span></span>
        </button>

        <div className="flex items-center gap-2 sm:gap-4">
          <span className="hidden items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground md:inline-flex" title={aiStatus?.error || aiLabel}>
            <span className={`h-2 w-2 rounded-full ${cloudReady ? "bg-primary" : "bg-warning"}`} aria-hidden="true" />
            {aiLabel}
          </span>
          <button type="button" onClick={onOpenHistory} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-muted-foreground hover:bg-primary-light hover:text-foreground sm:px-3">
            <History className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Saved</span>
            {savedMeetingsCount > 0 && <span className="rounded-full bg-primary-light px-1.5 text-xs text-primary">{savedMeetingsCount}</span>}
          </button>
          <button type="button" onClick={onResetHome} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-semibold text-white hover:bg-primary-hover sm:px-4">
            <Plus className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">New meeting</span><span className="sr-only sm:hidden">New meeting</span>
          </button>
        </div>
      </div>
    </header>
  );
}
