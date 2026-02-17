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
      <h1 className="zen-heading mb-8 text-center text-3xl">{t("title")}</h1>
      <RegistrationForm classes={classes} locale={locale} defaultClassId={classId} />
    </div>
  );
}
