import { getTeachers } from "@/lib/api";
import { TeachersClient } from "@/components/admin/TeachersClient";

export default async function AdminTeachers({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  let teachers;
  try {
    teachers = await getTeachers();
  } catch (error) {
    console.error("Failed to fetch teachers:", error);
    teachers = [];
  }

  return <TeachersClient initialTeachers={teachers} />;
}