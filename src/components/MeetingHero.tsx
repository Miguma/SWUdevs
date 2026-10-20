import {
  ArrowDown,
  ArrowRight,
  Check,
  CheckCheck,
  FileText,
  Quote,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

export function MeetingHero() {
  return (
    <section
      className="space-y-10 pb-3 pt-4 sm:pt-8"
      aria-labelledby="welcome-title"
    >
      <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div className="space-y-6">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-primary">
            <span className="h-2 w-2 rounded-full bg-primary" /> MADE FOR THE
            WAY WE WORK TOGETHER
          </p>
          <h1
            id="welcome-title"
            className="max-w-xl text-[2.65rem] font-bold leading-[1.08] tracking-[-0.045em] sm:text-6xl"
          >
            From conversation
            <br className="hidden sm:block" /> to{" "}
            <span className="text-primary">collective action.</span>
          </h1>
          <p className="max-w-lg text-base leading-7 text-muted-foreground">
            Good ideas shouldn’t get lost in meeting notes. Turn English and
            Cebuano conversations into clear next steps your team can actually
            follow.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a href="#meeting-workspace" className="ui-button-primary">
              Start a meeting <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#how-it-works" className="ui-button-secondary">
              See how it works <ArrowDown className="h-4 w-4" />
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" /> Open-weight AI
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-primary" /> English + Cebuano
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCheck className="h-4 w-4 text-primary" /> You have the final
              say
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-primary">Walay mabilin.</span>{" "}
            No idea—or teammate—left behind.
          </p>
        </div>

        <div className="relative rounded-[1.75rem] border border-border bg-[#EEF5EF] p-4 sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> A clearer way
              forward
            </span>
            <span>Illustrative preview</span>
          </div>
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-primary-light p-2.5 text-primary">
                <FileText className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  YOUR TEAM, ON THE SAME PAGE
                </p>
                <h2 className="mt-1 text-base font-bold">
                  Community event planning
                </h2>
              </div>
            </div>
            <div className="my-5 rounded-xl bg-background p-3.5 text-xs leading-6 text-muted-foreground">
              <Quote className="mb-1 h-4 w-4 text-primary" />
              <p>“Ako na bahala sa poster. I’ll send the draft tomorrow.”</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary-light/40 p-3.5">
                <span className="mt-0.5 rounded-full bg-primary p-1 text-white">
                  <Check className="h-3 w-3" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    Prepare the event poster
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Mark <span className="mx-1 text-border">/</span> Tomorrow
                  </p>
                </div>
                <span className="rounded-md bg-white px-2 py-1 text-[10px] font-semibold text-primary">
                  Reviewed
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3.5">
                <div>
                  <p className="text-sm font-semibold">
                    Confirm the food sponsors
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    A follow-up that needs an owner
                  </p>
                </div>
                <span className="h-7 w-7 shrink-0 rounded-full border border-dashed border-primary/40 text-center text-primary">
                  ?
                </span>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-[11px] text-muted-foreground">
              <span>Source notes stay within reach</span>
              <span className="flex items-center gap-1 font-semibold text-primary">
                <CheckCheck className="h-3.5 w-3.5" /> Human reviewed
              </span>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Less “who’s doing what?” More moving forward.
          </p>
        </div>
      </div>

      <div
        id="how-it-works"
        className="grid scroll-mt-28 gap-5 rounded-2xl border border-border bg-white p-5 sm:grid-cols-3 sm:p-6"
      >
        {[
          [
            "01",
            "Bring the conversation",
            "Paste notes or upload a transcript—in either language.",
          ],
          [
            "02",
            "Make it a shared plan",
            "Check the sources, adjust details, and approve the next steps.",
          ],
          [
            "03",
            "Keep things moving",
            "Export a clear action list and take it back to your team.",
          ],
        ].map(([number, title, description]) => (
          <div key={number} className="flex gap-3.5">
            <span className="pt-0.5 text-xs font-semibold text-primary">
              {number}
            </span>
            <div>
              <h3 className="text-sm font-semibold">{title}</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
