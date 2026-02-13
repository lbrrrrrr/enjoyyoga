"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { AdminUser } from "@/lib/admin-api";

export function AdminHeader() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const router = useRouter();
  const t = useTranslations("admin");

  useEffect(() => {
    const adminData = localStorage.getItem("admin_user");
    if (adminData) {
      setAdmin(JSON.parse(adminData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    router.push("/admin/login");
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {/* This will be updated per page */}
        </h1>

        <div className="flex items-center space-x-4">
          {admin && (
            <div className="text-sm text-gray-600">
              Welcome, {admin.username}
            </div>
          )}
          <Button variant="outline" size="sm" onClick={handleLogout}>
            {t("nav.logout")}
          </Button>
        </div>
      </div>
    </header>
  );
}