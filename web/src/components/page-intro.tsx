import type { ReactNode } from "react";

export function PageIntro({ title, description }: { title: ReactNode; description: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-[1.625rem] font-semibold tracking-tight text-balance">{title}</h1>
      <p className="max-w-[64ch] text-[0.9375rem] leading-relaxed text-pretty text-muted-foreground">{description}</p>
    </div>
  );
}
