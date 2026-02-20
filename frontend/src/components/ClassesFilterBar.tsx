"use client";

import { useRouter, usePathname } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterOption {
  id: string;
  label: string;
}

interface ClassesFilterBarProps {
  teachers: FilterOption[];
  yogaTypes: FilterOption[];
  initialTeacher?: string;
  initialType?: string;
}

export function ClassesFilterBar({
  teachers,
  yogaTypes,
  initialTeacher,
  initialType,
}: ClassesFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("classes");

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="mb-8 flex flex-wrap items-center justify-center gap-4">
      <Select
        value={initialTeacher || "all"}
        onValueChange={(v) => updateFilter("teacher", v)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={t("filterByTeacher")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allTeachers")}</SelectItem>
          {teachers.map((teacher) => (
            <SelectItem key={teacher.id} value={teacher.id}>
              {teacher.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={initialType || "all"}
        onValueChange={(v) => updateFilter("type", v)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={t("filterByType")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allTypes")}</SelectItem>
          {yogaTypes.map((yogaType) => (
            <SelectItem key={yogaType.id} value={yogaType.id}>
              {yogaType.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
