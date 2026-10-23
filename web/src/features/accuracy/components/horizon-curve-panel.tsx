"use client";

import { useTranslations } from "next-intl";
import { Section } from "@/components/section";
import { ErrorState } from "@/components/states/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useHorizonCurve } from "../hooks/use-accuracy-data";
import { HorizonCurveChart } from "./horizon-curve-chart";

export function HorizonCurvePanel({ selectedHorizon }: { selectedHorizon: number | null }) {
  const t = useTranslations("accuracy.horizonCurve");
  const { data: curve, error, mutate } = useHorizonCurve();

  if (error) return <ErrorState error={error} onRetry={() => mutate()} />;

  return (
    <Section title={t("title")} description={t("description")}>
      {curve ? (
        <HorizonCurveChart points={curve.points} selectedHorizon={selectedHorizon} />
      ) : (
        <Skeleton className="h-72 w-full" />
      )}
    </Section>
  );
}
