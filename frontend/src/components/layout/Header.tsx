"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Header() {
  const t = useTranslations("nav");
  const locale = useLocale();

  const links = [
    { href: `/${locale}`, label: t("home") },
    { href: `/${locale}/classes`, label: t("classes") },
    { href: `/${locale}/teachers`, label: t("teachers") },
    { href: `/${locale}/yoga-types`, label: t("yogaTypes") },
    { href: `/${locale}/register`, label: t("register") },
    { href: `/${locale}/payment/status`, label: t("paymentStatus") },
  ];

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href={`/${locale}`} className="text-xl font-bold">
          enjoyyoga
        </Link>
        <nav className="flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}
