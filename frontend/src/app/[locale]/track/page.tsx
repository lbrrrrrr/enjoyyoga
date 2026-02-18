"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestTrackingLink } from "@/lib/api";

export default function TrackingRecoveryPage() {
  const t = useTranslations("tracking.recovery");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await requestTrackingLink(email.trim(), locale);
      setSuccess(true);
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-lg px-4 py-12">
      <h1 className="zen-heading mb-3 text-center text-2xl">{t("title")}</h1>
      <div className="mb-2 flex items-center justify-center gap-3">
        <div className="h-px w-12 bg-primary/40" />
        <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
        <div className="h-px w-12 bg-primary/40" />
      </div>
      <p className="mb-6 text-center text-sm text-muted-foreground">{t("subtitle")}</p>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                required
              />
            </div>
            <Button type="submit" className="w-full rounded-full" disabled={loading}>
              {loading ? t("sending") : t("submit")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {success && (
        <Card className="mt-6 border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <p className="text-center text-sm">{t("success")}</p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="mt-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-center text-sm text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
