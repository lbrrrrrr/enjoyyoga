import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getClass } from "@/lib/api";
import { formatSchedule } from "@/lib/format-schedule";

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations("classes");
  const tCommon = await getTranslations("common");

  let yogaClass;
  try {
    yogaClass = await getClass(id);
  } catch {
    return (
      <div className="container mx-auto px-4 py-12">
        <p>Class not found.</p>
      </div>
    );
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
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href={`/${locale}/classes`}>&larr; {tCommon("backToList")}</Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="zen-heading text-2xl">{name(yogaClass)}</CardTitle>
          <div className="mt-3 flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-primary/40" />
            <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
            <div className="h-px w-12 bg-primary/40" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-base leading-relaxed text-muted-foreground">{desc(yogaClass)}</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <p>
              <span className="font-medium">{t("schedule")}:</span>{" "}
              {formatSchedule(yogaClass.schedule, t)}
            </p>
            <p>
              <span className="font-medium">{t("duration")}:</span>{" "}
              {yogaClass.duration_minutes} {t("minutes")}
            </p>
            <p>
              <span className="font-medium">{t("difficulty")}:</span>{" "}
              {translateDifficulty(yogaClass.difficulty)}
            </p>
            <p>
              <span className="font-medium">{t("capacity")}:</span>{" "}
              {yogaClass.capacity}
            </p>
            {yogaClass.location && (
              <p className="col-span-2">
                <span className="font-medium">{t("location")}:</span>{" "}
                {yogaClass.location}
              </p>
            )}
          </div>
          {/* Pricing section */}
          <div className="border-t pt-3">
            <p className="text-lg font-semibold">
              {t("price")}:{" "}
              {(() => {
                const cny = yogaClass.price != null && yogaClass.price > 0;
                const usd = yogaClass.price_usd != null && yogaClass.price_usd > 0;
                if (cny && usd) return `\u00a5${yogaClass.price} / $${yogaClass.price_usd} ${t("perSession")}`;
                if (cny) return `\u00a5${yogaClass.price}/${t("perSession")}`;
                if (usd) return `$${yogaClass.price_usd}/${t("perSession")}`;
                return t("free");
              })()}
            </p>
            {yogaClass.packages && yogaClass.packages.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{t("packages")}:</p>
                {yogaClass.packages.map((pkg) => {
                  const pkgName = locale === "zh" ? pkg.name_zh : pkg.name_en;
                  const hasCnyPkg = yogaClass.price != null && yogaClass.price > 0;
                  const hasUsdPkg = pkg.price_usd != null;
                  const perSessionCny = pkg.price / pkg.session_count;
                  const perSessionUsd = hasUsdPkg ? pkg.price_usd! / pkg.session_count : 0;
                  const savingsCny = hasCnyPkg && yogaClass.price
                    ? ((yogaClass.price - perSessionCny) / yogaClass.price * 100).toFixed(0)
                    : null;
                  return (
                    <div key={pkg.id} className="text-sm bg-secondary rounded p-2">
                      <span className="font-medium">{pkgName}</span>
                      {" - "}
                      <span>{pkg.session_count} {t("sessions")}:</span>
                      {hasCnyPkg && (
                        <>
                          {" "}<span>\u00a5{pkg.price}</span>
                          {" "}<span className="text-muted-foreground">(\u00a5{perSessionCny.toFixed(0)}/{t("perSession")})</span>
                        </>
                      )}
                      {hasCnyPkg && hasUsdPkg && " / "}
                      {hasUsdPkg && (
                        <>
                          <span>${pkg.price_usd}</span>
                          {" "}<span className="text-muted-foreground">(${perSessionUsd.toFixed(0)}/{t("perSession")})</span>
                        </>
                      )}
                      {savingsCny && Number(savingsCny) > 0 && (
                        <span className="ml-1 text-primary font-medium">
                          {t("save")} {savingsCny}%
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="border-t pt-3 text-sm">
            <p>
              <span className="font-medium">{t("teacher")}:</span>{" "}
              <Link
                href={`/${locale}/teachers/${yogaClass.teacher.id}`}
                className="underline"
              >
                {name(yogaClass.teacher)}
              </Link>
            </p>
            <p>
              <span className="font-medium">{t("type")}:</span>{" "}
              {name(yogaClass.yoga_type)}
            </p>
          </div>
          <Button asChild className="mt-4 rounded-full">
            <Link href={`/${locale}/register?classId=${yogaClass.id}`}>Register</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
