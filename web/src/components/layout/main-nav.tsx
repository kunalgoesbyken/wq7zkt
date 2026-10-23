"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", labelKey: "decision" },
  { href: "/accuracy", labelKey: "accuracy" },
  { href: "/methodology", labelKey: "methodology" },
] as const;

export function MainNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav aria-label={t("label")} className="-mx-2.5 flex items-center gap-1">
      {navItems.map(({ href, labelKey }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative rounded-md px-2.5 py-1.5 text-sm whitespace-nowrap text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
              isActive && "text-foreground after:absolute after:inset-x-2.5 after:-bottom-2.5 after:h-0.5 after:rounded-full after:bg-primary",
            )}
          >
            {t(labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
