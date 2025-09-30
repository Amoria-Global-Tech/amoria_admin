'use client';

import { useState } from 'react';
import { Edit, Trash2, Eye, EyeOff, ExternalLink, Globe } from 'lucide-react';
import api from "@/app/api/conn";

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

interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (id: number) => void;
  onToggleAvailability?: (id: number) => void;
  isDeleting?: boolean;
}

export default function ProductCard({ 
  product, 
  onEdit, 
  onDelete, 
  onToggleAvailability,
  isDeleting = false
}: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  function formatDate(dateString: any) {
    const date = new Date(dateString);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const year = date.getFullYear();
    const month = months[date.getMonth()];
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const prefix = Number(hours) < 12 ? 'AM' : 'PM'
    return `${month}, ${day} ${year} ${hours}:${minutes} ${prefix}`;
  }

  const getDisplayUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const handleToggleAvailability = async () => {
    if (isToggling) return;
    
    setIsToggling(true);
    try {
      const response = await api.put(`/admin/content/products/${product.id}`, 
        {
          isAvailable: !product.isAvailable
        });

      if (response.ok) {
        const result = await response.data;
        if (result.success) {
          onToggleAvailability?.(product.id);
        } else {
          console.error('Failed to toggle availability:', result.error);
          alert('Failed to update availability');
        }
      } else {
        console.error('Failed to toggle availability');
        alert('Failed to update availability');
      }
    } catch (error) {
      console.error('Error toggling availability:', error);
      alert('Failed to update availability');
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    
    const confirmDelete = window.confirm('Are you sure you want to delete this product?');
    if (!confirmDelete) return;

    try {
      const response = await api.delete(`/admin/content/products/${product.id}`);

      if (response.ok) {
        const result = await response.data;
        if (result.success) {
          onDelete?.(product.id);
        } else {
          console.error('Failed to delete product:', result.error);
          alert('Failed to delete product');
        }
      } else {
        console.error('Failed to delete product');
        alert('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const handleVisitSite = () => {
    if (product.siteUrl) {
      try {
        let url = product.siteUrl;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }
        window.open(url, '_blank', 'noopener,noreferrer');
      } catch (error) {
        console.error('Invalid URL:', error);
        alert('Invalid URL');
      }
    }
  };
  
  return (
    <div className="group relative w-full">
      {/* Card Container - Compact dimensions */}
      <div className="bg-gradient-to-b from-[#0b1c36]/80 to-[#13294b]/80 backdrop-blur-sm border border-blue-900/20 rounded-lg overflow-hidden hover:from-[#0b1c36] hover:to-[#13294b] transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20 flex flex-col">
        
        {/* Image Container - Compact height */}
        <div className="relative h-40 overflow-hidden bg-gradient-to-br from-[#0b1c36] to-[#13294b] flex-shrink-0">
          {!imageError ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className={`w-full h-full object-cover transition-all duration-300 ${
                imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
              } group-hover:scale-105`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0b1c36] to-[#13294b]">
              <div className="text-5xl text-white/40">📦</div>
            </div>
          )}
          
          {/* Availability Badge */}
          <div className="absolute top-3 left-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
              product.isAvailable 
                ? 'bg-green-500/80 text-white border border-green-400/50' 
                : 'bg-red-500/80 text-white border border-red-400/50'
            }`}>
              {product.isAvailable ? 'Available' : 'Unavailable'}
            </span>
          </div>

          {/* Site URL Badge */}
          {product.siteUrl && (
            <div className="absolute top-3 right-3">
              <button
                onClick={handleVisitSite}
                disabled={isDeleting || isToggling}
                className="px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm bg-blue-500/80 text-white border border-blue-400/50 hover:bg-blue-600/80 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                title={`Visit ${getDisplayUrl(product.siteUrl)}`}
              >
                <Globe size={10} />
                <span className="hidden sm:inline">{getDisplayUrl(product.siteUrl)}</span>
              </button>
            </div>
          )}

          {/* Loading Overlay for Delete */}
          {isDeleting && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <div className="text-white flex items-center gap-3 bg-black/40 px-4 py-2 rounded-lg">
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                <span className="font-medium">Deleting...</span>
              </div>
            </div>
          )}

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>

        {/* Content - Compact layout */}
        <div className="p-3 flex-1 flex flex-col">
          {/* Product Name */}
          <h3 className="font-semibold text-lg text-white mb-2 line-clamp-1 group-hover:text-blue-300 transition-colors duration-200">
            {product.name}
          </h3>
          
          {/* Category and Price Row */}
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 text-white/70 text-xs font-medium rounded-full border border-white/20">
              <i className="bi bi-tag text-white/60"></i>
              {product.category}
            </span>
            <span className="text-xl text-pink-400 font-bold">
              {formatPrice(product.price)}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-white/60 mb-3 line-clamp-2 leading-relaxed flex-1">
            {product.description}
          </p>

          {/* Action Buttons - Compact layout */}
          <div className="flex items-center gap-2">
            {/* Edit Button */}
            <button
              onClick={() => onEdit?.(product)}
              disabled={isDeleting || isToggling}
              className="flex-1 flex items-center justify-center gap-1 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white px-2 py-2 rounded-lg transition-all duration-200 border border-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Edit size={14} />
              <span className="text-xs font-medium">Edit</span>
            </button>

            {/* Toggle Availability */}
            <button
              onClick={handleToggleAvailability}
              disabled={isDeleting || isToggling}
              className={`p-2 rounded-lg transition-all duration-200 border disabled:opacity-50 disabled:cursor-not-allowed ${
                product.isAvailable
                  ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border-orange-500/30'
                  : 'bg-green-500/20 hover:bg-green-500/30 text-green-300 border-green-500/30'
              }`}
              title={product.isAvailable ? 'Mark as unavailable' : 'Mark as available'}
            >
              {isToggling ? (
                <div className="animate-spin w-3.5 h-3.5 border border-current border-t-transparent rounded-full"></div>
              ) : product.isAvailable ? (
                <EyeOff size={14} />
              ) : (
                <Eye size={14} />
              )}
            </button>

            {/* Delete Button */}
            <button
              onClick={handleDelete}
              disabled={isDeleting || isToggling}
              className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 rounded-lg transition-all duration-200 border border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete product"
            >
              {isDeleting ? (
                <div className="animate-spin w-3.5 h-3.5 border border-current border-t-transparent rounded-full"></div>
              ) : (
                <Trash2 size={14} />
              )}
            </button>

            {/* Visit Site Button */}
            <button
              onClick={handleVisitSite}
              disabled={isDeleting || isToggling || !product.siteUrl}
              className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-blue-200 rounded-lg transition-all duration-200 border border-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              title={product.siteUrl ? `Visit ${getDisplayUrl(product.siteUrl)}` : 'No site URL available'}
            >
              <ExternalLink size={14} />
            </button>
          </div>
        </div>

        {/* Hover Effect Overlay */}
        <div className="absolute inset-0 border border-blue-400/0 group-hover:border-blue-400/30 rounded-lg transition-all duration-300 pointer-events-none"></div>
      </div>

      {/* Glow Effect */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/0 via-blue-600/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:via-blue-600/10 group-hover:to-blue-500/10 blur-xl transition-all duration-300 -z-10"></div>
    </div>
  );
}