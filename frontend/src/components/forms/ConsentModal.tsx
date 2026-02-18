"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signConsent } from "@/lib/api";

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  yogaTypeId: string;
  yogaTypeName: string;
  locale: string;
  prefillName: string;
  prefillEmail: string;
}

export function ConsentModal({
  isOpen,
  onClose,
  onSuccess,
  yogaTypeId,
  yogaTypeName,
  locale,
  prefillName,
  prefillEmail,
}: ConsentModalProps) {
  const t = useTranslations("consent");
  const [name, setName] = useState(prefillName);
  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Sync name when modal opens with latest prefill value
  useEffect(() => {
    if (isOpen) {
      setName(prefillName);
    }
  }, [isOpen, prefillName]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed || !name.trim()) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      await signConsent({
        email: prefillEmail,
        name: name.trim(),
        yoga_type_id: yogaTypeId,
      });
      onSuccess();
      handleClose();
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : t("error"));
    }
  };

  const handleClose = () => {
    setAgreed(false);
    setStatus("idle");
    setErrorMessage("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="zen-heading text-xl">{t("modal.title")}</h2>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {yogaTypeName && (
          <p className="text-sm text-muted-foreground mb-4">{yogaTypeName}</p>
        )}

        <div className="bg-secondary rounded-lg p-4 mb-4 text-sm leading-relaxed">
          {t("waiverText")}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="consent-name">{t("form.name")}</Label>
            <Input
              id="consent-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("form.namePlaceholder")}
              disabled={status === "loading"}
            />
          </div>

          <div>
            <Label htmlFor="consent-email">{t("form.email")}</Label>
            <Input
              id="consent-email"
              type="email"
              value={prefillEmail}
              readOnly
              className="bg-muted"
            />
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="consent-agree"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 rounded border-border"
              disabled={status === "loading"}
            />
            <Label htmlFor="consent-agree" className="text-sm leading-normal">
              {t("form.agree")}
            </Label>
          </div>

          {status === "error" && (
            <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md">
              {errorMessage}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={!agreed || !name.trim() || status === "loading"}
              className="flex-1"
            >
              {status === "loading" ? t("form.submitting") : t("form.submit")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={status === "loading"}
            >
              {t("modal.cancel")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
