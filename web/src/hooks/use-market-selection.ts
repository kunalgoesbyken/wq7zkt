import { useQueryState } from "nuqs";
import { useMarkets } from "@/lib/api/queries";
import { searchParams } from "@/lib/search-params";

export function useMarketSelection() {
  const [marketId, setMarketId] = useQueryState("market", searchParams.market);
  const { data, error, mutate } = useMarkets();
  const markets = data?.markets ?? [];
  const market =
    markets.find(({ id }) => id === marketId) ?? markets.find(({ id }) => id === data?.default_market_id);

  return { market, markets, selectMarket: setMarketId, error, retry: mutate };
}
