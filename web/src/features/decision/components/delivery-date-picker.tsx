"use client";

import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { calendarLocales } from "@/i18n/calendar-locales";
import type { Schemas } from "@/lib/api/client";
import { addDays, calendarTimeZone, fromIsoDate, toIsoDate } from "@/lib/dates";
import { useFormat } from "@/lib/format/use-format";

type DeliveryDatePickerProps = {
  value: string;
  deliveryWindow: Schemas["DateWindow"];
  onChange: (isoDate: string) => void;
};

export function DeliveryDatePicker({ value, deliveryWindow, onChange }: DeliveryDatePickerProps) {
  const t = useTranslations("controls");
  const locale = useLocale();
  const format = useFormat();
  const [isOpen, setIsOpen] = useState(false);
  const previous = addDays(value, -1);
  const next = addDays(value, 1);

  const selectDate = (date: Date | undefined) => {
    if (!date) return;
    onChange(toIsoDate(date));
    setIsOpen(false);
  };

  return (
    <div className="flex items-center gap-1" role="group" aria-label={t("deliveryDay")}>
      <Button
        variant="outline"
        size="icon-lg"
        disabled={previous < deliveryWindow.start}
        onClick={() => onChange(previous)}
        aria-label={t("previousDay")}
      >
        <ChevronLeftIcon />
      </Button>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="lg" className="min-w-52 justify-start gap-2 px-3 font-normal">
            <CalendarDaysIcon className="text-muted-foreground" aria-hidden />
            <span className="sr-only">{t("deliveryDay")}</span>
            <span className="figures font-medium">{format.calendarDate(value, "fullDate")}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-1">
          <Calendar
            mode="single"
            required
            timeZone={calendarTimeZone}
            locale={calendarLocales[locale]}
            selected={fromIsoDate(value)}
            defaultMonth={fromIsoDate(value)}
            startMonth={fromIsoDate(deliveryWindow.start)}
            endMonth={fromIsoDate(deliveryWindow.end)}
            disabled={[{ before: fromIsoDate(deliveryWindow.start) }, { after: fromIsoDate(deliveryWindow.end) }]}
            onSelect={selectDate}
          />
        </PopoverContent>
      </Popover>
      <Button
        variant="outline"
        size="icon-lg"
        disabled={next > deliveryWindow.end}
        onClick={() => onChange(next)}
        aria-label={t("nextDay")}
      >
        <ChevronRightIcon />
      </Button>
    </div>
  );
}
