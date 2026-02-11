import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTeacher } from "@/lib/api";

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
        <CardHeader>
          <CardTitle className="text-2xl">{name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>{bio}</p>
          <p className="text-sm">
            <span className="font-medium">{t("qualifications")}:</span>{" "}
            {teacher.qualifications}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
