import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getClasses, type YogaClass } from "@/lib/api";
import { formatSchedule } from "@/lib/format-schedule";

export default async function ClassesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("classes");

  let classes: YogaClass[] = [];
  try {
    classes = await getClasses();
  } catch {
    // API not available
  }

  const name = (obj: { name_en: string; name_zh: string }) =>
    locale === "zh" ? obj.name_zh : obj.name_en;
  const desc = (obj: { description_en: string; description_zh: string }) =>
    locale === "zh" ? obj.description_zh : obj.description_en;

  const difficultyMap: Record<string, string> = {
    beginner: t("beginner"),
    intermediate: t("intermediate"),
    advanced: t("advanced"),
    "all levels": t("allLevels"),
  };
  const translateDifficulty = (d: string) =>
    difficultyMap[d.toLowerCase()] || d;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="zen-heading mb-3 text-3xl">{t("title")}</h1>
        <div className="mx-auto h-px w-16 bg-primary/40" />
      </div>
      {classes.length === 0 ? (
        <p className="text-muted-foreground">No classes available yet.</p>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <Card key={cls.id} className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <CardTitle className="zen-heading">{name(cls)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">{desc(cls)}</p>
                <p>
                  <span className="font-medium">{t("schedule")}:</span>{" "}
                  {formatSchedule(cls.schedule, t)}
                </p>
                <p>
                  <span className="font-medium">{t("duration")}:</span>{" "}
                  {cls.duration_minutes} {t("minutes")}
                </p>
                <p>
                  <span className="font-medium">{t("difficulty")}:</span>{" "}
                  {translateDifficulty(cls.difficulty)}
                </p>
                <p>
                  <span className="font-medium">{t("teacher")}:</span>{" "}
                  {name(cls.teacher)}
                </p>
                <p>
                  <span className="font-medium">{t("type")}:</span>{" "}
                  {name(cls.yoga_type)}
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
                {cls.packages && cls.packages.length > 0 && (
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                    {cls.packages.length} {t("packagesAvailable")}
                  </span>
                )}
                <Button asChild variant="outline" size="sm" className="mt-2">
                  <Link href={`/${locale}/classes/${cls.id}`}>
                    {t("viewDetails")}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
