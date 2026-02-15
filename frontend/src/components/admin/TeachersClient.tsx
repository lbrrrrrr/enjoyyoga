"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations, useLocale } from "next-intl";
import { getClassesByTeacher, YogaClass, Teacher } from "@/lib/api";
import { updateTeacher } from "@/lib/admin-api";

interface TeachersClientProps {
  initialTeachers: Teacher[];
}

export function TeachersClient({ initialTeachers }: TeachersClientProps) {
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showClasses, setShowClasses] = useState<string | null>(null);
  const [teacherClasses, setTeacherClasses] = useState<{ [teacherId: string]: YogaClass[] }>({});
  const [loadingClasses, setLoadingClasses] = useState<string | null>(null);

  // Form state for editing
  const [formData, setFormData] = useState({
    name_en: "",
    name_zh: "",
    bio_en: "",
    bio_zh: "",
    qualifications: "",
    photo_url: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const t = useTranslations("admin.teachers");
  const locale = useLocale();

  const handleEditTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      name_en: teacher.name_en,
      name_zh: teacher.name_zh,
      bio_en: teacher.bio_en,
      bio_zh: teacher.bio_zh,
      qualifications: teacher.qualifications,
      photo_url: teacher.photo_url || ""
    });
    setSaveError(null);
    setIsEditModalOpen(true);
  };

  const handleViewClasses = async (teacher: Teacher) => {
    if (showClasses === teacher.id) {
      // If already showing, hide classes
      setShowClasses(null);
      return;
    }

    setShowClasses(teacher.id);
    setLoadingClasses(teacher.id);

    try {
      // Fetch classes if not already loaded
      if (!teacherClasses[teacher.id]) {
        const classes = await getClassesByTeacher(teacher.id);
        setTeacherClasses(prev => ({
          ...prev,
          [teacher.id]: classes
        }));
      }
    } catch (error) {
      console.error("Failed to fetch teacher classes:", error);
      setTeacherClasses(prev => ({
        ...prev,
        [teacher.id]: []
      }));
    } finally {
      setLoadingClasses(null);
    }
  };

  const handleAddTeacher = () => {
    console.log("Add new teacher");
    // Here you would open a form to add a new teacher
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedTeacher(null);
    setSaveError(null);
  };

  const handleSaveTeacher = async () => {
    if (!selectedTeacher) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const updatedTeacher = await updateTeacher(selectedTeacher.id, {
        name_en: formData.name_en,
        name_zh: formData.name_zh,
        bio_en: formData.bio_en,
        bio_zh: formData.bio_zh,
        qualifications: formData.qualifications,
        photo_url: formData.photo_url || null
      });

      // Update the teachers list with the updated teacher
      setTeachers(prev =>
        prev.map(teacher =>
          teacher.id === selectedTeacher.id ? updatedTeacher : teacher
        )
      );

      closeEditModal();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save teacher");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFormChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <Button onClick={handleAddTeacher}>{t("addTeacher")}</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.map((teacher) => (
          <Card key={teacher.id}>
            <CardHeader>
              <CardTitle className="text-lg">
                {locale === "zh" ? teacher.name_zh || teacher.name_en : teacher.name_en}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-gray-700 max-h-20 overflow-hidden">
                  <strong>Bio:</strong>{" "}
                  {locale === "zh"
                    ? teacher.bio_zh || teacher.bio_en
                    : teacher.bio_en}
                </div>
                {teacher.qualifications && (
                  <div className="text-sm text-gray-600">
                    <strong>Qualifications:</strong> {teacher.qualifications}
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditTeacher(teacher)}
                  >
                    {t("edit")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewClasses(teacher)}
                  >
                    {t("viewClasses")}
                  </Button>
                </div>

                {showClasses === teacher.id && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Classes ({teacherClasses[teacher.id]?.length || 0})</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowClasses(null)}
                      >
                        Close
                      </Button>
                    </div>

                    {loadingClasses === teacher.id ? (
                      <p className="text-sm text-gray-600">Loading classes...</p>
                    ) : teacherClasses[teacher.id]?.length > 0 ? (
                      <div className="space-y-2">
                        {teacherClasses[teacher.id].map((yogaClass) => (
                          <div key={yogaClass.id} className="bg-white p-3 rounded border">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h5 className="font-medium text-sm">
                                  {locale === "zh" ? yogaClass.name_zh : yogaClass.name_en}
                                </h5>
                                <p className="text-xs text-gray-600 mt-1">
                                  <strong>Schedule:</strong> {yogaClass.schedule}
                                </p>
                                <p className="text-xs text-gray-600">
                                  <strong>Duration:</strong> {yogaClass.duration_minutes} min
                                </p>
                                <p className="text-xs text-gray-600">
                                  <strong>Difficulty:</strong> {yogaClass.difficulty}
                                </p>
                                <p className="text-xs text-gray-600">
                                  <strong>Capacity:</strong> {yogaClass.capacity}
                                </p>
                                <p className="text-xs text-gray-600">
                                  <strong>Type:</strong> {locale === "zh" ? yogaClass.yoga_type.name_zh : yogaClass.yoga_type.name_en}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">
                        No classes assigned to this teacher yet.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {teachers.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">{t("noTeachers")}</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Teacher Modal */}
      {isEditModalOpen && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Edit Teacher</h3>

            <div className="space-y-4">
              {saveError && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {saveError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Name (English)</label>
                <input
                  type="text"
                  value={formData.name_en}
                  onChange={(e) => handleFormChange("name_en", e.target.value)}
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Name (Chinese)</label>
                <input
                  type="text"
                  value={formData.name_zh}
                  onChange={(e) => handleFormChange("name_zh", e.target.value)}
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Bio (English)</label>
                <textarea
                  value={formData.bio_en}
                  onChange={(e) => handleFormChange("bio_en", e.target.value)}
                  className="w-full p-2 border rounded-md"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Bio (Chinese)</label>
                <textarea
                  value={formData.bio_zh}
                  onChange={(e) => handleFormChange("bio_zh", e.target.value)}
                  className="w-full p-2 border rounded-md"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Qualifications</label>
                <textarea
                  value={formData.qualifications}
                  onChange={(e) => handleFormChange("qualifications", e.target.value)}
                  className="w-full p-2 border rounded-md"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Photo URL</label>
                <input
                  type="url"
                  value={formData.photo_url}
                  onChange={(e) => handleFormChange("photo_url", e.target.value)}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                onClick={handleSaveTeacher}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                variant="outline"
                onClick={closeEditModal}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}