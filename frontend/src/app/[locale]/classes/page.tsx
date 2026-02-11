import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getClasses, type YogaClass } from "@/lib/api";

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

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">{t("title")}</h1>
      {classes.length === 0 ? (
        <p className="text-muted-foreground">No classes available yet.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <Card key={cls.id}>
              <CardHeader>
                <CardTitle>{name(cls)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">{desc(cls)}</p>
                <p>
                  <span className="font-medium">{t("schedule")}:</span>{" "}
                  {cls.schedule}
                </p>
                <p>
                  <span className="font-medium">{t("duration")}:</span>{" "}
                  {cls.duration_minutes} {t("minutes")}
                </p>
                <p>
                  <span className="font-medium">{t("difficulty")}:</span>{" "}
                  {cls.difficulty}
                </p>
                <p>
                  <span className="font-medium">{t("teacher")}:</span>{" "}
                  {name(cls.teacher)}
                </p>
                <p>
                  <span className="font-medium">{t("type")}:</span>{" "}
                  {name(cls.yoga_type)}
                </p>
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
