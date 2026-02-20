import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTeacher } from "@/lib/api";
import { TeacherPhoto } from "@/components/TeacherPhoto";

export default async function TeacherDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations("teachers");
  const tCommon = await getTranslations("common");

  let teacher;
  try {
    teacher = await getTeacher(id);
  } catch {
    return (
      <div className="container mx-auto px-4 py-12">
        <p>Teacher not found.</p>
      </div>
    );
  }

  const name = locale === "zh" ? teacher.name_zh : teacher.name_en;
  const bio = locale === "zh" ? teacher.bio_zh : teacher.bio_en;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href={`/${locale}/teachers`}>
          &larr; {tCommon("backToList")}
        </Link>
      </Button>
      <Card>
        <CardHeader className="text-center">
          {teacher.photo_url && (
            <div className="flex justify-center mb-4">
              <TeacherPhoto
                src={teacher.photo_url}
                alt={name}
                className="w-32 h-32 object-cover rounded-full border-4 border-primary/20"
              />
            </div>
          )}
          <CardTitle className="zen-heading text-2xl">{name}</CardTitle>
          <div className="mt-3 flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-primary/40" />
            <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
            <div className="h-px w-12 bg-primary/40" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-base leading-relaxed text-muted-foreground">{bio}</p>
          <div className="border-t pt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("qualifications")}</p>
            <p>{teacher.qualifications}</p>
          </div>
          <div className="border-t pt-5">
            <Button asChild variant="outline" size="sm">
              <Link href={`/${locale}/classes?teacher=${teacher.id}`}>
                {t("viewClasses")} &rarr;
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
