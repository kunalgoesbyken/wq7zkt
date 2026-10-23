"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { darkClass, themeStorageKey } from "./theme";

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle(darkClass);
  try {
    localStorage.setItem(themeStorageKey, isDark ? darkClass : "light");
  } catch {}
}

export function ThemeToggle() {
  const t = useTranslations("header");

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={t("toggleTheme")}>
      <MoonIcon className="dark:hidden" aria-hidden />
      <SunIcon className="hidden dark:block" aria-hidden />
    </Button>
  );
}
