"use client";

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TimeSlot {
  value: string;
  label: string;
  disabled?: boolean;
}

interface TimeSlotSelectorProps {
  availableSlots: TimeSlot[];
  selectedTime?: string;
  onTimeSelect: (time: string) => void;
  disabled?: boolean;
  className?: string;
}

export function TimeSlotSelector({
  availableSlots,
  selectedTime,
  onTimeSelect,
  disabled = false,
  className = ""
}: TimeSlotSelectorProps) {
  const t = useTranslations("register");

  if (availableSlots.length === 0) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Label className="text-muted-foreground">{t("selectTime")}</Label>
        <div className="rounded-lg border p-3 text-sm text-muted-foreground text-center">
          {t("noTimesAvailable")}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="time-select">{t("selectTime")}</Label>
      <Select
        value={selectedTime}
        onValueChange={onTimeSelect}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={t("selectTimeSlot")} />
        </SelectTrigger>
        <SelectContent>
          {availableSlots.map((slot) => (
            <SelectItem
              key={slot.value}
              value={slot.value}
              disabled={slot.disabled}
            >
              {slot.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}