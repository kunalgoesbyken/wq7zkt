"use client";

import { useTranslations } from "next-intl";
import type { CSSProperties } from "react";
import type { Schemas } from "@/lib/api/client";
import { useFormat } from "@/lib/format/use-format";
import { cn } from "@/lib/utils";

type DaySummary = Schemas["DaySummary"];

type DeliveryMonthStripProps = {
  days: DaySummary[];
  selectedDate: string;
  onSelect: (isoDate: string) => void;
};

const intensitySteps = [10, 24, 40, 58, 78];

function errorScale(days: DaySummary[]) {
  const errors = days.flatMap(({ mae_mw: mae }) => (mae === null ? [] : [mae]));
  if (errors.length === 0) return null;
  const min = Math.min(...errors);
  const max = Math.max(...errors);
  const span = max - min || 1;
  const lastStep = intensitySteps.length - 1;
  return {
    min,
    max,
    stepOf: (mae: number | null) =>
      mae === null ? null : Math.min(Math.floor(((mae - min) / span) * intensitySteps.length), lastStep),
  };
}

function cellBackground(step: number | null) {
  if (step === null) return undefined;
  return { backgroundColor: `color-mix(in oklch, var(--risk) ${intensitySteps[step]}%, var(--muted))` };
}

export function DeliveryMonthStrip({ days, selectedDate, onSelect }: DeliveryMonthStripProps) {
  const t = useTranslations("decision.month");
  const format = useFormat();
  const scale = errorScale(days);
  const hasUnmeasuredDays = days.some((day) => day.mae_mw === null);

  return (
    <div className="flex flex-col gap-4">
      <ol
        className="grid grid-cols-7 gap-1.5 sm:grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] xl:grid-cols-[repeat(var(--days),minmax(0,1fr))] xl:gap-1"
        style={{ "--days": days.length } as CSSProperties}
      >
        {days.map((day) => {
          const step = scale?.stepOf(day.mae_mw) ?? null;
          const isSelected = day.delivery_date === selectedDate;
          return (
            <li key={day.delivery_date}>
              <button
                type="button"
                onClick={() => onSelect(day.delivery_date)}
                aria-pressed={isSelected}
                aria-label={t("dayLabel", {
                  date: format.calendarDate(day.delivery_date, "fullDate"),
                  mae: format.mw(day.mae_mw),
                })}
                style={cellBackground(step)}
                className={cn(
                  "flex h-14 w-full flex-col items-center justify-center gap-0.5 rounded-md border border-transparent text-foreground transition-shadow outline-none hover:ring-1 hover:ring-foreground/30 focus-visible:ring-3 focus-visible:ring-ring/50",
                  step === null && "border-dashed border-border text-muted-foreground",
                  step === intensitySteps.length - 1 && "dark:text-background",
                  isSelected && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
                )}
              >
                <span className="text-[0.6875rem] leading-none opacity-75">
                  {format.calendarDate(day.delivery_date, "weekday")}
                </span>
                <span className="figures text-sm leading-none font-semibold">
                  {format.calendarDate(day.delivery_date, "dayOfMonth")}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {scale && (
          <span className="flex items-center gap-3">
            <span>{t("smallerMiss")}</span>
            <span className="figures">{format.mw(scale.min)}</span>
            <span aria-hidden className="flex gap-0.5">
              {intensitySteps.map((_, step) => (
                <span key={step} className="h-2.5 w-5 rounded-[2px]" style={cellBackground(step)} />
              ))}
            </span>
            <span className="figures">{format.mw(scale.max)}</span>
            <span>{t("biggerMiss")}</span>
          </span>
        )}
        {hasUnmeasuredDays && (
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="h-2.5 w-5 rounded-[2px] border border-dashed border-border" />
            {t("noActuals")}
          </span>
        )}
      </div>
    </div>
  );
}
