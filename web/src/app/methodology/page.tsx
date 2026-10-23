import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MethodologyArticle } from "@/features/methodology/components/methodology-article";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("methodology");
  return { title: t("title") };
}

export default function MethodologyPage() {
  return <MethodologyArticle />;
}
