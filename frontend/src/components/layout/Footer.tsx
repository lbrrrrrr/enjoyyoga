"use client";

import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-border/50 bg-secondary/50 py-12">
      <div className="container mx-auto px-4 text-center">
        <p className="zen-heading text-lg mb-3">Enjoy Yoga</p>
        <div className="mb-3 flex items-center justify-center gap-3">
          <div className="h-px w-12 bg-primary/40" />
          <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
          <div className="h-px w-12 bg-primary/40" />
        </div>
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Enjoy Yoga. {t("rights")}
        </p>
      </div>
    </footer>
  );
}
