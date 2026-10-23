import { cn } from "@/lib/utils";

export type LegendItem = {
  label: string;
  swatch: "line" | "dashed" | "band" | "bar";
  colorClass: string;
};

const swatchShape: Record<LegendItem["swatch"], string> = {
  line: "h-0.5 w-4 rounded-full",
  dashed: "h-0 w-4 border-t-2 border-dashed",
  band: "h-2.5 w-4 rounded-[3px] opacity-25",
  bar: "size-2.5 rounded-[3px]",
};

export function ChartLegend({ items, className }: { items: LegendItem[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground", className)}>
      {items.map(({ label, swatch, colorClass }) => (
        <li key={label} className="flex items-center gap-1.5">
          <span aria-hidden className={cn("shrink-0", swatchShape[swatch], colorClass)} />
          {label}
        </li>
      ))}
    </ul>
  );
}
