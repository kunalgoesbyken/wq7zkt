export type BiasDirection = "over" | "under" | "neutral";

export function biasDirection(biasMw: number | null): BiasDirection {
  if (!biasMw) return "neutral";
  return biasMw > 0 ? "over" : "under";
}
