"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, History, Cpu, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { OllamaHealthStatus } from "@/server/services/ollama-client";

interface HeaderProps {
  onOpenHistory: () => void;
  savedMeetingsCount: number;
}

export function Header({ onOpenHistory, savedMeetingsCount }: HeaderProps) {
  const [aiStatus, setAiStatus] = useState<OllamaHealthStatus | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  const fetchHealth = async () => {
    try {
      setLoadingHealth(true);
      const res = await fetch("/api/ai/health");
      const data = await res.json();
      setAiStatus(data);
    } catch {
      setAiStatus({
        ollamaConnected: false,
        modelAvailable: false,
        configuredModel: "qwen3:4b-instruct",
        availableModels: [],
        inferenceHost: "http://localhost:11434",
        error: "Failed to connect to /api/ai/health",
      });
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    // Poll every 30 seconds
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-border bg-card/90 backdrop-blur-sm sticky top-0 z-30 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent-teal flex items-center justify-center text-white shadow-sm font-bold text-lg">
            T
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight text-foreground">
                Tambayayong
              </span>
              <span className="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Open Source AI
              </span>
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              From conversation to action. <span className="text-primary font-medium">Walay mabilin!</span>
            </p>
          </div>
        </div>

        {/* Right Controls: AI status & History */}
        <div className="flex items-center gap-3">
          {/* AI Status Badge */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              loadingHealth
                ? "bg-slate-100 text-slate-600 border-slate-200"
                : aiStatus?.ollamaConnected
                ? "bg-primary-light text-primary border-primary/30"
                : "bg-warning-light text-warning border-warning/30"
            }`}
            title={
              aiStatus?.ollamaConnected
                ? `Ollama Active (${aiStatus.configuredModel}) at ${aiStatus.inferenceHost}`
                : "Ollama not running. Click for local setup instructions."
            }
          >
            <Cpu className="w-3.5 h-3.5" />
            <span className="hidden md:inline">
              {loadingHealth
                ? "Checking AI..."
                : aiStatus?.ollamaConnected
                ? `Local AI: ${aiStatus.configuredModel}`
                : "Ollama Offline (Guest Mode Active)"}
            </span>
            <span className="md:hidden">
              {aiStatus?.ollamaConnected ? "Local AI Ready" : "AI Offline"}
            </span>
            {aiStatus?.ollamaConnected ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-warning" />
            )}
          </div>

          {/* Privacy badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-slate-50 text-muted-foreground border border-border">
            <ShieldCheck className="w-3.5 h-3.5 text-accent-teal" />
            <span>100% Private & Self-Hosted</span>
          </div>

          {/* Saved meetings history button */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium border border-border bg-card hover:bg-slate-50 transition-colors shadow-sm text-foreground"
          >
            <History className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline">Saved Meetings</span>
            {savedMeetingsCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-xs bg-primary text-white font-semibold">
                {savedMeetingsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
