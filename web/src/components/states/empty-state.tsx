import { WindIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({ title, description }: { title: ReactNode; description: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-xl border border-dashed p-6">
      <WindIcon className="size-5 text-muted-foreground" aria-hidden />
      <p className="font-medium">{title}</p>
      <p className="max-w-prose text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
