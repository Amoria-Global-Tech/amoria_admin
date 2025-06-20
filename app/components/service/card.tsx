"use client";

import { useState } from "react";

interface Service {
  id: string;
  title: string;
  description: string;
  features: string;
  price: string;
  category: string;
  status: "active" | "inactive" | "pending";
  icon: string;
  createdAt: string;
  updatedAt: string;
}

interface ServiceCardProps {
  service: Service;
  onUpdate: (id: string, updatedService: Service) => void;
  onDelete: (id: string) => void;
}

export default function ServiceCard({ service, onUpdate, onDelete }: ServiceCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: service.title,
    description: service.description,
    features: service.features,
    price: service.price,
    category: service.category,
    status: service.status,
    icon: service.icon
  });

  const categories = [
    "Development",
    "Marketing", 
    "Design",
    "Consulting",
    "Support"
  ];

  const iconOptions = [
    { value: "bi bi-gear-wide-connected", label: "Services" },
    { value: "bi bi-code-slash", label: "Development" },
    { value: "bi bi-megaphone", label: "Marketing" },
    { value: "bi bi-palette", label: "Design" },
    { value: "bi bi-search", label: "SEO" },
    { value: "bi bi-graph-up", label: "Analytics" },
    { value: "bi bi-shield-check", label: "Security" },
    { value: "bi bi-cloud", label: "Cloud" },
    { value: "bi bi-phone", label: "Mobile" },
    { value: "bi bi-camera", label: "Photography" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-400/20 text-green-400 border-green-400/30";
      case "inactive":
        return "bg-red-400/20 text-red-400 border-red-400/30";
      case "pending":
        return "bg-yellow-400/20 text-yellow-400 border-yellow-400/30";
      default:
        return "bg-gray-400/20 text-gray-400 border-gray-400/30";
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/blog/services/add', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: parseInt(service.id),
          ...editForm
        }),
      });

      const result = await response.json();

      if (response.ok && result.service) {
        // Update the service with the response data
        onUpdate(service.id, {
          ...service,
          ...result.service,
          id: service.id // Ensure ID remains string for consistency
        });
        setIsEditing(false);
        setError(null);
      } else {
        throw new Error(result.message || result.error || 'Failed to update service');
      }
    } catch (error) {
      console.error('Error updating service:', error);
      setError(error instanceof Error ? error.message : 'Failed to update service');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      title: service.title,
      description: service.description,
      features: service.features,
      price: service.price,
      category: service.category,
      status: service.status,
      icon: service.icon
    });
    setIsEditing(false);
    setError(null);
  };

  const toggleStatus = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const newStatus = service.status === "active" ? "inactive" : "active";
      
      const response = await fetch('/api/blog/services/add', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: parseInt(service.id),
          status: newStatus
        }),
      });

      const result = await response.json();

      if (response.ok && result.service) {
        onUpdate(service.id, {
          ...service,
          ...result.service,
          id: service.id
        });
      } else {
        throw new Error(result.message || result.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setError(error instanceof Error ? error.message : 'Failed to update status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/blog/services/add', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: parseInt(service.id) }),
      });

      const result = await response.json();

      if (response.ok) {
        onDelete(service.id);
      } else {
        throw new Error(result.message || result.error || 'Failed to delete service');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete service');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 group">
      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-500/20 border border-red-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <i className="bi bi-exclamation-triangle text-red-400"></i>
            <p className="text-red-300 text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              <i className="bi bi-x"></i>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="bg-pink-400/20 p-3 rounded-xl group-hover:bg-pink-400/30 transition-colors">
            {isEditing ? (
              <select
                value={editForm.icon}
                onChange={(e) => setEditForm(prev => ({ ...prev, icon: e.target.value }))}
                className="bg-transparent text-pink-400 text-xl focus:outline-none"
                disabled={isLoading}
              >
                {iconOptions.map(option => (
                  <option key={option.value} value={option.value} className="bg-[#0b1c36] text-white">
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <i className={`${service.icon} text-pink-400 text-xl`}></i>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 text-white text-lg font-semibold focus:outline-none focus:border-pink-400"
                placeholder="Service title"
                disabled={isLoading}
              />
            ) : (
              <h3 className="text-white text-lg font-semibold truncate">{service.title}</h3>
            )}
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border mt-1 ${getStatusColor(service.status)}`}>
              {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Menu Button */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-white/60 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="animate-spin w-4 h-4 border border-white/30 border-t-white rounded-full"></div>
            ) : (
              <i className="bi bi-three-dots-vertical"></i>
            )}
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && !isEditing && (
            <div className="absolute right-0 top-full mt-2 bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-95 backdrop-blur-xl border border-blue-900/20 shadow-2xl rounded-xl py-2 z-20 min-w-[150px]">
              <button
                onClick={() => {
                  setIsEditing(true);
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                disabled={isLoading}
              >
                <i className="bi bi-pencil"></i>
                Edit
              </button>
              <button
                onClick={() => {
                  toggleStatus();
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                disabled={isLoading}
              >
                <i className={`bi ${service.status === "active" ? "bi-pause" : "bi-play"}`}></i>
                {service.status === "active" ? "Deactivate" : "Activate"}
              </button>
              <hr className="border-white/10 my-1" />
              <button
                onClick={() => {
                  handleDelete();
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors flex items-center gap-2"
                disabled={isLoading}
              >
                <i className="bi bi-trash"></i>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="mb-4">
        {isEditing ? (
          <textarea
            value={editForm.description}
            onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 text-white/80 resize-none focus:outline-none focus:border-pink-400"
            placeholder="Service description"
            disabled={isLoading}
          />
        ) : (
          <p className="text-white/80 text-sm leading-relaxed">{service.description}</p>
        )}
      </div>

      {/* Features */}
      {isEditing && (
        <div className="mb-4">
          <label className="block text-white/70 text-sm font-medium mb-2">Features</label>
          <input
            type="text"
            value={editForm.features}
            onChange={(e) => setEditForm(prev => ({ ...prev, features: e.target.value }))}
            className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-pink-400"
            placeholder="Service features"
            disabled={isLoading}
          />
        </div>
      )}

      {/* Category and Price */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <i className="bi bi-tag text-white/60"></i>
          {isEditing ? (
            <select
              value={editForm.category}
              onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-2 py-1 text-white text-sm focus:outline-none focus:border-pink-400"
              disabled={isLoading}
            >
              {categories.map(category => (
                <option key={category} value={category} className="bg-[#0b1c36] text-white">
                  {category}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-white/60 text-sm">{service.category}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <i className="bi bi-currency-dollar text-pink-400"></i>
          {isEditing ? (
            <input
              type="text"
              value={editForm.price}
              onChange={(e) => setEditForm(prev => ({ ...prev, price: e.target.value }))}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-2 py-1 text-pink-400 font-semibold text-sm w-24 focus:outline-none focus:border-pink-400"
              placeholder="$0"
              disabled={isLoading}
            />
          ) : (
            <span className="text-pink-400 font-semibold">{service.price}</span>
          )}
        </div>
      </div>

      {/* Status Selection in Edit Mode */}
      {isEditing && (
        <div className="mb-4">
          <label className="block text-white/70 text-sm font-medium mb-2">Status</label>
          <select
            value={editForm.status}
            onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as "active" | "inactive" | "pending" }))}
            className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-pink-400"
            disabled={isLoading}
          >
            <option value="active" className="bg-[#0b1c36] text-white">Active</option>
            <option value="inactive" className="bg-[#0b1c36] text-white">Inactive</option>
            <option value="pending" className="bg-[#0b1c36] text-white">Pending</option>
          </select>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <span className="text-white/50 text-xs flex items-center gap-1">
          <i className="bi bi-calendar3"></i>
          {new Date(service.createdAt).toLocaleDateString()}
        </span>

        {isEditing ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1 text-white/70 hover:text-white border border-white/20 rounded-lg text-sm transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-pink-400 hover:bg-pink-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin w-3 h-3 border border-white/30 border-t-white rounded-full"></div>
                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-check"></i>
                  Save
                </>
              )}
            </button>
          </div>
        ) : (
          <button className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white/70 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border border-white/20 hover:border-white/30">
            View Details
          </button>
        )}
      </div>

      {/* Click outside to close menu */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-10"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </div>
  );
}