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
    <header className="sticky top-0 z-30 border-b border-border/50 bg-card/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Link href={`/${locale}`} className="zen-heading text-2xl transition-colors hover:text-primary">
          Enjoy Yoga
        </Link>
        <nav className="flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="zen-heading text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
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
