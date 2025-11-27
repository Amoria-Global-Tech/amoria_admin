"use client";
import React, { useState, useEffect, useMemo } from 'react';
import api from '@/app/api/conn';

// Types based on the API response structure
interface Property {
  data?: any;
  id: number;
  name: string;
  location: string;
  type: string;
  category: string;
  pricingType: 'night' | 'month';
  pricePerNight: number;
  pricePerMonth: number;
  currency: string;
  status: 'active' | 'inactive' | 'pending' | 'rejected' | 'suspended';
  isVerified: boolean;
  isInstantBook: boolean;
  hostId: number;
  hostName: string;
  hostEmail: string;
  totalBookings: number;
  averageRating: number;
  reviewsCount: number;
  views: number;
  createdAt: string;
  images: string[];
  // Extended properties from property details endpoint
  description?: string;
  beds?: number;
  baths?: number;
  maxGuests?: number;
  features?: string[];
  propertyAddress?: string;
  availableFrom?: string;
  availableTo?: string;
  minStay?: number;
  maxStay?: number;
}

interface AdminPropertyFilters {
  status: string[];
  type: string[];
  category: string[];
  isVerified?: boolean;
  isInstantBook?: boolean;
  hostId?: number;
  priceRange?: { min: number; max: number };
  dateRange?: { field: string; start: string; end: string };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

function formatDate(dateString: string | any, relativeOnly: boolean = false): string {
  if (!dateString) return 'N/A';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';

    // --- Absolute date formatting ---
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", 
                    "Aug", "Sep", "Oct", "Nov", "Dec"];
    const year = date.getFullYear();
    const month = months[date.getMonth()];
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    const absolute = `${month} ${day}, ${year} ${hours}:${minutes}:${seconds}`;

    // --- Relative time ---
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    let relative: string;
    if (diffSec < 60) relative = `${diffSec} second${diffSec !== 1 ? 's' : ''} ago`;
    else if (diffMin < 60) relative = `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
    else if (diffHour < 24) relative = `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
    else if (diffDay === 1) relative = 'Yesterday';
    else if (diffDay < 7) relative = `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
    else if (diffDay < 30) relative = `${Math.floor(diffDay / 7)} week${Math.floor(diffDay / 7) !== 1 ? 's' : ''} ago`;
    else if (diffDay < 365) relative = `${Math.floor(diffDay / 30)} month${Math.floor(diffDay / 30) !== 1 ? 's' : ''} ago`;
    else relative = `${Math.floor(diffDay / 365)} year${Math.floor(diffDay / 365) !== 1 ? 's' : ''} ago`;

    // Decide output
    return relativeOnly ? relative : `${absolute}   ${relative}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}

const StatCard = ({ title, value, icon, iconBg, iconColor }: {
  title: string;
  value: number;
  icon: string;
  iconBg: string;
  iconColor: string;
}) => (
  <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-slate-700/50 p-6 rounded-xl shadow-xl">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-white/60 text-sm">{title}</p>
        <p className="text-white text-2xl font-bold">{value}</p>
      </div>
      <div className={`${iconBg} p-3 rounded-xl`}>
        <i className={`bi ${icon} ${iconColor} text-xl`}></i>
      </div>
    </div>
  </div>
);

const AddPropertyModal = ({ onClose, onPropertyAdded }: {
  onClose: () => void;
  onPropertyAdded: (property: Property) => void;
}) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    type: 'villa',
    category: 'entire_place',
    pricePerNight: '',
    currency: 'USD',
    description: '',
    beds: '',
    baths: '',
    maxGuests: '',
    propertyAddress: '',
    minStay: '1',
    maxStay: '30',
    hostId: '',
    status: 'pending'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        pricePerNight: parseFloat(formData.pricePerNight),
        beds: formData.beds ? parseInt(formData.beds) : undefined,
        baths: formData.baths ? parseInt(formData.baths) : undefined,
        maxGuests: formData.maxGuests ? parseInt(formData.maxGuests) : undefined,
        minStay: parseInt(formData.minStay),
        maxStay: parseInt(formData.maxStay),
        hostId: parseInt(formData.hostId)
      };
      
      const response = await api.post('/admin/properties', payload);
      if (response.data.success) {
        onPropertyAdded(response.data.data);
        onClose();
      }
    } catch (error) {
      console.error('Error creating property:', error);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#0b1c36] border border-slate-700 rounded-lg shadow-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Add New Property</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm mb-1">Property Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-white text-sm mb-1">Location *</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-white text-sm mb-1">Property Type *</label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="villa">Villa</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="condo">Condo</option>
                <option value="townhouse">Townhouse</option>
                <option value="studio">Studio</option>
              </select>
            </div>
            <div>
              <label className="block text-white text-sm mb-1">Category *</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="entire_place">Entire Place</option>
                <option value="private_room">Private Room</option>
                <option value="shared_room">Shared Room</option>
              </select>
            </div>
            <div>
              <label className="block text-white text-sm mb-1">Host ID *</label>
              <input
                type="number"
                required
                value={formData.hostId}
                onChange={(e) => setFormData({...formData, hostId: e.target.value})}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm mb-1">Price per Night *</label>
              <div className="flex">
                <input
                  type="number"
                  required
                  value={formData.pricePerNight}
                  onChange={(e) => setFormData({...formData, pricePerNight: e.target.value})}
                  className="flex-1 bg-slate-800/60 border border-slate-700 rounded-l-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({...formData, currency: e.target.value})}
                  className="bg-slate-800/60 border border-slate-700 border-l-0 rounded-r-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="RWF">RWF</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-white text-sm mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-white text-sm mb-1">Bedrooms</label>
              <input
                type="number"
                value={formData.beds}
                onChange={(e) => setFormData({...formData, beds: e.target.value})}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-white text-sm mb-1">Bathrooms</label>
              <input
                type="number"
                value={formData.baths}
                onChange={(e) => setFormData({...formData, baths: e.target.value})}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-white text-sm mb-1">Max Guests</label>
              <input
                type="number"
                value={formData.maxGuests}
                onChange={(e) => setFormData({...formData, maxGuests: e.target.value})}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-white text-sm mb-1">Property Address</label>
            <input
              type="text"
              value={formData.propertyAddress}
              onChange={(e) => setFormData({...formData, propertyAddress: e.target.value})}
              className="w-full bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-white text-sm mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={4}
              className="w-full bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm mb-1">Minimum Stay (days)</label>
              <input
                type="number"
                value={formData.minStay}
                onChange={(e) => setFormData({...formData, minStay: e.target.value})}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-white text-sm mb-1">Maximum Stay (days)</label>
              <input
                type="number"
                value={formData.maxStay}
                onChange={(e) => setFormData({...formData, maxStay: e.target.value})}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Property'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PropertyDetailsModal = ({ property, onClose, onPropertyUpdated }: {
  property: Property | null;
  onClose: () => void;
  onPropertyUpdated: (property: Property) => void;
}) => {
  const [propertyDetails, setPropertyDetails] = useState<Property | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Property>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (property) {
      fetchPropertyDetails();
      setFormData(property);
    }
  }, [property]);

  const fetchPropertyDetails = async () => {
    if (!property) return;
    try {
      const response = await api.get(`/admin/properties/${property.data.id}`);
      const propertyData = response.data.data;
      
      // Parse features if it's a string
      if (propertyData.features && typeof propertyData.features === 'string') {
        try {
          propertyData.features = JSON.parse(propertyData.features);
        } catch (error) {
          console.error('Error parsing features:', error);
          propertyData.features = [];
        }
      }
      
      setPropertyDetails(propertyData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching property details:', error);
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!property) return;
    setActionLoading('update');
    try {
      const response: any = await api.put(`/admin/properties/${property.id}`, formData);
      if (response.success) {
        setPropertyDetails(response.data);
        onPropertyUpdated(response.data);
        setEditMode(false);
      }
    } catch (error) {
      console.error('Error updating property:', error);
    }
    setActionLoading(null);
  };

  const handleAction = async (action: string) => {
    if (!property) return;
    setActionLoading(action);
    try {
      let response: any;
      switch (action) {
        case 'approve':
          response = await api.post(`/admin/properties/${property.id}/approve`);
          break;
        case 'reject':
          response = await api.post(`/admin/properties/${property.id}/reject`, { reason: 'Admin action' });
          break;
        case 'suspend':
          response = await api.post(`/admin/properties/${property.id}/suspend`, { reason: 'Admin action' });
          break;
        case 'activate':
          response = await api.put(`/admin/properties/${property.id}`, { status: 'active' });
          break;
        case 'verify':
          response = await api.put(`/admin/properties/${property.id}`, { isVerified: true });
          break;
        case 'unverify':
          response = await api.put(`/admin/properties/${property.id}`, { isVerified: false });
          break;
        default:
          return;
      }
      
      if (response?.success) {
        await fetchPropertyDetails();
        onPropertyUpdated(response.data);
      }
    } catch (error) {
      console.error(`Error ${action}:`, error);
    }
    setActionLoading(null);
  };

  if (!property) return null;

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-500/20 text-green-400',
      inactive: 'bg-gray-500/20 text-gray-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
      rejected: 'bg-red-500/20 text-red-400',
      suspended: 'bg-orange-500/20 text-orange-400'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#0b1c36] border border-slate-700 rounded-lg shadow-xl w-full max-w-6xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            Property Details - {property.name}
            <span className="ml-2 text-sm font-normal text-white/60">#{property.id}</span>
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <p className="text-white/60 text-sm">Status</p>
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(property.status)}`}>
              {property.status}
            </span>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <p className="text-white/60 text-sm">Price/{property.pricingType === 'night' ? 'Night' : 'Month'}</p>
            <p className="text-white font-bold">
              {property.pricingType === 'night'
                ? `${property.pricePerNight ? property.pricePerNight.toLocaleString() : '0'} USD`
                : `${property.pricePerMonth ? property.pricePerMonth.toLocaleString() : '0'} USD`
              }
            </p>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <p className="text-white/60 text-sm">Rating</p>
            <p className="text-white font-bold">{property.averageRating} ★ ({property.reviewsCount})</p>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <p className="text-white/60 text-sm">Bookings</p>
            <p className="text-white font-bold">{property.totalBookings}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { key: 'details', label: 'Details' },
            { key: 'host', label: 'Host Info' },
            { key: 'performance', label: 'Performance' },
            { key: 'images', label: 'Images' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-md text-sm ${
                activeTab === tab.key ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-white">Property Information</h3>
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md text-white text-sm"
                  >
                    {editMode ? 'Cancel' : 'Edit Property'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white/60 text-sm mb-1">Property Name</label>
                      {editMode ? (
                        <input
                          type="text"
                          value={formData.name || ''}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full bg-slate-800/60 border border-slate-700 rounded px-3 py-2 text-white"
                        />
                      ) : (
                        <p className="text-white">{propertyDetails?.name || 'N/A'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-white/60 text-sm mb-1">Location</label>
                      {editMode ? (
                        <input
                          type="text"
                          value={formData.location || ''}
                          onChange={(e) => setFormData({...formData, location: e.target.value})}
                          className="w-full bg-slate-800/60 border border-slate-700 rounded px-3 py-2 text-white"
                        />
                      ) : (
                        <p className="text-white">{propertyDetails?.location || 'N/A'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-white/60 text-sm mb-1">Property Type</label>
                      {editMode ? (
                        <select
                          value={formData.type || ''}
                          onChange={(e) => setFormData({...formData, type: e.target.value})}
                          className="w-full bg-slate-800/60 border border-slate-700 rounded px-3 py-2 text-white"
                        >
                          <option value="villa">Villa</option>
                          <option value="apartment">Apartment</option>
                          <option value="house">House</option>
                          <option value="condo">Condo</option>
                          <option value="townhouse">Townhouse</option>
                          <option value="studio">Studio</option>
                        </select>
                      ) : (
                        <p className="text-white capitalize">{propertyDetails?.type || 'N/A'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-white/60 text-sm mb-1">Category</label>
                      {editMode ? (
                        <select
                          value={formData.category || ''}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                          className="w-full bg-slate-800/60 border border-slate-700 rounded px-3 py-2 text-white"
                        >
                          <option value="entire_place">Entire Place</option>
                          <option value="private_room">Private Room</option>
                          <option value="shared_room">Shared Room</option>
                        </select>
                      ) : (
                        <p className="text-white">{propertyDetails?.category?.replace('_', ' ') || 'N/A'}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-white/60 text-sm mb-1">
                        Price per {propertyDetails?.pricingType === 'night' ? 'Night' : 'Month'}
                      </label>
                      {editMode ? (
                        <div className="flex">
                          <input
                            type="number"
                            value={formData.pricePerNight || ''}
                            onChange={(e) => setFormData({...formData, pricePerNight: parseFloat(e.target.value)})}
                            className="flex-1 bg-slate-800/60 border border-slate-700 rounded-l px-3 py-2 text-white"
                          />
                          <select
                            value={formData.currency || 'USD'}
                            onChange={(e) => setFormData({...formData, currency: e.target.value})}
                            className="bg-slate-800/60 border border-slate-700 border-l-0 rounded-r px-3 py-2 text-white"
                          >
                            <option value="RWF">RWF</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                          </select>
                        </div>
                      ) : (
                        <p className="text-white">
                          {propertyDetails?.pricingType === 'night'
                            ? `${propertyDetails?.pricePerNight ? propertyDetails.pricePerNight.toLocaleString() : '0'} USD`
                            : `${propertyDetails?.pricePerMonth ? propertyDetails.pricePerMonth.toLocaleString() : '0'} USD`
                          }
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-white/60 text-sm mb-1">Bedrooms</label>
                      <p className="text-white">{propertyDetails?.beds || 0}</p>
                    </div>

                    <div>
                      <label className="block text-white/60 text-sm mb-1">Bathrooms</label>
                      <p className="text-white">{propertyDetails?.baths || 0}</p>
                    </div>

                    <div>
                      <label className="block text-white/60 text-sm mb-1">Max Guests</label>
                      <p className="text-white">{propertyDetails?.maxGuests || 0}</p>
                    </div>
                  </div>
                </div>

                {propertyDetails?.description && (
                  <div className="border-t border-slate-700 pt-6">
                    <h4 className="text-white font-medium mb-4">Description</h4>
                    {editMode ? (
                      <textarea
                        value={formData.description || ''}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        rows={4}
                        className="w-full bg-slate-800/60 border border-slate-700 rounded px-3 py-2 text-white"
                      />
                    ) : (
                      <p className="text-white/80">{propertyDetails.description}</p>
                    )}
                  </div>
                )}

                {propertyDetails?.features && propertyDetails.features.length > 0 && (
                  <div className="border-t border-slate-700 pt-6">
                    <h4 className="text-white font-medium mb-4">Features</h4>
                    <div className="flex flex-wrap gap-2">
                      {propertyDetails.features.map((feature, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {editMode && (
                  <div className="flex gap-3 pt-6 border-t border-slate-700">
                    <button
                      onClick={handleUpdate}
                      disabled={actionLoading === 'update'}
                      className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-md text-white disabled:opacity-50"
                    >
                      {actionLoading === 'update' ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'host' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white">Host Information</h3>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-slate-800/50 p-6 rounded-lg">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-white/60 text-sm mb-1">Host ID</label>
                        <p className="text-white font-medium">{propertyDetails?.hostId}</p>
                      </div>
                      <div>
                        <label className="block text-white/60 text-sm mb-1">Host Name</label>
                        <p className="text-white font-medium">{propertyDetails?.hostName}</p>
                      </div>
                      <div>
                        <label className="block text-white/60 text-sm mb-1">Host Email</label>
                        <p className="text-white font-medium">{propertyDetails?.hostEmail}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white">Performance Metrics</h3>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-slate-800/50 p-6 rounded-lg">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-white/60 text-sm mb-1">Total Bookings</label>
                        <p className="text-white text-2xl font-bold">{propertyDetails?.totalBookings || 0}</p>
                      </div>
                      <div>
                        <label className="block text-white/60 text-sm mb-1">Average Rating</label>
                        <p className="text-white text-2xl font-bold">{propertyDetails?.averageRating || 0} ★</p>
                      </div>
                      <div>
                        <label className="block text-white/60 text-sm mb-1">Reviews Count</label>
                        <p className="text-white text-xl font-bold">{propertyDetails?.reviewsCount || 0}</p>
                      </div>
                      <div>
                        <label className="block text-white/60 text-sm mb-1">Total Views</label>
                        <p className="text-white text-xl font-bold">{propertyDetails?.views || 0}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-800/50 p-6 rounded-lg">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-white/60 text-sm">Verified</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          propertyDetails?.isVerified ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {propertyDetails?.isVerified ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/60 text-sm">Instant Book</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          propertyDetails?.isInstantBook ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {propertyDetails?.isInstantBook ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div>
                        <label className="block text-white/60 text-sm mb-1">Created Date</label>
                        <p className="text-white">{formatDate(propertyDetails?.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'images' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white">Property Images</h3>
                
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {propertyDetails?.images && propertyDetails.images.length > 0 ? (
                    propertyDetails.images.map((image, index) => (
                      <div key={index} className="aspect-square bg-slate-800/50 rounded-lg overflow-hidden">
                        <img
                          src={image}
                          alt={`Property ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <i className="bi bi-image text-6xl text-white/20 mb-4"></i>
                      <p className="text-white/60">No images uploaded</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Admin Actions */}
        <div className="flex gap-3 pt-6 border-t border-slate-700 mt-6 flex-wrap">
          {propertyDetails?.status === 'pending' && (
            <button
              onClick={() => handleAction('approve')}
              disabled={actionLoading === 'approve'}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md text-white text-sm disabled:opacity-50"
            >
              {actionLoading === 'approve' ? 'Approving...' : 'Approve Property'}
            </button>
          )}
          
          {propertyDetails?.status === 'active' ? (
            <button
              onClick={() => handleAction('suspend')}
              disabled={actionLoading === 'suspend'}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-white text-sm disabled:opacity-50"
            >
              {actionLoading === 'suspend' ? 'Suspending...' : 'Suspend Property'}
            </button>
          ) : propertyDetails?.status === 'suspended' && (
            <button
              onClick={() => handleAction('activate')}
              disabled={actionLoading === 'activate'}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md text-white text-sm disabled:opacity-50"
            >
              {actionLoading === 'activate' ? 'Activating...' : 'Activate Property'}
            </button>
          )}

          {propertyDetails?.status === 'pending' && (
            <button
              onClick={() => handleAction('reject')}
              disabled={actionLoading === 'reject'}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-white text-sm disabled:opacity-50"
            >
              {actionLoading === 'reject' ? 'Rejecting...' : 'Reject Property'}
            </button>
          )}

          {!propertyDetails?.isVerified ? (
            <button
              onClick={() => handleAction('verify')}
              disabled={actionLoading === 'verify'}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md text-white text-sm disabled:opacity-50"
            >
              {actionLoading === 'verify' ? 'Verifying...' : 'Verify Property'}
            </button>
          ) : (
            <button
              onClick={() => handleAction('unverify')}
              disabled={actionLoading === 'unverify'}
              className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-md text-white text-sm disabled:opacity-50"
            >
              {actionLoading === 'unverify' ? 'Unverifying...' : 'Remove Verification'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const PropertyGrid = ({ properties, onViewDetails, onPropertyAction }: {
  properties: Property[];
  onViewDetails: (property: Property) => void;
  onPropertyAction: (action: string, property: Property) => void;
}) => {
  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-500/20 text-green-400',
      inactive: 'bg-gray-500/20 text-gray-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
      rejected: 'bg-red-500/20 text-red-400',
      suspended: 'bg-orange-500/20 text-orange-400'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map(property => (
        <div key={property.id} className="bg-[#0b1c36]/80 border border-slate-700/50 rounded-lg shadow-lg overflow-hidden">
          <div className="relative">
            <img 
              className="h-48 w-full object-cover" 
              src={property.images[0] || 'https://via.placeholder.com/400x200'} 
              alt={property.name} 
            />
            <div className="absolute top-2 left-2">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(property.status)}`}>
                {property.status}
              </span>
            </div>
            <div className="absolute top-2 right-2 flex gap-1">
              {property.isVerified && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-400">
                  <i className="bi bi-check-circle"></i>
                </span>
              )}
              {property.isInstantBook && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400">
                  <i className="bi bi-lightning"></i>
                </span>
              )}
            </div>
          </div>
          
          <div className="p-5">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg truncate">{property.name}</h3>
                <p className="text-white/60 text-sm truncate">{property.location || 'Location not specified'}</p>
                <p className="text-white/60 text-xs">
                  {property.type || 'N/A'} • {property.category ? property.category.replace('_', ' ') : 'N/A'}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center border-y border-slate-700/50 py-3 mb-4">
              <div>
                <p className="text-white/60 text-xs">Rating</p>
                <p className="text-white font-bold flex items-center justify-center">
                  <i className="bi bi-star-fill text-yellow-400 mr-1"></i>
                  {property.averageRating || 0}
                </p>
              </div>
              <div>
                <p className="text-white/60 text-xs">Bookings</p>
                <p className="text-white font-bold">{property.totalBookings || 0}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">Views</p>
                <p className="text-white font-bold">{property.views || 0}</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-white font-bold text-lg">
                {property.pricingType === 'night'
                  ? `${property.pricePerNight ? property.pricePerNight.toLocaleString() : '0'} USD/night`
                  : `${property.pricePerMonth ? property.pricePerMonth.toLocaleString() : '0'} USD/month`
                }
              </p>
              <p className="text-white/60 text-sm">Host: {property.hostName || 'Unknown'}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onViewDetails(property)}
                className="flex-1 text-sm bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 px-3 py-2 rounded-md"
              >
                View Details
              </button>
              {property.status === 'pending' && (
                <button
                  onClick={() => onPropertyAction('approve', property)}
                  className="text-sm bg-green-500/20 text-green-400 hover:bg-green-500/40 px-3 py-2 rounded-md"
                >
                  Approve
                </button>
              )}
              {property.status === 'active' && (
                <button
                  onClick={() => onPropertyAction('suspend', property)}
                  className="text-sm bg-red-500/20 text-red-400 hover:bg-red-500/40 px-3 py-2 rounded-md"
                >
                  Suspend
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const PropertyTable = ({ properties, onViewDetails, onPropertyAction }: {
  properties: Property[];
  onViewDetails: (property: Property) => void;
  onPropertyAction: (action: string, property: Property) => void;
}) => {
  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-500/20 text-green-400',
      inactive: 'bg-gray-500/20 text-gray-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
      rejected: 'bg-red-500/20 text-red-400',
      suspended: 'bg-orange-500/20 text-orange-400'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div className="bg-[#0b1c36]/80 border border-slate-700/50 rounded-lg shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-white/80">
          <thead className="bg-slate-800/60">
            <tr>
              <th className="p-4">Property</th>
              <th className="p-4">Host</th>
              <th className="p-4">Type</th>
              <th className="p-4">Price/Night</th>
              <th className="p-4">Status</th>
              <th className="p-4">Rating</th>
              <th className="p-4">Performance</th>
              <th className="p-4">Created</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {properties.map(property => (
              <tr key={property.id} className="border-t border-slate-800 hover:bg-slate-800/40">
                <td className="p-4">
                  <div className="flex items-center">
                    <div className="h-12 w-16 flex-shrink-0 mr-4">
                      <img 
                        className="h-12 w-16 rounded-lg object-cover" 
                        src={property.images[0] || 'https://via.placeholder.com/64x48'} 
                        alt={property.name} 
                      />
                    </div>
                    <div>
                      <div className="font-medium text-white">{property.name}</div>
                      <div className="text-white/60 text-xs">{property.location}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div>
                    <div className="text-white font-medium">{property.hostName}</div>
                    <div className="text-white/60 text-xs">{property.hostEmail}</div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-white capitalize">{property.type || 'N/A'}</div>
                  <div className="text-white/60 text-xs">{property.category ? property.category.replace('_', ' ') : 'N/A'}</div>
                </td>
                <td className="p-4">
                  <div className="text-white font-medium">
                    {property.pricingType === 'night'
                      ? `${property.pricePerNight ? property.pricePerNight.toLocaleString() : '0'} USD/night`
                      : `${property.pricePerMonth ? property.pricePerMonth.toLocaleString() : '0'} USD/month`
                    }
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex flex-col gap-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${getStatusColor(property.status)}`}>
                      {property.status}
                    </span>
                    <div className="flex gap-1">
                      {property.isVerified && (
                        <span className="inline-flex items-center px-1 py-0.5 text-xs font-medium rounded bg-green-500/20 text-green-400">
                          <i className="bi bi-check mr-1"></i>
                          Verified
                        </span>
                      )}
                      {property.isInstantBook && (
                        <span className="inline-flex items-center px-1 py-0.5 text-xs font-medium rounded bg-blue-500/20 text-blue-400">
                          <i className="bi bi-lightning mr-1"></i>
                          Instant
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center text-white">
                    <i className="bi bi-star-fill text-yellow-400 mr-1"></i>
                    {property.averageRating || 0} ({property.reviewsCount || 0})
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-white">
                    <div>{property.totalBookings || 0} bookings</div>
                    <div className="text-white/60 text-xs">{property.views || 0} views</div>
                  </div>
                </td>
                <td className="p-4 text-white/70">{formatDate(property.createdAt, true)}</td>
                <td className="p-4 text-center">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => onViewDetails(property)}
                      className="text-blue-400 hover:text-blue-300"
                      title="View Details"
                    >
                      <i className="bi bi-eye"></i>
                    </button>
                    {property.status === 'pending' && (
                      <button
                        onClick={() => onPropertyAction('approve', property)}
                        className="text-green-400 hover:text-green-300"
                        title="Approve Property"
                      >
                        <i className="bi bi-check-circle"></i>
                      </button>
                    )}
                    {property.status === 'active' && (
                      <button
                        onClick={() => onPropertyAction('suspend', property)}
                        className="text-red-400 hover:text-red-300"
                        title="Suspend Property"
                      >
                        <i className="bi bi-pause-circle"></i>
                      </button>
                    )}
                    {property.status === 'suspended' && (
                      <button
                        onClick={() => onPropertyAction('activate', property)}
                        className="text-green-400 hover:text-green-300"
                        title="Activate Property"
                      >
                        <i className="bi bi-play-circle"></i>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AdminPropertiesPage: React.FC = () => {
  // State management
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperties, setSelectedProperties] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [activeTab, setActiveTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  // Initialize data
  useEffect(() => {
    fetchProperties();
  }, [pagination.page, pagination.limit, sortField, sortOrder]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sort: sortField,
        order: sortOrder,
      });

      if (searchTerm) queryParams.append('search', searchTerm);

      const response: any = await api.get(`/admin/properties?${queryParams}`);
      
      if (response.data.success) {
        setProperties(response.data.data || response.data);
        setPagination(response.data.pagination || {
          page: 1,
          limit: 20,
          total: response.data.data?.length || 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        });
      } else {
        throw new Error(response.error || 'Failed to fetch properties');
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      setError(error instanceof Error ? error.message : 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const fetchPropertyDetails = async (propertyId: number): Promise<Property | null> => {
    try {
      const response: any = await api.get(`/admin/properties/${propertyId}`);
      return response.data.success ? response.data : null;
    } catch (error) {
      console.error('Error fetching property details:', error);
      return null;
    }
  };

  // Statistics
  const stats = useMemo(() => {
    return {
      total: properties.length,
      active: properties.filter(p => p.status === 'active').length,
      pending: properties.filter(p => p.status === 'pending').length,
      verified: properties.filter(p => p.isVerified).length,
      totalBookings: properties.reduce((sum, p) => sum + (p.totalBookings || 0), 0),
    };
  }, [properties]);

  // Handler functions
  const handlePropertyAction = async (action: string, property: Property) => {
    try {
      let response: any;
      
      switch (action) {
        case 'approve':
          response = await api.post(`/admin/properties/${property.id}/approve`);
          break;
        case 'reject':
          response = await api.post(`/admin/properties/${property.id}/reject`, { reason: 'Admin action' });
          break;
        case 'suspend':
          response = await api.post(`/admin/properties/${property.id}/suspend`, { reason: 'Admin action' });
          break;
        case 'activate':
          response = await api.put(`/admin/properties/${property.id}`, { status: 'active' });
          break;
        case 'delete':
          response = await api.delete(`/admin/properties/${property.id}`);
          break;
        default:
          return;
      }

      if (response?.success) {
        await fetchProperties();
      } else {
        throw new Error(response?.error || `Failed to ${action} property`);
      }
    } catch (error) {
      console.error(`Error ${action} property:`, error);
      setError(error instanceof Error ? error.message : `Failed to ${action} property`);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedProperties.size === 0) return;

    try {
      const propertyIds = Array.from(selectedProperties);
      let response: any;

      switch (action) {
        case 'approve':
          response = await api.post('/admin/bulk/properties/update', {
            filters: { id: { in: propertyIds } },
            updates: { status: 'active', isVerified: true },
          });
          break;
        case 'suspend':
          response = await api.post('/admin/bulk/properties/update', {
            filters: { id: { in: propertyIds } },
            updates: { status: 'suspended' },
          });
          break;
        case 'delete':
          response = await api.post('/admin/bulk/properties/delete', {
            filters: { id: { in: propertyIds } },
          });
          break;
        default:
          return;
      }

      if (response?.success) {
        setSelectedProperties(new Set());
        await fetchProperties();
      } else {
        throw new Error(response?.error || `Failed to ${action} selected properties`);
      }
    } catch (error) {
      console.error(`Error with bulk ${action}:`, error);
      setError(error instanceof Error ? error.message : `Failed to ${action} selected properties`);
    }
  };

  const handleExport = async () => {
    try {
      const response: any = await api.post('/admin/export/properties', {
        type: 'properties',
        format: 'csv',
        filters: {},
        columns: ['id', 'name', 'location', 'type', 'status', 'hostName', 'pricePerNight', 'totalBookings'],
      });

      if (response?.success && response.downloadUrl) {
        const link = document.createElement('a');
        link.href = response.downloadUrl;
        link.download = 'properties_export.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        throw new Error(response?.error || 'Export failed');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      setError(error instanceof Error ? error.message : 'Export failed');
    }
  };

  const handleViewDetails = async (property: Property) => {
    const detailedProperty = await fetchPropertyDetails(property.id);
    if (detailedProperty) {
      setSelectedProperty(detailedProperty);
      setShowDetailsModal(true);
    }
  };

  const handlePropertyAdded = (newProperty: Property) => {
    setProperties([...properties, newProperty]);
  };

  const handlePropertyUpdated = (updatedProperty: Property) => {
    setProperties(properties.map(prop => prop.id === updatedProperty.id ? updatedProperty : prop));
  };

  const filteredProperties = useMemo(() => {
    let filtered = properties;

    // Filter by tab (status-based tabs)
    if (activeTab !== 'all') {
      if (activeTab === 'pending') {
        filtered = filtered.filter(property => property.status === 'pending');
      } else if (activeTab === 'active') {
        filtered = filtered.filter(property => property.status === 'active');
      } else if (activeTab === 'suspended') {
        filtered = filtered.filter(property => property.status === 'suspended');
      } else if (activeTab === 'verified') {
        filtered = filtered.filter(property => property.isVerified);
      }
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(property => property.status === statusFilter);
    }

    // Filter by verification
    if (verificationFilter !== 'all') {
      if (verificationFilter === 'verified') {
        filtered = filtered.filter(property => property.isVerified);
      } else if (verificationFilter === 'unverified') {
        filtered = filtered.filter(property => !property.isVerified);
      }
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(property => property.type === typeFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(property => 
        property.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.hostName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [properties, activeTab, statusFilter, verificationFilter, typeFilter, searchTerm]);

  if (loading && properties.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p>Loading properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] border border-slate-700/50 p-8 mb-8 rounded-2xl shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-white mb-2">Properties Management</h1>
              <p className="text-white/60">Monitor and manage all property listings, approvals, and host relationships</p>
            </div>
            <div className="mt-4 flex lg:mt-0 lg:ml-4 space-x-3">
              <button
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 border border-slate-600 rounded-md shadow-sm text-sm font-medium text-white bg-slate-700 hover:bg-slate-600"
              >
                <i className="bi bi-download mr-2"></i>
                Export
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <i className="bi bi-plus mr-2"></i>
                Add Property
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <i className="bi bi-exclamation-triangle text-red-400"></i>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-300">Error</h3>
                  <div className="mt-2 text-sm text-red-200">{error}</div>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => setError(null)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <i className="bi bi-x"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Properties" value={stats.total} icon="bi-house" iconBg="bg-blue-400/20" iconColor="text-blue-400" />
          <StatCard title="Active Properties" value={stats.active} icon="bi-check-circle" iconBg="bg-green-400/20" iconColor="text-green-400" />
          <StatCard title="Pending Approval" value={stats.pending} icon="bi-clock" iconBg="bg-yellow-400/20" iconColor="text-yellow-400" />
          <StatCard title="Verified Properties" value={stats.verified} icon="bi-patch-check" iconBg="bg-purple-400/20" iconColor="text-purple-400" />
        </div>

        {/* Property Status Tabs */}
        <div className="bg-[#0b1c36]/80 border border-slate-700/50 rounded-lg mb-6 p-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { key: 'all', label: 'All Properties' },
              { key: 'active', label: 'Active' },
              { key: 'pending', label: 'Pending' },
              { key: 'suspended', label: 'Suspended' },
              { key: 'verified', label: 'Verified' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-md text-sm ${
                  activeTab === tab.key ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-[#0b1c36]/80 border border-slate-700/50 p-4 rounded-lg mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
              <div className="relative w-full sm:w-auto">
                <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-white/40"></i>
                <input
                  type="text"
                  placeholder="Search properties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-800/60 border border-slate-700 rounded-md pl-10 pr-4 py-2 w-full sm:w-64 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                  <option value="rejected">Rejected</option>
                </select>
                
                <select
                  value={verificationFilter}
                  onChange={(e) => setVerificationFilter(e.target.value)}
                  className="bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Verification</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                </select>
                
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="villa">Villa</option>
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="condo">Condo</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="studio">Studio</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-800/60 border border-slate-700 rounded-md p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded text-sm ${viewMode === 'grid' ? 'bg-blue-600' : 'hover:bg-slate-700/50'}`}
                >
                  <i className="bi bi-grid-3x3-gap-fill"></i>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1 rounded text-sm ${viewMode === 'table' ? 'bg-blue-600' : 'hover:bg-slate-700/50'}`}
                >
                  <i className="bi bi-list-ul"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-4">
          <p className="text-white/60">
            Showing {filteredProperties.length} of {properties.length} properties
            {activeTab !== 'all' && ` in ${activeTab} status`}
            {statusFilter !== 'all' && ` with ${statusFilter} status`}
          </p>
        </div>

        {/* Bulk Actions */}
        {selectedProperties.size > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm text-blue-300">
                  {selectedProperties.size} properties selected
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkAction('approve')}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-green-300 bg-green-500/20 hover:bg-green-500/30"
                >
                  <i className="bi bi-check mr-1"></i>
                  Approve Selected
                </button>
                <button
                  onClick={() => handleBulkAction('suspend')}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-yellow-300 bg-yellow-500/20 hover:bg-yellow-500/30"
                >
                  <i className="bi bi-pause mr-1"></i>
                  Suspend Selected
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-300 bg-red-500/20 hover:bg-red-500/30"
                >
                  <i className="bi bi-trash mr-1"></i>
                  Delete Selected
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Properties Display */}
        <div>
          {filteredProperties.length === 0 ? (
            <div className="text-center py-12">
              <i className="bi bi-house text-6xl text-white/20 mb-4"></i>
              <p className="text-white/60 text-lg">No properties found matching your criteria</p>
            </div>
          ) : viewMode === 'grid' ? (
            <PropertyGrid 
              properties={filteredProperties} 
              onViewDetails={handleViewDetails}
              onPropertyAction={handlePropertyAction}
            />
          ) : (
            <PropertyTable 
              properties={filteredProperties} 
              onViewDetails={handleViewDetails}
              onPropertyAction={handlePropertyAction}
            />
          )}
        </div>

        {/* Modals */}
        {showCreateModal && (
          <AddPropertyModal
            onClose={() => setShowCreateModal(false)}
            onPropertyAdded={handlePropertyAdded}
          />
        )}

        {showDetailsModal && (
          <PropertyDetailsModal
            property={selectedProperty}
            onClose={() => setShowDetailsModal(false)}
            onPropertyUpdated={handlePropertyUpdated}
          />
        )}
      </div>
    </div>
  );
};

export default AdminPropertiesPage;