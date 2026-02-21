import { getTranslations } from "next-intl/server";
import Link from "next/link";
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
    <div className="container mx-auto max-w-3xl px-4 py-12">
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
        <p className="text-center text-muted-foreground">No yoga types available yet.</p>
      ) : (
        <div className="space-y-6">
          {yogaTypes.map((yt) => (
            <div
              key={yt.id}
              className="rounded-xl border bg-card p-6 transition-shadow hover:shadow-lg"
            >
              <h2 className="zen-heading text-xl mb-3">{name(yt)}</h2>
              <p className="text-base leading-relaxed text-muted-foreground">{desc(yt)}</p>
              <div className="mt-4">
                <Link
                  href={`/${locale}/classes?type=${yt.id}`}
                  className="inline-block text-sm text-primary/80 hover:text-primary transition-colors"
                >
                  {t("viewClasses")}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
