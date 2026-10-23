"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import type { HugeiconsIconProps } from "@hugeicons/react";
import {
  AlertCircleIcon,
  ArrowLeft02Icon,
  ArrowRight02Icon,
  Calendar03Icon,
  CalendarDaysIcon,
  Cancel01Icon,
  CheckIcon,
  CheckmarkCircle02Icon,
  ChevronDownIcon,
  Clock01Icon,
  Copy01Icon,
  Delete02Icon,
  Download04Icon,
  Edit02Icon,
  ExternalLinkIcon,
  EyeIcon,
  EyeOffIcon,
  File02Icon,
  FileDownloadIcon,
  FileUploadIcon,
  HistoryIcon,
  InfoIcon,
  KanbanIcon,
  Link02Icon,
  ListChecksIcon,
  Loading03Icon,
  LockKeyholeIcon,
  Mail02Icon,
  MessageSquareIcon,
  OneCircleIcon,
  PlusSignIcon,
  QuoteUpIcon,
  ScrollTextIcon,
  SecurityCheckIcon,
  SparklesIcon,
  Table02Icon,
  ThreeCircleIcon,
  TranslationIcon,
  TriangleAlertIcon,
  TwoCircleIcon,
  UserIcon,
  UserRoundIcon,
  UserRoundXIcon,
  UsersIcon,
} from "@hugeicons/core-free-icons";

type IconComponentProps = Omit<HugeiconsIconProps, "icon" | "altIcon" | "showAlt"> & {
  size?: string | number;
};

const DEFAULT_STROKE_WIDTH = 1.75;

function createIcon(icon: HugeiconsIconProps["icon"], displayName: string) {
  function IconComponent({ size, strokeWidth, ...rest }: IconComponentProps) {
    return (
      <HugeiconsIcon
        icon={icon}
        size={size ?? 24}
        strokeWidth={strokeWidth ?? DEFAULT_STROKE_WIDTH}
        {...rest}
      />
    );
  }
  IconComponent.displayName = displayName;
  return IconComponent;
}

/* HugeIcons equivalents of the lucide-react icons previously used in the app.
   Names are kept identical to the lucide exports so call sites change only
   their import source. */

export const AlertCircle = createIcon(AlertCircleIcon, "AlertCircle");
export const AlertTriangle = createIcon(TriangleAlertIcon, "AlertTriangle");
export const ArrowLeft = createIcon(ArrowLeft02Icon, "ArrowLeft");
export const ArrowRight = createIcon(ArrowRight02Icon, "ArrowRight");
export const Calendar = createIcon(Calendar03Icon, "Calendar");
export const CalendarDays = createIcon(CalendarDaysIcon, "CalendarDays");
export const Check = createIcon(CheckIcon, "Check");
export const CheckCircle2 = createIcon(CheckmarkCircle02Icon, "CheckCircle2");
export const ChevronDown = createIcon(ChevronDownIcon, "ChevronDown");
export const Clock = createIcon(Clock01Icon, "Clock");
export const Copy = createIcon(Copy01Icon, "Copy");
export const Download = createIcon(Download04Icon, "Download");
export const Edit2 = createIcon(Edit02Icon, "Edit2");
export const ExternalLink = createIcon(ExternalLinkIcon, "ExternalLink");
export const Eye = createIcon(EyeIcon, "Eye");
export const EyeOff = createIcon(EyeOffIcon, "EyeOff");
export const FileDown = createIcon(FileDownloadIcon, "FileDown");
export const FileText = createIcon(File02Icon, "FileText");
export const FileUp = createIcon(FileUploadIcon, "FileUp");
export const History = createIcon(HistoryIcon, "History");
export const Info = createIcon(InfoIcon, "Info");
export const Kanban = createIcon(KanbanIcon, "Kanban");
export const Languages = createIcon(TranslationIcon, "Languages");
export const Link2 = createIcon(Link02Icon, "Link2");
export const ListChecks = createIcon(ListChecksIcon, "ListChecks");
export const Loader2 = createIcon(Loading03Icon, "Loader2");
export const LockKeyhole = createIcon(LockKeyholeIcon, "LockKeyhole");
export const Mail = createIcon(Mail02Icon, "Mail");
export const MessageSquare = createIcon(MessageSquareIcon, "MessageSquare");
export const OneCircle = createIcon(OneCircleIcon, "OneCircle");
export const Plus = createIcon(PlusSignIcon, "Plus");
export const Quote = createIcon(QuoteUpIcon, "Quote");
export const ScrollText = createIcon(ScrollTextIcon, "ScrollText");
export const ShieldCheck = createIcon(SecurityCheckIcon, "ShieldCheck");
export const Sparkles = createIcon(SparklesIcon, "Sparkles");
export const Table = createIcon(Table02Icon, "Table");
export const ThreeCircle = createIcon(ThreeCircleIcon, "ThreeCircle");
export const Trash2 = createIcon(Delete02Icon, "Trash2");
export const TwoCircle = createIcon(TwoCircleIcon, "TwoCircle");
export const User = createIcon(UserIcon, "User");
export const UserRound = createIcon(UserRoundIcon, "UserRound");
export const UserRoundX = createIcon(UserRoundXIcon, "UserRoundX");
export const Users = createIcon(UsersIcon, "Users");
export const X = createIcon(Cancel01Icon, "X");
