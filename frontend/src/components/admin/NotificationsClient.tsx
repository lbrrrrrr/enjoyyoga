"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface NotificationTemplate {
  id: string;
  type: string;
  title: string;
  description: string;
  subject_en: string;
  content_en: string;
}

export function NotificationsClient() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [adminAlertsEnabled, setAdminAlertsEnabled] = useState(true);

  const t = useTranslations("admin.notifications");

  const templates: NotificationTemplate[] = [
    {
      id: "1",
      type: "registration_confirmation",
      title: "Registration Confirmation",
      description: "Sent automatically when a user registers for a class",
      subject_en: "Welcome to {{class_name}} - Registration Confirmed!",
      content_en: "Dear {{name}},\n\nYour registration for {{class_name}} has been confirmed!\n\nClass Details:\n- Date: {{date}}\n- Time: {{time}}\n- Teacher: {{teacher_name}}\n\nWe look forward to seeing you!\n\nBest regards,\nEnjoy Yoga Team"
    },
    {
      id: "2",
      type: "reminder_24h",
      title: "Class Reminder",
      description: "Sent 24 hours before the scheduled class",
      subject_en: "Reminder: {{class_name}} tomorrow at {{time}}",
      content_en: "Hi {{name}},\n\nThis is a friendly reminder that you have {{class_name}} scheduled for tomorrow.\n\nClass Details:\n- Date: {{date}}\n- Time: {{time}}\n- Teacher: {{teacher_name}}\n\nSee you there!\n\nBest,\nEnjoy Yoga Team"
    },
    {
      id: "3",
      type: "cancellation",
      title: "Cancellation Notice",
      description: "Sent when a class is cancelled by the studio",
      subject_en: "Class Cancelled: {{class_name}} on {{date}}",
      content_en: "Dear {{name}},\n\nWe regret to inform you that {{class_name}} scheduled for {{date}} at {{time}} has been cancelled.\n\nWe apologize for any inconvenience. Please contact us to reschedule or for a full refund.\n\nThank you for your understanding.\n\nEnjoy Yoga Team"
    }
  ];

  const handleEditTemplate = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    setIsEditModalOpen(true);
    console.log("Edit template:", template.title);
  };

  const handlePreviewTemplate = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    setIsPreviewOpen(true);
    console.log("Preview template:", template.title);
  };

  const handleCreateTemplate = () => {
    console.log("Create new template");
    // Here you would open a form to create a new template
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedTemplate(null);
  };

  const closePreviewModal = () => {
    setIsPreviewOpen(false);
    setSelectedTemplate(null);
  };

  const handleSaveTemplate = () => {
    console.log("Save template changes for:", selectedTemplate?.title);
    closeEditModal();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <Button onClick={handleCreateTemplate}>{t("createTemplate")}</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("emailTemplates")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {templates.map((template) => (
                <div key={template.id} className="border-b pb-4 last:border-b-0">
                  <h4 className="font-medium">{template.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {template.description}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                    >
                      {t("edit")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreviewTemplate(template)}
                    >
                      {t("preview")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("notificationSettings")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-gray-600">Send email confirmations and reminders</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailEnabled}
                  onChange={(e) => setEmailEnabled(e.target.checked)}
                  className="rounded border-gray-300"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">SMS Reminders</p>
                  <p className="text-sm text-gray-600">Send text message reminders</p>
                </div>
                <input
                  type="checkbox"
                  checked={smsEnabled}
                  onChange={(e) => setSmsEnabled(e.target.checked)}
                  className="rounded border-gray-300"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Admin Alerts</p>
                  <p className="text-sm text-gray-600">Notify admins of new registrations</p>
                </div>
                <input
                  type="checkbox"
                  checked={adminAlertsEnabled}
                  onChange={(e) => setAdminAlertsEnabled(e.target.checked)}
                  className="rounded border-gray-300"
                />
              </div>

              <Button className="w-full mt-4" onClick={() => console.log("Save settings")}>
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("recentNotifications")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm">
                <p className="font-medium">Registration Confirmation</p>
                <p className="text-gray-600">Sent to john@example.com</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>

              <div className="text-sm border-t pt-3">
                <p className="font-medium">Class Reminder</p>
                <p className="text-gray-600">Sent to 15 students</p>
                <p className="text-xs text-gray-500">1 day ago</p>
              </div>

              <div className="text-sm border-t pt-3">
                <p className="font-medium">Admin Alert</p>
                <p className="text-gray-600">New registration received</p>
                <p className="text-xs text-gray-500">3 hours ago</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Template Modal */}
      {isEditModalOpen && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">Edit Template: {selectedTemplate.title}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <input
                  type="text"
                  defaultValue={selectedTemplate.subject_en}
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Content</label>
                <textarea
                  rows={10}
                  defaultValue={selectedTemplate.content_en}
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div className="text-sm text-gray-600">
                <p className="font-medium mb-1">Available Variables:</p>
                <p>{`{{name}}`} - Student name</p>
                <p>{`{{class_name}}`} - Class name</p>
                <p>{`{{date}}`} - Class date</p>
                <p>{`{{time}}`} - Class time</p>
                <p>{`{{teacher_name}}`} - Teacher name</p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button onClick={handleSaveTemplate}>
                Save Changes
              </Button>
              <Button variant="outline" onClick={closeEditModal}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Template Modal */}
      {isPreviewOpen && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-medium mb-4">Preview: {selectedTemplate.title}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subject:</label>
                <div className="p-2 bg-gray-50 rounded border">
                  {selectedTemplate.subject_en
                    .replace("{{class_name}}", "Hatha Yoga")
                    .replace("{{date}}", "March 15, 2024")
                    .replace("{{time}}", "9:00 AM")}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Content:</label>
                <div className="p-3 bg-gray-50 rounded border whitespace-pre-line text-sm">
                  {selectedTemplate.content_en
                    .replace(/{{name}}/g, "Jane Doe")
                    .replace(/{{class_name}}/g, "Hatha Yoga")
                    .replace(/{{date}}/g, "March 15, 2024")
                    .replace(/{{time}}/g, "9:00 AM")
                    .replace(/{{teacher_name}}/g, "Sarah Chen")}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={closePreviewModal}>
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}