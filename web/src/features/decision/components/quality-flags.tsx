"use client";

import { useTranslations } from "next-intl";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Schemas } from "@/lib/api/client";

export function QualityFlags({ flags }: { flags: Schemas["QualityFlag"][] }) {
  const t = useTranslations("flags");

  if (flags.length === 0) return <span>{t("none")}</span>;

  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1">
      {flags.map((flag) => (
        <li key={flag}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="cursor-help rounded-sm text-risk-foreground underline decoration-dotted underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {t(`${flag}.label`)}
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-64">{t(`${flag}.description`)}</TooltipContent>
          </Tooltip>
        </li>
      ))}
    </ul>
  );
}
