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
        <div className="mb-3 flex items-center justify-center gap-3">
          <div className="h-px w-12 bg-primary/40" />
          <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
          <div className="h-px w-12 bg-primary/40" />
        </div>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>
      {teachers.length === 0 ? (
        <p className="text-muted-foreground">No teachers available yet.</p>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {teachers.map((teacher) => (
            <Card key={teacher.id} className="flex flex-col transition-shadow hover:shadow-lg">
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
              <CardContent className="flex flex-col flex-1 space-y-3 text-sm">
                <p className="text-base leading-relaxed text-muted-foreground line-clamp-3">{bio(teacher)}</p>
                <p>
                  <span className="font-medium">{t("qualifications")}:</span>{" "}
                  {teacher.qualifications}
                </p>
                <div className="mt-auto pt-3">
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={`/${locale}/teachers/${teacher.id}`}>
                      {t("viewProfile")}
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
