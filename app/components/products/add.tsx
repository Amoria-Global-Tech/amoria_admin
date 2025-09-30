'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Upload, Image as ImageIcon, DollarSign, Tag, FileText, Globe } from 'lucide-react';
import api from "@/app/api/conn";
import AlertNotification from '../menu/notify';
import { uploadProductImage } from '@/app/api/utils/storage';

interface Product {
  name: string;
  description: string;
  price: number | any;
  image: File | null | any;
  category: string;
  siteUrl: string;
  isAvailable: boolean;
}

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: any) => void;
}

export default function AddProductModal({ isOpen, onClose, onAddProduct }: AddProductModalProps) {
  const [formData, setFormData] = useState<Product>({
    name: '',
    description: '',
    price: 0,
    image: null,
    category: '',
    siteUrl: '',
    isAvailable: true
  });

  const [errors, setErrors] = useState<Partial<Product>>({});
  const [result, setResult] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    'Productivity',
    'Health & Fitness',
    'Developer Tools',
    'Finance',
    'Education',
    'Social Networking',
    'Entertainment',
    'Photo & Video',
    'Business',
    'Utilities',
    'Games',
    'Other'
  ];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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
    const newErrors: Partial<Product> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'App name is required';
    } else if (formData.name.length > 150) {
      newErrors.name = 'App name must be less than 150 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.siteUrl.trim()) {
      newErrors.siteUrl = 'Site URL is required';
    } else {
      // Validate URL format
      try {
        new URL(formData.siteUrl);
      } catch {
        newErrors.siteUrl = 'Please enter a valid URL (e.g., https://example.com)';
      }
    }

    if (formData.image) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(formData.image.type)) {
        newErrors.image = 'Image must be JPEG, PNG, or WebP format';
      } else if (formData.image.size > 5 * 1024 * 1024) {
        newErrors.image = 'Image must be less than 5MB';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      if (errors.image) {
        setErrors(prev => ({ ...prev, image: undefined }));
      }
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: null }));
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      let imageUrl = '';

      // Upload image to Supabase if provided
      if (formData.image) {
        setUploadingImage(true);
        const uploadResult = await uploadProductImage(formData.image, formData.name);
        setUploadingImage(false);

        if (!uploadResult.success) {
          setResult(`Image upload failed: ${uploadResult.error}`);
          setIsSubmitting(false);
          return;
        }

        imageUrl = uploadResult.url || '';
      }

      // Prepare data for backend API
      const productData = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        category: formData.category,
        imageUrl: imageUrl,
        siteUrl: formData.siteUrl,
        isAvailable: formData.isAvailable !== false
      };

      const response = await api.post('/admin/content/products', productData);

      if (response.ok) {
        const result = await response.data;
        if (result.success) {
          setResult("Product added successfully");
          onAddProduct(result.data);
          handleClose();
        } else {
          setResult(result.error || 'Failed to add product');
        }
      } else {
        setResult('Failed to add product');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      setResult(`Error adding product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
      setUploadingImage(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      image: null,
      category: '',
      siteUrl: '',
      isAvailable: true
    });
    setErrors({});
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleInputChange = (field: keyof Product, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      {result && <AlertNotification message={result} type={result.includes('success') ? 'success':'error'}/>}
      
      <div className="relative w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden overflow-y-visible">
        <div className="bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-95 backdrop-blur-xl border border-blue-900/20 rounded-xl sm:rounded-2xl shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-blue-900/20 flex-shrink-0 bg-gradient-to-r from-[#0b1c36] to-[#13294b]">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Publish New App
              </h2>
              <p className="text-white/60 text-xs sm:text-sm mt-1 hidden sm:block"></p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200 text-white/70 hover:text-white"
            >
              <X size={20} className="sm:hidden" />
              <X size={24} className="hidden sm:block" />
            </button>
          </div>

          {/* Form - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              
              {/* Product Name */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-white mb-2">
                  <Tag size={14} className="sm:hidden" />
                  <Tag size={16} className="hidden sm:block" />
                  App Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter app name..."
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 border rounded-lg text-white placeholder-white/40 backdrop-blur-sm focus:outline-none focus:ring-2 transition-all duration-200 text-sm sm:text-base ${
                    errors.name ? 'border-red-500 focus:ring-red-500' : 'border-blue-900/20 focus:ring-blue-500'
                  }`}
                  maxLength={150}
                />
                {errors.name && <p className="text-red-400 text-xs sm:text-sm mt-1 break-words">{errors.name}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-white mb-2">
                  <FileText size={14} className="sm:hidden" />
                  <FileText size={16} className="hidden sm:block" />
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your app's features..."
                  rows={3}
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 border rounded-lg text-white placeholder-white/40 backdrop-blur-sm focus:outline-none focus:ring-2 transition-all duration-200 resize-none text-sm sm:text-base ${
                    errors.description ? 'border-red-500 focus:ring-red-500' : 'border-blue-900/20 focus:ring-blue-500'
                  }`}
                />
                {errors.description && <p className="text-red-400 text-xs sm:text-sm mt-1 break-words">{errors.description}</p>}
              </div>

              {/* Price and Category Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-white mb-2">
                    <DollarSign size={14} className="sm:hidden" />
                    <DollarSign size={16} className="hidden sm:block" />
                    Price *
                  </label>
                  <input
                    type="number"
                    value={formData.price || ''}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    placeholder="9.99"
                    step="0.01"
                    min="0"
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 border rounded-lg text-white placeholder-white/40 backdrop-blur-sm focus:outline-none focus:ring-2 transition-all duration-200 text-sm sm:text-base ${
                      errors.price ? 'border-red-500 focus:ring-red-500' : 'border-blue-900/20 focus:ring-blue-500'
                    }`}
                  />
                  {errors.price && <p className="text-red-400 text-xs sm:text-sm mt-1 break-words">{errors.price}</p>}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-white mb-2">
                    <Tag size={14} className="sm:hidden" />
                    <Tag size={16} className="hidden sm:block" />
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 border rounded-lg text-white backdrop-blur-sm focus:outline-none focus:ring-2 transition-all duration-200 appearance-none cursor-pointer text-sm sm:text-base ${
                      errors.category ? 'border-red-500 focus:ring-red-500' : 'border-blue-900/20 focus:ring-blue-500'
                    }`}
                  >
                    <option value="" className="bg-[#0b1c36]">Select a category</option>
                    {categories.map(category => (
                      <option key={category} value={category} className="bg-[#0b1c36]">{category}</option>
                    ))}
                  </select>
                  {errors.category && <p className="text-red-400 text-xs sm:text-sm mt-1 break-words">{errors.category}</p>}
                </div>
              </div>

              {/* Site URL */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-white mb-2">
                  <Globe size={14} className="sm:hidden" />
                  <Globe size={16} className="hidden sm:block" />
                  Site URL *
                </label>
                <input
                  type="url"
                  value={formData.siteUrl}
                  onChange={(e) => handleInputChange('siteUrl', e.target.value)}
                  placeholder="https://example.com"
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 border rounded-lg text-white placeholder-white/40 backdrop-blur-sm focus:outline-none focus:ring-2 transition-all duration-200 text-sm sm:text-base ${
                    errors.siteUrl ? 'border-red-500 focus:ring-red-500' : 'border-blue-900/20 focus:ring-blue-500'
                  }`}
                />
                {errors.siteUrl && <p className="text-red-400 text-xs sm:text-sm mt-1 break-words">{errors.siteUrl}</p>}
              </div>

              {/* Image Upload */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-white mb-2">
                  <ImageIcon size={14} className="sm:hidden" />
                  <ImageIcon size={16} className="hidden sm:block" />
                  App Image
                </label>
                <div className={`relative border-2 border-dashed rounded-lg p-4 sm:p-6 transition-all duration-200 ${
                  errors.image ? 'border-red-500' : 'border-blue-900/40 hover:border-blue-700/60'
                }`}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploadingImage}
                  />
                  <div className="text-center">
                    <ImageIcon className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-white/40" />
                    <p className="mt-2 text-xs sm:text-sm text-white/60">
                      <span className="font-medium text-blue-400">Click to upload</span>
                      <span className="hidden sm:inline"> or drag and drop</span>
                    </p>
                    <p className="text-xs text-white/40">PNG, JPG, WebP up to 5MB</p>
                  </div>
                </div>
                {errors.image && <p className="text-red-400 text-xs sm:text-sm mt-1 break-words">{errors.image}</p>}
              </div>

              {/* Image Preview */}
              {imagePreview && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-white mb-2">
                    <ImageIcon size={14} className="sm:hidden" />
                    <ImageIcon size={16} className="hidden sm:block" />
                    Image Preview
                  </label>
                  <div className="relative w-full h-32 sm:h-48 bg-[#0b1c36] rounded-lg overflow-hidden border border-blue-900/20">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors duration-200"
                      disabled={uploadingImage}
                    >
                      <X size={14} className="sm:hidden" />
                      <X size={16} className="hidden sm:block" />
                    </button>
                  </div>
                </div>
              )}

              {/* Availability Toggle */}
              <div className="flex items-center justify-between p-3 sm:p-4 bg-white/5 rounded-lg border border-blue-900/20">
                <div className="flex-1 min-w-0 mr-4">
                  <h4 className="text-white font-medium text-sm sm:text-base">App Availability</h4>
                  <p className="text-white/60 text-xs sm:text-sm mt-1">Set whether this app is currently available for download</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleInputChange('isAvailable', !formData.isAvailable)}
                  className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0b1c36] flex-shrink-0 ${
                    formData.isAvailable ? 'bg-blue-600' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      formData.isAvailable ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </form>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-center gap-3 p-4 sm:p-6 border-t border-blue-900/20 bg-gradient-to-r from-[#0b1c36] to-[#13294b] flex-shrink-0">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting || uploadingImage}
              className="flex-1 px-4 sm:px-6 py-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting || uploadingImage}
              className="flex-1 px-4 sm:px-6 py-2.5 bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0b1c36] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-blue-900/20 text-sm sm:text-base"
            >
              <span className="flex items-center justify-center gap-2">
                {uploadingImage ? (
                  <>
                    <svg className="animate-spin h-3 w-3 sm:h-4 sm:w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="hidden sm:inline">Uploading Image...</span>
                    <span className="sm:hidden">Uploading...</span>
                  </>
                ) : isSubmitting ? (
                  <>
                    <svg className="animate-spin h-3 w-3 sm:h-4 sm:w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="hidden sm:inline">Adding App...</span>
                    <span className="sm:hidden">Adding...</span>
                  </>
                ) : (
                  <>
                    <Upload size={16} className="sm:hidden" />
                    <Upload size={18} className="hidden sm:block" />
                    <span className="hidden sm:inline">Add App</span>
                    <span className="sm:hidden">Add</span>
                  </>
                )}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}