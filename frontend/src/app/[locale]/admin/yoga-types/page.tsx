import { getYogaTypes, YogaType } from "@/lib/api";
import { YogaTypesClient } from "@/components/admin/YogaTypesClient";

export default async function AdminYogaTypes({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  let yogaTypes: YogaType[];
  try {
    yogaTypes = await getYogaTypes();
  } catch (error) {
    console.error("Failed to fetch yoga types:", error);
    yogaTypes = [];
  }

  return <YogaTypesClient initialYogaTypes={yogaTypes} />;
}