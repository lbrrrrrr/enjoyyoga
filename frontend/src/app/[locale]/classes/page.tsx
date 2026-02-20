import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getClasses, type YogaClass } from "@/lib/api";
import { formatSchedule } from "@/lib/format-schedule";
import { ClassesFilterBar } from "@/components/ClassesFilterBar";

export default async function ClassesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ teacher?: string; type?: string }>;
}) {
  const { locale } = await params;
  const { teacher: teacherFilter, type: typeFilter } = await searchParams;
  const t = await getTranslations("classes");

  let allClasses: YogaClass[] = [];
  try {
    allClasses = await getClasses();
  } catch {
    // API not available
  }

  const name = (obj: { name_en: string; name_zh: string }) =>
    locale === "zh" ? obj.name_zh : obj.name_en;
  const desc = (obj: { description_en: string; description_zh: string }) =>
    locale === "zh" ? obj.description_zh : obj.description_en;

  // Extract unique teachers and yoga types for filter dropdowns
  const teacherMap = new Map<string, string>();
  const yogaTypeMap = new Map<string, string>();
  for (const cls of allClasses) {
    if (cls.teacher) {
      teacherMap.set(cls.teacher_id, name(cls.teacher));
    }
    if (cls.yoga_type) {
      yogaTypeMap.set(cls.yoga_type_id, name(cls.yoga_type));
    }
  }
  const teachers = Array.from(teacherMap, ([id, label]) => ({ id, label }));
  const yogaTypes = Array.from(yogaTypeMap, ([id, label]) => ({ id, label }));

  // Apply filters
  let classes = allClasses;
  if (teacherFilter) {
    classes = classes.filter((cls) => cls.teacher_id === teacherFilter);
  }
  if (typeFilter) {
    classes = classes.filter((cls) => cls.yoga_type_id === typeFilter);
  }

  const hasFilters = !!(teacherFilter || typeFilter);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="zen-heading mb-3 text-3xl">{t("title")}</h1>
        <div className="mb-3 flex items-center justify-center gap-3">
          <div className="h-px w-12 bg-primary/40" />
          <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
          <div className="h-px w-12 bg-primary/40" />
        </div>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>
      {allClasses.length > 0 && (
        <ClassesFilterBar
          teachers={teachers}
          yogaTypes={yogaTypes}
          initialTeacher={teacherFilter}
          initialType={typeFilter}
        />
      )}
      {classes.length === 0 ? (
        <p className="text-center text-muted-foreground">
          {hasFilters ? t("noMatchingClasses") : "No classes available yet."}
        </p>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <Card key={cls.id} className="flex flex-col transition-shadow hover:shadow-lg">
              <CardHeader>
                <CardTitle className="zen-heading">{name(cls)}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 space-y-3 text-sm">
                <p className="text-base leading-relaxed text-muted-foreground line-clamp-2">{desc(cls)}</p>
                <p>
                  <span className="font-medium">{t("schedule")}:</span>{" "}
                  {formatSchedule(cls.schedule, t)}
                </p>
                <p>
                  <span className="font-medium">{t("teacher")}:</span>{" "}
                  {name(cls.teacher)}
                </p>
                <p>
                  <span className="font-medium">{t("price")}:</span>{" "}
                  {(() => {
                    const cny = cls.price != null && cls.price > 0;
                    const usd = cls.price_usd != null && cls.price_usd > 0;
                    if (cny && usd) return `\u00a5${cls.price} / $${cls.price_usd} ${t("perSession")}`;
                    if (cny) return `\u00a5${cls.price}/${t("perSession")}`;
                    if (usd) return `$${cls.price_usd}/${t("perSession")}`;
                    return t("free");
                  })()}
                </p>
                <div className="mt-auto pt-3 space-y-2">
                  {cls.packages && cls.packages.length > 0 && (
                    <span className="inline-block px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                      {cls.packages.length} {t("packagesAvailable")}
                    </span>
                  )}
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={`/${locale}/classes/${cls.id}`}>
                      {t("viewDetails")}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
