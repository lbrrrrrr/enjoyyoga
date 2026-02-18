"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getAdminConsents,
  getConsentStats,
  getYogaTypes,
  type ConsentListItem,
  type ConsentStats,
  type YogaType,
} from "@/lib/api";

export function ConsentsClient() {
  const t = useTranslations("admin.consents");
  const locale = useLocale();
  const [consents, setConsents] = useState<ConsentListItem[]>([]);
  const [stats, setStats] = useState<ConsentStats | null>(null);
  const [yogaTypes, setYogaTypes] = useState<YogaType[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailFilter, setEmailFilter] = useState("");
  const [yogaTypeFilter, setYogaTypeFilter] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [consentsData, statsData, yogaTypesData] = await Promise.all([
        getAdminConsents(
          emailFilter || undefined,
          yogaTypeFilter || undefined
        ),
        getConsentStats(),
        getYogaTypes(),
      ]);
      setConsents(consentsData);
      setStats(statsData);
      setYogaTypes(yogaTypesData);
    } catch {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  }, [emailFilter, yogaTypeFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getYogaTypeName = (item: ConsentListItem) =>
    locale === "zh"
      ? item.yoga_type_name_zh || item.yoga_type_name_en
      : item.yoga_type_name_en || item.yoga_type_name_zh;

  const handleSearch = () => {
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <div className="text-sm text-gray-600">{t("stats.total")}</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          {stats.by_yoga_type.slice(0, 3).map((yt) => (
            <div key={yt.yoga_type_id} className="bg-white rounded-lg border p-4">
              <div className="text-sm text-gray-600">
                {locale === "zh" ? yt.name_zh : yt.name_en}
              </div>
              <div className="text-2xl font-bold text-gray-900">{yt.count}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <Label>{t("filters.email")}</Label>
            <Input
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              placeholder={t("filters.emailPlaceholder")}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <Label>{t("filters.yogaType")}</Label>
            <select
              value={yogaTypeFilter}
              onChange={(e) => setYogaTypeFilter(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">{t("filters.allYogaTypes")}</option>
              {yogaTypes.map((yt) => (
                <option key={yt.id} value={yt.id}>
                  {locale === "zh" ? yt.name_zh : yt.name_en}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={handleSearch}>{t("filters.search")}</Button>
        </div>
      </div>

      {/* Consent Records Table */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">{t("list.title")}</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">{t("list.loading")}</div>
        ) : consents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">{t("list.empty")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">{t("list.name")}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">{t("list.email")}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">{t("list.yogaType")}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">{t("list.version")}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">{t("list.signedAt")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {consents.map((consent) => (
                  <tr key={consent.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{consent.name}</td>
                    <td className="px-4 py-3 text-gray-600">{consent.email}</td>
                    <td className="px-4 py-3">{getYogaTypeName(consent)}</td>
                    <td className="px-4 py-3 text-gray-500">{consent.consent_text_version}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(consent.signed_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
