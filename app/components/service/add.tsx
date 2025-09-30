"use client";

import { useState, useEffect } from "react";
import api from "@/app/api/conn";
import AlertNotification from '../menu/notify';

interface Service {
  name: string;
  description: string;
  features: string;
  price: string;
  category: string;
  isActive: boolean;
  icon: string;
}

interface AddServiceProps {
  onClose: () => void;
  onAddService: (service: any) => void;
}

export default function AddService({ onClose, onAddService }: AddServiceProps) {
  const [formData, setFormData] = useState<Service>({
    name: "",
    description: "",
    features: "",
    price: "",
    category: "Development",
    isActive: true,
    icon: "bi bi-gear-wide-connected"
  });

  const [errors, setErrors] = useState<Partial<Record<keyof Service, string>>>({});
  const [result, setResult] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Function to clear messages after a few seconds
  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => {
        setResult(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [result]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof Service, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Service name is required";
    } else if (formData.name.length > 150) {
      newErrors.name = "Service name must be less than 150 characters";
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
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Prepare data for backend API
      const serviceData = {
        name: formData.name,
        description: formData.description,
        features: formData.features,
        price: formData.price,
        category: formData.category,
        isActive: formData.isActive,
        icon: formData.icon
      };

      const response = await api.post('/admin/content/services', serviceData);

      if (response.ok) {
        const result = await response.data;
        if (result.success) {
          setResult("Service added successfully");
          onAddService(result.data);
          handleClose();
        } else {
          setResult(result.error || 'Failed to add service');
        }
      } else {
        setResult('Failed to add service');
      }
    } catch (error) {
      console.error('Error adding service:', error);
      setResult(`Error adding service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      features: "",
      price: "",
      category: "Development",
      isActive: true,
      icon: "bi bi-gear-wide-connected"
    });
    setErrors({});
    setResult(null);
    onClose();
  };

  const handleInputChange = (field: keyof Service, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      {result && <AlertNotification message={result} type={result.includes('success') ? 'success' : 'error'} />}
      
      <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-95 backdrop-blur-xl border border-blue-900/20 shadow-2xl rounded-xl sm:rounded-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 bg-gradient-to-r from-[#0b1c36] to-[#13294b] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-pink-400/20 p-2 sm:p-3 rounded-lg sm:rounded-xl">
              <i className="bi bi-plus-circle text-pink-400 text-lg sm:text-xl"></i>
            </div>
            <div>
              <h2 className="text-white text-lg sm:text-xl font-semibold">Add New Service</h2>
              <p className="text-white/60 text-xs sm:text-sm hidden sm:block">Create a new service offering</p>
            </div>
          </div>
          
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-white/60 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <i className="bi bi-x-lg text-lg sm:text-xl"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            
            {/* Service Name */}
            <div>
              <label className="block text-white font-medium mb-2 text-sm sm:text-base">
                Service Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter service name"
                disabled={isSubmitting}
                maxLength={150}
                className={`w-full bg-white/10 backdrop-blur-sm border rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder-white/60 focus:outline-none transition-colors disabled:opacity-50 text-sm sm:text-base ${
                  errors.name ? "border-red-400 focus:border-red-400" : "border-white/20 focus:border-pink-400"
                }`}
              />
              {errors.name && (
                <p className="text-red-400 text-xs sm:text-sm mt-1 flex items-center gap-1">
                  <i className="bi bi-exclamation-circle flex-shrink-0"></i>
                  <span className="break-words">{errors.name}</span>
                </p>
              )}
            </div>

            {/* Service Description */}
            <div>
              <label className="block text-white font-medium mb-2 text-sm sm:text-base">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe your service offering"
                rows={3}
                disabled={isSubmitting}
                className={`w-full bg-white/10 backdrop-blur-sm border rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder-white/60 focus:outline-none resize-none transition-colors disabled:opacity-50 text-sm sm:text-base ${
                  errors.description ? "border-red-400 focus:border-red-400" : "border-white/20 focus:border-pink-400"
                }`}
              />
              {errors.description && (
                <p className="text-red-400 text-xs sm:text-sm mt-1 flex items-center gap-1">
                  <i className="bi bi-exclamation-circle flex-shrink-0"></i>
                  <span className="break-words">{errors.description}</span>
                </p>
              )}
            </div>

            {/* Service Features */}
            <div>
              <label className="block text-white font-medium mb-2 text-sm sm:text-base">
                Service Features *
              </label>
              <input
                type="text"
                value={formData.features}
                onChange={(e) => handleInputChange("features", e.target.value)}
                placeholder="Enter service features"
                disabled={isSubmitting}
                className={`w-full bg-white/10 backdrop-blur-sm border rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder-white/60 focus:outline-none transition-colors disabled:opacity-50 text-sm sm:text-base ${
                  errors.features ? "border-red-400 focus:border-red-400" : "border-white/20 focus:border-pink-400"
                }`}
              />
              {errors.features && (
                <p className="text-red-400 text-xs sm:text-sm mt-1 flex items-center gap-1">
                  <i className="bi bi-exclamation-circle flex-shrink-0"></i>
                  <span className="break-words">{errors.features}</span>
                </p>
              )}
            </div>

            {/* Price and Category Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Price */}
              <div>
                <label className="block text-white font-medium mb-2 text-sm sm:text-base">
                  Price *
                </label>
                <div className="relative">
                  <i className="bi bi-currency-dollar absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-pink-400"></i>
                  <input
                    type="text"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    placeholder="e.g., $1,500"
                    disabled={isSubmitting}
                    className={`w-full bg-white/10 backdrop-blur-sm border rounded-lg sm:rounded-xl pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-white placeholder-white/60 focus:outline-none transition-colors disabled:opacity-50 text-sm sm:text-base ${
                      errors.price ? "border-red-400 focus:border-red-400" : "border-white/20 focus:border-pink-400"
                    }`}
                  />
                </div>
                {errors.price && (
                  <p className="text-red-400 text-xs sm:text-sm mt-1 flex items-center gap-1">
                    <i className="bi bi-exclamation-circle flex-shrink-0"></i>
                    <span className="break-words">{errors.price}</span>
                  </p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-white font-medium mb-2 text-sm sm:text-base">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange("category", e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:outline-none focus:border-pink-400 transition-colors disabled:opacity-50 text-sm sm:text-base"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value} className="bg-[#0b1c36] text-white">
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Icon Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-white font-medium mb-2 text-sm sm:text-base">
                  Icon
                </label>
                <select
                  value={formData.icon}
                  onChange={(e) => handleInputChange("icon", e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:outline-none focus:border-pink-400 transition-colors disabled:opacity-50 text-sm sm:text-base"
                >
                  {iconOptions.map(option => (
                    <option key={option.value} value={option.value} className="bg-[#0b1c36] text-white">
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="mt-2 flex items-center gap-2 text-white/60 text-xs sm:text-sm">
                  <i className={formData.icon}></i>
                  <span>Preview</span>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-white font-medium mb-2 text-sm sm:text-base">
                  Status
                </label>
                <select
                  value={formData.isActive ? "active" : "inactive"}
                  onChange={(e) => handleInputChange("isActive", e.target.value === "active")}
                  disabled={isSubmitting}
                  className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:outline-none focus:border-pink-400 transition-colors disabled:opacity-50 text-sm sm:text-base"
                >
                  <option value="active" className="bg-[#0b1c36] text-white">Active</option>
                  <option value="inactive" className="bg-[#0b1c36] text-white">Inactive</option>
                </select>
              </div>
            </div>

            {/* Preview Card */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg sm:rounded-xl p-3 sm:p-4">
              <h3 className="text-white font-medium mb-3 flex items-center gap-2 text-sm sm:text-base">
                <i className="bi bi-eye text-pink-400"></i>
                Preview
              </h3>
              <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-sm border border-blue-900/20 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="bg-pink-400/20 p-2 rounded-lg flex-shrink-0">
                    <i className={`${formData.icon} text-pink-400 text-sm sm:text-base`}></i>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-white font-semibold text-sm sm:text-base mb-1 break-words">
                      {formData.name || "Service Name"}
                    </h4>
                    <span className={`inline-block px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium border ${
                      formData.isActive ? "bg-green-400/20 text-green-400 border-green-400/30" :
                      "bg-red-400/20 text-red-400 border-red-400/30"
                    }`}>
                      {formData.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <p className="text-white/80 text-xs sm:text-sm mb-3 break-words">
                  {formData.description || "Service description will appear here"}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-white/60 text-xs sm:text-sm truncate">{formData.category}</span>
                  <span className="text-pink-400 font-semibold text-sm sm:text-base flex-shrink-0">{formData.price || "$0"}</span>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 p-4 sm:p-6 border-t border-white/10 bg-gradient-to-r from-[#0b1c36] to-[#13294b] flex-shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/20 hover:border-white/30 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all duration-200 disabled:opacity-50 text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-3 w-3 sm:h-4 sm:w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="hidden sm:inline">Adding Service...</span>
                <span className="sm:hidden">Adding...</span>
              </>
            ) : (
              <>
                <i className="bi bi-plus-circle"></i>
                <span className="hidden sm:inline">Add Service</span>
                <span className="sm:hidden">Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}