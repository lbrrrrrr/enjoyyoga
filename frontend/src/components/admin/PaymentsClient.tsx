"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  getAdminPayments,
  getPaymentStats,
  confirmPayment,
  cancelPayment,
  type Payment,
  type PaymentStats,
} from "@/lib/admin-api";

export function PaymentsClient() {
  const t = useTranslations("admin.payments");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    try {
      const [paymentsData, statsData] = await Promise.all([
        getAdminPayments(statusFilter || undefined),
        getPaymentStats(),
      ]);
      setPayments(paymentsData);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (paymentId: string) => {
    setActionLoading(true);
    try {
      await confirmPayment(paymentId, adminNotes || undefined);
      setSelectedPayment(null);
      setAdminNotes("");
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to confirm payment");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (paymentId: string) => {
    setActionLoading(true);
    try {
      await cancelPayment(paymentId, adminNotes || undefined);
      setSelectedPayment(null);
      setAdminNotes("");
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to cancel payment");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "refunded":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
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

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-gray-600">{t("totalPayments")}</p>
              <p className="text-2xl font-bold">{stats.total_payments}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-amber-600">{t("pending")}</p>
              <p className="text-2xl font-bold text-amber-600">{stats.pending_payments}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-green-600">{t("confirmed")}</p>
              <p className="text-2xl font-bold text-green-600">{stats.confirmed_payments}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-gray-600">{t("revenue")}</p>
              <p className="text-2xl font-bold">{"\u00a5"}{stats.total_revenue.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status filter */}
      <div className="flex gap-2">
        {["", "pending", "confirmed", "cancelled"].map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(status)}
          >
            {status === "" ? t("all") : t(status)}
          </Button>
        ))}
      </div>

      {/* Payment list */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t("paymentList")} ({payments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-gray-500">{t("noPayments")}</p>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setSelectedPayment(payment);
                    setAdminNotes(payment.admin_notes || "");
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-mono font-medium">{payment.reference_number}</p>
                      <p className="text-sm text-gray-600">
                        {"\u00a5"}{payment.amount.toFixed(2)} - {payment.payment_type}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(payment.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                          payment.status
                        )}`}
                      >
                        {payment.status}
                      </span>
                      {payment.status === "pending" && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfirm(payment.id);
                          }}
                        >
                          {t("confirmBtn")}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <h2 className="text-lg font-bold">{t("paymentDetail")}</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedPayment(null);
                    setAdminNotes("");
                  }}
                >
                  X
                </Button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("referenceNumber")}</span>
                  <span className="font-mono">{selectedPayment.reference_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("amountLabel")}</span>
                  <span>{"\u00a5"}{selectedPayment.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("statusLabel")}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(selectedPayment.status)}`}>
                    {selectedPayment.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("type")}</span>
                  <span>{selectedPayment.payment_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("created")}</span>
                  <span>{new Date(selectedPayment.created_at).toLocaleString()}</span>
                </div>
                {selectedPayment.confirmed_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t("confirmedAt")}</span>
                    <span>{new Date(selectedPayment.confirmed_at).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {selectedPayment.status === "pending" && (
                <>
                  <div>
                    <label className="text-sm text-gray-600">{t("adminNotes")}</label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder={t("adminNotesPlaceholder")}
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => handleConfirm(selectedPayment.id)}
                      disabled={actionLoading}
                    >
                      {actionLoading ? "..." : t("confirmBtn")}
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleCancel(selectedPayment.id)}
                      disabled={actionLoading}
                    >
                      {actionLoading ? "..." : t("cancelBtn")}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
