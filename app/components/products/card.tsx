'use client';

import { useState } from 'react';
import { Edit, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  isAvailable: boolean;
  createdAt: string;
  updated_at: string;
}

interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (id: number) => void;
  onToggleAvailability?: (id: number) => void;
}

export default function ProductCard({ 
  product, 
  onEdit, 
  onDelete, 
  onToggleAvailability 
}: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

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
  
  
  return (
    <div className="group relative">
      {/* Card Container */}
      <div className="bg-gradient-to-b from-[#0b1c36]/80 to-[#13294b]/80 backdrop-blur-sm border border-blue-900/20 rounded-lg overflow-hidden hover:from-[#0b1c36] hover:to-[#13294b] transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20">
        
        {/* Image Container */}
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[#0b1c36] to-[#13294b]">
          {!imageError ? (
            <img
              src={product.image_url}
              alt={product.name}
              className={`w-full h-full object-cover transition-all duration-300 ${
                imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
              } group-hover:scale-110`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0b1c36] to-[#13294b]">
              <div className="text-4xl text-white/40">📦</div>
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

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Product Name */}
          <h3 className="font-semibold text-lg text-white mb-2 line-clamp-1 group-hover:text-blue-300 transition-colors duration-200">
            {product.name}
          </h3>
          
          {/* Category Badge */}
          <div className="flex items-center gap-2 mb-1">
            <i className="bi bi-tag text-white/60"></i>
            <span className="text-white/30 text-sm">{product.category}</span>
          </div>

          {/* Description */}
          <p className="text-sm text-white/60 mb-3 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* Price */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl text-pink-400 font-semibold">
              {formatPrice(product.price)}
            </span>
            <span className="text-xs text-white/40">
              Added {formatDate(product.createdAt)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Edit Button */}
            <button
              onClick={() => onEdit?.(product)}
              className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white px-3 py-2 rounded-lg transition-all duration-200 border border-blue-900/20"
            >
              <Edit size={14} />
              <span className="text-sm font-medium">Edit</span>
            </button>

            {/* Toggle Availability */}
            <button
              onClick={() => onToggleAvailability?.(product.id)}
              className={`p-2 rounded-lg transition-all duration-200 border ${
                product.isAvailable
                  ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border-orange-500/30'
                  : 'bg-green-500/20 hover:bg-green-500/30 text-green-300 border-green-500/30'
              }`}
              title={product.isAvailable ? 'Mark as unavailable' : 'Mark as available'}
            >
              {product.isAvailable ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>

            {/* Delete Button */}
            <button
              onClick={() => onDelete?.(product.id)}
              className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 rounded-lg transition-all duration-200 border border-red-500/30"
              title="Delete app"
            >
              <Trash2 size={14} />
            </button>

            {/* View Details */}
            <button
              className="p-2 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded-lg transition-all duration-200 border border-blue-900/20"
              title="View details"
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