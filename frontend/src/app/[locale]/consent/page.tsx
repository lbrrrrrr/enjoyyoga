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
      <div className="mb-10 text-center">
        <h1 className="zen-heading mb-3 text-3xl">{t("title")}</h1>
        <div className="mb-3 flex items-center justify-center gap-3">
          <div className="h-px w-12 bg-primary/40" />
          <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
          <div className="h-px w-12 bg-primary/40" />
        </div>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>
      <ConsentForm
        yogaTypes={yogaTypes}
        locale={locale}
        defaultYogaTypeId={yoga_type_id}
        returnUrl={return_url}
      />
    </div>
  );
}
