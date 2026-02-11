import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage({
  params,
}: {
  params: { locale: string };
}) {
  const t = useTranslations("home");
  const locale = params.locale;

  return (
    <div className="container mx-auto px-4 py-24 text-center">
      <h1 className="mb-4 text-5xl font-bold tracking-tight">{t("title")}</h1>
      <p className="mx-auto mb-8 max-w-xl text-lg text-muted-foreground">
        {t("subtitle")}
      </p>
      <div className="flex justify-center gap-4">
        <Button asChild>
          <Link href={`/${locale}/classes`}>{t("ctaClasses")}</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/${locale}/register`}>{t("ctaRegister")}</Link>
        </Button>
      </div>
    </div>
  );
}
