"use client";

import { ErrorState } from "@/components/states/error-state";
import { cn } from "@/lib/utils";
import { useAccuracyReport, type AccuracyQuery } from "../hooks/use-accuracy-data";
import { AccuracyReportView } from "./accuracy-report-view";
import { AccuracyReportSkeleton } from "./accuracy-skeleton";

export function AccuracyReportSection({ query, timeZone }: { query: AccuracyQuery; timeZone: string }) {
  const { data: report, error, mutate, isValidating } = useAccuracyReport(query);

  if (error) return <ErrorState error={error} onRetry={() => mutate()} />;
  if (!report) return <AccuracyReportSkeleton />;

  return (
    <div aria-busy={isValidating} className={cn("transition-opacity", isValidating && "opacity-60")}>
      <AccuracyReportView report={report} timeZone={timeZone} />
    </div>
  );
}
