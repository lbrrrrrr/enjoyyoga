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
    try {
      const data = await getPaymentByRegistration(registrationId);
      setPaymentInfo(data);
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-12">
        <p className="text-gray-600">{t("loading")}</p>
      </div>
    );
  }

  if (error || !paymentInfo) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-12">
        <p className="text-red-600">{error || t("notFound")}</p>
      </div>
    );
  }

  const instructions = locale === "zh"
    ? paymentInfo.payment_instructions_zh
    : paymentInfo.payment_instructions_en;

  const isConfirmed = paymentInfo.status === "confirmed";
  const isPending = paymentInfo.status === "pending";

  return (
    <div className="container mx-auto max-w-lg px-4 py-12">
      <h1 className="mb-6 text-2xl font-bold">{t("title")}</h1>

      {isConfirmed && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <p className="text-center text-green-800 font-medium">
              {t("statusConfirmed")}
            </p>
          </CardContent>
        </Card>
      )}

      {isPending && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t("scanQrCode")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              {paymentInfo.wechat_qr_code_url ? (
                <img
                  src={paymentInfo.wechat_qr_code_url}
                  alt="WeChat Pay QR Code"
                  className="w-64 h-64 object-contain border rounded-lg"
                />
              ) : (
                <div className="w-64 h-64 bg-gray-100 flex items-center justify-center rounded-lg border">
                  <p className="text-gray-500 text-sm">{t("qrNotConfigured")}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t("paymentDetails")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">{t("amount")}</p>
                <p className="text-3xl font-bold">
                  {paymentInfo.currency === "CNY" ? "\u00a5" : paymentInfo.currency}{" "}
                  {paymentInfo.amount.toFixed(2)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">{t("referenceNumber")}</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-mono font-bold text-blue-600 select-all">
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
                <p className="text-xs text-amber-600 mt-1">{t("includeReference")}</p>
              </div>

              {instructions && (
                <div>
                  <p className="text-sm text-gray-600">{t("instructions")}</p>
                  <p className="mt-1 text-sm whitespace-pre-line">{instructions}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-center">
            <Button variant="outline" onClick={refreshStatus}>
              {t("checkStatus")}
            </Button>
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

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>
          {t("statusCheckLater")}{" "}
          <Link href={`/${locale}/payment/status`} className="text-blue-600 underline">
            {t("statusPage")}
          </Link>
        </p>
      </div>
    </div>
  );
}
