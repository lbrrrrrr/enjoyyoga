"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

export default function AdminPage() {
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    // Redirect to dashboard as the main admin page
    router.replace(`/${locale}/admin/dashboard`);
  }, [router, locale]);

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-lg text-gray-600">Loading...</div>
    </div>
  );
}