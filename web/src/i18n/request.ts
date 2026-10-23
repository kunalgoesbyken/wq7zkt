import { getRequestConfig } from "next-intl/server";
import { defaultLocale, defaultTimeZone, formats } from "./config";

export default getRequestConfig(async () => ({
  locale: defaultLocale,
  timeZone: defaultTimeZone,
  formats,
  messages: (await import(`../../messages/${defaultLocale}.json`)).default,
}));
