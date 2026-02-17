"use client";

import { useTranslations } from "next-intl";
import { formatSchedule } from "@/lib/format-schedule";

interface ScheduleDisplayProps {
  schedule: string;
  className?: string;
}

export function ScheduleDisplay({ schedule, className = "" }: ScheduleDisplayProps) {
  const t = useTranslations("register");

  if (!schedule) {
    return (
      <div className={`text-sm text-muted-foreground ${className}`}>
        {t("scheduleNotAvailable")}
      </div>
    );
  }

  return (
    <div className={`rounded-lg bg-muted/50 p-3 ${className}`}>
      <div className="flex items-center gap-2">
        <svg
          className="h-4 w-4 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span className="text-sm font-medium">{t("classSchedule")}:</span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {formatSchedule(schedule, t)}
      </p>
    </div>
  );
}
