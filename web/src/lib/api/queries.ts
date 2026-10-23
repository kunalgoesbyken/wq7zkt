import { useApi } from "./client";

export function useMeta() {
  return useApi("/api/v1/meta", {});
}

export function useMarkets() {
  return useApi("/api/v1/markets", {});
}
