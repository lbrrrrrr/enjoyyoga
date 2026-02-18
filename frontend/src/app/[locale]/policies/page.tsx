import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sections = [
  "health",
  "rules",
  "payment",
  "verification",
  "packages",
  "cancellation",
  "contact",
] as const;

export default async function PoliciesPage() {
  const t = await getTranslations("policies");

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
      <div className="mx-auto max-w-3xl space-y-8">
        {sections.map((key, i) => (
          <Card key={key} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <p className="text-xs font-medium tracking-widest text-muted-foreground/60">
                {String(i + 1).padStart(2, "0")}
              </p>
              <CardTitle className="zen-heading font-bold">{t(`${key}.title`)}</CardTitle>
            </CardHeader>
            <CardContent className={key === "health" ? "space-y-3" : undefined}>
              <p className="text-base leading-relaxed text-muted-foreground">{t(`${key}.body`)}</p>
              {key === "health" && (
                <div className="bg-primary/5 border-l-2 border-primary/40 pl-4 py-2 rounded-r-md">
                  <p className="text-base leading-relaxed font-medium text-muted-foreground">
                    {t("health.consent")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
