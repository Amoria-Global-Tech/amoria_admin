'use client';

import { useState, useEffect } from 'react';
import { X, Globe } from 'lucide-react';
import api from "@/app/api/conn";
import { uploadProductImage } from '@/app/api/utils/storage';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  siteUrl: string;
  category: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onUpdateProduct: (product: Product) => void;
}

export default function EditProductModal({ 
  isOpen, 
  onClose, 
  product, 
  onUpdateProduct 
}: EditProductModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    siteUrl: '',
    isAvailable: true,
    image: null as File | null
  });
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price.toString(),
        category: product.category || '',
        siteUrl: product.siteUrl || '',
        isAvailable: product.isAvailable,
        image: null
      });
      setImagePreview(product.imageUrl || '');
    }
  }, [product]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: target.checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Product name is required');
      return false;
    }

    if (!formData.description.trim()) {
      setError('Description is required');
      return false;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Price must be greater than 0');
      return false;
    }

    if (!formData.category) {
      setError('Category is required');
      return false;
    }

    if (!formData.siteUrl.trim()) {
      setError('Site URL is required');
      return false;
    }

    // Validate URL format
    try {
      new URL(formData.siteUrl);
    } catch {
      setError('Please enter a valid URL (e.g., https://example.com)');
      return false;
    }

    if (formData.image) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(formData.image.type)) {
        setError('Image must be JPEG, PNG, or WebP format');
        return false;
      }

      if (formData.image.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      let imageUrl = product.imageUrl || ''; // Keep existing image URL by default

      // Upload new image to Supabase if a new image was selected
      if (formData.image) {
        setUploadingImage(true);
        const uploadResult = await uploadProductImage(formData.image, formData.name);
        setUploadingImage(false);

        if (!uploadResult.success) {
          setError(`Image upload failed: ${uploadResult.error}`);
          setLoading(false);
          return;
        }

        imageUrl = uploadResult.url || '';
      }

      // Prepare data for backend API to match expected format
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        imageUrl: imageUrl,
        siteUrl: formData.siteUrl,
        isAvailable: formData.isAvailable !== false
      };

      const response = await api.put(`/admin/content/products/${product.id}`, productData);

      if (response.ok) {
        const result = await response.data;
        if (result.success) {
          onUpdateProduct(result.data);
          onClose();
        } else {
          setError(result.error || 'Failed to update product');
        }
      } else {
        setError('Failed to update product');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product');
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-[#0b1c36] to-[#13294b] rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-blue-900/20 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Edit Product</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {uploadingImage && (
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 mb-4">
            <p className="text-blue-300 text-sm flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Uploading image...
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:border-pink-400 transition-colors"
                placeholder="Enter product name"
              />
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={3}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:border-pink-400 transition-colors resize-none"
                placeholder="Enter product description"
              />
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Price *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:border-pink-400 transition-colors"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Category *
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:border-pink-400 transition-colors"
                placeholder="Enter category"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-white/80 text-sm font-medium mb-2">
                <Globe size={16} />
                Site URL *
              </label>
              <input
                type="url"
                name="siteUrl"
                value={formData.siteUrl}
                onChange={handleInputChange}
                required
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:border-pink-400 transition-colors"
                placeholder="https://example.com"
              />
            </div>

            {imagePreview && (
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Current Image
                </label>
                <div className="relative w-full h-40 bg-white/5 rounded-lg overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Update Image (optional)
              </label>
              <input
                type="file"
                name="image"
                onChange={handleImageChange}
                accept="image/*"
                disabled={uploadingImage}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-400 file:text-white hover:file:bg-pink-500 transition-colors disabled:opacity-50"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isAvailable"
                id="isAvailable"
                checked={formData.isAvailable}
                onChange={handleInputChange}
                className="w-4 h-4 text-pink-400 bg-white/10 border-white/20 rounded focus:ring-pink-400 focus:ring-2"
              />
              <label htmlFor="isAvailable" className="text-white/80 text-sm">
                Product is available
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || uploadingImage}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="flex-1 bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadingImage ? 'Uploading...' : loading ? 'Updating...' : 'Update Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}