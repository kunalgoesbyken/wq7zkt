"use client";

import { useTranslations } from "next-intl";
import { SegmentedControl } from "@/components/segmented-control";
import type { Schemas } from "@/lib/api/client";
import { bases } from "@/lib/search-params";

type BasisToggleProps = {
  value: Schemas["Basis"];
  onChange: (basis: Schemas["Basis"]) => void;
};

export function BasisToggle({ value, onChange }: BasisToggleProps) {
  const t = useTranslations();

  return (
    <SegmentedControl
      label={t("controls.basis")}
      value={value}
      onChange={onChange}
      options={bases.map((basis) => ({ value: basis, label: t(`accuracy.basis.${basis}`) }))}
    />
  );
}
