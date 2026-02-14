"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getAvailableDates, type AvailableDate } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface AvailableDatesSelectorProps {
  classId: string;
  selectedDate?: string;
  onDateSelect: (date: string, time: string) => void;
  className?: string;
}

export function AvailableDatesSelector({
  classId,
  selectedDate,
  onDateSelect,
  className = ""
}: AvailableDatesSelectorProps) {
  const t = useTranslations("register");
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!classId) {
      setAvailableDates([]);
      return;
    }

    const fetchDates = async () => {
      setLoading(true);
      setError(null);
      try {
        const dates = await getAvailableDates(classId, undefined, 12);
        setAvailableDates(dates);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dates");
        setAvailableDates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDates();
  }, [classId]);

  if (loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Label>{t("selectDate")}</Label>
        <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
          {t("loadingDates")}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Label>{t("selectDate")}</Label>
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  if (availableDates.length === 0) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Label>{t("selectDate")}</Label>
        <div className="rounded-lg border p-4 text-sm text-muted-foreground text-center">
          {t("noDatesAvailable")}
        </div>
      </div>
    );
  }

  const formatDateTime = (date: AvailableDate) => {
    // Extract date directly from ISO string to avoid timezone conversion
    return date.date_time.split('T')[0]; // YYYY-MM-DD format
  };

  const getTimeFromDateTime = (date: AvailableDate) => {
    // Extract time directly from ISO string to avoid timezone conversion
    const timePart = date.date_time.split('T')[1];
    return timePart ? timePart.split(/[+-]/)[0] : '00:00:00'; // HH:MM:SS format, ignore timezone offset
  };

  const handleDateClick = (date: AvailableDate) => {
    const dateStr = formatDateTime(date);
    const timeStr = getTimeFromDateTime(date);
    onDateSelect(dateStr, timeStr);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>{t("selectDate")}</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
        {availableDates.map((date, index) => {
          const dateStr = formatDateTime(date);
          const isSelected = selectedDate === dateStr;
          const isAvailable = date.available_spots > 0;

          return (
            <Button
              key={index}
              type="button"
              variant={isSelected ? "default" : "outline"}
              disabled={!isAvailable}
              onClick={() => handleDateClick(date)}
              className={`h-auto p-3 text-left justify-start ${
                !isAvailable ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <div className="flex flex-col gap-1">
                <div className="font-medium text-sm">
                  {date.formatted_date}
                </div>
                <div className="text-xs text-muted-foreground">
                  {date.formatted_time}
                </div>
                <div className="text-xs">
                  {isAvailable
                    ? `${date.available_spots} ${t("spotsAvailable")}`
                    : t("classFull")
                  }
                </div>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}