import type { Formats } from "next-intl";

export const locales = ["en-GB"] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "en-GB";

export const defaultTimeZone = "UTC";

export const formats = {
  dateTime: {
    hourMinute: { hour: "2-digit", minute: "2-digit", hourCycle: "h23" },
    dayMonth: { day: "numeric", month: "short" },
    weekdayDayMonth: { weekday: "short", day: "numeric", month: "short" },
    fullDate: { weekday: "long", day: "numeric", month: "long", year: "numeric" },
    dayMonthTime: { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" },
    weekday: { weekday: "narrow" },
    dayOfMonth: { day: "numeric" },
    dayMonthYear: { day: "numeric", month: "long", year: "numeric" },
  },
} satisfies Formats;
