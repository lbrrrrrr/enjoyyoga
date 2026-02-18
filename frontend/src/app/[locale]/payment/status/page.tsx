"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPaymentStatus, type PaymentInfo } from "@/lib/api";

export default function PaymentStatusPage() {
  const t = useTranslations("payment");
  const locale = useLocale();
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceNumber.trim()) return;

    setLoading(true);
    setError("");
    setPaymentInfo(null);

    try {
      const data = await getPaymentStatus(referenceNumber.trim());
      setPaymentInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("notFound"));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed":
        return t("statusConfirmed");
      case "pending":
        return t("statusPending");
      case "cancelled":
        return t("statusCancelled");
      default:
        return status;
    }
  };

  return (
    <div className="container mx-auto max-w-lg px-4 py-12">
      <h1 className="zen-heading mb-3 text-center text-2xl">{t("checkPaymentStatus")}</h1>
      <div className="mb-6 flex items-center justify-center gap-3">
        <div className="h-px w-12 bg-primary/40" />
        <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
        <div className="h-px w-12 bg-primary/40" />
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reference">{t("referenceNumber")}</Label>
              <Input
                id="reference"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="EY-20260215-AB3X"
                className="font-mono"
              />
            </div>
            <Button type="submit" className="w-full rounded-full" disabled={loading}>
              {loading ? t("searching") : t("checkStatus")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {paymentInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="zen-heading">{t("paymentDetails")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("referenceNumber")}</span>
              <span className="font-mono font-medium">{paymentInfo.reference_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("amount")}</span>
              <span className="font-medium">
                {paymentInfo.currency === "USD" ? "$" : "\u00a5"}
                {paymentInfo.amount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t("status")}</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(paymentInfo.status)}`}>
                {getStatusLabel(paymentInfo.status)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("date")}</span>
              <span>{new Date(paymentInfo.created_at).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
