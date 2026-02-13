import { NotificationsClient } from "@/components/admin/NotificationsClient";

export default async function AdminNotifications({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <NotificationsClient />;
}