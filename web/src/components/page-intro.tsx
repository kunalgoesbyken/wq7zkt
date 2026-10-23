import type { ReactNode } from "react";

export function PageIntro({ title, description }: { title: ReactNode; description: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-[1.75rem]">{title}</h1>
      <p className="max-w-[68ch] text-[0.9375rem] leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
