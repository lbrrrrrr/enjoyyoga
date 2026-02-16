"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  getPaymentSettingsAdmin,
  updatePaymentSettings,
  uploadWechatQrCode,
  uploadVenmoQrCode,
  type PaymentSettingsAdmin,
} from "@/lib/admin-api";

export function PaymentSettingsClient() {
  const t = useTranslations("admin.paymentSettings");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const venmoFileInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<PaymentSettingsAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingVenmo, setUploadingVenmo] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [instructionsEn, setInstructionsEn] = useState("");
  const [instructionsZh, setInstructionsZh] = useState("");
  const [venmoInstructionsEn, setVenmoInstructionsEn] = useState("");
  const [venmoInstructionsZh, setVenmoInstructionsZh] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await getPaymentSettingsAdmin();
      setSettings(data);
      setInstructionsEn(data.payment_instructions_en || "");
      setInstructionsZh(data.payment_instructions_zh || "");
      setVenmoInstructionsEn(data.venmo_payment_instructions_en || "");
      setVenmoInstructionsZh(data.venmo_payment_instructions_zh || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccessMessage("");
    try {
      const data = await updatePaymentSettings({
        payment_instructions_en: instructionsEn,
        payment_instructions_zh: instructionsZh,
        venmo_payment_instructions_en: venmoInstructionsEn,
        venmo_payment_instructions_zh: venmoInstructionsZh,
      });
      setSettings(data);
      setSuccessMessage(t("saved"));
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setSuccessMessage("");
    try {
      const result = await uploadWechatQrCode(file);
      setSettings(result.settings);
      setSuccessMessage(t("qrUploaded"));
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to upload QR code");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleVenmoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVenmo(true);
    setSuccessMessage("");
    try {
      const result = await uploadVenmoQrCode(file);
      setSettings(result.settings);
      setSuccessMessage(t("venmoQrUploaded"));
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to upload Venmo QR code");
    } finally {
      setUploadingVenmo(false);
      if (venmoFileInputRef.current) {
        venmoFileInputRef.current.value = "";
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded">
          {successMessage}
        </div>
      )}

      {/* QR Code Upload */}
      <Card>
        <CardHeader>
          <CardTitle>{t("wechatQrCode")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings?.wechat_qr_code_url ? (
            <div className="flex flex-col items-center gap-4">
              <img
                src={settings.wechat_qr_code_url}
                alt="WeChat QR Code"
                className="w-48 h-48 object-contain border rounded-lg"
              />
              <p className="text-sm text-gray-500">{t("currentQrCode")}</p>
            </div>
          ) : (
            <p className="text-gray-500">{t("noQrCode")}</p>
          )}

          <div>
            <Label htmlFor="qr-upload">{t("uploadNewQr")}</Label>
            <input
              ref={fileInputRef}
              id="qr-upload"
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {uploading && <p className="text-sm text-gray-500 mt-1">{t("uploading")}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Venmo QR Code Upload */}
      <Card>
        <CardHeader>
          <CardTitle>{t("venmoQrCode")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings?.venmo_qr_code_url ? (
            <div className="flex flex-col items-center gap-4">
              <img
                src={settings.venmo_qr_code_url}
                alt="Venmo QR Code"
                className="w-48 h-48 object-contain border rounded-lg"
              />
              <p className="text-sm text-gray-500">{t("currentVenmoQrCode")}</p>
            </div>
          ) : (
            <p className="text-gray-500">{t("noVenmoQrCode")}</p>
          )}

          <div>
            <Label htmlFor="venmo-qr-upload">{t("uploadNewVenmoQr")}</Label>
            <input
              ref={venmoFileInputRef}
              id="venmo-qr-upload"
              type="file"
              accept="image/*"
              onChange={handleVenmoUpload}
              className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {uploadingVenmo && <p className="text-sm text-gray-500 mt-1">{t("uploading")}</p>}
          </div>
        </CardContent>
      </Card>

      {/* WeChat Payment Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>{t("paymentInstructions")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="instructions-en">{t("instructionsEn")}</Label>
            <Textarea
              id="instructions-en"
              value={instructionsEn}
              onChange={(e) => setInstructionsEn(e.target.value)}
              placeholder={t("instructionsPlaceholder")}
              rows={5}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="instructions-zh">{t("instructionsZh")}</Label>
            <Textarea
              id="instructions-zh"
              value={instructionsZh}
              onChange={(e) => setInstructionsZh(e.target.value)}
              placeholder={t("instructionsPlaceholder")}
              rows={5}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Venmo Payment Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>{t("venmoInstructions")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="venmo-instructions-en">{t("venmoInstructionsEn")}</Label>
            <Textarea
              id="venmo-instructions-en"
              value={venmoInstructionsEn}
              onChange={(e) => setVenmoInstructionsEn(e.target.value)}
              placeholder={t("venmoInstructionsPlaceholder")}
              rows={5}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="venmo-instructions-zh">{t("venmoInstructionsZh")}</Label>
            <Textarea
              id="venmo-instructions-zh"
              value={venmoInstructionsZh}
              onChange={(e) => setVenmoInstructionsZh(e.target.value)}
              placeholder={t("venmoInstructionsPlaceholder")}
              rows={5}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? t("saving") : t("save")}
      </Button>
    </div>
  );
}
