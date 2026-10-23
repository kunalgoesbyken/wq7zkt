"use client";

import type { ReactNode } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type SegmentOption<Value extends string> = {
  value: Value;
  label: ReactNode;
  ariaLabel?: string;
};

type SegmentedControlProps<Value extends string> = {
  label: string;
  options: SegmentOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
};

export function SegmentedControl<Value extends string>({ label, options, value, onChange }: SegmentedControlProps<Value>) {
  const selectOption = (next: string) => {
    const option = options.find((candidate) => candidate.value === next);
    if (option) onChange(option.value);
  };

  return (
    <ToggleGroup type="single" variant="outline" spacing={0} value={value} onValueChange={selectOption} aria-label={label}>
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          aria-label={option.ariaLabel}
          className="h-9 gap-2 px-3 data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-[inset_0_-2px_0_var(--primary)]"
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
