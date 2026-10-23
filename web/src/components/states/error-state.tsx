"use client";

import { RotateCcwIcon, TriangleAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";

const serverErrorStatus = 500;

function errorKind(error: unknown) {
  if (!(error instanceof ApiError)) return "network";
  return error.status >= serverErrorStatus ? "server" : "request";
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const t = useTranslations("states.error");
  const kind = errorKind(error);

  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-dashed p-6">
      <TriangleAlertIcon className="size-5 text-destructive" aria-hidden />
      <div className="flex flex-col gap-1">
        <p className="font-medium">{t(`${kind}.title`)}</p>
        <p className="max-w-prose text-sm text-muted-foreground">{t(`${kind}.description`)}</p>
      </div>
      <Button variant="outline" onClick={onRetry}>
        <RotateCcwIcon aria-hidden />
        {t("retry")}
      </Button>
    </div>
  );
}
