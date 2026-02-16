"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations, useLocale } from "next-intl";
import { YogaType } from "@/lib/api";
import { createYogaType, updateYogaType, YogaTypeCreate } from "@/lib/admin-api";

interface YogaTypesClientProps {
  initialYogaTypes: YogaType[];
}

export function YogaTypesClient({ initialYogaTypes }: YogaTypesClientProps) {
  const [yogaTypes, setYogaTypes] = useState<YogaType[]>(initialYogaTypes);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedYogaType, setSelectedYogaType] = useState<YogaType | null>(null);

  // Form state for editing/adding
  const [formData, setFormData] = useState({
    name_en: "",
    name_zh: "",
    description_en: "",
    description_zh: "",
    image_url: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const locale = useLocale();

  const handleEditYogaType = (yogaType: YogaType) => {
    setSelectedYogaType(yogaType);
    setFormData({
      name_en: yogaType.name_en,
      name_zh: yogaType.name_zh,
      description_en: yogaType.description_en,
      description_zh: yogaType.description_zh,
      image_url: yogaType.image_url || ""
    });
    setSaveError(null);
    setIsEditModalOpen(true);
  };

  const handleAddYogaType = () => {
    setFormData({
      name_en: "",
      name_zh: "",
      description_en: "",
      description_zh: "",
      image_url: ""
    });
    setSaveError(null);
    setIsAddModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedYogaType(null);
    setSaveError(null);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setSaveError(null);
  };

  const handleSaveYogaType = async () => {
    if (!selectedYogaType) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const updatedYogaType = await updateYogaType(selectedYogaType.id, {
        name_en: formData.name_en,
        name_zh: formData.name_zh,
        description_en: formData.description_en,
        description_zh: formData.description_zh,
        image_url: formData.image_url || null
      });

      // Update the yoga types list with the updated yoga type
      setYogaTypes(prev =>
        prev.map(yogaType =>
          yogaType.id === selectedYogaType.id ? updatedYogaType : yogaType
        )
      );

      closeEditModal();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save yoga type");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateYogaType = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const newYogaType = await createYogaType({
        name_en: formData.name_en,
        name_zh: formData.name_zh,
        description_en: formData.description_en,
        description_zh: formData.description_zh,
        image_url: formData.image_url || null
      });

      // Add the new yoga type to the list
      setYogaTypes(prev => [...prev, newYogaType]);

      closeAddModal();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to create yoga type");
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
        <h1 className="text-3xl font-bold">Yoga Types</h1>
        <Button onClick={handleAddYogaType}>Add Yoga Type</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {yogaTypes.map((yogaType) => (
          <Card key={yogaType.id}>
            <CardHeader>
              <CardTitle className="text-lg">
                {locale === "zh" ? yogaType.name_zh || yogaType.name_en : yogaType.name_en}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* Yoga type image */}
                {yogaType.image_url && (
                  <div className="flex justify-center mb-3">
                    <img
                      src={yogaType.image_url}
                      alt={locale === "zh" ? yogaType.name_zh || yogaType.name_en : yogaType.name_en}
                      className="w-16 h-16 object-cover rounded-md border-2 border-gray-200"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                <div className="text-sm text-gray-700 max-h-20 overflow-hidden">
                  <strong>Description:</strong>{" "}
                  {locale === "zh"
                    ? yogaType.description_zh || yogaType.description_en
                    : yogaType.description_en}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditYogaType(yogaType)}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {yogaTypes.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">No yoga types found. Add one to get started!</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Yoga Type Modal */}
      {isEditModalOpen && selectedYogaType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="p-6 pb-4 border-b">
              <h3 className="text-lg font-medium">Edit Yoga Type</h3>
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
                  <label className="block text-sm font-medium mb-1">Description (English)</label>
                  <textarea
                    value={formData.description_en}
                    onChange={(e) => handleFormChange("description_en", e.target.value)}
                    className="w-full p-2 border rounded-md"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description (Chinese)</label>
                  <textarea
                    value={formData.description_zh}
                    onChange={(e) => handleFormChange("description_zh", e.target.value)}
                    className="w-full p-2 border rounded-md"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Image URL (Optional)</label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => handleFormChange("image_url", e.target.value)}
                    className="w-full p-2 border rounded-md"
                    placeholder="https://example.com/image.jpg"
                  />
                  {formData.image_url && (
                    <div className="mt-2">
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded-md"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 pt-4 border-t">
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveYogaType}
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

      {/* Add Yoga Type Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="p-6 pb-4 border-b">
              <h3 className="text-lg font-medium">Add New Yoga Type</h3>
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
                    placeholder="Enter yoga type name in English"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Name (Chinese)</label>
                  <input
                    type="text"
                    value={formData.name_zh}
                    onChange={(e) => handleFormChange("name_zh", e.target.value)}
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter yoga type name in Chinese"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description (English)</label>
                  <textarea
                    value={formData.description_en}
                    onChange={(e) => handleFormChange("description_en", e.target.value)}
                    className="w-full p-2 border rounded-md"
                    rows={3}
                    placeholder="Enter description in English"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description (Chinese)</label>
                  <textarea
                    value={formData.description_zh}
                    onChange={(e) => handleFormChange("description_zh", e.target.value)}
                    className="w-full p-2 border rounded-md"
                    rows={3}
                    placeholder="Enter description in Chinese"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Image URL (Optional)</label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => handleFormChange("image_url", e.target.value)}
                    className="w-full p-2 border rounded-md"
                    placeholder="https://example.com/image.jpg"
                  />
                  {formData.image_url && (
                    <div className="mt-2">
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded-md"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 pt-4 border-t">
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateYogaType}
                  disabled={isSaving}
                >
                  {isSaving ? "Creating..." : "Create Yoga Type"}
                </Button>
                <Button
                  variant="outline"
                  onClick={closeAddModal}
                  disabled={isSaving}
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