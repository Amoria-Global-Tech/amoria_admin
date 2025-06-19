'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Upload, Image as ImageIcon, DollarSign, Tag, FileText } from 'lucide-react';
import AlertNotification from '../menu/notify';

interface Product {
  name: string;
  description: string;
  price: number | any;
  image: File | null | any;
  category: string;
  is_available: boolean;
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
    is_available: true
  });

  const [errors, setErrors] = useState<Partial<Product>>({});
  const [result, setResult] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
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
      }, 10000); // Hide after 10 seconds
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

    // Validate image file if provided
    if (formData.image) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(formData.image.type)) {
        newErrors.image = 'Image must be JPEG, PNG, or WebP format';
      } else if (formData.image.size > 5 * 1024 * 1024) { // 5MB limit
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
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Clear any existing image error
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
      // Create FormData for multipart/form-data
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price.toString());
      formDataToSend.append('category', formData.category);
      formDataToSend.append('is_available', formData.is_available.toString());
      
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      // Make API call
      const response = await fetch('/api/blog/products/add', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        setResult(errorData.message || 'Failed to add product');
        return;
      }

      const result = await response.json();
      setResult("Product added successfully");
      onAddProduct(result.product || result);
      handleClose();
    } catch (error) {
      console.error('Error adding product:', error);
      setResult(`Error adding product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      image: null,
      category: '',
      is_available: true
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      {result && <AlertNotification message={result} type={result.includes('success') ? 'success':'error'}/>}
      {/* Modal */}
      <div className="relative w-full max-w-2xl">
        <div className="bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 rounded-2xl shadow-2xl sm:pb-8">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-blue-900/20">
            <div>
              <h2 className="text-xl font-bold text-white">
                Add New App
              </h2>
              <p className="text-white/60 mt-1">Create a new app in your inventory</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200 text-white/70 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
            
            {/* Product Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white mb-2">
                <Tag size={16} />
                App Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter app name..."
                className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/40 backdrop-blur-sm focus:outline-none focus:ring-2 transition-all duration-200 ${
                  errors.name ? 'border-red-500 focus:ring-red-500' : 'border-blue-900/20 focus:ring-blue-500'
                }`}
                maxLength={150}
              />
              {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white mb-2">
                <FileText size={16} />
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your app's features..."
                rows={4}
                className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/40 backdrop-blur-sm focus:outline-none focus:ring-2 transition-all duration-200 resize-none ${
                  errors.description ? 'border-red-500 focus:ring-red-500' : 'border-blue-900/20 focus:ring-blue-500'
                }`}
              />
              {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
            </div>

            {/* Price and Category Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Price */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-white mb-2">
                  <DollarSign size={16} />
                  Price *
                </label>
                <input
                  type="number"
                  value={formData.price || ''}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  placeholder="9.99"
                  step="0.01"
                  min="0"
                  className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/40 backdrop-blur-sm focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.price ? 'border-red-500 focus:ring-red-500' : 'border-blue-900/20 focus:ring-blue-500'
                  }`}
                />
                {errors.price && <p className="text-red-400 text-sm mt-1">{errors.price}</p>}
              </div>

              {/* Category */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-white mb-2">
                  <Tag size={16} />
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white backdrop-blur-sm focus:outline-none focus:ring-2 transition-all duration-200 appearance-none cursor-pointer ${
                    errors.category ? 'border-red-500 focus:ring-red-500' : 'border-blue-900/20 focus:ring-blue-500'
                  }`}
                >
                  <option value="" className="bg-[#0b1c36]">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category} className="bg-[#0b1c36]">{category}</option>
                  ))}
                </select>
                {errors.category && <p className="text-red-400 text-sm mt-1">{errors.category}</p>}
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white mb-2">
                <ImageIcon size={16} />
                App Image
              </label>
              <div className={`relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
                errors.image ? 'border-red-500' : 'border-blue-900/40 hover:border-blue-700/60'
              }`}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-white/40" />
                  <p className="mt-2 text-sm text-white/60">
                    <span className="font-medium text-blue-400">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-white/40">PNG, JPG, WebP up to 5MB</p>
                </div>
              </div>
              {errors.image && <p className="text-red-400 text-sm mt-1">{errors.image}</p>}
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-white mb-2">
                  <ImageIcon size={16} />
                  Image Preview
                </label>
                <div className="relative w-full h-48 bg-[#0b1c36] rounded-lg overflow-hidden border border-blue-900/20">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors duration-200"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Availability Toggle */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-blue-900/20">
              <div>
                <h4 className="text-white font-medium">App Availability</h4>
                <p className="text-white/60 text-sm">Set whether this app is currently available for download</p>
              </div>
              <button
                type="button"
                onClick={() => handleInputChange('is_available', !formData.is_available)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0b1c36] ${
                  formData.is_available ? 'bg-blue-600' : 'bg-white/20'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    formData.is_available ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-blue-900/20">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-6 py-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="relative px-6 py-2.5 bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white font-medium rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0b1c36] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-blue-900/20"
              >
                <span className="flex items-center gap-2">
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Adding App...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Add App
                    </>
                  )}
                </span>
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}