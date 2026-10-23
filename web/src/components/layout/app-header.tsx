import Link from "next/link";
import { useTranslations } from "next-intl";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { BrandMark } from "./brand-mark";
import { DataStatus } from "./data-status";
import { MainNav } from "./main-nav";

export function AppHeader() {
  const t = useTranslations("header");

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto grid w-full max-w-[90rem] grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2 px-4 py-2.5 sm:px-6 md:grid-cols-[auto_1fr_auto] lg:px-10">
        <Link href="/" className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <BrandMark className="size-6 text-primary" />
          <span className="flex items-baseline gap-2">
            <span className="text-[0.9375rem] font-semibold tracking-tight">{t("product")}</span>
            <span className="hidden text-xs text-muted-foreground lg:inline">{t("tagline")}</span>
          </span>
        </Link>
        <div className="col-span-2 row-start-2 md:col-span-1 md:col-start-2 md:row-start-1">
          <MainNav />
        </div>
        <div className="col-start-2 row-start-1 flex items-center gap-1 md:col-start-3">
          <DataStatus />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
