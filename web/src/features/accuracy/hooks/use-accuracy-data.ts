import { useQueryStates } from "nuqs";
import { useMarketSelection } from "@/hooks/use-market-selection";
import { useApi } from "@/lib/api/client";
import { searchParams } from "@/lib/search-params";

export function useAccuracySelection() {
  const [{ basis, horizon }, setParams] = useQueryStates({
    basis: searchParams.basis,
    horizon: searchParams.horizon,
  });
  const marketSelection = useMarketSelection();
  const isGateClosure = basis === "gate_closure";
  const marketId = marketSelection.market?.id;

  const query =
    isGateClosure && !marketId
      ? null
      : {
          basis: basis ?? undefined,
          horizon_h: isGateClosure ? undefined : (horizon ?? undefined),
          market: isGateClosure ? marketId : undefined,
        };

  return { basis, horizon, setParams, marketSelection, query };
}

export type AccuracyQuery = ReturnType<typeof useAccuracySelection>["query"];

export function useAccuracyReport(query: AccuracyQuery) {
  return useApi("/api/v1/accuracy", query && { query });
}

export function useHorizonCurve() {
  return useApi("/api/v1/accuracy/horizon-curve", {});
}
