"use client";

import { useState } from "react";

interface Service {
  title: string;
  description: string;
  features: string;
  price: string;
  category: string;
  status: "active" | "inactive" | "pending";
  icon: string;
}

interface AddServiceProps {
  onClose: () => void;
  onAdd: (service: Service & { id: number; createdAt: string; updatedAt: string }) => void;
}

export default function AddService({ onClose, onAdd }: AddServiceProps) {
  const [formData, setFormData] = useState<Service>({
    title: "",
    description: "",
    features: "",
    price: "",
    category: "Development",
    status: "active",
    icon: "bi bi-gear-wide-connected"
  });

  const [errors, setErrors] = useState<Partial<Record<keyof Service, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const categories = [
    { value: "Development", label: "Development" },
    { value: "Marketing", label: "Marketing" },
    { value: "Design", label: "Design" },
    { value: "Consulting", label: "Consulting" },
    { value: "Support", label: "Support" }
  ];

  const iconOptions = [
    { value: "bi bi-gear-wide-connected", label: "Services", icon: "bi bi-gear-wide-connected" },
    { value: "bi bi-code-slash", label: "Development", icon: "bi bi-code-slash" },
    { value: "bi bi-megaphone", label: "Marketing", icon: "bi bi-megaphone" },
    { value: "bi bi-palette", label: "Design", icon: "bi bi-palette" },
    { value: "bi bi-search", label: "SEO", icon: "bi bi-search" },
    { value: "bi bi-graph-up", label: "Analytics", icon: "bi bi-graph-up" },
    { value: "bi bi-shield-check", label: "Security", icon: "bi bi-shield-check" },
    { value: "bi bi-cloud", label: "Cloud", icon: "bi bi-cloud" },
    { value: "bi bi-phone", label: "Mobile", icon: "bi bi-phone" },
    { value: "bi bi-camera", label: "Photography", icon: "bi bi-camera" }
  ];

  const statusOptions = [
    { value: "active", label: "Active", color: "text-green-400" },
    { value: "inactive", label: "Inactive", color: "text-red-400" },
    { value: "pending", label: "Pending", color: "text-yellow-400" }
  ];

  const validateForm = () => {
    const newErrors: Partial<Record<keyof Service, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Service title is required";
    }

    if (!formData.features.trim()) {
      newErrors.features = "Service features is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Service description is required";
    }

    if (!formData.price.trim()) {
      newErrors.price = "Service price is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/blog/services/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
      }

      if (data.service) {
       
        //onAdd(data.service);
        //onClose();
      } else {
        throw new Error('Invalid response format');
      }

    } catch (error) {
      console.error('Error adding service:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to add service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof Service, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    // Clear submit error when user makes changes
    if (submitError) {
      setSubmitError(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-95 backdrop-blur-xl border border-blue-900/20 shadow-2xl rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="bg-pink-400/20 p-3 rounded-xl">
              <i className="bi bi-plus-circle text-pink-400 text-xl"></i>
            </div>
            <div>
              <h2 className="text-white text-xl font-semibold">Add New Service</h2>
              <p className="text-white/60 text-sm">Create a new service offering</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-white/60 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <i className="bi bi-x-lg text-xl"></i>
          </button>
        </div>

        {/* Submit Error */}
        {submitError && (
          <div className="mx-6 mt-6 bg-red-500/20 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <i className="bi bi-exclamation-triangle text-red-400 text-xl"></i>
              <div>
                <h3 className="text-red-400 font-semibold">Error</h3>
                <p className="text-red-300">{submitError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Service Title */}
          <div>
            <label className="block text-white font-medium mb-2">
              Service Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Enter service title"
              disabled={isSubmitting}
              className={`w-full bg-white/10 backdrop-blur-sm border rounded-xl px-4 py-3 text-white placeholder-white/60 focus:outline-none transition-colors disabled:opacity-50 ${
                errors.title ? "border-red-400 focus:border-red-400" : "border-white/20 focus:border-pink-400"
              }`}
            />
            {errors.title && (
              <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                <i className="bi bi-exclamation-circle"></i>
                {errors.title}
              </p>
            )}
          </div>

          {/* Service Description */}
          <div>
            <label className="block text-white font-medium mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Describe your service offering"
              rows={4}
              disabled={isSubmitting}
              className={`w-full bg-white/10 backdrop-blur-sm border rounded-xl px-4 py-3 text-white placeholder-white/60 focus:outline-none resize-none transition-colors disabled:opacity-50 ${
                errors.description ? "border-red-400 focus:border-red-400" : "border-white/20 focus:border-pink-400"
              }`}
            />
            {errors.description && (
              <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                <i className="bi bi-exclamation-circle"></i>
                {errors.description}
              </p>
            )}
          </div>

           {/* Service features */}
           <div>
            <label className="block text-white font-medium mb-2">
              Service features *
            </label>
            <input
              type="text"
              value={formData.features}
              onChange={(e) => handleChange("features", e.target.value)}
              placeholder="Enter service features"
              disabled={isSubmitting}
              className={`w-full bg-white/10 backdrop-blur-sm border rounded-xl px-4 py-3 text-white placeholder-white/60 focus:outline-none transition-colors disabled:opacity-50 ${
                errors.features ? "border-red-400 focus:border-red-400" : "border-white/20 focus:border-pink-400"
              }`}
            />
            {errors.features && (
              <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                <i className="bi bi-exclamation-circle"></i>
                {errors.features}
              </p>
            )}
          </div>

          {/* Price and Category Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Price */}
            <div>
              <label className="block text-white font-medium mb-2">
                Price *
              </label>
              <div className="relative">
                <i className="bi bi-currency-dollar absolute left-4 top-1/2 transform -translate-y-1/2 text-pink-400"></i>
                <input
                  type="text"
                  value={formData.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  placeholder="e.g., $1,500"
                  disabled={isSubmitting}
                  className={`w-full bg-white/10 backdrop-blur-sm border rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/60 focus:outline-none transition-colors disabled:opacity-50 ${
                    errors.price ? "border-red-400 focus:border-red-400" : "border-white/20 focus:border-pink-400"
                  }`}
                />
              </div>
              {errors.price && (
                <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                  <i className="bi bi-exclamation-circle"></i>
                  {errors.price}
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-white font-medium mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-400 transition-colors disabled:opacity-50"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value} className="bg-[#0b1c36] text-white">
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Icon and Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Icon Selection */}
            <div>
              <label className="block text-white font-medium mb-2">
                Icon
              </label>
              <select
                value={formData.icon}
                onChange={(e) => handleChange("icon", e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-400 transition-colors disabled:opacity-50"
              >
                {iconOptions.map(option => (
                  <option key={option.value} value={option.value} className="bg-[#0b1c36] text-white">
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="mt-2 flex items-center gap-2 text-white/60 text-sm">
                <i className={formData.icon}></i>
                <span>Preview</span>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-white font-medium mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange("status", e.target.value as "active" | "inactive" | "pending")}
                disabled={isSubmitting}
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-400 transition-colors disabled:opacity-50"
              >
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value} className="bg-[#0b1c36] text-white">
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Preview Card */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <i className="bi bi-eye text-pink-400"></i>
              Preview
            </h3>
            <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-sm border border-blue-900/20 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-pink-400/20 p-2 rounded-lg">
                  <i className={`${formData.icon} text-pink-400`}></i>
                </div>
                <div>
                  <h4 className="text-white font-semibold">
                    {formData.title || "Service Title"}
                  </h4>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${
                    formData.status === "active" ? "bg-green-400/20 text-green-400 border-green-400/30" :
                    formData.status === "inactive" ? "bg-red-400/20 text-red-400 border-red-400/30" :
                    "bg-yellow-400/20 text-yellow-400 border-yellow-400/30"
                  }`}>
                    {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                  </span>
                </div>
              </div>
              <p className="text-white/80 text-sm mb-3">
                {formData.description || "Service description will appear here"}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-sm">{formData.category}</span>
                <span className="text-pink-400 font-semibold">{formData.price || "$0"}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/20 hover:border-white/30 px-6 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <i className="bi bi-arrow-clockwise animate-spin"></i>
                  Adding...
                </>
              ) : (
                <>
                  <i className="bi bi-plus-circle"></i>
                  Add Service
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}