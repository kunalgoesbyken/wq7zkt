import { useQueryState } from "nuqs";
import { useMeta } from "@/lib/api/queries";
import { fromIsoDate, isWithin, toIsoDate } from "@/lib/dates";
import { searchParams } from "@/lib/search-params";

export function useDeliveryDate() {
  const [date, setDate] = useQueryState("date", searchParams.date);
  const { data: meta } = useMeta();
  const deliveryWindow = meta?.delivery_window;
  const isSelectable = date && deliveryWindow && isWithin(date, deliveryWindow.start, deliveryWindow.end);
  const deliveryDate = isSelectable ? toIsoDate(date) : deliveryWindow?.end;

  return {
    deliveryDate,
    deliveryWindow,
    selectDate: (isoDate: string) => setDate(fromIsoDate(isoDate)),
  };
}
