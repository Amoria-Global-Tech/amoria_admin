"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../../api/jambolush/api-conn'; 

// Types
interface Property {
  id: string;
  hostId: string;
  hostName: string;
  hostEmail: string;
  hostPhone: string;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  amenities: string[];
  pricePerNight: number;
  status: 'active' | 'pending' | 'suspended' | 'rejected';
  images: string[];
  featuredImage: string;
  createdAt: Date;
  updatedAt: Date;
  verificationStatus: 'verified' | 'pending' | 'unverified';
  totalBookings: number;
  rating: number;
  reviews: number;
}

type ViewMode = 'grid' | 'list';
type SortField = 'title' | 'hostName' | 'pricePerNight' | 'status' | 'createdAt' | 'rating';
type SortOrder = 'asc' | 'desc';

const HostsPropertiesPage: React.FC = () => {
  // Date formatting helper function
  const format = (date: Date, formatStr: string) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();
    
    switch(formatStr) {
      case 'MMM dd, yyyy':
        return `${months[month]} ${day.toString().padStart(2, '0')}, ${year}`;
      case 'MMM dd':
        return `${months[month]} ${day.toString().padStart(2, '0')}`;
      default:
        return `${months[month]} ${day}, ${year}`;
    }
  };

  // States
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [goToPageInput, setGoToPageInput] = useState('');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  
  // Sort states
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Generate mock data
  const generateMockData = () => {
    const statuses: ('active' | 'pending' | 'suspended' | 'rejected')[] = ['active', 'pending', 'suspended', 'rejected'];
    const verificationStatuses: ('verified' | 'pending' | 'unverified')[] = ['verified', 'pending', 'unverified'];
    const propertyTypes = ['Apartment', 'House', 'Villa', 'Condo', 'Townhouse', 'Studio'];
    const hosts = ['John Smith', 'Emma Wilson', 'Michael Brown', 'Sarah Davis', 'James Johnson'];
    const cities = ['New York', 'Los Angeles', 'Chicago', 'Miami', 'San Francisco'];
    
    const mockProperties: Property[] = Array.from({ length: 45 }, (_, i) => ({
      id: `PROP${String(i + 1).padStart(5, '0')}`,
      hostId: `HOST${String(Math.floor(Math.random() * 10) + 1).padStart(3, '0')}`,
      hostName: hosts[Math.floor(Math.random() * hosts.length)],
      hostEmail: `host${i + 1}@email.com`,
      hostPhone: `+1 555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      title: `${propertyTypes[Math.floor(Math.random() * propertyTypes.length)]} in ${cities[Math.floor(Math.random() * cities.length)]}`,
      description: 'Beautiful property with modern amenities and great location. Perfect for travelers looking for comfort and convenience.',
      address: `${Math.floor(Math.random() * 999) + 1} ${['Main St', 'Ocean Blvd', 'Park Ave', 'Mountain Rd'][Math.floor(Math.random() * 4)]}`,
      city: cities[Math.floor(Math.random() * cities.length)],
      state: ['NY', 'CA', 'FL', 'TX', 'IL'][Math.floor(Math.random() * 5)],
      country: 'USA',
      zipCode: String(Math.floor(Math.random() * 90000) + 10000),
      propertyType: propertyTypes[Math.floor(Math.random() * propertyTypes.length)],
      bedrooms: Math.floor(Math.random() * 4) + 1,
      bathrooms: Math.floor(Math.random() * 3) + 1,
      maxGuests: Math.floor(Math.random() * 6) + 2,
      amenities: ['WiFi', 'Kitchen', 'Parking', 'Pool'].slice(0, Math.floor(Math.random() * 4) + 1),
      pricePerNight: Math.floor(Math.random() * 400) + 50,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      images: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, idx) => `https://picsum.photos/seed/${i * 10 + idx}/800/600`),
      featuredImage: `https://picsum.photos/seed/${i}/800/600`,
      createdAt: new Date(2025, Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1),
      updatedAt: new Date(2025, Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1),
      verificationStatus: verificationStatuses[Math.floor(Math.random() * verificationStatuses.length)],
      totalBookings: Math.floor(Math.random() * 50),
      rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
      reviews: Math.floor(Math.random() * 30)
    }));
    
    setProperties(mockProperties);
  };

  const fetchProperties = async () => {
    try {
      setLoading(true);
      // This now uses the real API connector
      const response = await api.get<Property[]>('/hosts/properties');
      
      if (response.success && response.data) {
        // If the API call is successful, set the properties from the response
        setProperties(response.data);
      } else {
        // If the API fails, log the error and clear existing properties
        console.error('Failed to fetch properties:', response.error);
        setProperties([]); // Clear data on failure
      }
    } catch (error) {
      // This catches network errors or other unexpected issues
      console.error('Error fetching properties:', error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  // Load properties on component mount
  useEffect(() => {
    fetchProperties();
  }, []);

  // Update goToPageInput when currentPage changes
  useEffect(() => {
    setGoToPageInput(currentPage.toString());
  }, [currentPage]);

  // Filter and sort logic
  useEffect(() => {
    let filtered = [...properties];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(property =>
        property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.hostName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(property => property.status === statusFilter);
    }

    // Property type filter
    if (propertyTypeFilter !== 'all') {
      filtered = filtered.filter(property => property.propertyType === propertyTypeFilter);
    }

    // Verification filter
    if (verificationFilter !== 'all') {
      filtered = filtered.filter(property => property.verificationStatus === verificationFilter);
    }

    // Price range filter
    if (priceRange.min || priceRange.max) {
      filtered = filtered.filter(property => {
        const price = property.pricePerNight;
        const min = priceRange.min ? parseFloat(priceRange.min) : 0;
        const max = priceRange.max ? parseFloat(priceRange.max) : Infinity;
        return price >= min && price <= max;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'hostName':
          comparison = a.hostName.localeCompare(b.hostName);
          break;
        case 'pricePerNight':
          comparison = a.pricePerNight - b.pricePerNight;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'rating':
          comparison = a.rating - b.rating;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredProperties(filtered);
    setCurrentPage(1);
  }, [properties, searchTerm, statusFilter, propertyTypeFilter, verificationFilter, priceRange, sortField, sortOrder]);

  // Pagination
  const paginatedProperties = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProperties.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProperties, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);

  // Get unique values for filters
  const uniquePropertyTypes = useMemo(() => {
    return [...new Set(properties.map(p => p.propertyType))];
  }, [properties]);

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleViewDetails = (property: Property) => {
    setSelectedProperty(property);
    setShowModal(true);
  };

  const handleStatusUpdate = async (propertyId: string, newStatus: Property['status']) => {
    try {
      const response = await api.patch(`/hosts/properties/${propertyId}/status`, {
        status: newStatus
      });
      
      if (response.success) {
        setProperties(prev => prev.map(p => 
          p.id === propertyId ? { ...p, status: newStatus } : p
        ));
      }
    } catch (error) {
      console.error('Error updating property status:', error);
      // For demo, update locally
      setProperties(prev => prev.map(p => 
        p.id === propertyId ? { ...p, status: newStatus } : p
      ));
    }
  };

  const handleVerificationUpdate = async (propertyId: string, newVerification: Property['verificationStatus']) => {
    try {
      const response = await api.patch(`/hosts/properties/${propertyId}/verification`, {
        verificationStatus: newVerification
      });
      
      if (response.success) {
        setProperties(prev => prev.map(p => 
          p.id === propertyId ? { ...p, verificationStatus: newVerification } : p
        ));
      }
    } catch (error) {
      console.error('Error updating verification status:', error);
      // For demo, update locally
      setProperties(prev => prev.map(p => 
        p.id === propertyId ? { ...p, verificationStatus: newVerification } : p
      ));
    }
  };

  const handleDelete = async (propertyId: string) => {
    if (confirm('Are you sure you want to delete this property?')) {
      try {
        const response = await api.delete(`/hosts/properties/${propertyId}`);
        
        if (response.success) {
          setProperties(prev => prev.filter(p => p.id !== propertyId));
        }
      } catch (error) {
        console.error('Error deleting property:', error);
        // For demo, delete locally
        setProperties(prev => prev.filter(p => p.id !== propertyId));
      }
    }
  };

  const handleGoToPage = (value: string) => {
    const page = parseInt(value);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setGoToPageInput(page.toString());
    } else {
      setGoToPageInput(currentPage.toString());
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-400/20 text-green-400';
      case 'pending': return 'bg-yellow-400/20 text-yellow-400';
      case 'suspended': return 'bg-red-400/20 text-red-400';
      case 'rejected': return 'bg-gray-400/20 text-gray-400';
      default: return 'bg-gray-400/20 text-gray-400';
    }
  };

  const getVerificationColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'unverified': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: properties.length,
      active: properties.filter(p => p.status === 'active').length,
      pending: properties.filter(p => p.status === 'pending').length,
      verified: properties.filter(p => p.verificationStatus === 'verified').length
    };
  }, [properties]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-2xl rounded-2xl p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Hosts Properties Management
              </h1>
              <p className="text-white/70 text-lg">
                Monitor and manage all property listings from hosts
              </p>
            </div>
            
            <button
              onClick={fetchProperties}
              className="bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 self-start lg:self-center"
            >
              <i className="bi bi-arrow-clockwise text-lg"></i>
              Refresh Properties
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Total Properties</p>
                <p className="text-white text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="bg-blue-400/20 p-3 rounded-xl">
                <i className="bi bi-house text-blue-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Active Properties</p>
                <p className="text-white text-2xl font-bold">{stats.active}</p>
              </div>
              <div className="bg-green-400/20 p-3 rounded-xl">
                <i className="bi bi-check-circle text-green-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Pending Review</p>
                <p className="text-white text-2xl font-bold">{stats.pending}</p>
              </div>
              <div className="bg-yellow-400/20 p-3 rounded-xl">
                <i className="bi bi-clock text-yellow-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Verified</p>
                <p className="text-white text-2xl font-bold">{stats.verified}</p>
              </div>
              <div className="bg-pink-400/20 p-3 rounded-xl">
                <i className="bi bi-patch-check text-pink-400 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
            {/* Search */}
            <div className="xl:col-span-2">
              <label className="block text-sm font-medium text-white/80 mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Property, host, or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/60 focus:outline-none focus:border-pink-400 transition-colors"
                />
                <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-white/60"></i>
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-400 transition-colors"
              >
                <option value="all" className="bg-[#0b1c36] text-white">All Status</option>
                <option value="active" className="bg-[#0b1c36] text-white">Active</option>
                <option value="pending" className="bg-[#0b1c36] text-white">Pending</option>
                <option value="suspended" className="bg-[#0b1c36] text-white">Suspended</option>
                <option value="rejected" className="bg-[#0b1c36] text-white">Rejected</option>
              </select>
            </div>

            {/* Property Type Filter */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Property Type</label>
              <select
                value={propertyTypeFilter}
                onChange={(e) => setPropertyTypeFilter(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-400 transition-colors"
              >
                <option value="all" className="bg-[#0b1c36] text-white">All Types</option>
                {uniquePropertyTypes.map(type => (
                  <option key={type} value={type} className="bg-[#0b1c36] text-white">{type}</option>
                ))}
              </select>
            </div>

            {/* Verification Filter */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Verification</label>
              <select
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-400 transition-colors"
              >
                <option value="all" className="bg-[#0b1c36] text-white">All</option>
                <option value="verified" className="bg-[#0b1c36] text-white">Verified</option>
                <option value="pending" className="bg-[#0b1c36] text-white">Pending</option>
                <option value="unverified" className="bg-[#0b1c36] text-white">Unverified</option>
              </select>
            </div>
          </div>

          {/* Price Range and View Mode */}
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-white/80">Price Range:</label>
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  className="w-20 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-2 py-1 text-white placeholder-white/60 focus:outline-none focus:border-pink-400 transition-colors text-sm"
                />
                <span className="text-white/60">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  className="w-20 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-2 py-1 text-white placeholder-white/60 focus:outline-none focus:border-pink-400 transition-colors text-sm"
                />
              </div>
              <p className="text-white/60 text-sm">
                Showing {paginatedProperties.length} of {filteredProperties.length} properties
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-pink-500 text-white' 
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                <i className="bi bi-grid-3x3-gap mr-2"></i>Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-pink-500 text-white' 
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                <i className="bi bi-list-ul mr-2"></i>List
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-pink-400 border-t-transparent rounded-full"></div>
            <p className="text-white/60 mt-4">Loading properties...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredProperties.length === 0 && (
          <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-2xl p-12 text-center">
            <i className="bi bi-house-x text-white/40 text-6xl mb-4"></i>
            <h3 className="text-white text-xl font-semibold mb-2">No properties found</h3>
            <p className="text-white/60">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Grid View */}
        {!loading && filteredProperties.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedProperties.map((property) => (
              <div key={property.id} className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative">
                  <img src={property.featuredImage} alt={property.title} className="w-full h-48 object-cover" />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(property.status)}`}>
                      {property.status}
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-white/20 ${getVerificationColor(property.verificationStatus)}`}>
                      {property.verificationStatus}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
                    <div className="flex items-center gap-1 text-white text-sm">
                      <i className="bi bi-star-fill text-yellow-400"></i>
                      <span>{property.rating}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="text-white font-semibold text-lg mb-2 truncate">{property.title}</h3>
                  <p className="text-white/60 text-sm mb-2">Host: {property.hostName}</p>
                  <p className="text-white/60 text-sm mb-3">{property.city}, {property.state}</p>
                  
                  <div className="flex items-center justify-between text-sm text-white/60 mb-3">
                    <span>{property.bedrooms} beds • {property.bathrooms} baths</span>
                    <span>{property.maxGuests} guests</span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-white text-xl font-bold">${property.pricePerNight}</span>
                      <span className="text-white/60 text-sm">/night</span>
                    </div>
                    <div className="text-white/60 text-sm">
                      {property.totalBookings} bookings
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(property)}
                      className="flex-1 bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300"
                    >
                      <i className="bi bi-eye mr-1"></i>View
                    </button>
                    <div className="relative group">
                      <button className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
                        <i className="bi bi-three-dots-vertical"></i>
                      </button>
                      <div className="absolute right-0 top-full mt-1 bg-[#0b1c36] border border-blue-900/20 rounded-lg shadow-xl py-1 min-w-[120px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                        <button
                          onClick={() => handleStatusUpdate(property.id, property.status === 'active' ? 'suspended' : 'active')}
                          className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                        >
                          {property.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleVerificationUpdate(property.id, property.verificationStatus === 'verified' ? 'pending' : 'verified')}
                          className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                        >
                          {property.verificationStatus === 'verified' ? 'Unverify' : 'Verify'}
                        </button>
                        <button
                          onClick={() => handleDelete(property.id)}
                          className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {!loading && filteredProperties.length > 0 && viewMode === 'list' && (
          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white/80 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white/80 uppercase tracking-wider">
                      Host
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('pricePerNight')}
                        className="text-sm font-medium text-white/80 uppercase tracking-wider flex items-center gap-1 hover:text-white transition-colors"
                      >
                        Price/Night
                        <i className={`bi bi-chevron-${sortField === 'pricePerNight' && sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('status')}
                        className="text-sm font-medium text-white/80 uppercase tracking-wider flex items-center gap-1 hover:text-white transition-colors"
                      >
                        Status
                        <i className={`bi bi-chevron-${sortField === 'status' && sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('rating')}
                        className="text-sm font-medium text-white/80 uppercase tracking-wider flex items-center gap-1 hover:text-white transition-colors"
                      >
                        Rating
                        <i className={`bi bi-chevron-${sortField === 'rating' && sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                      </button>
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-white/80 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {paginatedProperties.map((property) => (
                    <tr key={property.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <img src={property.featuredImage} alt={property.title} className="w-16 h-12 rounded-lg object-cover mr-4" />
                          <div>
                            <div className="text-white font-medium">{property.title}</div>
                            <div className="text-white/60 text-sm">{property.city}, {property.state}</div>
                            <div className="text-white/50 text-xs">{property.propertyType}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{property.hostName}</div>
                        <div className="text-white/60 text-sm">{property.hostEmail}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-bold">${property.pricePerNight}</div>
                        <div className="text-white/60 text-sm">{property.totalBookings} bookings</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(property.status)}`}>
                            {property.status}
                          </span>
                          <span className={`text-xs ${getVerificationColor(property.verificationStatus)}`}>
                            {property.verificationStatus}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <i className="bi bi-star-fill text-yellow-400 text-sm"></i>
                          <span className="text-white font-medium">{property.rating}</span>
                          <span className="text-white/60 text-sm">({property.reviews})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetails(property)}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <i className="bi bi-eye text-lg"></i>
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(property.id, property.status === 'active' ? 'suspended' : 'active')}
                            className="text-yellow-400 hover:text-yellow-300 transition-colors"
                          >
                            <i className="bi bi-gear text-lg"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(property.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <i className="bi bi-trash text-lg"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white font-medium hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <i className="bi bi-chevron-left"></i>
              </button>
              
              <div className="hidden sm:flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-pink-500 text-white'
                          : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <div className="sm:hidden text-sm text-white/70">
                Page {currentPage} of {totalPages}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white font-medium hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
            
            <div className="hidden md:flex items-center gap-2">
              <span className="text-white/70 text-sm">Go to page:</span>
              <input
                type="number"
                min="1"
                max={totalPages}
                value={goToPageInput}
                onChange={(e) => setGoToPageInput(e.target.value)}
                onBlur={(e) => handleGoToPage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleGoToPage((e.target as HTMLInputElement).value);
                  }
                }}
                className="w-16 px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none focus:border-pink-400 transition-colors"
              />
              <span className="text-white/70 text-sm">of {totalPages}</span>
            </div>
          </div>
        )}
      </div>

      {/* Property Details Modal */}
      {showModal && selectedProperty && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-blue-900/20 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-[#0b1c36] to-[#13294b] border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-2xl font-semibold text-white">Property Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex items-center justify-center w-8 h-8 bg-white/10 hover:bg-red-500 text-white rounded-full transition-colors"
                >
                  <i className="bi bi-x text-xl"></i>
                </button>
              </div>

              {/* Modal Content */}
              <div className="px-6 py-6 overflow-y-auto flex-1">
                <div className="space-y-6">
                  
                  {/* Property Images */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Property Images</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {selectedProperty.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Property ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Basic Information</h3>
                      <div className="bg-white/5 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between">
                          <span className="text-white/60">Property ID</span>
                          <span className="text-white font-medium">{selectedProperty.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Title</span>
                          <span className="text-white font-medium text-right">{selectedProperty.title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Type</span>
                          <span className="text-white font-medium">{selectedProperty.propertyType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Price per Night</span>
                          <span className="text-white font-bold">${selectedProperty.pricePerNight}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/60">Status</span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedProperty.status)}`}>
                            {selectedProperty.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/60">Verification</span>
                          <span className={`text-sm font-medium ${getVerificationColor(selectedProperty.verificationStatus)}`}>
                            {selectedProperty.verificationStatus}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Host Information</h3>
                      <div className="bg-white/5 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between">
                          <span className="text-white/60">Host ID</span>
                          <span className="text-white font-medium">{selectedProperty.hostId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Name</span>
                          <span className="text-white font-medium">{selectedProperty.hostName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Email</span>
                          <span className="text-white font-medium text-right">{selectedProperty.hostEmail}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Phone</span>
                          <span className="text-white font-medium">{selectedProperty.hostPhone}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Location & Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Location</h3>
                      <div className="bg-white/5 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between">
                          <span className="text-white/60">Address</span>
                          <span className="text-white font-medium text-right">{selectedProperty.address}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">City</span>
                          <span className="text-white font-medium">{selectedProperty.city}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">State</span>
                          <span className="text-white font-medium">{selectedProperty.state}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Country</span>
                          <span className="text-white font-medium">{selectedProperty.country}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Zip Code</span>
                          <span className="text-white font-medium">{selectedProperty.zipCode}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Property Details</h3>
                      <div className="bg-white/5 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between">
                          <span className="text-white/60">Bedrooms</span>
                          <span className="text-white font-medium">{selectedProperty.bedrooms}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Bathrooms</span>
                          <span className="text-white font-medium">{selectedProperty.bathrooms}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Max Guests</span>
                          <span className="text-white font-medium">{selectedProperty.maxGuests}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/60">Rating</span>
                          <div className="flex items-center gap-1">
                            <i className="bi bi-star-fill text-yellow-400"></i>
                            <span className="text-white font-medium">{selectedProperty.rating}</span>
                            <span className="text-white/60">({selectedProperty.reviews} reviews)</span>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Total Bookings</span>
                          <span className="text-white font-medium">{selectedProperty.totalBookings}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description & Amenities */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/80">{selectedProperty.description}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Amenities</h3>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex flex-wrap gap-2">
                        {selectedProperty.amenities.map((amenity, index) => (
                          <span key={index} className="px-3 py-1 bg-pink-500/20 text-pink-400 rounded-full text-sm">
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Important Dates</h3>
                      <div className="bg-white/5 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between">
                          <span className="text-white/60">Created</span>
                          <span className="text-white font-medium">{format(selectedProperty.createdAt, 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Last Updated</span>
                          <span className="text-white font-medium">{format(selectedProperty.updatedAt, 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gradient-to-r from-[#0b1c36] to-[#13294b] border-t border-white/10 px-6 py-4 flex justify-end gap-3 z-10">
                <button
                  onClick={() => handleStatusUpdate(selectedProperty.id, selectedProperty.status === 'active' ? 'suspended' : 'active')}
                  className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors font-medium"
                >
                  {selectedProperty.status === 'active' ? 'Suspend' : 'Activate'}
                </button>
                <button
                  onClick={() => handleVerificationUpdate(selectedProperty.id, selectedProperty.verificationStatus === 'verified' ? 'pending' : 'verified')}
                  className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-medium"
                >
                  {selectedProperty.verificationStatus === 'verified' ? 'Unverify' : 'Verify'}
                </button>
                <button
                  onClick={() => {
                    handleDelete(selectedProperty.id);
                    setShowModal(false);
                  }}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-medium"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white rounded-lg transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostsPropertiesPage;