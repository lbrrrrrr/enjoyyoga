"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

export function AdminSidebar() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("admin");

  const navItems = [
    { href: `/${locale}/admin/dashboard`, label: t("nav.dashboard") },
    { href: `/${locale}/admin/registrations`, label: t("nav.registrations") },
    { href: `/${locale}/admin/teachers`, label: t("nav.teachers") },
    { href: `/${locale}/admin/yoga-types`, label: "Yoga Types" },
    { href: `/${locale}/admin/inquiries`, label: t("nav.inquiries") },
    { href: `/${locale}/admin/notifications`, label: t("nav.notifications") },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">enjoyyoga Admin</h2>
      </div>

      <nav className="flex-1 mt-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                  pathname === item.href
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}