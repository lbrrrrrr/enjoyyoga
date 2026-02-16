"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPaymentByRegistration, type PaymentInfo } from "@/lib/api";
import Link from "next/link";

export default function PaymentPage() {
  const params = useParams();
  const registrationId = params.registrationId as string;
  const t = useTranslations("payment");
  const locale = useLocale();
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const data = await getPaymentByRegistration(registrationId);
        setPaymentInfo(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load payment info");
      } finally {
        setLoading(false);
      }
    };
    fetchPayment();
  }, [registrationId]);

  const refreshStatus = async () => {
    setChecking(true);
    try {
      const data = await getPaymentByRegistration(registrationId);
      setPaymentInfo(data);
      setLastChecked(new Date().toLocaleTimeString());
    } catch {
      setLastChecked(null);
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-12">
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  if (error || !paymentInfo) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-12">
        <p className="text-destructive">{error || t("notFound")}</p>
      </div>
    );
  }

  const isVenmo = paymentInfo.payment_method === "venmo_qr";
  const qrCodeUrl = isVenmo ? paymentInfo.venmo_qr_code_url : paymentInfo.wechat_qr_code_url;
  const instructions = isVenmo
    ? (locale === "zh" ? paymentInfo.venmo_payment_instructions_zh : paymentInfo.venmo_payment_instructions_en)
    : (locale === "zh" ? paymentInfo.payment_instructions_zh : paymentInfo.payment_instructions_en);
  const currencySymbol = paymentInfo.currency === "USD" ? "$" : "\u00a5";

  const isConfirmed = paymentInfo.status === "confirmed";
  const isPending = paymentInfo.status === "pending";

  return (
    <div className="container mx-auto max-w-lg px-4 py-12">
      <h1 className="zen-heading mb-6 text-2xl">{t("title")}</h1>

      {isConfirmed && (
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <p className="text-center text-primary font-medium">
              {t("statusConfirmed")}
            </p>
          </CardContent>
        </Card>
      )}

      {isPending && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="zen-heading">{isVenmo ? t("scanQrCodeVenmo") : t("scanQrCodeWechat")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt={isVenmo ? "Venmo QR Code" : "WeChat Pay QR Code"}
                  className="w-64 h-64 object-contain border rounded-lg"
                />
              ) : (
                <div className="w-64 h-64 bg-secondary flex items-center justify-center rounded-lg border">
                  <p className="text-muted-foreground text-sm">{t("qrNotConfigured")}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="zen-heading">{t("paymentDetails")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">{t("amount")}</p>
                <p className="text-3xl font-bold">
                  {currencySymbol}{paymentInfo.amount.toFixed(2)}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">{t("referenceNumber")}</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-mono font-bold text-primary select-all">
                    {paymentInfo.reference_number}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(paymentInfo.reference_number)}
                  >
                    {t("copy")}
                  </Button>
                </div>
                <p className="text-xs text-amber-600 mt-1">
                  {isVenmo ? t("includeReferenceVenmo") : t("includeReference")}
                </p>
              </div>

              {instructions && (
                <div>
                  <p className="text-sm text-muted-foreground">{t("instructions")}</p>
                  <p className="mt-1 text-sm whitespace-pre-line">{instructions}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-center space-y-2">
            <Button variant="outline" onClick={refreshStatus} disabled={checking}>
              {checking ? t("searching") : t("checkStatus")}
            </Button>
            {lastChecked && (
              <p className="text-xs text-muted-foreground">
                {t("statusPending")} ({lastChecked})
              </p>
            )}
          </div>
        </>
      )}

      {paymentInfo.status === "cancelled" && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-center text-red-800 font-medium">
              {t("statusCancelled")}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>
          {t("statusCheckLater")}{" "}
          <Link href={`/${locale}/payment/status`} className="text-primary underline">
            {t("statusPage")}
          </Link>
        </p>
      </div>
    </div>
  );
}
