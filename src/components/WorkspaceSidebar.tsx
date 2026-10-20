"use client";

import React, { useState } from "react";
import { Bookmark, CheckSquare2, Home, NotebookPen, Sparkles } from "lucide-react";

interface WorkspaceSidebarProps {
  onOpenHistory: () => void;
  onResetHome: () => void;
  savedMeetingsCount: number;
}

const sections = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "meeting-workspace", label: "Meeting notes", icon: NotebookPen },
  { id: "step-2-review", label: "Action review", icon: CheckSquare2 },
] as const;

export function WorkspaceSidebar({ onOpenHistory, onResetHome, savedMeetingsCount }: WorkspaceSidebarProps) {
  const [active, setActive] = useState<string>("overview");

  return (
    <aside className="workspace-sidebar hidden lg:flex" aria-label="Workspace navigation">
      <button type="button" onClick={() => { setActive("overview"); onResetHome(); }} className="workspace-brand" aria-label="Tambayayong, new meeting">
        <span className="workspace-brand-mark"><Sparkles className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" /></span>
        <span><strong>tambayayong<span className="text-primary">.</span></strong><small>Better together.</small></span>
      </button>

      <nav className="mt-11 flex-1" aria-label="Workspace sections">
        <p className="workspace-nav-label">Workspace</p>
        <div className="mt-3 space-y-1">
          {sections.map(({ id, label, icon: Icon }) => (
            <a key={id} href={`#${id}`} onClick={() => setActive(id)} aria-current={active === id ? "page" : undefined} className={`workspace-nav-item ${active === id ? "is-active" : ""}`}>
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} aria-hidden="true" />
              <span>{label}</span>
            </a>
          ))}
          <button type="button" onClick={onOpenHistory} className="workspace-nav-item w-full text-left">
            <Bookmark className="h-[18px] w-[18px]" strokeWidth={1.9} aria-hidden="true" />
            <span>Saved meetings</span>
            {savedMeetingsCount > 0 && <span className="ml-auto text-xs">{savedMeetingsCount}</span>}
          </button>
        </div>
      </nav>

      <div className="workspace-sidebar-footer">
        <span className="workspace-hill workspace-hill-back" aria-hidden="true" />
        <span className="workspace-hill workspace-hill-front" aria-hidden="true" />
        <p>Bayanihan<br />turns ideas<br />into action.</p>
      </div>
    </aside>
  );
}
