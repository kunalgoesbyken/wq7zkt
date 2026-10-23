import type messages from "../../messages/en-GB.json";
import type { AppLocale, formats } from "./config";

declare module "next-intl" {
  interface AppConfig {
    Locale: AppLocale;
    Messages: typeof messages;
    Formats: typeof formats;
  }
}
