import { getYogaTypes, type YogaType } from "@/lib/api";
import { ConsentForm } from "@/components/forms/ConsentForm";
import { getTranslations } from "next-intl/server";

export default async function ConsentPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ yoga_type_id?: string; return_url?: string }>;
}) {
  const { locale } = await params;
  const { yoga_type_id, return_url } = await searchParams;
  const t = await getTranslations("consent");

  let yogaTypes: YogaType[] = [];
  try {
    yogaTypes = await getYogaTypes();
  } catch {
    // API not available
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="zen-heading mb-8 text-center text-3xl">{t("title")}</h1>
      <ConsentForm
        yogaTypes={yogaTypes}
        locale={locale}
        defaultYogaTypeId={yoga_type_id}
        returnUrl={return_url}
      />
    </div>
  );
}
