"use client";

import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-border/50 bg-secondary/50 py-12">
      <div className="container mx-auto px-4 text-center">
        <p className="zen-heading text-lg mb-2">Enjoy Yoga</p>
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Enjoy Yoga. {t("rights")}
        </p>
      </div>
    </footer>
  );
}
