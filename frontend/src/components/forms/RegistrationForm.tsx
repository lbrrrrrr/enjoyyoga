"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createRegistration, createRegistrationWithSchedule, type YogaClass } from "@/lib/api";
import { ScheduleDisplay } from "./ScheduleDisplay";
import { AvailableDatesSelector } from "./AvailableDatesSelector";

interface RegistrationFormProps {
  classes: YogaClass[];
  locale: string;
}

export function RegistrationForm({ classes, locale }: RegistrationFormProps) {
  const t = useTranslations("register");
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState("");

  const currentClass = classes.find(cls => cls.id === selectedClass);
  const hasPrice = currentClass?.price != null && currentClass.price > 0;
  const activePackages = currentClass?.packages?.filter(p => p.is_active) || [];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("idle");
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);

    try {
      // Use enhanced registration API if date is selected
      if (selectedDate && selectedTime) {
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
        });

        // If pending payment, redirect to payment page
        if (result.status === "pending_payment") {
          router.push(`/${locale}/payment/${result.id}`);
          return;
        }
      } else {
        // Fallback to basic registration
        await createRegistration({
          class_id: formData.get("class_id") as string,
          name: formData.get("name") as string,
          email: formData.get("email") as string,
          phone: (formData.get("phone") as string) || undefined,
          message: (formData.get("message") as string) || undefined,
        });
      }

      setStatus("success");
      formRef.current?.reset();
      setSelectedClass("");
      setSelectedDate("");
      setSelectedTime("");
      setSelectedPackageId("");
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
  };

  const handleDateSelect = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
  };

  const getName = (cls: YogaClass) =>
    locale === "zh" ? cls.name_zh : cls.name_en;

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
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
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {getName(cls)}
                  {cls.price != null && cls.price > 0
                    ? ` - \u00a5${cls.price}`
                    : ` - ${t("free")}`}
                </option>
              ))}
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

          {/* Price display and package selection */}
          {hasPrice && (
            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
              <p className="font-medium">
                {t("classPrice")}: {"\u00a5"}{currentClass!.price}/{t("perSession")}
              </p>

              {activePackages.length > 0 && (
                <div className="space-y-2">
                  <Label>{t("selectOption")}</Label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 p-2 rounded border bg-white cursor-pointer">
                      <input
                        type="radio"
                        name="payment_option"
                        value=""
                        checked={!selectedPackageId}
                        onChange={() => setSelectedPackageId("")}
                      />
                      <span className="text-sm">
                        {t("singleSession")} - {"\u00a5"}{currentClass!.price}
                      </span>
                    </label>
                    {activePackages.map((pkg) => {
                      const pkgName = locale === "zh" ? pkg.name_zh : pkg.name_en;
                      const perSession = pkg.price / pkg.session_count;
                      return (
                        <label
                          key={pkg.id}
                          className="flex items-center gap-2 p-2 rounded border bg-white cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="payment_option"
                            value={pkg.id}
                            checked={selectedPackageId === pkg.id}
                            onChange={() => setSelectedPackageId(pkg.id)}
                          />
                          <span className="text-sm">
                            {pkgName} ({pkg.session_count} {t("sessions")}) - {"\u00a5"}{pkg.price}
                            <span className="text-gray-500 ml-1">
                              ({"\u00a5"}{perSession.toFixed(0)}/{t("perSession")})
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
            <Input id="name" name="name" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input id="email" name="email" type="email" required />
          </div>

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
                className="rounded border-gray-300"
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
                className="rounded border-gray-300"
              />
              <Label htmlFor="sms_notifications" className="text-sm">
                {t("smsNotifications")}
              </Label>
            </div>
          </div>

          <Button type="submit" className="w-full">
            {hasPrice ? t("submitAndPay") : t("submit")}
          </Button>

          {status === "success" && (
            <p className="text-sm text-green-600">{t("success")}</p>
          )}
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
