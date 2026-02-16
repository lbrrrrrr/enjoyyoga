"use client";

import { useState, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createContactInquiry } from "@/lib/api";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const t = useTranslations("contact");
  const locale = useLocale();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);

    try {
      await createContactInquiry({
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        phone: (formData.get("phone") as string) || undefined,
        subject: formData.get("subject") as string,
        message: formData.get("message") as string,
        category: formData.get("category") as string,
        preferred_language: locale,
      });

      setStatus("success");
      formRef.current?.reset();

      // Auto close after 3 seconds
      setTimeout(() => {
        onClose();
        setStatus("idle");
      }, 3000);

    } catch (error) {
      console.error("Error submitting inquiry:", error);
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const handleClose = () => {
    onClose();
    setStatus("idle");
    setErrorMessage("");
    formRef.current?.reset();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{t("title")}</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {status === "success" ? (
          <div className="text-center py-8">
            <div className="text-green-600 text-5xl mb-4">✓</div>
            <h3 className="text-lg font-semibold mb-2">{t("success.title")}</h3>
            <p className="text-gray-600">{t("success.message")}</p>
          </div>
        ) : (
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="category">{t("form.category.label")}</Label>
              <select
                id="category"
                name="category"
                required
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">{t("form.category.placeholder")}</option>
                <option value="scheduling">{t("form.category.options.scheduling")}</option>
                <option value="payment">{t("form.category.options.payment")}</option>
                <option value="general">{t("form.category.options.general")}</option>
                <option value="business">{t("form.category.options.business")}</option>
              </select>
            </div>

            <div>
              <Label htmlFor="name">{t("form.name.label")}</Label>
              <Input
                type="text"
                id="name"
                name="name"
                required
                placeholder={t("form.name.placeholder")}
                disabled={status === "loading"}
              />
            </div>

            <div>
              <Label htmlFor="email">{t("form.email.label")}</Label>
              <Input
                type="email"
                id="email"
                name="email"
                required
                placeholder={t("form.email.placeholder")}
                disabled={status === "loading"}
              />
            </div>

            <div>
              <Label htmlFor="phone">{t("form.phone.label")}</Label>
              <Input
                type="tel"
                id="phone"
                name="phone"
                placeholder={t("form.phone.placeholder")}
                disabled={status === "loading"}
              />
            </div>

            <div>
              <Label htmlFor="subject">{t("form.subject.label")}</Label>
              <Input
                type="text"
                id="subject"
                name="subject"
                required
                placeholder={t("form.subject.placeholder")}
                disabled={status === "loading"}
              />
            </div>

            <div>
              <Label htmlFor="message">{t("form.message.label")}</Label>
              <Textarea
                id="message"
                name="message"
                required
                rows={4}
                placeholder={t("form.message.placeholder")}
                disabled={status === "loading"}
              />
            </div>

            {status === "error" && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                {errorMessage || t("form.error")}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={status === "loading"}
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
                {t("form.cancel")}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}