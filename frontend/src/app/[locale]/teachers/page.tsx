import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTeachers, type Teacher } from "@/lib/api";
import { TeacherPhoto } from "@/components/TeacherPhoto";

export default async function TeachersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("teachers");

  let teachers: Teacher[] = [];
  try {
    teachers = await getTeachers();
  } catch {
    // API not available
  }

  const name = (obj: { name_en: string; name_zh: string }) =>
    locale === "zh" ? obj.name_zh : obj.name_en;
  const bio = (obj: { bio_en: string; bio_zh: string }) =>
    locale === "zh" ? obj.bio_zh : obj.bio_en;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="zen-heading mb-3 text-3xl">{t("title")}</h1>
        <div className="mx-auto h-px w-16 bg-primary/40" />
      </div>
      {teachers.length === 0 ? (
        <p className="text-muted-foreground">No teachers available yet.</p>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {teachers.map((teacher) => (
            <Card key={teacher.id} className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-4">
                  {teacher.photo_url && (
                    <TeacherPhoto
                      src={teacher.photo_url}
                      alt={name(teacher)}
                      className="w-20 h-20 object-cover rounded-full border-2 border-primary/20"
                    />
                  )}
                  <CardTitle className="zen-heading">{name(teacher)}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">{bio(teacher)}</p>
                <p>
                  <span className="font-medium">{t("qualifications")}:</span>{" "}
                  {teacher.qualifications}
                </p>
                <Button asChild variant="outline" size="sm" className="mt-2">
                  <Link href={`/${locale}/teachers/${teacher.id}`}>
                    {t("viewProfile")}
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
