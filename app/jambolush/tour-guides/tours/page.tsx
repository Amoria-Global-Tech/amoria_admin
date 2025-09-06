"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../../api/jambolush/api-conn';

// Types
interface Tour {
  id: string;
  tourCode: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'moderate' | 'challenging' | 'expert';
  duration: number; // in hours
  maxParticipants: number;
  minParticipants: number;
  pricePerPerson: number;
  location: string;
  meetingPoint: string;
  images: string[];
  inclusions: string[];
  exclusions: string[];
  requirements: string[];
  guideId: string;
  guideName: string;
  guideEmail: string;
  guidePhone: string;
  guideRating: number;
  guideExperience: number; // years
  tourStatus: 'active' | 'inactive' | 'cancelled' | 'suspended' | 'draft';
  bookingStatus: 'available' | 'fully-booked' | 'limited' | 'closed';
  nextAvailableDate: Date;
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date;
  lastModifiedBy: string;
  seasonalPricing?: {
    season: string;
    multiplier: number;
  };
  cancellationPolicy: string;
  weatherDependent: boolean;
  groupDiscounts?: {
    minSize: number;
    discountPercent: number;
  };
}

type ViewMode = 'grid' | 'list';
type SortField = 'tourCode' | 'title' | 'guideName' | 'pricePerPerson' | 'tourStatus' | 'createdAt' | 'averageRating' | 'totalBookings';
type SortOrder = 'asc' | 'desc';

const ToursAdminPage: React.FC = () => {
  // Date formatting helper function
  const format = (date: Date, formatStr: string): string => {
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
  const [tours, setTours] = useState<Tour[]>([]);
  const [filteredTours, setFilteredTours] = useState<Tour[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [loading, setLoading] = useState(true);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [goToPageInput, setGoToPageInput] = useState('');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [bookingFilter, setBookingFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  
  // Sort states
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const fetchTours = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await api.get<Tour[]>('/admin/tours');
      
      if (response.success && response.data) {
        setTours(response.data);
      } else {
        console.error('Failed to fetch tours:', response.error);
        setTours([]);
      }
    } catch (error) {
      console.error('Error fetching tours:', error);
      setTours([]);
    } finally {
      setLoading(false);
    }
  };

  // Load tours on component mount
  useEffect(() => {
    fetchTours();
  }, []);

  // Update goToPageInput when currentPage changes
  useEffect(() => {
    setGoToPageInput(currentPage.toString());
  }, [currentPage]);

  // Filter and sort logic
  useEffect(() => {
    let filtered = [...tours];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(tour =>
        tour.tourCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tour.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tour.guideName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tour.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tour.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(tour => tour.tourStatus === statusFilter);
    }

    // Booking filter
    if (bookingFilter !== 'all') {
      filtered = filtered.filter(tour => tour.bookingStatus === bookingFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(tour => tour.category === categoryFilter);
    }

    // Difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(tour => tour.difficulty === difficultyFilter);
    }

    // Price range filter
    if (priceRange.min || priceRange.max) {
      filtered = filtered.filter(tour => {
        const price = tour.pricePerPerson;
        const min = priceRange.min ? parseFloat(priceRange.min) : 0;
        const max = priceRange.max ? parseFloat(priceRange.max) : Infinity;
        return price >= min && price <= max;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'tourCode':
          comparison = a.tourCode.localeCompare(b.tourCode);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'guideName':
          comparison = a.guideName.localeCompare(b.guideName);
          break;
        case 'pricePerPerson':
          comparison = a.pricePerPerson - b.pricePerPerson;
          break;
        case 'tourStatus':
          comparison = a.tourStatus.localeCompare(b.tourStatus);
          break;
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'averageRating':
          comparison = a.averageRating - b.averageRating;
          break;
        case 'totalBookings':
          comparison = a.totalBookings - b.totalBookings;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredTours(filtered);
    setCurrentPage(1);
  }, [tours, searchTerm, statusFilter, bookingFilter, categoryFilter, difficultyFilter, priceRange, sortField, sortOrder]);

  // Pagination
  const paginatedTours = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTours.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTours, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredTours.length / itemsPerPage);

  // Handlers
  const handleSort = (field: SortField): void => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleViewDetails = (tour: Tour): void => {
    setSelectedTour(tour);
    setShowModal(true);
  };

  const handleStatusUpdate = async (tourId: string, newStatus: Tour['tourStatus']): Promise<void> => {
    try {
      const response = await api.patch(`/admin/tours/${tourId}/status`, {
        status: newStatus
      });
      
      if (response.success) {
        setTours(prev => prev.map(t => 
          t.id === tourId ? { ...t, tourStatus: newStatus } : t
        ));
      }
    } catch (error) {
      console.error('Error updating tour status:', error);
    }
  };

  const handleBookingStatusUpdate = async (tourId: string, newBookingStatus: Tour['bookingStatus']): Promise<void> => {
    try {
      const response = await api.patch(`/admin/tours/${tourId}/booking-status`, {
        bookingStatus: newBookingStatus
      });
      
      if (response.success) {
        setTours(prev => prev.map(t => 
          t.id === tourId ? { ...t, bookingStatus: newBookingStatus } : t
        ));
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  };

  const handlePriceUpdate = async (tourId: string, newPrice: number): Promise<void> => {
    if (confirm(`Are you sure you want to update the price to $${newPrice}?`)) {
      try {
        const response = await api.patch(`/admin/tours/${tourId}/price`, {
          pricePerPerson: newPrice
        });
        
        if (response.success) {
          setTours(prev => prev.map(t => 
            t.id === tourId ? { ...t, pricePerPerson: newPrice } : t
          ));
        }
      } catch (error) {
        console.error('Error updating price:', error);
      }
    }
  };

  const handleDeleteTour = async (tourId: string): Promise<void> => {
    if (confirm('Are you sure you want to delete this tour? This action cannot be undone.')) {
      try {
        const response = await api.delete(`/admin/tours/${tourId}`);
        
        if (response.success) {
          setTours(prev => prev.filter(t => t.id !== tourId));
        }
      } catch (error) {
        console.error('Error deleting tour:', error);
      }
    }
  };

  const handleGoToPage = (value: string): void => {
    const page = parseInt(value);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setGoToPageInput(page.toString());
    } else {
      setGoToPageInput(currentPage.toString());
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return 'bg-green-400/20 text-green-400';
      case 'inactive': return 'bg-gray-400/20 text-gray-400';
      case 'cancelled': return 'bg-red-400/20 text-red-400';
      case 'suspended': return 'bg-orange-400/20 text-orange-400';
      case 'draft': return 'bg-yellow-400/20 text-yellow-400';
      default: return 'bg-gray-400/20 text-gray-400';
    }
  };

  const getBookingStatusColor = (status: string): string => {
    switch (status) {
      case 'available': return 'text-green-400';
      case 'fully-booked': return 'text-red-400';
      case 'limited': return 'text-yellow-400';
      case 'closed': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'moderate': return 'text-yellow-400';
      case 'challenging': return 'text-orange-400';
      case 'expert': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const totalRevenue = tours.reduce((sum, t) => sum + t.totalRevenue, 0);
    const averagePrice = tours.length > 0 ? tours.reduce((sum, t) => sum + t.pricePerPerson, 0) / tours.length : 0;
    
    return {
      total: tours.length,
      active: tours.filter(t => t.tourStatus === 'active').length,
      totalBookings: tours.reduce((sum, t) => sum + t.totalBookings, 0),
      totalRevenue: totalRevenue,
      averagePrice: averagePrice
    };
  }, [tours]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-2xl rounded-2xl p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Tour Guides Administration
              </h1>
              <p className="text-white/70 text-lg">
                Manage tours, guides, and tour operations
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={fetchTours}
                className="bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
              >
                <i className="bi bi-arrow-clockwise text-lg"></i>
                Refresh Tours
              </button>
              <button
                className="bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
              >
                <i className="bi bi-plus-lg text-lg"></i>
                Add Tour
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Total Tours</p>
                <p className="text-white text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="bg-blue-400/20 p-3 rounded-xl">
                <i className="bi bi-map text-blue-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Active Tours</p>
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
                <p className="text-white/60 text-sm">Total Bookings</p>
                <p className="text-white text-2xl font-bold">{stats.totalBookings}</p>
              </div>
              <div className="bg-yellow-400/20 p-3 rounded-xl">
                <i className="bi bi-people text-yellow-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Total Revenue</p>
                <p className="text-white text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-pink-400/20 p-3 rounded-xl">
                <i className="bi bi-currency-dollar text-pink-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Avg Price</p>
                <p className="text-white text-2xl font-bold">${Math.round(stats.averagePrice)}</p>
              </div>
              <div className="bg-orange-400/20 p-3 rounded-xl">
                <i className="bi bi-graph-up text-orange-400 text-xl"></i>
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
                  placeholder="Tour code, title, guide, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/60 focus:outline-none focus:border-pink-400 transition-colors"
                />
                <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-white/60"></i>
              </div>
            </div>

            {/* Tour Status Filter */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Tour Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-400 transition-colors"
              >
                <option value="all" className="bg-[#0b1c36] text-white">All Status</option>
                <option value="active" className="bg-[#0b1c36] text-white">Active</option>
                <option value="inactive" className="bg-[#0b1c36] text-white">Inactive</option>
                <option value="suspended" className="bg-[#0b1c36] text-white">Suspended</option>
                <option value="cancelled" className="bg-[#0b1c36] text-white">Cancelled</option>
                <option value="draft" className="bg-[#0b1c36] text-white">Draft</option>
              </select>
            </div>

            {/* Booking Status Filter */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Booking Status</label>
              <select
                value={bookingFilter}
                onChange={(e) => setBookingFilter(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-400 transition-colors"
              >
                <option value="all" className="bg-[#0b1c36] text-white">All Bookings</option>
                <option value="available" className="bg-[#0b1c36] text-white">Available</option>
                <option value="limited" className="bg-[#0b1c36] text-white">Limited</option>
                <option value="fully-booked" className="bg-[#0b1c36] text-white">Fully Booked</option>
                <option value="closed" className="bg-[#0b1c36] text-white">Closed</option>
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Difficulty</label>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-400 transition-colors"
              >
                <option value="all" className="bg-[#0b1c36] text-white">All Levels</option>
                <option value="easy" className="bg-[#0b1c36] text-white">Easy</option>
                <option value="moderate" className="bg-[#0b1c36] text-white">Moderate</option>
                <option value="challenging" className="bg-[#0b1c36] text-white">Challenging</option>
                <option value="expert" className="bg-[#0b1c36] text-white">Expert</option>
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
                Showing {paginatedTours.length} of {filteredTours.length} tours
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
            <p className="text-white/60 mt-4">Loading tours...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredTours.length === 0 && (
          <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-2xl p-12 text-center">
            <i className="bi bi-map text-white/40 text-6xl mb-4"></i>
            <h3 className="text-white text-xl font-semibold mb-2">No tours found</h3>
            <p className="text-white/60">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Grid View */}
        {!loading && filteredTours.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedTours.map((tour) => (
              <div key={tour.id} className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative">
                  <img src={tour.images[0] || `https://picsum.photos/seed/${tour.id}/800/600`} alt={tour.title} className="w-full h-48 object-cover" />
                  <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(tour.tourStatus)}`}>
                      {tour.tourStatus}
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-white/20 ${getBookingStatusColor(tour.bookingStatus)}`}>
                      {tour.bookingStatus}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
                    <div className="text-white text-sm font-bold">
                      {tour.duration}h
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <div className={`text-sm font-medium ${getDifficultyColor(tour.difficulty)}`}>
                      {tour.difficulty}
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="text-white font-semibold text-lg mb-1 truncate">{tour.title}</h3>
                  <p className="text-white/60 text-sm mb-2">Code: {tour.tourCode}</p>
                  <p className="text-white/80 text-sm font-medium mb-1">{tour.guideName}</p>
                  <p className="text-white/60 text-xs mb-3">{tour.location}</p>
                  
                  <div className="space-y-2 text-sm text-white/60 mb-3">
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="text-white">{tour.duration} hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max participants:</span>
                      <span className="text-white">{tour.maxParticipants}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rating:</span>
                      <div className="flex items-center gap-1">
                        <i className="bi bi-star-fill text-yellow-400 text-xs"></i>
                        <span className="text-white">{tour.averageRating.toFixed(1)}</span>
                        <span className="text-white/60">({tour.totalReviews})</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-white text-xl font-bold">${tour.pricePerPerson}</span>
                      <div className="text-white/60 text-xs">
                        per person
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 text-sm font-medium">
                        {tour.totalBookings} bookings
                      </div>
                      <div className="text-white/60 text-xs">${tour.totalRevenue.toLocaleString()} revenue</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(tour)}
                      className="flex-1 bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300"
                    >
                      <i className="bi bi-eye mr-1"></i>View
                    </button>
                    <div className="relative group">
                      <button className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
                        <i className="bi bi-three-dots-vertical"></i>
                      </button>
                      <div className="absolute right-0 top-full mt-1 bg-[#0b1c36] border border-blue-900/20 rounded-lg shadow-xl py-1 min-w-[140px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                        <button
                          onClick={() => handleStatusUpdate(tour.id, tour.tourStatus === 'active' ? 'inactive' : 'active')}
                          className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                        >
                          {tour.tourStatus === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleBookingStatusUpdate(tour.id, tour.bookingStatus === 'available' ? 'closed' : 'available')}
                          className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                        >
                          {tour.bookingStatus === 'available' ? 'Close Bookings' : 'Open Bookings'}
                        </button>
                        <button
                          onClick={() => {
                            const newPrice = prompt('Enter new price per person:', tour.pricePerPerson.toString());
                            if (newPrice && !isNaN(Number(newPrice))) {
                              handlePriceUpdate(tour.id, Number(newPrice));
                            }
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-yellow-400 hover:bg-yellow-500/20 transition-colors"
                        >
                          Update Price
                        </button>
                        <button
                          onClick={() => handleDeleteTour(tour.id)}
                          className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          Delete Tour
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
        {!loading && filteredTours.length > 0 && viewMode === 'list' && (
          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white/80 uppercase tracking-wider">
                      Tour
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white/80 uppercase tracking-wider">
                      Guide
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('pricePerPerson')}
                        className="text-sm font-medium text-white/80 uppercase tracking-wider flex items-center gap-1 hover:text-white transition-colors"
                      >
                        Price
                        <i className={`bi bi-chevron-${sortField === 'pricePerPerson' && sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('tourStatus')}
                        className="text-sm font-medium text-white/80 uppercase tracking-wider flex items-center gap-1 hover:text-white transition-colors"
                      >
                        Status
                        <i className={`bi bi-chevron-${sortField === 'tourStatus' && sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('totalBookings')}
                        className="text-sm font-medium text-white/80 uppercase tracking-wider flex items-center gap-1 hover:text-white transition-colors"
                      >
                        Bookings
                        <i className={`bi bi-chevron-${sortField === 'totalBookings' && sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('averageRating')}
                        className="text-sm font-medium text-white/80 uppercase tracking-wider flex items-center gap-1 hover:text-white transition-colors"
                      >
                        Rating
                        <i className={`bi bi-chevron-${sortField === 'averageRating' && sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                      </button>
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-white/80 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {paginatedTours.map((tour) => (
                    <tr key={tour.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <img src={tour.images[0] || `https://picsum.photos/seed/${tour.id}/800/600`} alt={tour.title} className="w-16 h-12 rounded-lg object-cover mr-4" />
                          <div>
                            <div className="text-white font-medium">{tour.tourCode}</div>
                            <div className="text-white/60 text-sm truncate max-w-[200px]">{tour.title}</div>
                            <div className="text-white/50 text-xs">{tour.location}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{tour.guideName}</div>
                        <div className="text-white/60 text-sm">{tour.guideEmail}</div>
                        <div className="flex items-center gap-1 text-yellow-400 text-sm">
                          <i className="bi bi-star-fill text-xs"></i>
                          <span>{tour.guideRating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-bold">${tour.pricePerPerson}</div>
                        <div className="text-white/60 text-sm">per person</div>
                        <div className={`text-sm font-medium ${getDifficultyColor(tour.difficulty)}`}>
                          {tour.difficulty}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(tour.tourStatus)}`}>
                          {tour.tourStatus}
                        </span>
                        <div className={`text-sm font-medium mt-1 ${getBookingStatusColor(tour.bookingStatus)}`}>
                          {tour.bookingStatus}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-bold">{tour.totalBookings}</div>
                        <div className="text-white/60 text-sm">${tour.totalRevenue.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <i className="bi bi-star-fill text-yellow-400"></i>
                          <span className="text-white font-medium">{tour.averageRating.toFixed(1)}</span>
                        </div>
                        <div className="text-white/60 text-sm">({tour.totalReviews} reviews)</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetails(tour)}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <i className="bi bi-eye text-lg"></i>
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(tour.id, tour.tourStatus === 'active' ? 'inactive' : 'active')}
                            className="text-green-400 hover:text-green-300 transition-colors"
                          >
                            <i className="bi bi-power text-lg"></i>
                          </button>
                          <button
                            onClick={() => handleBookingStatusUpdate(tour.id, tour.bookingStatus === 'available' ? 'closed' : 'available')}
                            className="text-yellow-400 hover:text-yellow-300 transition-colors"
                          >
                            <i className="bi bi-calendar-check text-lg"></i>
                          </button>
                          <button
                            onClick={() => {
                              const newPrice = prompt('Enter new price per person:', tour.pricePerPerson.toString());
                              if (newPrice && !isNaN(Number(newPrice))) {
                                handlePriceUpdate(tour.id, Number(newPrice));
                              }
                            }}
                            className="text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            <i className="bi bi-currency-dollar text-lg"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteTour(tour.id)}
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

      {/* Tour Details Modal */}
      {showModal && selectedTour && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-blue-900/20 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
              
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-[#0b1c36] to-[#13294b] border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-2xl font-semibold text-white">Tour Details</h2>
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
                  
                  {/* Tour Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Tour Information</h3>
                      <div className="bg-white/5 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between">
                          <span className="text-white/60">Tour Code</span>
                          <span className="text-white font-medium">{selectedTour.tourCode}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Tour ID</span>
                          <span className="text-white font-medium">{selectedTour.id}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/60">Status</span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTour.tourStatus)}`}>
                            {selectedTour.tourStatus}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/60">Booking Status</span>
                          <span className={`text-sm font-medium ${getBookingStatusColor(selectedTour.bookingStatus)}`}>
                            {selectedTour.bookingStatus}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Category</span>
                          <span className="text-white font-medium">{selectedTour.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Created</span>
                          <span className="text-white font-medium">{format(selectedTour.createdAt, 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Tour Details</h3>
                      <div className="bg-white/5 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between">
                          <span className="text-white/60">Duration</span>
                          <span className="text-white font-medium">{selectedTour.duration} hours</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Difficulty</span>
                          <span className={`font-medium ${getDifficultyColor(selectedTour.difficulty)}`}>
                            {selectedTour.difficulty}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Max Participants</span>
                          <span className="text-white font-medium">{selectedTour.maxParticipants}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Min Participants</span>
                          <span className="text-white font-medium">{selectedTour.minParticipants}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Price per Person</span>
                          <span className="text-white font-bold">${selectedTour.pricePerPerson}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Weather Dependent</span>
                          <span className="text-white font-medium">{selectedTour.weatherDependent ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Guide Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Guide Information</h3>
                    <div className="bg-white/5 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-white/60">Guide ID</span>
                          <span className="text-white font-medium">{selectedTour.guideId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Name</span>
                          <span className="text-white font-medium">{selectedTour.guideName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Email</span>
                          <span className="text-white font-medium">{selectedTour.guideEmail}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-white/60">Phone</span>
                          <span className="text-white font-medium">{selectedTour.guidePhone}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/60">Rating</span>
                          <div className="flex items-center gap-1">
                            <i className="bi bi-star-fill text-yellow-400"></i>
                            <span className="text-white font-medium">{selectedTour.guideRating.toFixed(1)}</span>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Experience</span>
                          <span className="text-white font-medium">{selectedTour.guideExperience} years</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Location & Meeting Point */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Location Information</h3>
                    <div className="bg-white/5 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-white/60">Location</span>
                          <span className="text-white font-medium">{selectedTour.location}</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-white/60">Meeting Point</span>
                          <span className="text-white font-medium text-right">{selectedTour.meetingPoint}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Performance Metrics</h3>
                    <div className="bg-white/5 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-white/60">Total Bookings</span>
                          <span className="text-white font-bold text-lg">{selectedTour.totalBookings}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Total Revenue</span>
                          <span className="text-green-400 font-medium">${selectedTour.totalRevenue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Next Available</span>
                          <span className="text-white font-medium">{format(selectedTour.nextAvailableDate, 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-white/60">Average Rating</span>
                          <div className="flex items-center gap-1">
                            <i className="bi bi-star-fill text-yellow-400"></i>
                            <span className="text-white font-medium">{selectedTour.averageRating.toFixed(1)}</span>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Total Reviews</span>
                          <span className="text-white font-medium">{selectedTour.totalReviews}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Last Modified</span>
                          <span className="text-white font-medium">{format(selectedTour.updatedAt, 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tour Description */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/80">{selectedTour.description}</p>
                    </div>
                  </div>

                  {/* Inclusions & Exclusions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Inclusions</h3>
                      <div className="bg-white/5 rounded-lg p-4">
                        <ul className="space-y-2">
                          {selectedTour.inclusions.map((item, index) => (
                            <li key={index} className="flex items-center gap-2 text-white/80">
                              <i className="bi bi-check-circle text-green-400"></i>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Exclusions</h3>
                      <div className="bg-white/5 rounded-lg p-4">
                        <ul className="space-y-2">
                          {selectedTour.exclusions.map((item, index) => (
                            <li key={index} className="flex items-center gap-2 text-white/80">
                              <i className="bi bi-x-circle text-red-400"></i>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Requirements */}
                  {selectedTour.requirements.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Requirements</h3>
                      <div className="bg-white/5 rounded-lg p-4">
                        <ul className="space-y-2">
                          {selectedTour.requirements.map((item, index) => (
                            <li key={index} className="flex items-center gap-2 text-white/80">
                              <i className="bi bi-info-circle text-blue-400"></i>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Cancellation Policy */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Cancellation Policy</h3>
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/80">{selectedTour.cancellationPolicy}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gradient-to-r from-[#0b1c36] to-[#13294b] border-t border-white/10 px-6 py-4 flex justify-end gap-3 z-10">
                <button
                  onClick={() => handleStatusUpdate(selectedTour.id, selectedTour.tourStatus === 'active' ? 'inactive' : 'active')}
                  className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-medium"
                >
                  {selectedTour.tourStatus === 'active' ? 'Deactivate Tour' : 'Activate Tour'}
                </button>
                <button
                  onClick={() => handleBookingStatusUpdate(selectedTour.id, selectedTour.bookingStatus === 'available' ? 'closed' : 'available')}
                  className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors font-medium"
                >
                  {selectedTour.bookingStatus === 'available' ? 'Close Bookings' : 'Open Bookings'}
                </button>
                <button
                  onClick={() => {
                    const newPrice = prompt('Enter new price per person:', selectedTour.pricePerPerson.toString());
                    if (newPrice && !isNaN(Number(newPrice))) {
                      handlePriceUpdate(selectedTour.id, Number(newPrice));
                      setShowModal(false);
                    }
                  }}
                  className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors font-medium"
                >
                  Update Price
                </button>
                <button
                  onClick={() => {
                    handleDeleteTour(selectedTour.id);
                    setShowModal(false);
                  }}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-medium"
                >
                  Delete Tour
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

export default ToursAdminPage;