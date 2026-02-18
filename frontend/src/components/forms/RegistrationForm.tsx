"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createRegistrationWithSchedule, checkConsent, type YogaClass } from "@/lib/api";
import { ScheduleDisplay } from "./ScheduleDisplay";
import { AvailableDatesSelector } from "./AvailableDatesSelector";
import { ConsentModal } from "./ConsentModal";

interface RegistrationFormProps {
  classes: YogaClass[];
  locale: string;
  defaultClassId?: string;
}

export function RegistrationForm({ classes, locale, defaultClassId }: RegistrationFormProps) {
  const t = useTranslations("register");
  const tc = useTranslations("consent");
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [selectedClass, setSelectedClass] = useState(defaultClassId ?? "");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState("");
  const [consentStatus, setConsentStatus] = useState<"unchecked" | "checking" | "granted" | "missing" | "error">("unchecked");
  const [emailValue, setEmailValue] = useState("");
  const [nameValue, setNameValue] = useState("");
  const [showConsentModal, setShowConsentModal] = useState(false);

  const currentClass = classes.find(cls => cls.id === selectedClass);
  const hasCnyPrice = currentClass?.price != null && currentClass.price > 0;
  const hasUsdPrice = currentClass?.price_usd != null && currentClass.price_usd > 0;
  const hasPrice = hasCnyPrice || hasUsdPrice;
  const hasBothPrices = hasCnyPrice && hasUsdPrice;
  const activePackages = currentClass?.packages?.filter(p => p.is_active) || [];

  const checkConsentStatus = useCallback(async (email: string, yogaTypeId: string) => {
    if (!email || !yogaTypeId) return;
    setConsentStatus("checking");
    try {
      const result = await checkConsent(email, yogaTypeId);
      setConsentStatus(result.has_consent ? "granted" : "missing");
    } catch {
      // Fail-open: don't block registration if check fails
      setConsentStatus("error");
    }
  }, []);

  // Re-check consent when email or selected class changes
  useEffect(() => {
    if (!emailValue || !currentClass) {
      if (consentStatus !== "unchecked") setConsentStatus("unchecked");
      return;
    }
    checkConsentStatus(emailValue, currentClass.yoga_type_id);
  }, [emailValue, selectedClass]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("idle");
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);

    try {
      const result = await createRegistrationWithSchedule({
        class_id: formData.get("class_id") as string,
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        phone: (formData.get("phone") as string) || undefined,
        message: (formData.get("message") as string) || undefined,
        target_date: selectedDate,
        target_time: selectedTime,
        preferred_language: formData.get("preferred_language") as string || "en",
        email_notifications: formData.get("email_notifications") === "on",
        sms_notifications: formData.get("sms_notifications") === "on",
        package_id: selectedPackageId || undefined,
        payment_method: selectedPaymentMethod || undefined,
      });

      // If pending payment, redirect to payment page
      if (result.status === "pending_payment") {
        router.push(`/${locale}/payment/${result.id}`);
        return;
      }

      setStatus("success");
      formRef.current?.reset();
      setSelectedClass("");
      setSelectedDate("");
      setSelectedTime("");
      setSelectedPackageId("");
      setSelectedPaymentMethod("");
      setEmailValue("");
      setNameValue("");
      setConsentStatus("unchecked");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Registration failed");
    }
  };

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    setSelectedDate("");
    setSelectedTime("");
    setSelectedPackageId("");
    setSelectedPaymentMethod("");
    setConsentStatus("unchecked");
  };

  const handleDateSelect = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
  };

  const getName = (cls: YogaClass) =>
    locale === "zh" ? cls.name_zh : cls.name_en;

  const getYogaTypeName = () => {
    if (!currentClass?.yoga_type) return "";
    return locale === "zh"
      ? (currentClass.yoga_type.name_zh || currentClass.yoga_type.name_en || "")
      : (currentClass.yoga_type.name_en || "");
  };

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle className="zen-heading">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="class_id">{t("selectClass")}</Label>
            <select
              id="class_id"
              name="class_id"
              required
              value={selectedClass}
              onChange={(e) => handleClassChange(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">{t("selectClass")}</option>
              {classes.map((cls) => {
                const cny = cls.price != null && cls.price > 0;
                const usd = cls.price_usd != null && cls.price_usd > 0;
                let priceLabel = ` - ${t("free")}`;
                if (cny && usd) priceLabel = ` - \u00a5${cls.price} / $${cls.price_usd}`;
                else if (cny) priceLabel = ` - \u00a5${cls.price}`;
                else if (usd) priceLabel = ` - $${cls.price_usd}`;
                return (
                  <option key={cls.id} value={cls.id}>
                    {getName(cls)}{priceLabel}
                  </option>
                );
              })}
            </select>
          </div>

          {selectedClass && (
            <>
              <ScheduleDisplay
                schedule={currentClass?.schedule || ""}
                className="mt-4"
              />

              <AvailableDatesSelector
                classId={selectedClass}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                className="mt-4"
              />
            </>
          )}

          {/* Payment method selection */}
          {hasPrice && hasBothPrices && (
            <div className="bg-secondary rounded-lg p-4 space-y-3">
              <Label className="font-medium">{t("selectPaymentMethod")}</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 p-2 rounded border bg-card cursor-pointer">
                  <input
                    type="radio"
                    name="payment_method"
                    value="wechat_qr"
                    checked={selectedPaymentMethod === "wechat_qr"}
                    onChange={() => setSelectedPaymentMethod("wechat_qr")}
                  />
                  <span className="text-sm">
                    {t("wechatPay")} - {"\u00a5"}{currentClass!.price}/{t("perSession")}
                  </span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded border bg-card cursor-pointer">
                  <input
                    type="radio"
                    name="payment_method"
                    value="venmo_qr"
                    checked={selectedPaymentMethod === "venmo_qr"}
                    onChange={() => setSelectedPaymentMethod("venmo_qr")}
                  />
                  <span className="text-sm">
                    {t("venmo")} - ${currentClass!.price_usd}/{t("perSession")}
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Price display and package selection */}
          {hasPrice && (
            <div className="bg-secondary rounded-lg p-4 space-y-3">
              {!hasBothPrices && (
                <p className="font-medium">
                  {t("classPrice")}:{" "}
                  {hasCnyPrice
                    ? `\u00a5${currentClass!.price}`
                    : `$${currentClass!.price_usd}`}
                  /{t("perSession")}
                </p>
              )}

              {activePackages.length > 0 && (
                <div className="space-y-2">
                  <Label>{t("selectOption")}</Label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 p-2 rounded border bg-card cursor-pointer">
                      <input
                        type="radio"
                        name="payment_option"
                        value=""
                        checked={!selectedPackageId}
                        onChange={() => setSelectedPackageId("")}
                      />
                      <span className="text-sm">
                        {t("singleSession")} -{" "}
                        {selectedPaymentMethod === "venmo_qr" && hasUsdPrice
                          ? `$${currentClass!.price_usd}`
                          : `\u00a5${currentClass!.price}`}
                      </span>
                    </label>
                    {activePackages.map((pkg) => {
                      const pkgName = locale === "zh" ? pkg.name_zh : pkg.name_en;
                      const useUsd = selectedPaymentMethod === "venmo_qr" && pkg.price_usd != null;
                      const displayPrice = useUsd ? pkg.price_usd! : pkg.price;
                      const symbol = useUsd ? "$" : "\u00a5";
                      const perSession = displayPrice / pkg.session_count;
                      return (
                        <label
                          key={pkg.id}
                          className="flex items-center gap-2 p-2 rounded border bg-card cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="payment_option"
                            value={pkg.id}
                            checked={selectedPackageId === pkg.id}
                            onChange={() => setSelectedPackageId(pkg.id)}
                          />
                          <span className="text-sm">
                            {pkgName} ({pkg.session_count} {t("sessions")}) - {symbol}{displayPrice}
                            <span className="text-muted-foreground ml-1">
                              ({symbol}{perSession.toFixed(0)}/{t("perSession")})
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">{t("name")}</Label>
            <Input
              id="name"
              name="name"
              required
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              value={emailValue}
              onChange={(e) => setEmailValue(e.target.value)}
            />
          </div>

          {consentStatus === "checking" && (
            <p className="text-sm text-muted-foreground">{tc("check.checking")}</p>
          )}

          {consentStatus === "missing" && currentClass && (
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 space-y-2">
              <p className="text-sm text-amber-800 font-medium">
                {tc("check.warning")}
              </p>
              <button
                type="button"
                onClick={() => setShowConsentModal(true)}
                className="inline-block text-sm text-amber-700 underline font-medium hover:text-amber-900"
              >
                {tc("check.signWaiver")}
              </button>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="phone">{t("phone")}</Label>
            <Input id="phone" name="phone" type="tel" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">{t("message")}</Label>
            <Textarea id="message" name="message" rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferred_language">{t("preferredLanguage")}</Label>
            <select
              id="preferred_language"
              name="preferred_language"
              defaultValue="en"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="en">English</option>
              <option value="zh">中文</option>
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="email_notifications"
                name="email_notifications"
                defaultChecked
                className="rounded border-border"
              />
              <Label htmlFor="email_notifications" className="text-sm">
                {t("emailNotifications")}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="sms_notifications"
                name="sms_notifications"
                className="rounded border-border"
              />
              <Label htmlFor="sms_notifications" className="text-sm">
                {t("smsNotifications")}
              </Label>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full rounded-full"
            disabled={consentStatus === "missing" || (!!selectedClass && !selectedDate)}
          >
            {hasPrice ? t("submitAndPay") : t("submit")}
          </Button>

          {status === "success" && (
            <p className="text-sm text-primary">{t("success")}</p>
          )}
          {status === "error" && (
            <p className="text-sm text-destructive">
              {errorMessage || t("error")}
            </p>
          )}
        </form>

        {currentClass && (
          <ConsentModal
            isOpen={showConsentModal}
            onClose={() => setShowConsentModal(false)}
            onSuccess={() => setConsentStatus("granted")}
            yogaTypeId={currentClass.yoga_type_id}
            yogaTypeName={getYogaTypeName()}
            locale={locale}
            prefillName={nameValue}
            prefillEmail={emailValue}
          />
        )}
      </CardContent>
    </Card>
  );
}
