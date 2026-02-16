"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminLogin } from "@/lib/admin-api";
import { useLocale } from "next-intl";
import { notifySessionChange } from "@/lib/session";

export default function AdminLogin() {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("admin");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    try {
      const response = await adminLogin(username, password);
      // The server will set the session cookies automatically via credentials: 'include'
      // Notify components that session has changed
      notifySessionChange();
      // Redirect to dashboard
      router.push(`/${locale}/admin/dashboard`);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("login.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t("login.username")}</Label>
              <Input
                id="username"
                name="username"
                type="text"
                required
                disabled={status === "loading"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("login.password")}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                disabled={status === "loading"}
              />
            </div>

            <Button type="submit" className="w-full" disabled={status === "loading"}>
              {status === "loading" ? "Signing in..." : t("login.submit")}
            </Button>

            {status === "error" && (
              <p className="text-sm text-destructive">
                {errorMessage || t("login.error")}
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}