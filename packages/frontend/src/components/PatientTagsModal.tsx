import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import api from "../api/axios";

interface Patient {
    id: string;
    firstName: string;
    middleName?: string | null;
    lastName: string;
    gender?: string;
    dob?: string | null;
    phone?: string;
}

interface TagCategory {
    id: number;
    name: string;
    color: string;
    emoji: string;
    description?: string;
}

interface Tag {
    id: number;
    category_id: number;
    name: string;
    description?: string;
    color?: string;
}

interface PatientTag {
    id: number;
    tag_id: number;
    notes?: string;
    tag_name?: string;
    category_name?: string;
    color?: string;
    category_emoji?: string;
    created_at?: string;
}

interface PatientTagsModalProps {
    patient: Patient;
    onClose: () => void;
    onSave?: () => void;
}

// Default categories for demo (when API not available)
const defaultCategories: TagCategory[] = [
    { id: 1, name: "Medical conditions", color: "#EF4444", emoji: "🔴", description: "Medical conditions and diagnoses" },
    { id: 2, name: "Medical programmes", color: "#22C55E", emoji: "🟢", description: "Enrolled medical programmes" },
    { id: 3, name: "Payment", color: "#F59E0B", emoji: "🟡", description: "Payment and billing related tags" },
    { id: 4, name: "General", color: "#3B82F6", emoji: "🔵", description: "General purpose tags" },
    { id: 5, name: "Allergies", color: "#EC4899", emoji: "💊", description: "Patient allergies" },
    { id: 6, name: "Insurance", color: "#8B5CF6", emoji: "🛡️", description: "Insurance information" },
];

// Default tags for demo
const defaultTags: Tag[] = [
    { id: 1, category_id: 1, name: "Diabetes" },
    { id: 2, category_id: 1, name: "Hypertension" },
    { id: 3, category_id: 1, name: "Asthma" },
    { id: 4, category_id: 2, name: "Maternal Health" },
    { id: 5, category_id: 2, name: "Child Wellness" },
    { id: 6, category_id: 3, name: "Cash Patient" },
    { id: 7, category_id: 3, name: "Insurance Patient" },
    { id: 8, category_id: 3, name: "SHA Member" },
    { id: 9, category_id: 4, name: "VIP Patient" },
    { id: 10, category_id: 4, name: "Staff Family" },
    { id: 11, category_id: 5, name: "Penicillin Allergy" },
    { id: 12, category_id: 5, name: "Latex Allergy" },
    { id: 13, category_id: 6, name: "Jubilee Insurance" },
    { id: 14, category_id: 6, name: "AAR Insurance" },
];

export const PatientTagsModal: React.FC<PatientTagsModalProps> = ({
    patient,
    onClose,
    onSave,
}) => {
    const [categories, setCategories] = useState<TagCategory[]>(defaultCategories);
    const [tags, setTags] = useState<Tag[]>(defaultTags);
    const [patientTags, setPatientTags] = useState<PatientTag[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | "">("");
    const [selectedTag, setSelectedTag] = useState<number | "">("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // New tag form
    const [showNewTagForm, setShowNewTagForm] = useState(false);
    const [newTagCategory, setNewTagCategory] = useState<number | "">("");
    const [newTagName, setNewTagName] = useState("");
    const [newTagDescription, setNewTagDescription] = useState("");

    const getFullName = () =>
        [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(" ");

    const getInitials = () =>
        [patient.firstName?.[0], patient.lastName?.[0]].filter(Boolean).join("").toUpperCase();

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Try to fetch categories
                try {
                    const catRes = await api.get("/tag-categories");
                    if (catRes.data && Array.isArray(catRes.data)) {
                        setCategories(catRes.data);
                    }
                } catch { /* Use defaults */ }

                // Try to fetch tags
                try {
                    const tagRes = await api.get("/tags");
                    if (tagRes.data && Array.isArray(tagRes.data)) {
                        setTags(tagRes.data);
                    }
                } catch { /* Use defaults */ }

                // Fetch patient's current tags
                try {
                    const ptRes = await api.get(`/patients/${patient.id}/tags`);
                    if (ptRes.data && Array.isArray(ptRes.data)) {
                        setPatientTags(ptRes.data);
                    }
                } catch { /* No tags yet */ }
            } catch (err) {
                console.error("Error loading data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [patient.id]);

    // Get filtered tags based on selected category
    const filteredTags = selectedCategory
        ? tags.filter(t => t.category_id === selectedCategory)
        : [];

    // Add existing tag to patient
    const handleAddExistingTag = async () => {
        if (!selectedTag) {
            setError("Please select a tag");
            return;
        }

        // Check if already added
        if (patientTags.some(pt => pt.tag_id === selectedTag)) {
            setError("This tag is already added to the patient");
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            await api.post(`/patients/${patient.id}/tags`, { tag_id: selectedTag });

            const tag = tags.find(t => t.id === selectedTag);
            const category = categories.find(c => c.id === tag?.category_id);

            setPatientTags([...patientTags, {
                id: Date.now(),
                tag_id: selectedTag as number,
                tag_name: tag?.name,
                category_name: category?.name,
                color: category?.color,
                category_emoji: category?.emoji,
                created_at: new Date().toISOString(),
            }]);

            setSuccessMessage("✅ Tag added successfully!");
            setSelectedTag("");
            setSelectedCategory("");
            setTimeout(() => setSuccessMessage(null), 3000);
            onSave?.();
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to add tag");
        } finally {
            setIsSaving(false);
        }
    };

    // Create and add new tag
    const handleCreateAndAddTag = async () => {
        if (!newTagCategory || !newTagName.trim()) {
            setError("Please fill in tag category and name");
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            // Create the tag
            const createRes = await api.post("/tags", {
                category_id: newTagCategory,
                name: newTagName.trim(),
                description: newTagDescription.trim(),
            });

            const newTag = createRes.data as Tag;

            // Add to patient
            await api.post(`/patients/${patient.id}/tags`, { tag_id: newTag.id });

            const category = categories.find(c => c.id === newTagCategory);

            setTags([...tags, newTag]);
            setPatientTags([...patientTags, {
                id: Date.now(),
                tag_id: newTag.id,
                tag_name: newTag.name,
                category_name: category?.name,
                color: category?.color,
                category_emoji: category?.emoji,
                created_at: new Date().toISOString(),
            }]);

            setSuccessMessage("✅ New tag created and added!");
            setNewTagCategory("");
            setNewTagName("");
            setNewTagDescription("");
            setShowNewTagForm(false);
            setTimeout(() => setSuccessMessage(null), 3000);
            onSave?.();
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to create tag");
        } finally {
            setIsSaving(false);
        }
    };

    // Remove tag from patient
    const handleRemoveTag = async (tagId: number) => {
        try {
            await api.delete(`/patients/${patient.id}/tags/${tagId}`);
            setPatientTags(patientTags.filter(pt => pt.tag_id !== tagId));
            setSuccessMessage("🗑️ Tag removed");
            setTimeout(() => setSuccessMessage(null), 3000);
            onSave?.();
        } catch (err) {
            setError("Failed to remove tag");
        }
    };

    return (
        <Dialog.Root open onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-gradient-to-br from-slate-900/60 via-slate-800/50 to-slate-900/60 backdrop-blur-md z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] overflow-y-auto z-50">
                    {/* Main Card */}
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                        {/* 🏷️ Premium Header */}
                        <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600 px-6 py-5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>

                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl shadow-lg backdrop-blur-sm">
                                        🏷️
                                    </div>
                                    <div>
                                        <Dialog.Title className="text-xl font-bold text-white tracking-tight">
                                            Patient Tags
                                        </Dialog.Title>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold text-white">
                                                {getInitials()}
                                            </div>
                                            <span className="text-purple-100 font-medium">{getFullName()}</span>
                                            {patient.gender && (
                                                <span className="text-lg">{patient.gender === 'Male' ? '👨' : '👩'}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <Dialog.Close asChild>
                                    <button
                                        className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-all duration-200 hover:scale-105"
                                    >
                                        ✕
                                    </button>
                                </Dialog.Close>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-5">
                            {/* Messages */}
                            {error && (
                                <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
                                    <span className="text-2xl">⚠️</span>
                                    <div>
                                        <div className="font-semibold text-red-800 text-sm">Error</div>
                                        <div className="text-red-700 text-sm">{error}</div>
                                    </div>
                                    <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
                                </div>
                            )}

                            {successMessage && (
                                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                                    <span className="text-2xl">✅</span>
                                    <div className="text-emerald-700 font-medium text-sm">{successMessage}</div>
                                </div>
                            )}

                            {/* 📋 Current Patient Tags */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        <span className="text-lg">📋</span> Current Tags
                                    </h3>
                                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                                        {patientTags.length} tag{patientTags.length !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                {isLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : patientTags.length === 0 ? (
                                    <div className="bg-slate-50 rounded-2xl p-6 text-center">
                                        <span className="text-4xl mb-3 block">🏷️</span>
                                        <p className="text-slate-600 text-sm">No tags recorded for this patient</p>
                                        <p className="text-slate-400 text-xs mt-1">Add tags below to categorize this patient</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {patientTags.map((pt) => (
                                            <div
                                                key={pt.id}
                                                className="group flex items-center gap-2 px-3 py-2 rounded-xl border-2 bg-white hover:shadow-md transition-all"
                                                style={{ borderColor: pt.color || '#E2E8F0' }}
                                            >
                                                <span>{pt.category_emoji || '🏷️'}</span>
                                                <span className="text-sm font-medium text-slate-700">{pt.tag_name}</span>
                                                <button
                                                    onClick={() => handleRemoveTag(pt.tag_id)}
                                                    className="w-5 h-5 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* ➕ Add Existing Tag Section */}
                            <div className="bg-gradient-to-br from-slate-50 to-purple-50/30 rounded-2xl p-5 space-y-4 border border-slate-200">
                                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <span className="text-lg">➕</span> Add Existing Tag
                                </h3>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Category Selection */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                                            📁 Select Category
                                        </label>
                                        <select
                                            value={selectedCategory}
                                            onChange={(e) => {
                                                setSelectedCategory(e.target.value ? Number(e.target.value) : "");
                                                setSelectedTag("");
                                            }}
                                            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
                                        >
                                            <option value="">Select category...</option>
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.emoji} {cat.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Tag Selection */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                                            🏷️ Select Tag
                                        </label>
                                        <select
                                            value={selectedTag}
                                            onChange={(e) => setSelectedTag(e.target.value ? Number(e.target.value) : "")}
                                            disabled={!selectedCategory}
                                            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-400 transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                                        >
                                            <option value="">Select tag...</option>
                                            {filteredTags.map((tag) => (
                                                <option key={tag.id} value={tag.id}>
                                                    {tag.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <button
                                    onClick={handleAddExistingTag}
                                    disabled={!selectedTag || isSaving}
                                    className="w-full px-4 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSaving ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Adding...
                                        </>
                                    ) : (
                                        <>➕ Add Tag</>
                                    )}
                                </button>
                            </div>

                            {/* 🆕 Create New Tag Section */}
                            <div className="border-t border-slate-200 pt-5">
                                <button
                                    onClick={() => setShowNewTagForm(!showNewTagForm)}
                                    className="w-full px-4 py-3 bg-white border-2 border-dashed border-slate-300 text-slate-600 font-medium rounded-xl hover:border-purple-400 hover:text-purple-600 transition-all flex items-center justify-center gap-2"
                                >
                                    {showNewTagForm ? '➖ Hide New Tag Form' : '✨ Create New Tag'}
                                </button>

                                {showNewTagForm && (
                                    <div className="mt-4 bg-gradient-to-br from-amber-50 to-orange-50/30 rounded-2xl p-5 space-y-4 border border-amber-200">
                                        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                            <span className="text-lg">✨</span> Create & Add New Tag
                                        </h3>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                                                    📁 Tag Category *
                                                </label>
                                                <select
                                                    value={newTagCategory}
                                                    onChange={(e) => setNewTagCategory(e.target.value ? Number(e.target.value) : "")}
                                                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-400 transition-all"
                                                >
                                                    <option value="">Select category...</option>
                                                    {categories.map((cat) => (
                                                        <option key={cat.id} value={cat.id}>
                                                            {cat.emoji} {cat.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                                                    🏷️ Tag Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newTagName}
                                                    onChange={(e) => setNewTagName(e.target.value)}
                                                    placeholder="Enter tag name..."
                                                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-400 transition-all"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                                                    📝 Description (Optional)
                                                </label>
                                                <textarea
                                                    value={newTagDescription}
                                                    onChange={(e) => setNewTagDescription(e.target.value)}
                                                    placeholder="Add a description for this tag..."
                                                    rows={2}
                                                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-400 transition-all resize-none"
                                                />
                                            </div>

                                            <button
                                                onClick={handleCreateAndAddTag}
                                                disabled={!newTagCategory || !newTagName.trim() || isSaving}
                                                className="w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {isSaving ? (
                                                    <>
                                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                        Creating...
                                                    </>
                                                ) : (
                                                    <>✨ Save and Add Tag</>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 🎯 Action Buttons */}
                            <div className="flex gap-3 pt-2">
                                <Dialog.Close asChild>
                                    <button className="flex-1 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 hover:scale-[1.02]">
                                        ✅ Done
                                    </button>
                                </Dialog.Close>
                            </div>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};
