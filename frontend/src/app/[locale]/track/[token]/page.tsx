"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRegistrationsByToken, type TrackingResponse } from "@/lib/api";
import Link from "next/link";

export default function TrackingPage() {
  const t = useTranslations("tracking");
  const locale = useLocale();
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<TrackingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const result = await getRegistrationsByToken(token);
        setData(result);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed":
        return t("statusConfirmed");
      case "pending_payment":
        return t("statusPendingPayment");
      case "waitlist":
        return t("statusWaitlist");
      case "cancelled":
        return t("statusCancelled");
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "text-primary bg-primary/10";
      case "pending_payment":
        return "text-amber-800 bg-amber-100";
      case "waitlist":
        return "text-blue-800 bg-blue-100";
      case "cancelled":
        return "text-red-800 bg-red-100";
      default:
        return "text-muted-foreground bg-secondary";
    }
  };

  const getPaymentLabel = (status: string) => {
    switch (status) {
      case "confirmed":
        return t("paymentConfirmed");
      case "pending":
        return t("paymentPending");
      case "cancelled":
        return t("paymentCancelled");
      default:
        return status;
    }
  };

  const getPaymentColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "text-primary bg-primary/10";
      case "pending":
        return "text-amber-800 bg-amber-100";
      case "cancelled":
        return "text-red-800 bg-red-100";
      default:
        return "text-muted-foreground bg-secondary";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-center">
            <p className="text-red-800">{t("invalidLink")}</p>
            <p className="mt-4">
              <Link href={`/${locale}/track`} className="text-primary underline">
                {t("requestNewLink")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <h1 className="zen-heading mb-3 text-center text-2xl">{t("title")}</h1>
      <div className="mb-2 flex items-center justify-center gap-3">
        <div className="h-px w-12 bg-primary/40" />
        <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
        <div className="h-px w-12 bg-primary/40" />
      </div>
      <p className="mb-6 text-center text-sm text-muted-foreground">
        {t("email")}: {data.email}
      </p>

      {data.registrations.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">{t("noRegistrations")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.registrations.map((reg) => (
            <Card key={reg.registration_id}>
              <CardHeader className="pb-3">
                <CardTitle className="zen-heading text-lg">
                  {locale === "zh" ? reg.class_name_zh : reg.class_name_en}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {reg.target_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("date")}</span>
                    <span>{new Date(reg.target_date).toLocaleDateString()}</span>
                  </div>
                )}
                {reg.target_time && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("time")}</span>
                    <span>{reg.target_time}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("status")}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(reg.status)}`}>
                    {getStatusLabel(reg.status)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("registeredOn")}</span>
                  <span>{new Date(reg.created_at).toLocaleDateString()}</span>
                </div>
                {reg.payment_status && (
                  <>
                    <div className="my-2 h-px bg-border" />
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">{t("paymentStatus")}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentColor(reg.payment_status)}`}>
                        {getPaymentLabel(reg.payment_status)}
                      </span>
                    </div>
                    {reg.reference_number && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("referenceNumber")}</span>
                        <span className="font-mono text-xs">{reg.reference_number}</span>
                      </div>
                    )}
                    {reg.amount != null && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("amount")}</span>
                        <span className="font-medium">
                          {reg.currency === "USD" ? "$" : "\u00a5"}
                          {reg.amount.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="mt-8 text-center text-sm text-muted-foreground">
        {t("lostLink")}{" "}
        <Link href={`/${locale}/track`} className="text-primary underline">
          {t("requestNewLink")}
        </Link>
      </p>
    </div>
  );
}
