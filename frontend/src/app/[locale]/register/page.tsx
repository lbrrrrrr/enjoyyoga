import { getClasses, type YogaClass } from "@/lib/api";
import { RegistrationForm } from "@/components/forms/RegistrationForm";
import { getTranslations } from "next-intl/server";

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ classId?: string }>;
}) {
  const { locale } = await params;
  const { classId } = await searchParams;
  const t = await getTranslations("register");

  let classes: YogaClass[] = [];
  try {
    classes = await getClasses();
  } catch {
    // API not available
  }

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
      <RegistrationForm classes={classes} locale={locale} defaultClassId={classId} />
    </div>
  );
}
