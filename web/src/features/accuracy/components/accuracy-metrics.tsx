"use client";

import { useTranslations } from "next-intl";
import { Stat } from "@/components/stat";
import type { Schemas } from "@/lib/api/client";
import { biasDirection } from "@/lib/bias";
import { useFormat } from "@/lib/format/use-format";

const cell = "bg-card p-5";

export function AccuracyMetrics({ metrics }: { metrics: Schemas["Metrics"] }) {
  const t = useTranslations("accuracy.metrics");
  const format = useFormat();
  const bias = biasDirection(metrics.bias_mw);

  return (
    <section aria-label={t("title")} className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
      <dl className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3 xl:grid-cols-6">
        <Stat className={cell} label={t("mae")} value={format.mw(metrics.mae_mw)} caption={t("maeCaption")} />
        <Stat className={cell} label={t("rmse")} value={format.mw(metrics.rmse_mw)} caption={t("rmseCaption")} />
        <Stat
          className={cell}
          label={t("bias")}
          value={format.signedMw(metrics.bias_mw)}
          tone={bias === "over" ? "risk" : "default"}
          caption={t(`biasCaption.${bias}`)}
        />
        <Stat className={cell} label={t("p50")} value={format.mw(metrics.p50_abs_error_mw)} caption={t("p50Caption")} />
        <Stat className={cell} label={t("p90")} value={format.mw(metrics.p90_abs_error_mw)} caption={t("p90Caption")} />
        <Stat className={cell} label={t("nmae")} value={format.percent(metrics.nmae_pct)} caption={t("nmaeCaption")} />
      </dl>
    </section>
  );
}
