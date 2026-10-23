import { useFormatter, useTranslations, type NumberFormatOptions } from "next-intl";
import { useMemo } from "react";
import type { formats } from "@/i18n/config";
import { calendarTimeZone, fromIsoDate } from "@/lib/dates";

type DateTimeFormat = keyof typeof formats.dateTime;
type Value = number | null | undefined;

const megawattsPerGigawatt = 1000;
const minutesPerHour = 60;
const percentScale = 100;

export function useFormat() {
  const format = useFormatter();
  const t = useTranslations("units");

  return useMemo(() => {
    const withValue = (value: Value, render: (value: number) => string) =>
      value === null || value === undefined ? t("missing") : render(value);

    const decimal = (value: number, fractionDigits: number, options?: NumberFormatOptions) =>
      format.number(value, { maximumFractionDigits: fractionDigits, minimumFractionDigits: fractionDigits, ...options });

    return {
      mw: (value: Value) => withValue(value, (v) => t("mw", { value: decimal(v, 0) })),
      signedMw: (value: Value) =>
        withValue(value, (v) => t("mw", { value: decimal(v, 0, { signDisplay: "exceptZero" }) })),
      gw: (valueMw: Value, fractionDigits = 1) =>
        withValue(valueMw, (v) => t("gw", { value: decimal(v / megawattsPerGigawatt, fractionDigits) })),
      gwh: (value: Value) => withValue(value, (v) => t("gwh", { value: decimal(v, 1) })),
      percent: (valuePct: Value) =>
        withValue(valuePct, (v) => format.number(v / percentScale, { style: "percent", maximumFractionDigits: 1 })),
      ratio: (value: Value) =>
        withValue(value, (v) => format.number(v, { style: "percent", maximumFractionDigits: 0 })),
      duration: (hours: Value) =>
        withValue(hours, (v) =>
          Math.abs(v) < 1
            ? t("minutes", { value: format.number(Math.round(v * minutesPerHour)) })
            : t("hours", { value: decimal(v, 1) }),
        ),
      leadTime: (hours: Value) => withValue(hours, (v) => t("leadTime", { value: format.number(v) })),
      count: (value: Value) => withValue(value, (v) => format.number(v)),
      percentile: (quantile: number) => format.number(quantile * percentScale, { maximumFractionDigits: 0 }),
      list: (items: string[]) => format.list(items, { type: "conjunction" }),
      clockHour: (hour: number) => t("clockHour", { hour: format.number(hour, { minimumIntegerDigits: 2 }) }),
      dateTime: (iso: string | null | undefined, timeZone: string, preset: DateTimeFormat) =>
        iso ? format.dateTime(new Date(iso), preset, { timeZone }) : t("missing"),
      calendarDate: (isoDate: string, preset: DateTimeFormat) =>
        format.dateTime(fromIsoDate(isoDate), preset, { timeZone: calendarTimeZone }),
      calendarRange: (start: string, end: string, preset: DateTimeFormat) =>
        format.dateTimeRange(fromIsoDate(start), fromIsoDate(end), preset, { timeZone: calendarTimeZone }),
    };
  }, [format, t]);
}
