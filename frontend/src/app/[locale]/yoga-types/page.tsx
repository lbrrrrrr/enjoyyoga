import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getYogaTypes, type YogaType } from "@/lib/api";

export default async function YogaTypesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("yogaTypes");

  let yogaTypes: YogaType[] = [];
  try {
    yogaTypes = await getYogaTypes();
  } catch {
    // API not available
  }

  const name = (obj: { name_en: string; name_zh: string }) =>
    locale === "zh" ? obj.name_zh : obj.name_en;
  const desc = (obj: { description_en: string; description_zh: string }) =>
    locale === "zh" ? obj.description_zh : obj.description_en;

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
      {yogaTypes.length === 0 ? (
        <p className="text-muted-foreground">No yoga types available yet.</p>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {yogaTypes.map((yt) => (
            <Card key={yt.id} className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <CardTitle className="zen-heading">{name(yt)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base leading-relaxed text-muted-foreground">{desc(yt)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
