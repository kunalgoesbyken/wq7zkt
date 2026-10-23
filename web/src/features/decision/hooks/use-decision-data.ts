import { useApi } from "@/lib/api/client";

export function useDecisionDay(marketId: string | undefined, deliveryDate: string | undefined) {
  return useApi(
    "/api/v1/decisions/{delivery_date}",
    marketId && deliveryDate ? { path: { delivery_date: deliveryDate }, query: { market: marketId } } : null,
  );
}

export function useDecisionCalendar(marketId: string | undefined) {
  return useApi("/api/v1/decisions", marketId ? { query: { market: marketId } } : null);
}
