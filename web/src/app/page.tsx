import { Suspense } from "react";
import { DecisionDesk } from "@/features/decision/components/decision-desk";
import { DecisionDeskSkeleton } from "@/features/decision/components/decision-skeleton";

export default function DecisionPage() {
  return (
    <Suspense fallback={<DecisionDeskSkeleton />}>
      <DecisionDesk />
    </Suspense>
  );
}
