"use client";

import { useTranslations } from "next-intl";
import { SegmentedControl } from "@/components/segmented-control";
import type { Schemas } from "@/lib/api/client";

type MarketToggleProps = {
  markets: Schemas["Market"][];
  value: string;
  onChange: (marketId: string) => void;
};

export function MarketToggle({ markets, value, onChange }: MarketToggleProps) {
  const t = useTranslations("controls");

  return (
    <SegmentedControl
      label={t("market")}
      value={value}
      onChange={onChange}
      options={markets.map((market) => ({
        value: market.id,
        ariaLabel: t("marketOption", { venue: market.venue, time: market.gate_closure_local }),
        label: (
          <>
            <span className="font-medium">{market.venue}</span>
            <span className="figures text-muted-foreground">{market.gate_closure_local}</span>
          </>
        ),
      }))}
    />
  );
}
