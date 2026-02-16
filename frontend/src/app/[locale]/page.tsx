import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("home");

  return (
    <div className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="zen-heading mb-6 text-5xl md:text-6xl lg:text-7xl tracking-tight">{t("title")}</h1>
      <div className="mb-6 flex items-center gap-3">
        <span className="block h-px w-12 bg-primary/40" />
        <span className="block h-1.5 w-1.5 rounded-full bg-primary/60" />
        <span className="block h-px w-12 bg-primary/40" />
      </div>
      <p className="mx-auto mb-10 max-w-xl text-lg text-muted-foreground">
        {t("subtitle")}
      </p>
      <div className="flex justify-center gap-4">
        <Button asChild className="rounded-full px-8">
          <Link href={`/${locale}/classes`}>{t("ctaClasses")}</Link>
        </Button>
        <Button variant="outline" asChild className="rounded-full px-8">
          <Link href={`/${locale}/register`}>{t("ctaRegister")}</Link>
        </Button>
      </div>
    </div>
  );
}
