"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { AdminUser, adminLogout } from "@/lib/admin-api";
import { getAdminUserFromCookie, clearSessionCookies } from "@/lib/session";

export function AdminHeader() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("admin");

  useEffect(() => {
    // Initial load - check for admin data
    const checkAdminStatus = () => {
      const adminData = getAdminUserFromCookie();
      setAdmin(adminData);
    };

    checkAdminStatus();

    // Check session status periodically (every 30 seconds)
    const interval = setInterval(checkAdminStatus, 30000);

    return () => clearInterval(interval);
  }, []); // Remove admin from dependency to avoid infinite loop

  // Also check when the component becomes visible or window gets focus
  useEffect(() => {
    const checkAdminData = () => {
      const adminData = getAdminUserFromCookie();
      setAdmin(adminData);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkAdminData();
      }
    };

    const handleFocus = () => {
      checkAdminData();
    };

    const handleSessionChange = () => {
      checkAdminData();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('adminSessionChanged', handleSessionChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('adminSessionChanged', handleSessionChange);
    };
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await adminLogout();
      clearSessionCookies();
      setAdmin(null); // Clear admin state immediately
      router.push(`/${locale}/admin/login`);
    } catch (error) {
      // Even if logout fails, clear local session
      clearSessionCookies();
      setAdmin(null); // Clear admin state immediately
      router.push(`/${locale}/admin/login`);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {/* This will be updated per page */}
        </h1>

        <div className="flex items-center space-x-4">
          {admin && (
            <>
              <div className="text-sm text-gray-600">
                Welcome, {admin.username}
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout} disabled={isLoggingOut}>
                {isLoggingOut ? "Logging out..." : t("nav.logout")}
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}