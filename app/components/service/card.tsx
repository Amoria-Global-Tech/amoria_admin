"use client";

import { useState } from "react";

interface Service {
  id: string;
  title: string;
  description: string;
  price: string;
  category: string;
  status: "active" | "inactive" | "pending";
  icon: string;
  createdAt: string;
}

interface ServiceCardProps {
  service: Service;
  onUpdate: (id: string, updatedService: Partial<Service>) => void;
  onDelete: (id: string) => void;
}

export default function ServiceCard({ service, onUpdate, onDelete }: ServiceCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: service.title,
    description: service.description,
    price: service.price,
    category: service.category,
    status: service.status,
    icon: service.icon
  });

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

  const handleSave = () => {
    onUpdate(service.id, editForm);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditForm({
      title: service.title,
      description: service.description,
      price: service.price,
      category: service.category,
      status: service.status,
      icon: service.icon
    });
    setIsEditing(false);
  };

  const toggleStatus = () => {
    const newStatus = service.status === "active" ? "inactive" : "active";
    onUpdate(service.id, { status: newStatus });
  };

  return (
    <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-pink-400/20 p-3 rounded-xl group-hover:bg-pink-400/30 transition-colors">
            <i className={`${service.icon} text-pink-400 text-xl`}></i>
          </div>
          <div>
            {isEditing ? (
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-1 text-white text-lg font-semibold focus:outline-none focus:border-pink-400"
              />
            ) : (
              <h3 className="text-white text-lg font-semibold">{service.title}</h3>
            )}
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(service.status)} mt-1`}>
              {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Menu Button */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-white/60 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <i className="bi bi-three-dots-vertical"></i>
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-2 bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-95 backdrop-blur-xl border border-blue-900/20 shadow-2xl rounded-xl py-2 z-10 min-w-[150px]">
              <button
                onClick={() => {
                  setIsEditing(true);
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2"
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
              >
                <i className={`bi ${service.status === "active" ? "bi-pause" : "bi-play"}`}></i>
                {service.status === "active" ? "Deactivate" : "Activate"}
              </button>
              <hr className="border-white/10 my-1" />
              <button
                onClick={() => {
                  onDelete(service.id);
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors flex items-center gap-2"
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
          />
        ) : (
          <p className="text-white/80 text-sm leading-relaxed">{service.description}</p>
        )}
      </div>

      {/* Category and Price */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <i className="bi bi-tag text-white/60"></i>
          {isEditing ? (
            <select
              value={editForm.category}
              onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-2 py-1 text-white text-sm focus:outline-none focus:border-pink-400"
            >
              <option value="Development" className="bg-[#0b1c36] text-white">Development</option>
              <option value="Marketing" className="bg-[#0b1c36] text-white">Marketing</option>
              <option value="Design" className="bg-[#0b1c36] text-white">Design</option>
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
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-2 py-1 text-pink-400 font-semibold text-sm w-20 focus:outline-none focus:border-pink-400"
            />
          ) : (
            <span className="text-pink-400 font-semibold">{service.price}</span>
          )}
        </div>
      </div>

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
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-pink-400 hover:bg-pink-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Save
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
          className="fixed inset-0 z-0"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </div>
  );
}