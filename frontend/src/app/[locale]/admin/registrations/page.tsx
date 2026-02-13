"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAdminRegistrations, updateRegistrationStatus, RegistrationWithSchedule } from "@/lib/admin-api";

export default function AdminRegistrations() {
  const [registrations, setRegistrations] = useState<RegistrationWithSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const t = useTranslations("admin.registrations");

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const data = await getAdminRegistrations();
      setRegistrations(data);
    } catch (err) {
      console.error("Failed to fetch registrations:", err);
      setError(err instanceof Error ? err.message : "Failed to load registrations");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (registrationId: string, newStatus: string) => {
    setUpdating(registrationId);
    try {
      const updatedRegistration = await updateRegistrationStatus(registrationId, newStatus);
      setRegistrations(prev =>
        prev.map(reg =>
          reg.id === registrationId ? updatedRegistration : reg
        )
      );
    } catch (err) {
      console.error("Failed to update registration:", err);
      alert("Failed to update registration status");
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "waitlist":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t("title")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>All Registrations ({registrations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {registrations.length === 0 ? (
              <p className="text-gray-500">No registrations found.</p>
            ) : (
              registrations.map((registration) => (
                <div key={registration.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-lg">{registration.name}</h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(
                            registration.status
                          )}`}
                        >
                          {registration.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{registration.email}</p>
                      {registration.phone && (
                        <p className="text-sm text-gray-600">{registration.phone}</p>
                      )}
                      <div className="mt-2 text-xs text-gray-500 grid grid-cols-2 gap-4">
                        <div>
                          <strong>Language:</strong> {registration.preferred_language}
                        </div>
                        <div>
                          <strong>Email Notifications:</strong>{" "}
                          {registration.email_notifications ? "Yes" : "No"}
                        </div>
                        <div>
                          <strong>SMS Notifications:</strong>{" "}
                          {registration.sms_notifications ? "Yes" : "No"}
                        </div>
                        <div>
                          <strong>Confirmation Sent:</strong>{" "}
                          {registration.email_confirmation_sent ? "Yes" : "No"}
                        </div>
                        {registration.target_date && (
                          <div>
                            <strong>Target Date:</strong> {registration.target_date}
                            {registration.target_time && ` at ${registration.target_time}`}
                          </div>
                        )}
                        <div>
                          <strong>Created:</strong>{" "}
                          {new Date(registration.created_at).toLocaleString()}
                        </div>
                      </div>
                      {registration.message && (
                        <div className="mt-2">
                          <strong className="text-xs text-gray-500">Message:</strong>
                          <p className="text-sm text-gray-700 mt-1">{registration.message}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      {["confirmed", "waitlist", "cancelled"].map((status) => (
                        <Button
                          key={status}
                          variant={registration.status === status ? "default" : "outline"}
                          size="sm"
                          disabled={
                            updating === registration.id || registration.status === status
                          }
                          onClick={() => handleStatusUpdate(registration.id, status)}
                        >
                          {updating === registration.id ? "..." : status}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}