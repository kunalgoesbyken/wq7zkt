import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PanelProps = {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
};

export function Panel({ title, description, children }: PanelProps) {
  return (
    <Card className="gap-5 py-5 shadow-none [--card-spacing:--spacing(5)]">
      <CardHeader>
        <CardTitle>
          <h2 className="text-[0.9375rem] font-semibold tracking-tight">{title}</h2>
        </CardTitle>
        {description && <CardDescription className="max-w-prose text-[0.8125rem]">{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
