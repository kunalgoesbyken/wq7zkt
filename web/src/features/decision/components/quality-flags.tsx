"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Schemas } from "@/lib/api/client";

export function QualityFlags({ flags }: { flags: Schemas["QualityFlag"][] }) {
  const t = useTranslations("flags");

  if (flags.length === 0) {
    return <span className="text-sm text-muted-foreground">{t("none")}</span>;
  }

  return (
    <ul className="flex flex-wrap gap-1.5">
      {flags.map((flag) => (
        <li key={flag}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                tabIndex={0}
                className="cursor-help border-risk/50 bg-risk/10 text-risk-foreground"
              >
                {t(`${flag}.label`)}
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-64">{t(`${flag}.description`)}</TooltipContent>
          </Tooltip>
        </li>
      ))}
    </ul>
  );
}
