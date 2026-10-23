import createClient, { type ClientPathsWithMethod, type FetchOptions } from "openapi-fetch";
import useSWR from "swr";
import type { components, paths } from "./schema";

export type Schemas = components["schemas"];

const apiClient = createClient<paths>();

type GetPath = ClientPathsWithMethod<typeof apiClient, "get">;
type GetOperation<Path extends GetPath> = paths[Path]["get"];
type GetParams<Path extends GetPath> = FetchOptions<GetOperation<Path>>["params"];
type GetData<Path extends GetPath> = GetOperation<Path>["responses"][200]["content"]["application/json"];
type ApiKey<Path extends GetPath> = readonly [Path, GetParams<Path>];

export class ApiError extends Error {
  constructor(readonly status: number) {
    super(`Request failed with status ${status}`);
  }
}

async function fetchApi<Path extends GetPath>([path, params]: ApiKey<Path>): Promise<GetData<Path>> {
  const { data, response }: { data?: unknown; response: Response } = await apiClient.GET(path, { params } as never);
  if (!response.ok) throw new ApiError(response.status);
  return data as GetData<Path>;
}

export function useApi<Path extends GetPath>(path: Path, params: GetParams<Path> | null) {
  const key: ApiKey<Path> | null = params ? [path, params] : null;
  return useSWR(key, fetchApi<Path>);
}
