/**
 * Translate a canonical schedule string (e.g. "Mon/Wed/Fri 7:00 AM") into a
 * localised, human-readable form using the provided translation function.
 *
 * The translation function `t` must resolve the following keys:
 *   monday, tuesday, wednesday, thursday, friday, saturday, sunday, and, at
 *
 * If the string cannot be parsed the original value is returned unchanged.
 */
export function formatSchedule(
  schedule: string,
  t: (key: string) => string,
): string {
  const match = schedule.match(
    /([a-zA-Z/,]+)\s+(\d{1,2}:\d{2}\s*[APap][Mm]?)/,
  );
  if (!match) return schedule;

  const [, days, time] = match;

  const dayMap: Record<string, string> = {
    mon: t("monday"),
    tue: t("tuesday"),
    wed: t("wednesday"),
    thu: t("thursday"),
    fri: t("friday"),
    sat: t("saturday"),
    sun: t("sunday"),
  };

  const dayNames = days
    .split(/[/,]/)
    .map((d) => dayMap[d.toLowerCase().trim()] || d);

  const formatted =
    dayNames.length > 1
      ? `${dayNames.slice(0, -1).join(", ")} ${t("and")} ${dayNames[dayNames.length - 1]}`
      : dayNames[0];

  return `${formatted} ${t("at")} ${time}`;
}
