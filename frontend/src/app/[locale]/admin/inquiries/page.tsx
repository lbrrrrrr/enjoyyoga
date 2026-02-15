import { useTranslations } from "next-intl";
import { InquiriesClient } from "@/components/admin/InquiriesClient";

export default function InquiriesPage() {
  const t = useTranslations("admin.inquiries");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-600">{t("description")}</p>
      </div>
      <InquiriesClient />
    </div>
  );
}