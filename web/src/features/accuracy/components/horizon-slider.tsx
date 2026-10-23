"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { useFormat } from "@/lib/format/use-format";

type HorizonSliderProps = {
  value: number;
  max: number;
  onCommit: (hours: number) => void;
};

export function HorizonSlider({ value, max, onCommit }: HorizonSliderProps) {
  const t = useTranslations("controls");
  const format = useFormat();
  const [draft, setDraft] = useState<number | null>(null);
  const shown = draft ?? value;

  return (
    <div className="flex w-full max-w-md items-center gap-4">
      <span aria-hidden className="shrink-0 text-sm text-muted-foreground">
        {t("horizon")}
      </span>
      <Slider
        aria-label={t("horizon")}
        aria-valuetext={t("horizonValue", { hours: shown })}
        min={0}
        max={max}
        step={1}
        value={[shown]}
        onValueChange={([next]) => setDraft(next)}
        onValueCommit={([next]) => {
          setDraft(null);
          onCommit(next);
        }}
        className="flex-1"
      />
      <output className="figures w-24 shrink-0 text-sm font-medium" aria-live="polite">
        {format.leadTime(shown)}
      </output>
    </div>
  );
}
