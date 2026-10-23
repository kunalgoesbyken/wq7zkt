import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { AccuracyView } from "@/features/accuracy/components/accuracy-view";
import { AccuracyViewSkeleton } from "@/features/accuracy/components/accuracy-skeleton";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("accuracy");
  return { title: t("title") };
}

export default function AccuracyPage() {
  return (
    <Suspense fallback={<AccuracyViewSkeleton />}>
      <AccuracyView />
    </Suspense>
  );
}
