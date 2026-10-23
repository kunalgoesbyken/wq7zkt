import { parseAsInteger, parseAsIsoDate, parseAsString, parseAsStringLiteral } from "nuqs";
import type { Schemas } from "@/lib/api/client";

export const bases = ["horizon", "gate_closure"] as const satisfies readonly Schemas["Basis"][];

export const searchParams = {
  market: parseAsString,
  date: parseAsIsoDate,
  basis: parseAsStringLiteral(bases),
  horizon: parseAsInteger,
};
