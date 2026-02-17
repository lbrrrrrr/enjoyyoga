import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PoliciesPage() {
  const t = await getTranslations("policies");

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="zen-heading mb-3 text-3xl">{t("title")}</h1>
        <div className="mx-auto h-px w-16 bg-primary/40" />
      </div>
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="zen-heading">{t("health.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t("health.body")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="zen-heading">{t("rules.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t("rules.body")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="zen-heading">{t("payment.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t("payment.body")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="zen-heading">{t("verification.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t("verification.body")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="zen-heading">{t("packages.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t("packages.body")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="zen-heading">{t("cancellation.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t("cancellation.body")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="zen-heading">{t("contact.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t("contact.body")}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
