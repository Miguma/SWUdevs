"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  ChevronDown,
} from "@/components/icons";
import { formatDateDisplay } from "@/lib/utils";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const POPOVER_WIDTH = 288;
const POPOVER_HEIGHT = 364;
const GAP = 6;
const EDGE = 12;

type Position = {
  top: number;
  left: number;
  width: number;
};

type Placement = "above" | "below";

function parseDateValue(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function toDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getYearPageStart(year: number): number {
  return Math.floor(year / 10) * 10;
}

function buildMonthDays(month: Date): Date[] {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return day;
  });
}

interface DatePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
}

export function DatePicker({
  id,
  value,
  onChange,
  disabled = false,
  placeholder = "Select date",
  ariaLabel,
  className = "",
}: DatePickerProps) {
  const generatedId = useId();
  const triggerId = id ?? `date-picker-${generatedId}`;
  const popoverId = `date-picker-popover-${generatedId}`;
  const yearPickerId = `${popoverId}-years`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const yearToggleRef = useRef<HTMLButtonElement>(null);
  const placementRef = useRef<Placement | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position>({
    top: 0,
    left: 0,
    width: POPOVER_WIDTH,
  });
  const [viewMonth, setViewMonth] = useState(() =>
    startOfMonth(parseDateValue(value) ?? new Date())
  );
  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const [yearPageStart, setYearPageStart] = useState(() =>
    getYearPageStart((parseDateValue(value) ?? new Date()).getFullYear())
  );

  const today = toDateValue(new Date());
  const currentYear = Number(today.slice(0, 4));
  const viewYear = viewMonth.getFullYear();
  const years = useMemo(
    () =>
      Array.from({ length: 10 }, (_, index) => yearPageStart + index),
    [yearPageStart]
  );
  const days = useMemo(() => buildMonthDays(viewMonth), [viewMonth]);
  const monthLabel = viewMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const dialogLabel = ariaLabel ?? "Choose date";

  const closeCalendar = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    setYearPickerOpen(false);
    if (restoreFocus) {
      triggerRef.current?.focus({ preventScroll: true });
    }
  }, []);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    // Document-level zoom (desktop scaling) comes back inside getBoundingClientRect()
    // values but is multiplied into assigned px again at paint time. Divide the
    // rect-derived values by the zoom factor so the popover paints exactly where
    // the trigger appears. offsetHeight, innerWidth/innerHeight and the constants
    // below are already in unzoomed layout units.
    const htmlZoomRaw = getComputedStyle(document.documentElement).zoom;
    const htmlZoom =
      Number.parseFloat(
        typeof htmlZoomRaw === "number" ? String(htmlZoomRaw) : htmlZoomRaw || "1"
      ) || 1;

    const rect = trigger.getBoundingClientRect();
    const rl = rect.left / htmlZoom;
    const rw = rect.width / htmlZoom;
    const rt = rect.top / htmlZoom;
    const rb = rect.bottom / htmlZoom;
    const availableWidth = Math.max(160, window.innerWidth - EDGE * 2);
    const width = Math.min(
      320,
      Math.max(POPOVER_WIDTH, rw),
      availableWidth
    );
    let left = rl;
    if (left + width > window.innerWidth - EDGE) {
      left = window.innerWidth - width - EDGE;
    }
    left = Math.max(EDGE, left);

    const height = popoverRef.current?.offsetHeight ?? POPOVER_HEIGHT;
    let placement = placementRef.current;

    if (!placement) {
      const fitsBelow =
        rb + GAP + height <= window.innerHeight - EDGE;
      const fitsAbove = rt - GAP - height >= EDGE;
      placement = fitsBelow || !fitsAbove ? "below" : "above";
      placementRef.current = placement;
    }

    let top: number;

    if (placement === "above") {
      top = rt - height - GAP;
      if (top < EDGE) {
        top = rb + GAP;
        placementRef.current = "below";
      }
    } else {
      top = rb + GAP;
      if (top + height > window.innerHeight - EDGE) {
        const above = rt - height - GAP;
        if (above >= EDGE) {
          top = above;
          placementRef.current = "above";
        } else {
          top = Math.max(EDGE, window.innerHeight - height - EDGE);
        }
      }
    }

    setPosition({ top, left, width });
  }, []);

  const openCalendar = () => {
    if (disabled) return;
    const baseDate = parseDateValue(value) ?? new Date();
    setViewMonth(startOfMonth(baseDate));
    setYearPageStart(getYearPageStart(baseDate.getFullYear()));
    setYearPickerOpen(false);
    placementRef.current = null;
    updatePosition();
    setOpen(true);
  };

  useEffect(() => {
    if (disabled && open) setOpen(false);
  }, [disabled, open]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }
      closeCalendar(false);
    };

    const closeOnViewportChange = () => closeCalendar(false);
    const handleScroll = (event: Event) => {
      if (popoverRef.current?.contains(event.target as Node)) return;
      closeCalendar(false);
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("resize", closeOnViewportChange);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("resize", closeOnViewportChange);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open, closeCalendar]);

  useEffect(() => {
    if (!open) return;

    const frame = requestAnimationFrame(() => {
      popoverRef.current?.focus({ preventScroll: true });
    });

    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const frame = requestAnimationFrame(() => {
      updatePosition();
    });

    return () => cancelAnimationFrame(frame);
  }, [open, yearPickerOpen, updatePosition]);

  useEffect(() => {
    if (!open || !yearPickerOpen) return;

    const frame = requestAnimationFrame(() => {
      const root = popoverRef.current;
      if (!root) return;
      const selected = root.querySelector<HTMLButtonElement>(
        '[data-year-selected="true"]'
      );
      const first = root.querySelector<HTMLButtonElement>("[data-year]");
      (selected ?? first)?.focus({ preventScroll: true });
    });

    return () => cancelAnimationFrame(frame);
  }, [open, yearPickerOpen, yearPageStart]);

  const openYearPicker = () => {
    setYearPageStart(getYearPageStart(viewMonth.getFullYear()));
    setYearPickerOpen(true);
  };

  const closeYearPicker = (restoreFocus: boolean) => {
    setYearPickerOpen(false);
    if (restoreFocus) {
      requestAnimationFrame(() => {
        yearToggleRef.current?.focus({ preventScroll: true });
      });
    }
  };

  const chooseDate = (date: Date) => {
    onChange(toDateValue(date));
    closeCalendar(true);
  };

  const chooseYear = (year: number) => {
    setViewMonth(new Date(year, viewMonth.getMonth(), 1));
    setYearPickerOpen(false);
    requestAnimationFrame(() => {
      const root = popoverRef.current;
      const selected = root?.querySelector<HTMLButtonElement>(
        '[data-selected="true"]'
      );
      const first = root?.querySelector<HTMLButtonElement>(
        '[data-current-month="true"]'
      );
      (selected ?? first)?.focus({ preventScroll: true });
    });
  };

  const handleYearKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>
  ) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeYearPicker(true);
      return;
    }

    const moves: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -5,
      ArrowDown: 5,
    };
    const move = moves[event.key];
    if (!move) return;

    const buttons = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>("[data-year]")
    );
    const index = buttons.indexOf(
      document.activeElement as HTMLButtonElement
    );
    if (index === -1) return;

    const next = buttons[
      Math.min(buttons.length - 1, Math.max(0, index + move))
    ];
    if (next) {
      event.preventDefault();
      event.stopPropagation();
      next.focus({ preventScroll: true });
    }
  };

  const handleCalendarKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>
  ) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      if (yearPickerOpen) {
        closeYearPicker(true);
        return;
      }
      closeCalendar(true);
      return;
    }

    if (yearPickerOpen) return;

    if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault();
      setViewMonth(
        (current) =>
          new Date(
            current.getFullYear(),
            current.getMonth() + (event.key === "PageUp" ? -1 : 1),
            1
          )
      );
      requestAnimationFrame(() => {
        popoverRef.current
          ?.querySelector<HTMLButtonElement>('[data-current-month="true"]')
          ?.focus({ preventScroll: true });
      });
      return;
    }

    const moves: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    const move = moves[event.key];
    if (!move) return;

    const buttons = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>("[data-day]")
    );
    const index = buttons.indexOf(
      document.activeElement as HTMLButtonElement
    );
    if (index === -1) {
      event.preventDefault();
      const root = event.currentTarget;
      const selected = root.querySelector<HTMLButtonElement>(
        '[data-selected="true"]'
      );
      const todayButton = root.querySelector<HTMLButtonElement>(
        '[data-today="true"]'
      );
      const firstOfMonth = root.querySelector<HTMLButtonElement>(
        '[data-current-month="true"]'
      );
      (selected ?? todayButton ?? firstOfMonth ?? buttons[0])?.focus({
        preventScroll: true,
      });
      return;
    }

    const next = buttons[
      Math.min(buttons.length - 1, Math.max(0, index + move))
    ];
    if (next) {
      event.preventDefault();
      next.focus({ preventScroll: true });
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        disabled={disabled}
        onClick={() => (open ? closeCalendar(true) : openCalendar())}
        onKeyDown={(event) => {
          if (
            !open &&
            (event.key === "ArrowDown" || event.key === "ArrowUp")
          ) {
            event.preventDefault();
            openCalendar();
          } else if (open && event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            closeCalendar(true);
          }
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        aria-label={ariaLabel}
        className={`ui-input flex cursor-pointer items-center justify-between gap-2 text-left ${
          value ? "text-foreground" : "text-muted-foreground/70"
        } ${className}`}
      >
        <span className="min-w-0 truncate">
          {value ? formatDateDisplay(value) : placeholder}
        </span>
        <Calendar
          className="h-4 w-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={popoverRef}
            id={popoverId}
            role="dialog"
            aria-label={dialogLabel}
            tabIndex={-1}
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              width: position.width,
              zIndex: 80,
              maxHeight: "calc(100vh - 24px)",
            }}
            className="date-picker-popover panel-switch-in overflow-y-auto rounded-xl border border-border bg-card p-3 focus-visible:outline-none"
            onKeyDown={handleCalendarKeyDown}
            onBlur={(event) => {
              const next = event.relatedTarget as Node | null;
              if (!next) return;
              if (
                triggerRef.current?.contains(next) ||
                popoverRef.current?.contains(next)
              ) {
                return;
              }
              closeCalendar(false);
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <button
                ref={yearToggleRef}
                type="button"
                onClick={() =>
                  yearPickerOpen ? closeYearPicker(true) : openYearPicker()
                }
                onKeyDown={(event) => {
                  if (
                    !yearPickerOpen &&
                    (event.key === "ArrowDown" ||
                      event.key === "ArrowUp")
                  ) {
                    event.preventDefault();
                    event.stopPropagation();
                    openYearPicker();
                  }
                }}
                aria-expanded={yearPickerOpen}
                aria-controls={yearPickerOpen ? yearPickerId : undefined}
                aria-label={
                  yearPickerOpen
                    ? "Back to day calendar"
                    : `Choose year, currently ${viewYear}`
                }
                title={yearPickerOpen ? "Back to calendar" : "Choose year"}
                className="tap-44 inline-flex min-w-0 items-center gap-1 rounded text-left text-xs font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
              >
                <span aria-live="polite" className="font-brand truncate">
                  {monthLabel}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-150 ${
                    yearPickerOpen ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>
              <div className="flex items-center gap-0.5">
                {yearPickerOpen ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setYearPageStart((current) => current - 10)
                      }
                      className="tap-icon rounded p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                      aria-label="Previous decade"
                    >
                      <ArrowLeft
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setYearPageStart((current) => current + 10)
                      }
                      className="tap-icon rounded p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                      aria-label="Next decade"
                    >
                      <ArrowRight
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setViewMonth(
                          (current) =>
                            new Date(
                              current.getFullYear(),
                              current.getMonth() - 1,
                              1
                            )
                        )
                      }
                      className="tap-icon rounded p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                      aria-label="Previous month"
                    >
                      <ArrowLeft
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setViewMonth(
                          (current) =>
                            new Date(
                              current.getFullYear(),
                              current.getMonth() + 1,
                              1
                            )
                        )
                      }
                      className="tap-icon rounded p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                      aria-label="Next month"
                    >
                      <ArrowRight
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                    </button>
                  </>
                )}
              </div>
            </div>

            {yearPickerOpen && (
              <div
                id={yearPickerId}
                role="group"
                aria-label="Choose year"
                className="panel-switch-in mt-2"
              >
                <p className="pb-1 text-center text-[10px] font-medium tabular-nums text-muted-foreground">
                  {yearPageStart} to {yearPageStart + 9}
                </p>
                <div
                  className="grid grid-cols-5 gap-1"
                  onKeyDown={handleYearKeyDown}
                >
                  {years.map((year) => {
                    const isViewYear = year === viewYear;
                    const isCurrentYear = year === currentYear;

                    return (
                      <button
                        key={year}
                        type="button"
                        data-year={year}
                        data-year-selected={
                          isViewYear ? "true" : "false"
                        }
                        onClick={() => chooseYear(year)}
                        aria-pressed={isViewYear}
                        aria-label={`Year ${year}${
                          isCurrentYear ? ", current year" : ""
                        }`}
                        className={`tap-44 flex min-h-8 items-center justify-center rounded-md text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 ${
                          isViewYear
                            ? "bg-primary font-semibold text-primary-foreground hover:bg-primary-hover"
                            : isCurrentYear
                              ? "font-semibold text-primary hover:bg-muted"
                              : "text-foreground hover:bg-muted"
                        }`}
                      >
                        {year}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {!yearPickerOpen && (
              <>
                <div className="mt-2 grid grid-cols-7 gap-0.5">
                  {WEEKDAYS.map((day) => (
                    <div
                      key={day}
                      aria-hidden="true"
                      className="py-1 text-center text-[10px] font-medium text-muted-foreground"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div
                  className="calendar-grid grid grid-cols-7 gap-0.5"
                  role="group"
                  aria-label="Calendar days"
                >
                  {days.map((day) => {
                    const dayValue = toDateValue(day);
                    const isCurrentMonth =
                      day.getMonth() === viewMonth.getMonth();
                    const isSelected = dayValue === value;
                    const isToday = dayValue === today;

                    return (
                      <button
                        key={dayValue}
                        type="button"
                        data-day={dayValue}
                        data-current-month={isCurrentMonth ? "true" : "false"}
                        data-selected={isSelected ? "true" : "false"}
                        data-today={isToday ? "true" : "false"}
                        onClick={() => chooseDate(day)}
                        aria-label={day.toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                        aria-current={isSelected ? "date" : undefined}
                        className={`calendar-day relative flex aspect-square items-center justify-center rounded-md text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 ${
                          isSelected
                            ? "bg-primary font-semibold text-primary-foreground hover:bg-primary-hover"
                            : isCurrentMonth
                              ? isToday
                                ? "font-semibold text-primary hover:bg-muted"
                                : "text-foreground hover:bg-muted"
                              : "text-muted-foreground/40 hover:bg-muted hover:text-muted-foreground"
                        }`}
                      >
                        {day.getDate()}
                        {isToday && isCurrentMonth && !isSelected && (
                          <span
                            aria-hidden="true"
                            className="absolute bottom-1 h-0.5 w-2 rounded-full bg-primary"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onChange("");
                      closeCalendar(true);
                    }}
                    className="tap-44-inline text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => chooseDate(new Date())}
                    className="tap-44-inline min-h-9 rounded-full border border-primary/40 bg-primary-light/50 px-3.5 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                  >
                    Today
                  </button>
                </div>
              </>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
