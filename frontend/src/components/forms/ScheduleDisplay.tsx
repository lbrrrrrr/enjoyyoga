"use client";

import { useTranslations } from "next-intl";

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

  // Parse and display the schedule in a user-friendly format
  const formatSchedule = (scheduleStr: string) => {
    // Try to parse common formats like "Mon/Wed/Fri 7:00 AM"
    const match = scheduleStr.match(/([a-zA-Z/]+)\s+(\d{1,2}:\d{2}\s*[APap][Mm])/);

    if (match) {
      const [, days, time] = match;
      const dayNames = days.split('/').map(day => {
        const dayMap: Record<string, string> = {
          'mon': t('monday'),
          'tue': t('tuesday'),
          'wed': t('wednesday'),
          'thu': t('thursday'),
          'fri': t('friday'),
          'sat': t('saturday'),
          'sun': t('sunday'),
          'monday': t('monday'),
          'tuesday': t('tuesday'),
          'wednesday': t('wednesday'),
          'thursday': t('thursday'),
          'friday': t('friday'),
          'saturday': t('saturday'),
          'sunday': t('sunday')
        };
        return dayMap[day.toLowerCase().trim()] || day;
      });

      const formattedDays = dayNames.length > 1
        ? `${dayNames.slice(0, -1).join(', ')} ${t('and')} ${dayNames[dayNames.length - 1]}`
        : dayNames[0];

      return `${formattedDays} ${t('at')} ${time}`;
    }

    // If parsing fails, return the original schedule
    return scheduleStr;
  };

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
        {formatSchedule(schedule)}
      </p>
    </div>
  );
}