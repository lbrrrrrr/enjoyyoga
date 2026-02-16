"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations, useLocale } from "next-intl";
import { getClassesByTeacher, YogaClass, Teacher, getYogaTypes, YogaType } from "@/lib/api";
import { createTeacher, updateTeacher, uploadTeacherPhoto, createClass, updateClass, YogaClassCreate } from "@/lib/admin-api";

interface TeachersClientProps {
  initialTeachers: Teacher[];
}

export function TeachersClient({ initialTeachers }: TeachersClientProps) {
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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

  // Form state for adding new teacher
  const [addFormData, setAddFormData] = useState({
    name_en: "",
    name_zh: "",
    bio_en: "",
    bio_zh: "",
    qualifications: "",
    photo_url: ""
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Photo upload state for add teacher modal
  const [addPhotoFile, setAddPhotoFile] = useState<File | null>(null);
  const [addPhotoUploadError, setAddPhotoUploadError] = useState<string | null>(null);

  // Add class modal state
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [selectedTeacherForClass, setSelectedTeacherForClass] = useState<Teacher | null>(null);
  const [yogaTypes, setYogaTypes] = useState<YogaType[]>([]);
  const [classFormData, setClassFormData] = useState({
    name_en: "",
    name_zh: "",
    description_en: "",
    description_zh: "",
    yoga_type_id: "",
    schedule: "",
    duration_minutes: 60,
    difficulty: "beginner",
    capacity: 10,
    price: null as number | null,
    price_usd: null as number | null,
    currency: "CNY"
  });
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [createClassError, setCreateClassError] = useState<string | null>(null);

  // Edit class modal state
  const [isEditClassModalOpen, setIsEditClassModalOpen] = useState(false);
  const [selectedClassForEdit, setSelectedClassForEdit] = useState<YogaClass | null>(null);
  const [editClassFormData, setEditClassFormData] = useState({
    name_en: "",
    name_zh: "",
    description_en: "",
    description_zh: "",
    teacher_id: "",
    yoga_type_id: "",
    schedule: "",
    duration_minutes: 60,
    difficulty: "beginner",
    capacity: 10,
    price: null as number | null,
    price_usd: null as number | null,
    currency: "CNY"
  });
  const [isUpdatingClass, setIsUpdatingClass] = useState(false);
  const [updateClassError, setUpdateClassError] = useState<string | null>(null);

  // Photo upload state
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);

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
    setPhotoUploadError(null);
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
    setAddFormData({
      name_en: "",
      name_zh: "",
      bio_en: "",
      bio_zh: "",
      qualifications: "",
      photo_url: ""
    });
    setCreateError(null);
    setAddPhotoFile(null);
    setAddPhotoUploadError(null);
    setIsAddModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedTeacher(null);
    setSaveError(null);
    setPhotoUploadError(null);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setCreateError(null);
    setAddPhotoFile(null);
    setAddPhotoUploadError(null);
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

  const handleCreateTeacher = async () => {
    setIsCreating(true);
    setCreateError(null);
    setAddPhotoUploadError(null);

    try {
      // First, create the teacher
      let newTeacher = await createTeacher({
        name_en: addFormData.name_en,
        name_zh: addFormData.name_zh,
        bio_en: addFormData.bio_en,
        bio_zh: addFormData.bio_zh,
        qualifications: addFormData.qualifications,
        photo_url: addFormData.photo_url || null
      });

      // If a photo file was selected, upload it
      if (addPhotoFile) {
        try {
          const photoResult = await uploadTeacherPhoto(newTeacher.id, addPhotoFile);
          // Update the teacher with the uploaded photo URL
          newTeacher = { ...newTeacher, photo_url: photoResult.photo_url };
        } catch (photoError) {
          // Teacher was created but photo upload failed - still add to list but show error
          setAddPhotoUploadError(photoError instanceof Error ? photoError.message : "Failed to upload photo");
        }
      }

      // Add the new teacher to the list (with or without photo depending on upload success)
      setTeachers(prev => [...prev, newTeacher]);

      // Only close modal if photo upload succeeded or no photo was selected
      if (!addPhotoFile || !addPhotoUploadError) {
        closeAddModal();
      }
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Failed to create teacher");
    } finally {
      setIsCreating(false);
    }
  };

  const handleFormChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddFormChange = (field: keyof typeof addFormData, value: string) => {
    setAddFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddPhotoFileChange = (file: File | null) => {
    setAddPhotoFile(file);
    setAddPhotoUploadError(null);

    // If a file is selected, clear the URL field to avoid confusion
    if (file) {
      setAddFormData(prev => ({
        ...prev,
        photo_url: ""
      }));
    }
  };

  const handleAddClass = async (teacher: Teacher) => {
    setSelectedTeacherForClass(teacher);
    setClassFormData({
      name_en: "",
      name_zh: "",
      description_en: "",
      description_zh: "",
      yoga_type_id: "",
      schedule: "",
      duration_minutes: 60,
      difficulty: "beginner",
      capacity: 10,
      price: null,
      price_usd: null,
      currency: "CNY"
    });
    setCreateClassError(null);

    // Load yoga types if not already loaded
    if (yogaTypes.length === 0) {
      try {
        const types = await getYogaTypes();
        setYogaTypes(types);
      } catch (error) {
        setCreateClassError("Failed to load yoga types");
        return;
      }
    }

    setIsAddClassModalOpen(true);
  };

  const closeAddClassModal = () => {
    setIsAddClassModalOpen(false);
    setSelectedTeacherForClass(null);
    setCreateClassError(null);
  };

  const handleClassFormChange = (field: keyof typeof classFormData, value: string | number | null) => {
    setClassFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateClass = async () => {
    if (!selectedTeacherForClass) return;

    setIsCreatingClass(true);
    setCreateClassError(null);

    try {
      const newClass = await createClass({
        name_en: classFormData.name_en,
        name_zh: classFormData.name_zh,
        description_en: classFormData.description_en,
        description_zh: classFormData.description_zh,
        teacher_id: selectedTeacherForClass.id,
        yoga_type_id: classFormData.yoga_type_id,
        schedule: classFormData.schedule,
        duration_minutes: classFormData.duration_minutes,
        difficulty: classFormData.difficulty,
        capacity: classFormData.capacity,
        price: classFormData.price,
        price_usd: classFormData.price_usd,
        currency: classFormData.currency
      });

      // Re-fetch classes from API to ensure the list is complete
      const classes = await getClassesByTeacher(selectedTeacherForClass.id);
      setTeacherClasses(prev => ({
        ...prev,
        [selectedTeacherForClass.id]: classes
      }));

      // Show the classes for this teacher if not already showing
      if (showClasses !== selectedTeacherForClass.id) {
        setShowClasses(selectedTeacherForClass.id);
      }

      closeAddClassModal();
    } catch (error) {
      setCreateClassError(error instanceof Error ? error.message : "Failed to create class");
    } finally {
      setIsCreatingClass(false);
    }
  };

  const handleEditClass = async (yogaClass: YogaClass) => {
    setSelectedClassForEdit(yogaClass);
    setEditClassFormData({
      name_en: yogaClass.name_en,
      name_zh: yogaClass.name_zh,
      description_en: yogaClass.description_en,
      description_zh: yogaClass.description_zh,
      teacher_id: yogaClass.teacher_id,
      yoga_type_id: yogaClass.yoga_type_id,
      schedule: yogaClass.schedule,
      duration_minutes: yogaClass.duration_minutes,
      difficulty: yogaClass.difficulty,
      capacity: yogaClass.capacity,
      price: yogaClass.price ?? null,
      price_usd: yogaClass.price_usd ?? null,
      currency: yogaClass.currency || "CNY"
    });
    setUpdateClassError(null);

    // Load yoga types if not already loaded
    if (yogaTypes.length === 0) {
      try {
        const types = await getYogaTypes();
        setYogaTypes(types);
      } catch (error) {
        setUpdateClassError("Failed to load yoga types");
        return;
      }
    }

    setIsEditClassModalOpen(true);
  };

  const closeEditClassModal = () => {
    setIsEditClassModalOpen(false);
    setSelectedClassForEdit(null);
    setUpdateClassError(null);
  };

  const handleEditClassFormChange = (field: keyof typeof editClassFormData, value: string | number | null) => {
    setEditClassFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpdateClass = async () => {
    if (!selectedClassForEdit) return;

    setIsUpdatingClass(true);
    setUpdateClassError(null);

    try {
      const updatedClass = await updateClass(selectedClassForEdit.id, {
        name_en: editClassFormData.name_en,
        name_zh: editClassFormData.name_zh,
        description_en: editClassFormData.description_en,
        description_zh: editClassFormData.description_zh,
        teacher_id: editClassFormData.teacher_id,
        yoga_type_id: editClassFormData.yoga_type_id,
        schedule: editClassFormData.schedule,
        duration_minutes: editClassFormData.duration_minutes,
        difficulty: editClassFormData.difficulty,
        capacity: editClassFormData.capacity,
        price: editClassFormData.price,
        price_usd: editClassFormData.price_usd,
        currency: editClassFormData.currency
      });

      // Update the teacher classes cache with the updated class
      setTeacherClasses(prev => ({
        ...prev,
        [editClassFormData.teacher_id]: (prev[editClassFormData.teacher_id] || []).map(cls =>
          cls.id === selectedClassForEdit.id ? updatedClass : cls
        )
      }));

      // If the teacher changed, also update the new teacher's classes
      if (editClassFormData.teacher_id !== selectedClassForEdit.teacher_id) {
        setTeacherClasses(prev => ({
          ...prev,
          [selectedClassForEdit.teacher_id]: (prev[selectedClassForEdit.teacher_id] || []).filter(cls =>
            cls.id !== selectedClassForEdit.id
          ),
          [editClassFormData.teacher_id]: [
            ...(prev[editClassFormData.teacher_id] || []),
            updatedClass
          ]
        }));
      }

      closeEditClassModal();
    } catch (error) {
      setUpdateClassError(error instanceof Error ? error.message : "Failed to update class");
    } finally {
      setIsUpdatingClass(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (!selectedTeacher) return;

    setUploadingPhoto(true);
    setPhotoUploadError(null);

    try {
      const result = await uploadTeacherPhoto(selectedTeacher.id, file);

      // Update form data with new photo URL
      setFormData(prev => ({
        ...prev,
        photo_url: result.photo_url
      }));

      // Update the teachers list immediately so user sees the change
      setTeachers(prev =>
        prev.map(teacher =>
          teacher.id === selectedTeacher.id
            ? { ...teacher, photo_url: result.photo_url }
            : teacher
        )
      );

    } catch (error) {
      setPhotoUploadError(error instanceof Error ? error.message : "Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
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
                {/* Teacher photo */}
                {teacher.photo_url && (
                  <div className="flex justify-center mb-3">
                    <img
                      src={teacher.photo_url}
                      alt={locale === "zh" ? teacher.name_zh || teacher.name_en : teacher.name_en}
                      className="w-16 h-16 object-cover rounded-full border-2 border-gray-200"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

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
                <div className="flex flex-wrap gap-2 mt-4">
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddClass(teacher)}
                  >
                    Add Class
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
                                  <strong>Price:</strong>{" "}
                                  {(() => {
                                    const cny = yogaClass.price != null && yogaClass.price > 0;
                                    const usd = yogaClass.price_usd != null && yogaClass.price_usd > 0;
                                    if (cny && usd) return `¥${yogaClass.price} / $${yogaClass.price_usd}/session`;
                                    if (cny) return `¥${yogaClass.price}/session`;
                                    if (usd) return `$${yogaClass.price_usd}/session`;
                                    return "Free";
                                  })()}
                                </p>
                                <p className="text-xs text-gray-600">
                                  <strong>Type:</strong> {locale === "zh" ? yogaClass.yoga_type.name_zh : yogaClass.yoga_type.name_en}
                                </p>
                              </div>
                              <div className="ml-3 flex-shrink-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditClass(yogaClass)}
                                  className="text-xs px-2 py-1"
                                >
                                  Edit
                                </Button>
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
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="p-6 pb-4 border-b">
              <h3 className="text-lg font-medium">Edit Teacher</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pt-4">
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
                <label className="block text-sm font-medium mb-1">Photo</label>
                <div className="space-y-3">
                  {/* Current photo preview */}
                  {formData.photo_url && (
                    <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-md">
                      <img
                        src={formData.photo_url}
                        alt="Current teacher photo"
                        className="w-12 h-12 object-cover rounded-md"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <span className="text-sm text-gray-600">Current photo</span>
                    </div>
                  )}

                  {/* Photo upload errors */}
                  {photoUploadError && (
                    <div className="p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                      {photoUploadError}
                    </div>
                  )}

                  {/* File upload */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Upload new photo:</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handlePhotoUpload(file);
                        }
                      }}
                      disabled={uploadingPhoto}
                      className="w-full p-2 border rounded-md text-sm"
                    />
                    {uploadingPhoto && (
                      <p className="text-xs text-blue-600 mt-1">Uploading photo...</p>
                    )}
                  </div>

                  {/* URL input */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Or enter photo URL:</label>
                    <input
                      type="url"
                      value={formData.photo_url}
                      onChange={(e) => handleFormChange("photo_url", e.target.value)}
                      className="w-full p-2 border rounded-md"
                      placeholder="https://example.com/photo.jpg"
                    />
                  </div>
                </div>
              </div>
              </div>
            </div>

            <div className="p-6 pt-4 border-t">
              <div className="flex gap-2">
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
        </div>
      )}

      {/* Add Teacher Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="p-6 pb-4 border-b">
              <h3 className="text-lg font-medium">Add New Teacher</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pt-4">
              <div className="space-y-4">
                {createError && (
                  <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {createError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Name (English)</label>
                  <input
                    type="text"
                    value={addFormData.name_en}
                    onChange={(e) => handleAddFormChange("name_en", e.target.value)}
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter teacher's English name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Name (Chinese)</label>
                  <input
                    type="text"
                    value={addFormData.name_zh}
                    onChange={(e) => handleAddFormChange("name_zh", e.target.value)}
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter teacher's Chinese name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Bio (English)</label>
                  <textarea
                    value={addFormData.bio_en}
                    onChange={(e) => handleAddFormChange("bio_en", e.target.value)}
                    className="w-full p-2 border rounded-md"
                    rows={3}
                    placeholder="Enter teacher's English bio"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Bio (Chinese)</label>
                  <textarea
                    value={addFormData.bio_zh}
                    onChange={(e) => handleAddFormChange("bio_zh", e.target.value)}
                    className="w-full p-2 border rounded-md"
                    rows={3}
                    placeholder="Enter teacher's Chinese bio"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Qualifications</label>
                  <textarea
                    value={addFormData.qualifications}
                    onChange={(e) => handleAddFormChange("qualifications", e.target.value)}
                    className="w-full p-2 border rounded-md"
                    rows={2}
                    placeholder="Enter teacher's qualifications"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Photo</label>
                  <div className="space-y-3">
                    {/* Current photo preview */}
                    {(addFormData.photo_url || addPhotoFile) && (
                      <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-md">
                        {addPhotoFile ? (
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                              <span className="text-xs text-gray-600">File</span>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">Selected file: {addPhotoFile.name}</span>
                              <p className="text-xs text-gray-500">Will be uploaded after teacher creation</p>
                            </div>
                          </div>
                        ) : addFormData.photo_url ? (
                          <>
                            <img
                              src={addFormData.photo_url}
                              alt="Photo preview"
                              className="w-12 h-12 object-cover rounded-md"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <span className="text-sm text-gray-600">Photo from URL</span>
                          </>
                        ) : null}
                      </div>
                    )}

                    {/* Photo upload errors */}
                    {addPhotoUploadError && (
                      <div className="p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                        {addPhotoUploadError}
                      </div>
                    )}

                    {/* File upload */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Upload photo file:</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          handleAddPhotoFileChange(file || null);
                        }}
                        disabled={isCreating}
                        className="w-full p-2 border rounded-md text-sm"
                      />
                      {addPhotoFile && (
                        <button
                          type="button"
                          onClick={() => handleAddPhotoFileChange(null)}
                          className="text-xs text-red-600 mt-1 hover:text-red-800"
                          disabled={isCreating}
                        >
                          Remove selected file
                        </button>
                      )}
                    </div>

                    {/* URL input */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Or enter photo URL:</label>
                      <input
                        type="url"
                        value={addFormData.photo_url}
                        onChange={(e) => {
                          handleAddFormChange("photo_url", e.target.value);
                          // Clear file selection if URL is entered
                          if (e.target.value && addPhotoFile) {
                            setAddPhotoFile(null);
                          }
                        }}
                        disabled={isCreating || !!addPhotoFile}
                        className="w-full p-2 border rounded-md"
                        placeholder="https://example.com/photo.jpg"
                      />
                      {!!addPhotoFile && (
                        <p className="text-xs text-gray-500 mt-1">
                          URL input disabled while file is selected
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 pt-4 border-t">
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateTeacher}
                  disabled={isCreating}
                >
                  {isCreating ? "Creating..." : "Create Teacher"}
                </Button>
                <Button
                  variant="outline"
                  onClick={closeAddModal}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Class Modal */}
      {isAddClassModalOpen && selectedTeacherForClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="p-6 pb-4 border-b">
              <h3 className="text-lg font-medium">
                Add Class for {locale === "zh" ? selectedTeacherForClass.name_zh || selectedTeacherForClass.name_en : selectedTeacherForClass.name_en}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pt-4">
              <div className="space-y-4">
                {createClassError && (
                  <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {createClassError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Class Name (English) *</label>
                  <input
                    type="text"
                    value={classFormData.name_en}
                    onChange={(e) => handleClassFormChange("name_en", e.target.value)}
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter class name in English"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Class Name (Chinese) *</label>
                  <input
                    type="text"
                    value={classFormData.name_zh}
                    onChange={(e) => handleClassFormChange("name_zh", e.target.value)}
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter class name in Chinese"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description (English)</label>
                  <textarea
                    value={classFormData.description_en}
                    onChange={(e) => handleClassFormChange("description_en", e.target.value)}
                    className="w-full p-2 border rounded-md"
                    rows={3}
                    placeholder="Enter class description in English"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description (Chinese)</label>
                  <textarea
                    value={classFormData.description_zh}
                    onChange={(e) => handleClassFormChange("description_zh", e.target.value)}
                    className="w-full p-2 border rounded-md"
                    rows={3}
                    placeholder="Enter class description in Chinese"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Yoga Type *</label>
                  <select
                    value={classFormData.yoga_type_id}
                    onChange={(e) => handleClassFormChange("yoga_type_id", e.target.value)}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="">Select yoga type</option>
                    {yogaTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {locale === "zh" ? type.name_zh || type.name_en : type.name_en}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Schedule *</label>
                  <input
                    type="text"
                    value={classFormData.schedule}
                    onChange={(e) => handleClassFormChange("schedule", e.target.value)}
                    className="w-full p-2 border rounded-md"
                    placeholder="e.g., Monday 10:00-11:00, Weekly on Tuesday 18:00"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Examples: "Monday 10:00-11:00", "Weekly on Tuesday 18:00", "Daily 07:00-08:00"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Duration (minutes) *</label>
                    <input
                      type="number"
                      value={classFormData.duration_minutes}
                      onChange={(e) => handleClassFormChange("duration_minutes", parseInt(e.target.value) || 60)}
                      className="w-full p-2 border rounded-md"
                      min="15"
                      max="180"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Capacity *</label>
                    <input
                      type="number"
                      value={classFormData.capacity}
                      onChange={(e) => handleClassFormChange("capacity", parseInt(e.target.value) || 10)}
                      className="w-full p-2 border rounded-md"
                      min="1"
                      max="50"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Difficulty Level *</label>
                  <select
                    value={classFormData.difficulty}
                    onChange={(e) => handleClassFormChange("difficulty", e.target.value)}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="all-levels">All Levels</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Price per Session (CNY)</label>
                    <input
                      type="number"
                      value={classFormData.price ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleClassFormChange("price", val === "" ? null as unknown as number : parseFloat(val));
                      }}
                      className="w-full p-2 border rounded-md"
                      min="0"
                      step="0.01"
                      placeholder="Leave empty if not available"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      WeChat Pay (leave empty if not available in CNY)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Price per Session (USD)</label>
                    <input
                      type="number"
                      value={classFormData.price_usd ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleClassFormChange("price_usd", val === "" ? null as unknown as number : parseFloat(val));
                      }}
                      className="w-full p-2 border rounded-md"
                      min="0"
                      step="0.01"
                      placeholder="Leave empty if not available"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Venmo (leave empty if not available in USD)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 pt-4 border-t">
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateClass}
                  disabled={isCreatingClass || !classFormData.name_en || !classFormData.name_zh || !classFormData.yoga_type_id || !classFormData.schedule}
                >
                  {isCreatingClass ? "Creating..." : "Create Class"}
                </Button>
                <Button
                  variant="outline"
                  onClick={closeAddClassModal}
                  disabled={isCreatingClass}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {isEditClassModalOpen && selectedClassForEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="p-6 pb-4 border-b">
              <h3 className="text-lg font-medium">
                Edit Class: {locale === "zh" ? selectedClassForEdit.name_zh : selectedClassForEdit.name_en}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pt-4">
              <div className="space-y-4">
                {updateClassError && (
                  <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {updateClassError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Class Name (English) *</label>
                  <input
                    type="text"
                    value={editClassFormData.name_en}
                    onChange={(e) => handleEditClassFormChange("name_en", e.target.value)}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Class Name (Chinese) *</label>
                  <input
                    type="text"
                    value={editClassFormData.name_zh}
                    onChange={(e) => handleEditClassFormChange("name_zh", e.target.value)}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description (English)</label>
                  <textarea
                    value={editClassFormData.description_en}
                    onChange={(e) => handleEditClassFormChange("description_en", e.target.value)}
                    className="w-full p-2 border rounded-md"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description (Chinese)</label>
                  <textarea
                    value={editClassFormData.description_zh}
                    onChange={(e) => handleEditClassFormChange("description_zh", e.target.value)}
                    className="w-full p-2 border rounded-md"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Teacher *</label>
                  <select
                    value={editClassFormData.teacher_id}
                    onChange={(e) => handleEditClassFormChange("teacher_id", e.target.value)}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="">Select teacher</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {locale === "zh" ? teacher.name_zh || teacher.name_en : teacher.name_en}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Yoga Type *</label>
                  <select
                    value={editClassFormData.yoga_type_id}
                    onChange={(e) => handleEditClassFormChange("yoga_type_id", e.target.value)}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="">Select yoga type</option>
                    {yogaTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {locale === "zh" ? type.name_zh || type.name_en : type.name_en}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Schedule *</label>
                  <input
                    type="text"
                    value={editClassFormData.schedule}
                    onChange={(e) => handleEditClassFormChange("schedule", e.target.value)}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Examples: "Monday 10:00-11:00", "Weekly on Tuesday 18:00", "Daily 07:00-08:00"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Duration (minutes) *</label>
                    <input
                      type="number"
                      value={editClassFormData.duration_minutes}
                      onChange={(e) => handleEditClassFormChange("duration_minutes", parseInt(e.target.value) || 60)}
                      className="w-full p-2 border rounded-md"
                      min="15"
                      max="180"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Capacity *</label>
                    <input
                      type="number"
                      value={editClassFormData.capacity}
                      onChange={(e) => handleEditClassFormChange("capacity", parseInt(e.target.value) || 10)}
                      className="w-full p-2 border rounded-md"
                      min="1"
                      max="50"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Difficulty Level *</label>
                  <select
                    value={editClassFormData.difficulty}
                    onChange={(e) => handleEditClassFormChange("difficulty", e.target.value)}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="all-levels">All Levels</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Price per Session (CNY)</label>
                    <input
                      type="number"
                      value={editClassFormData.price ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleEditClassFormChange("price", val === "" ? null as unknown as number : parseFloat(val));
                      }}
                      className="w-full p-2 border rounded-md"
                      min="0"
                      step="0.01"
                      placeholder="Leave empty if not available"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      WeChat Pay (leave empty if not available in CNY)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Price per Session (USD)</label>
                    <input
                      type="number"
                      value={editClassFormData.price_usd ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleEditClassFormChange("price_usd", val === "" ? null as unknown as number : parseFloat(val));
                      }}
                      className="w-full p-2 border rounded-md"
                      min="0"
                      step="0.01"
                      placeholder="Leave empty if not available"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Venmo (leave empty if not available in USD)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 pt-4 border-t">
              <div className="flex gap-2">
                <Button
                  onClick={handleUpdateClass}
                  disabled={isUpdatingClass || !editClassFormData.name_en || !editClassFormData.name_zh || !editClassFormData.teacher_id || !editClassFormData.yoga_type_id || !editClassFormData.schedule}
                >
                  {isUpdatingClass ? "Updating..." : "Update Class"}
                </Button>
                <Button
                  variant="outline"
                  onClick={closeEditClassModal}
                  disabled={isUpdatingClass}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}