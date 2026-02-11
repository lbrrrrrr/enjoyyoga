"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createRegistration, type YogaClass } from "@/lib/api";

interface RegistrationFormProps {
  classes: YogaClass[];
  locale: string;
}

export function RegistrationForm({ classes, locale }: RegistrationFormProps) {
  const t = useTranslations("register");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [selectedClass, setSelectedClass] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("idle");

    const formData = new FormData(e.currentTarget);
    try {
      await createRegistration({
        class_id: formData.get("class_id") as string,
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        phone: (formData.get("phone") as string) || undefined,
        message: (formData.get("message") as string) || undefined,
      });
      setStatus("success");
      e.currentTarget.reset();
      setSelectedClass("");
    } catch {
      setStatus("error");
    }
  };

  const getName = (cls: YogaClass) =>
    locale === "zh" ? cls.name_zh : cls.name_en;

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="class_id">{t("selectClass")}</Label>
            <select
              id="class_id"
              name="class_id"
              required
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">{t("selectClass")}</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {getName(cls)}
                </option>
              ))}
            </select>
          </div>

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

          <Button type="submit" className="w-full">
            {t("submit")}
          </Button>

          {status === "success" && (
            <p className="text-sm text-green-600">{t("success")}</p>
          )}
          {status === "error" && (
            <p className="text-sm text-destructive">{t("error")}</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
