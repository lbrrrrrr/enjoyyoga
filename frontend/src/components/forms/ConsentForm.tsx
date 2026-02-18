"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signConsent, type YogaType } from "@/lib/api";

interface ConsentFormProps {
  yogaTypes: YogaType[];
  locale: string;
  defaultYogaTypeId?: string;
  returnUrl?: string;
}

export function ConsentForm({
  yogaTypes,
  locale,
  defaultYogaTypeId,
  returnUrl,
}: ConsentFormProps) {
  const t = useTranslations("consent");
  const router = useRouter();
  const [selectedYogaType, setSelectedYogaType] = useState(defaultYogaTypeId ?? "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const getName = (yt: YogaType) =>
    locale === "zh" ? yt.name_zh : yt.name_en;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      await signConsent({
        email,
        name,
        yoga_type_id: selectedYogaType,
        consent_text_version: "1.0",
      });
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : t("error"));
    }
  };

  const handleRegisterClick = () => {
    if (returnUrl) {
      router.push(decodeURIComponent(returnUrl));
    } else {
      router.push(`/${locale}/register`);
    }
  };

  if (status === "success") {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold text-primary">
              {t("success.title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("success.message")}
            </p>
            <Button onClick={handleRegisterClick} className="rounded-full">
              {t("success.registerButton")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle className="zen-heading">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="yoga_type">{t("selectYogaType")}</Label>
            <select
              id="yoga_type"
              required
              value={selectedYogaType}
              onChange={(e) => setSelectedYogaType(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">{t("selectYogaTypePlaceholder")}</option>
              {yogaTypes.map((yt) => (
                <option key={yt.id} value={yt.id}>
                  {getName(yt)}
                </option>
              ))}
            </select>
          </div>

          {selectedYogaType && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                {t("waiverText")}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="consent_name">{t("form.name")}</Label>
            <Input
              id="consent_name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("form.namePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="consent_email">{t("form.email")}</Label>
            <Input
              id="consent_email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("form.emailPlaceholder")}
            />
          </div>

          <div className="flex items-start space-x-2">
            <input
              type="checkbox"
              id="consent_agree"
              required
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 rounded border-border"
            />
            <Label htmlFor="consent_agree" className="text-sm">
              {t("form.agree")}
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full rounded-full"
            disabled={!agreed || !selectedYogaType || status === "submitting"}
          >
            {status === "submitting" ? t("form.submitting") : t("form.submit")}
          </Button>

          {status === "error" && (
            <p className="text-sm text-destructive">
              {errorMessage || t("error")}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
