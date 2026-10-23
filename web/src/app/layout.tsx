import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { AppHeader } from "@/components/layout/app-header";
import { themeBootstrapScript } from "@/components/theme/theme";
import { Providers } from "./providers";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  axes: ["wdth"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    title: { default: t("title"), template: t("titleTemplate") },
    description: t("description"),
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${plexSans.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <NextIntlClientProvider>
          <Providers>
            <AppHeader />
            <main className="mx-auto w-full max-w-[76rem] flex-1 px-4 pt-8 pb-20 sm:px-6 lg:px-10">{children}</main>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
