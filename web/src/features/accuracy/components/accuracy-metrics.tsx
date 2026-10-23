"use client";

import { useTranslations } from "next-intl";
import type { Schemas } from "@/lib/api/client";
import { biasDirection } from "@/lib/bias";
import { useFormat } from "@/lib/format/use-format";

type AccuracyMetricsProps = {
  metrics: Schemas["Metrics"];
  basis: Schemas["Basis"];
  horizon: number | null;
};

export function AccuracyMetrics({ metrics, basis, horizon }: AccuracyMetricsProps) {
  const t = useTranslations("accuracy.metrics");
  const format = useFormat();
  const bias = biasDirection(metrics.bias_mw);

  const rows = [
    { key: "mae", value: format.mw(metrics.mae_mw) },
    { key: "p50", value: format.mw(metrics.p50_abs_error_mw) },
    { key: "p90", value: format.mw(metrics.p90_abs_error_mw) },
    { key: "rmse", value: format.mw(metrics.rmse_mw) },
    { key: "nmae", value: format.percent(metrics.nmae_pct) },
    { key: "bias", value: format.signedMw(metrics.bias_mw) },
  ] as const;

  return (
    <section aria-labelledby="accuracy-summary" className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
      <div className="flex flex-col gap-3">
        <h2 id="accuracy-summary" className="sr-only">
          {t("title")}
        </h2>
        <p className="max-w-[40ch] text-[1.375rem] leading-snug tracking-tight text-pretty">
          {t.rich(`headline.${basis}`, {
            hours: horizon ?? 0,
            mae: format.mw(metrics.mae_mw),
            share: format.percent(metrics.nmae_pct),
            figure: (chunks) => <strong className="figures font-semibold whitespace-nowrap">{chunks}</strong>,
          })}
        </p>
        <p className="max-w-[48ch] text-base leading-relaxed text-pretty text-muted-foreground">
          {t(`biasSentence.${bias}`, { bias: format.mw(Math.abs(metrics.bias_mw ?? 0)) })}
        </p>
      </div>
      <table className="w-full text-sm">
        <caption className="sr-only">{t("title")}</caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">{t("measure")}</th>
            <th scope="col">{t("value")}</th>
            <th scope="col">{t("meaning")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ key, value }) => (
            <tr key={key} className="border-b align-baseline">
              <th scope="row" className="py-2.5 pr-4 text-left font-normal text-muted-foreground">
                {t(`${key}.label`)}
              </th>
              <td className="figures py-2.5 pr-6 text-right font-medium whitespace-nowrap">{value}</td>
              <td className="hidden py-2.5 leading-snug text-muted-foreground sm:table-cell">{t(`${key}.meaning`)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
