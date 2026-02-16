"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  getContactInquiries,
  getContactInquiry,
  updateContactInquiry,
  getContactInquiryStats,
  createInquiryReply,
  type ContactInquirySummary,
  type ContactInquiry,
  type InquiryReply,
} from "@/lib/api";

export function InquiriesClient() {
  const [inquiries, setInquiries] = useState<ContactInquirySummary[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    total_inquiries: number;
    by_status: Record<string, number>;
    by_category: Record<string, number>;
  } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const t = useTranslations("admin.inquiries");

  useEffect(() => {
    loadInquiries();
    loadStats();
  }, [statusFilter, categoryFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadInquiries = async () => {
    try {
      setLoading(true);
      const data = await getContactInquiries(statusFilter || undefined, categoryFilter || undefined);
      setInquiries(data);
    } catch (error) {
      console.error("Error loading inquiries:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await getContactInquiryStats();
      setStats(statsData);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleViewInquiry = async (inquiryId: string) => {
    try {
      const inquiry = await getContactInquiry(inquiryId);
      setSelectedInquiry(inquiry);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error("Error loading inquiry details:", error);
    }
  };

  const handleUpdateInquiry = async (inquiryId: string, status: string, adminNotes?: string) => {
    try {
      await updateContactInquiry(inquiryId, {
        status,
        admin_notes: adminNotes
      });

      // Reload inquiries and stats
      await loadInquiries();
      await loadStats();

      // Update selected inquiry if it's the one being updated
      if (selectedInquiry && selectedInquiry.id === inquiryId) {
        const updatedInquiry = await getContactInquiry(inquiryId);
        setSelectedInquiry(updatedInquiry);
      }
    } catch (error) {
      console.error("Error updating inquiry:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-red-100 text-red-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "resolved": return "bg-green-100 text-green-800";
      case "closed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "scheduling": return "bg-blue-100 text-blue-800";
      case "general": return "bg-purple-100 text-purple-800";
      case "business": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{stats.total_inquiries}</div>
              <div className="text-sm text-gray-600">{t("stats.total")}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.by_status.open || 0}</div>
              <div className="text-sm text-gray-600">{t("stats.open")}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.by_status.in_progress || 0}</div>
              <div className="text-sm text-gray-600">{t("stats.inProgress")}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.by_status.resolved || 0}</div>
              <div className="text-sm text-gray-600">{t("stats.resolved")}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t("filters.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="statusFilter">{t("filters.status")}</Label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">{t("filters.allStatuses")}</option>
                <option value="open">{t("status.open")}</option>
                <option value="in_progress">{t("status.inProgress")}</option>
                <option value="resolved">{t("status.resolved")}</option>
                <option value="closed">{t("status.closed")}</option>
              </select>
            </div>
            <div>
              <Label htmlFor="categoryFilter">{t("filters.category")}</Label>
              <select
                id="categoryFilter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">{t("filters.allCategories")}</option>
                <option value="scheduling">{t("category.scheduling")}</option>
                <option value="payment">{t("category.payment")}</option>
                <option value="general">{t("category.general")}</option>
                <option value="business">{t("category.business")}</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={loadInquiries} variant="outline">
                {t("filters.refresh")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inquiries List */}
      <Card>
        <CardHeader>
          <CardTitle>{t("list.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">{t("list.loading")}</div>
          ) : inquiries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">{t("list.empty")}</div>
          ) : (
            <div className="space-y-4">
              {inquiries.map((inquiry) => (
                <div key={inquiry.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(inquiry.status)}`}>
                          {t(`status.${inquiry.status}`)}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(inquiry.category)}`}>
                          {t(`category.${inquiry.category}`)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {inquiry.preferred_language === "zh" ? "中文" : "English"}
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900">{inquiry.subject}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {t("list.from")}: {inquiry.name} ({inquiry.email})
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(inquiry.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewInquiry(inquiry.id)}
                    >
                      {t("list.view")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {isDetailModalOpen && selectedInquiry && (
        <InquiryDetailModal
          inquiry={selectedInquiry}
          onClose={() => setIsDetailModalOpen(false)}
          onUpdate={handleUpdateInquiry}
          t={t}
        />
      )}
    </div>
  );
}

// Inquiry Detail Modal Component
function InquiryDetailModal({
  inquiry,
  onClose,
  onUpdate,
  t,
}: {
  inquiry: ContactInquiry;
  onClose: () => void;
  onUpdate: (inquiryId: string, status: string, adminNotes?: string) => void;
  t: (key: string) => string;
}) {
  const [status, setStatus] = useState(inquiry.status);
  const [adminNotes, setAdminNotes] = useState(inquiry.admin_notes || "");

  // Reply functionality state
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replySubject, setReplySubject] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replySuccess, setReplySuccess] = useState(false);

  const handleSave = () => {
    onUpdate(inquiry.id, status, adminNotes);
    onClose();
  };

  const handleSendReply = async () => {
    if (!replySubject.trim() || !replyMessage.trim()) {
      setReplyError(t("replies.error"));
      return;
    }

    setIsReplying(true);
    setReplyError(null);
    setReplySuccess(false);

    try {
      await createInquiryReply(inquiry.id, {
        subject: replySubject,
        message: replyMessage,
      });

      setReplySuccess(true);
      setShowReplyForm(false);
      setReplySubject("");
      setReplyMessage("");

      // Refresh inquiry data to show new reply
      const updatedInquiry = await getContactInquiry(inquiry.id);
      // Update the inquiry in parent component
      onUpdate(inquiry.id, inquiry.status, inquiry.admin_notes ?? undefined);
    } catch (error) {
      setReplyError(t("replies.error"));
    } finally {
      setIsReplying(false);
    }
  };

  const handleComposeReply = () => {
    setShowReplyForm(true);
    setReplySubject(`Re: ${inquiry.subject}`);
    setReplyError(null);
    setReplySuccess(false);
  };

  const handleCancelReply = () => {
    setShowReplyForm(false);
    setReplySubject("");
    setReplyMessage("");
    setReplyError(null);
  };

  const getReplyStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "sent": return "bg-green-100 text-green-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">{t("detail.title")}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(90vh-120px)]">
          {/* Left Column - Inquiry Details */}
          <div className="overflow-y-auto">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">{t("detail.name")}</Label>
                  <div className="text-sm text-gray-900 mt-1">{inquiry.name}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">{t("detail.email")}</Label>
                  <div className="text-sm text-gray-900 mt-1">{inquiry.email}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">{t("detail.phone")}</Label>
                  <div className="text-sm text-gray-900 mt-1">{inquiry.phone || t("detail.noPhone")}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">{t("detail.language")}</Label>
                  <div className="text-sm text-gray-900 mt-1">
                    {inquiry.preferred_language === "zh" ? "中文" : "English"}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">{t("detail.category")}</Label>
                <div className="text-sm text-gray-900 mt-1">{t(`category.${inquiry.category}`)}</div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">{t("detail.subject")}</Label>
                <div className="text-sm text-gray-900 mt-1">{inquiry.subject}</div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">{t("detail.message")}</Label>
                <div className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded-md whitespace-pre-wrap">
                  {inquiry.message}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">{t("detail.created")}</Label>
                <div className="text-sm text-gray-900 mt-1">
                  {new Date(inquiry.created_at).toLocaleString()}
                </div>
              </div>

              <hr className="my-4" />

              <div>
                <Label htmlFor="status">{t("detail.status")}</Label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="open">{t("status.open")}</option>
                  <option value="in_progress">{t("status.inProgress")}</option>
                  <option value="resolved">{t("status.resolved")}</option>
                  <option value="closed">{t("status.closed")}</option>
                </select>
              </div>

              <div>
                <Label htmlFor="adminNotes">{t("detail.adminNotes")}</Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  placeholder={t("detail.adminNotesPlaceholder")}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <Button onClick={handleSave}>
                  {t("detail.save")}
                </Button>
                <Button variant="outline" onClick={onClose}>
                  {t("detail.cancel")}
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column - Reply History and Composition */}
          <div className="border-l pl-6 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-md font-semibold">{t("replies.title")}</h4>
                {!showReplyForm && (
                  <Button onClick={handleComposeReply} size="sm">
                    {t("replies.compose")}
                  </Button>
                )}
              </div>

              {/* Success Message */}
              {replySuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="text-sm text-green-800">{t("replies.success")}</div>
                </div>
              )}

              {/* Reply History */}
              <div className="space-y-3">
                {inquiry.replies && inquiry.replies.length > 0 ? (
                  inquiry.replies.map((reply: InquiryReply) => (
                    <div key={reply.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-sm text-gray-900">{reply.subject}</h5>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getReplyStatusColor(reply.email_status)}`}>
                          {t(`replies.status.${reply.email_status}`)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap mb-2">{reply.message}</p>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>
                          {new Date(reply.created_at).toLocaleString()}
                        </span>
                        {reply.sent_at && (
                          <span>
                            {t("replies.sentAt")}: {new Date(reply.sent_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                      {reply.error_message && (
                        <div className="text-xs text-red-600 mt-1">
                          {t("replies.errorMessage")}: {reply.error_message}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {t("replies.noReplies")}
                  </div>
                )}
              </div>

              {/* Reply Composition Form */}
              {showReplyForm && (
                <div className="border-t pt-4 space-y-4">
                  <h5 className="font-medium text-sm">{t("replies.compose")}</h5>

                  {replyError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="text-sm text-red-800">{replyError}</div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="replySubject">{t("replies.subject")}</Label>
                    <Input
                      id="replySubject"
                      value={replySubject}
                      onChange={(e) => setReplySubject(e.target.value)}
                      placeholder={t("replies.subjectPlaceholder")}
                      disabled={isReplying}
                    />
                  </div>

                  <div>
                    <Label htmlFor="replyMessage">{t("replies.message")}</Label>
                    <Textarea
                      id="replyMessage"
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      rows={6}
                      placeholder={t("replies.messagePlaceholder")}
                      disabled={isReplying}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleSendReply}
                      disabled={isReplying || !replySubject.trim() || !replyMessage.trim()}
                    >
                      {isReplying ? t("replies.sending") : t("replies.send")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancelReply}
                      disabled={isReplying}
                    >
                      {t("replies.cancel")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}