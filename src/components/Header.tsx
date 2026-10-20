"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Download, History, LogIn, LogOut, Plus, Sparkles, UserRound } from "lucide-react";
import type { GroqHealthStatus } from "@/server/services/groq-client";
import { useAuth } from "@/components/AuthProvider";

interface HeaderProps {
  onOpenHistory: () => void;
  savedMeetingsCount: number;
  onResetHome: () => void;
  canExport: boolean;
}

export function Header({ onOpenHistory, savedMeetingsCount, onResetHome, canExport }: HeaderProps) {
  const { user, loading: authLoading, signOut } = useAuth();
  const [aiStatus, setAiStatus] = useState<GroqHealthStatus | null>(null);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/ai/health");
        if (!response.ok) {
          if (active) setAiStatus(null);
          return;
        }
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
      ? "Cloud AI · Qwen 3.8 via Groq"
      : aiStatus.configured
        ? "Cloud AI unavailable"
        : "Cloud AI setup needed";

  return (
    <header className="workspace-topbar sticky top-0 z-20 border-b border-border/70 bg-background/95 backdrop-blur-md">
      <div className="flex h-[70px] items-center justify-between gap-3 px-4 sm:px-7 xl:px-8">
        <button type="button" onClick={onResetHome} className="flex min-w-0 items-center gap-2 rounded-lg text-left lg:hidden" aria-label="Tambayayong, new meeting">
          <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white"><Sparkles className="h-5 w-5" strokeWidth={1.5} /></span>
          <span className="truncate text-sm font-bold tracking-tight sm:text-base">tambayayong<span className="text-primary">.</span></span>
        </button>

        <span className="hidden items-center gap-2 rounded-full border border-border bg-[#f1f6f2] px-4 py-2 text-xs font-medium text-foreground lg:inline-flex" title={aiStatus?.error || aiLabel}>
          <span className={`h-2 w-2 rounded-full ${cloudReady ? "bg-primary" : "bg-warning"}`} aria-hidden="true" />
          {aiLabel}
        </span>

        <div className="flex items-center gap-1 sm:gap-2">
          <button type="button" onClick={onOpenHistory} className="workspace-top-action">
            <History className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">History</span>
            {savedMeetingsCount > 0 && <span className="rounded-full bg-primary-light px-1.5 text-xs text-primary">{savedMeetingsCount}</span>}
          </button>
          <button type="button" disabled={!canExport} onClick={() => document.getElementById("export-results")?.scrollIntoView({ behavior: "smooth", block: "center" })} className="workspace-top-action" title={canExport ? "Jump to export results" : "Analyze or open a meeting to export"}>
            <Download className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Export</span>
          </button>
          <span className="mx-1 hidden h-7 w-px bg-border sm:block" aria-hidden="true" />
          <button type="button" onClick={onResetHome} className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-primary-light px-3 text-xs font-semibold text-primary hover:bg-primary-light/70" title="New meeting">
            <Plus className="h-4 w-4" aria-hidden="true" /><span className="hidden xl:inline">New meeting</span>
          </button>
          {user ? (
            <div className="ml-1 flex items-center gap-1 rounded-full border border-border bg-white pl-2.5 pr-1">
              <UserRound className="h-4 w-4 text-primary" aria-hidden="true" />
              <span className="hidden max-w-36 truncate text-xs font-semibold xl:inline">{user.user_metadata.full_name || user.email}</span>
              <button type="button" onClick={() => void signOut()} className="rounded-full p-2 text-muted-foreground hover:bg-primary-light hover:text-primary" aria-label="Sign out" title="Sign out">
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : !authLoading ? (
            <Link href="/sign-in" className="workspace-top-action"><LogIn className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Sign in</span></Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
