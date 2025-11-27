"use client";
import React, { useState, useEffect, useMemo } from 'react';
import api from '@/app/api/conn';

// Types
interface Tour {
  id: string;
  tourCode: string;
  title: string;
  shortDescription: string;
  description: string;
  category: string;
  type: 'guided' | 'self-guided' | 'group' | 'private';
  difficulty: 'easy' | 'moderate' | 'challenging' | 'expert';
  duration: number; // in hours
  price: number;
  currency: string;
  maxGroupSize: number;
  minGroupSize: number;
  tourGuideId: number;
  guideName: string;
  guideEmail: string;
  guidePhone: string;
  guideRating: number;
  guideExperience: number;
  locationCity: string;
  locationCountry: string;
  locationAddress: string;
  latitude?: number;
  longitude?: number;
  meetingPoint: string;
  isActive: boolean;
  isVerified: boolean;
  rating: number;
  totalReviews: number;
  totalBookings: number;
  totalRevenue: number;
  views: number;
  images: string[];
  itinerary: any[];
  inclusions: string[];
  exclusions: string[];
  requirements: string[];
  tags: string[];
  specialNotes?: string;
  cancelationPolicy: string;
  weatherDependent: boolean;
  groupDiscounts?: {
    minSize: number;
    discountPercent: number;
  };
  seasonalPricing?: {
    season: string;
    multiplier: number;
  }[];
  createdAt: string;
  updatedAt: string;
  nextSchedule?: {
    startDate: string;
    availableSlots: number;
    bookedSlots: number;
  };
  schedules: TourSchedule[];
  recentBookings: TourBooking[];
  reviews: TourReview[];
  metrics: TourMetrics;
}

interface TourSchedule {
  id: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  availableSlots: number;
  bookedSlots: number;
  isAvailable: boolean;
  price: number;
  specialNotes?: string;
  createdAt: string;
}

interface TourBooking {
  id: string;
  type: 'tour';
  guestId: number;
  guestName: string;
  guestEmail: string;
  numberOfParticipants: number;
  totalAmount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  bookingDate: string;
  scheduleDate: string;
  specialRequests?: string;
  checkInStatus?: 'pending' | 'checked-in' | 'completed';
  createdAt: string;
}

interface TourReview {
  id: string;
  userId: number;
  userName: string;
  userEmail: string;
  rating: number;
  comment: string;
  isVisible: boolean;
  isReported: boolean;
  response?: string;
  responseDate?: string;
  createdAt: string;
  images: string[];
}

interface TourMetrics {
  totalRevenue: number;
  totalBookings: number;
  totalParticipants: number;
  averageRating: number;
  totalReviews: number;
  conversionRate: number;
  repeatBookingRate: number;
  cancellationRate: number;
  averageGroupSize: number;
  peakSeason: string;
}

type ViewMode = 'grid' | 'list';
type SortField = 'tourCode' | 'title' | 'guideName' | 'price' | 'rating' | 'totalBookings' | 'createdAt' | 'isActive';
type SortOrder = 'asc' | 'desc';

const ToursAdminPage: React.FC = () => {
  // Date formatting helper function
  const formatDate = (date: string | Date, formatStr: string = 'MMM dd, yyyy'): string => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    
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
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [goToPageInput, setGoToPageInput] = useState('');
  const [selectedTours, setSelectedTours] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [guideFilter, setGuideFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [durationRange, setDurationRange] = useState({ min: '', max: '' });
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // Sort states
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const fetchTours = async (): Promise<void> => {
    try {
      setLoading(true);
      const response: any = await api.get<Tour[]>('/admin/tours');
      
      if (response.data.success && response.data) {
        setTours(response.data.data);
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
        tour.locationCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tour.locationCountry.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tour.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(tour => tour.isActive);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(tour => !tour.isActive);
      }
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(tour => tour.category === categoryFilter);
    }

    // Type filter  
    if (typeFilter !== 'all') {
      filtered = filtered.filter(tour => tour.type === typeFilter);
    }

    // Difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(tour => tour.difficulty === difficultyFilter);
    }

    // Guide filter
    if (guideFilter !== 'all') {
      filtered = filtered.filter(tour => tour.tourGuideId.toString() === guideFilter);
    }

    // Location filter
    if (locationFilter !== 'all') {
      filtered = filtered.filter(tour => 
        tour.locationCity === locationFilter || tour.locationCountry === locationFilter
      );
    }

    // Verification filter
    if (verificationFilter !== 'all') {
      if (verificationFilter === 'verified') {
        filtered = filtered.filter(tour => tour.isVerified);
      } else if (verificationFilter === 'unverified') {
        filtered = filtered.filter(tour => !tour.isVerified);
      }
    }

    // Price range filter
    if (priceRange.min || priceRange.max) {
      filtered = filtered.filter(tour => {
        const price = tour.price;
        const min = priceRange.min ? parseFloat(priceRange.min) : 0;
        const max = priceRange.max ? parseFloat(priceRange.max) : Infinity;
        return price >= min && price <= max;
      });
    }

    // Duration range filter
    if (durationRange.min || durationRange.max) {
      filtered = filtered.filter(tour => {
        const duration = tour.duration;
        const min = durationRange.min ? parseFloat(durationRange.min) : 0;
        const max = durationRange.max ? parseFloat(durationRange.max) : Infinity;
        return duration >= min && duration <= max;
      });
    }

    // Rating filter
    if (ratingFilter !== 'all') {
      const minRating = parseFloat(ratingFilter);
      filtered = filtered.filter(tour => tour.rating >= minRating);
    }

    // Date range filter
    if (dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      filtered = filtered.filter(tour => {
        const tourDate = new Date(tour.createdAt);
        return tourDate >= startDate && tourDate <= endDate;
      });
    }

    // Tab filter
    if (activeTab !== 'all') {
      switch (activeTab) {
        case 'active':
          filtered = filtered.filter(tour => tour.isActive);
          break;
        case 'inactive':
          filtered = filtered.filter(tour => !tour.isActive);
          break;
        case 'verified':
          filtered = filtered.filter(tour => tour.isVerified);
          break;
        case 'unverified':
          filtered = filtered.filter(tour => !tour.isVerified);
          break;
        case 'high-rated':
          filtered = filtered.filter(tour => tour.rating >= 4.5);
          break;
        case 'pending-approval':
          filtered = filtered.filter(tour => !tour.isActive && !tour.isVerified);
          break;
      }
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
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'rating':
          comparison = a.rating - b.rating;
          break;
        case 'totalBookings':
          comparison = a.totalBookings - b.totalBookings;
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'isActive':
          comparison = (a.isActive ? 1 : 0) - (b.isActive ? 1 : 0);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredTours(filtered);
    setCurrentPage(1);
  }, [tours, searchTerm, statusFilter, categoryFilter, typeFilter, difficultyFilter, guideFilter, locationFilter, 
      verificationFilter, priceRange, durationRange, ratingFilter, dateRange, sortField, sortOrder, activeTab]);

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
    setShowDetailsModal(true);
  };

  const handleStatusUpdate = async (tourId: string, isActive: boolean): Promise<void> => {
    try {
      const response: any = await api.patch(`/admin/tours/${tourId}`, { isActive });
      
      if (response.data.success) {
        setTours(prev => prev.map(t => 
          t.id === tourId ? { ...t, isActive } : t
        ));
      }
    } catch (error) {
      console.error('Error updating tour status:', error);
    }
  };

  const handleVerificationUpdate = async (tourId: string, isVerified: boolean): Promise<void> => {
    try {
      const response: any = await api.patch(`/admin/tours/${tourId}`, { isVerified });
      
      if (response.success) {
        setTours(prev => prev.map(t => 
          t.id === tourId ? { ...t, isVerified } : t
        ));
      }
    } catch (error) {
      console.error('Error updating tour verification:', error);
    }
  };

  const handlePriceUpdate = async (tourId: string, newPrice: number): Promise<void> => {
    if (confirm(`Are you sure you want to update the price to $${newPrice}?`)) {
      try {
        const response: any = await api.patch(`/admin/tours/${tourId}`, { price: newPrice });
        
        if (response.success) {
          setTours(prev => prev.map(t => 
            t.id === tourId ? { ...t, price: newPrice } : t
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
        const response: any = await api.delete(`/admin/tours/${tourId}`);
        
        if (response.success) {
          setTours(prev => prev.filter(t => t.id !== tourId));
        }
      } catch (error) {
        console.error('Error deleting tour:', error);
      }
    }
  };

  const handleBulkAction = async (action: string, tourIds: string[]): Promise<void> => {
    if (tourIds.length === 0) return;
    
    if (confirm(`Are you sure you want to ${action} ${tourIds.length} tours?`)) {
      try {
        const response: any = await api.post(`/admin/bulk/tours/${action}`, { tourIds });
        
        if (response.success) {
          await fetchTours();
          setSelectedTours([]);
        }
      } catch (error) {
        console.error(`Error performing bulk ${action}:`, error);
      }
    }
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf'): Promise<void> => {
    try {
      const response: any = await api.post('/admin/export/tours', {
        format,
        filters: {
          searchTerm,
          statusFilter,
          categoryFilter,
          typeFilter,
          difficultyFilter
        }
      });

      if (response.data.success && response.data.downloadUrl) {
        window.open(response.data.downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
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

  const toggleTourSelection = (tourId: string): void => {
    setSelectedTours(prev => 
      prev.includes(tourId) 
        ? prev.filter(id => id !== tourId)
        : [...prev, tourId]
    );
  };

  const toggleSelectAll = (): void => {
    if (selectedTours.length === paginatedTours.length) {
      setSelectedTours([]);
    } else {
      setSelectedTours(paginatedTours.map(tour => tour.id));
    }
  };

  // Utility functions
  const getStatusColor = (isActive: boolean): string => {
    return isActive ? 'bg-green-400/20 text-green-400' : 'bg-red-400/20 text-red-400';
  };

  const getVerificationColor = (isVerified: boolean): string => {
    return isVerified ? 'text-green-400' : 'text-yellow-400';
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

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'guided': return 'bg-blue-400/20 text-blue-400';
      case 'self-guided': return 'bg-purple-400/20 text-purple-400';
      case 'group': return 'bg-green-400/20 text-green-400';
      case 'private': return 'bg-pink-400/20 text-pink-400';
      default: return 'bg-gray-400/20 text-gray-400';
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const totalTours = tours.length;
    const activeTours = tours.filter(t => t.isActive).length;
    const verifiedTours = tours.filter(t => t.isVerified).length;
    const totalRevenue = tours.reduce((sum, t) => sum + t.totalRevenue, 0);
    const totalBookings = tours.reduce((sum, t) => sum + t.totalBookings, 0);
    const averageRating = tours.length > 0 ? tours.reduce((sum, t) => sum + t.rating, 0) / tours.length : 0;
    const highRatedTours = tours.filter(t => t.rating >= 4.5).length;
    const pendingApproval = tours.filter(t => !t.isActive && !t.isVerified).length;
    
    return {
      totalTours,
      activeTours,
      verifiedTours,
      totalRevenue,
      totalBookings,
      averageRating,
      highRatedTours,
      pendingApproval
    };
  }, [tours]);

  // Get unique values for filters
  const uniqueCategories = [...new Set(tours.map(t => t.category))];
  const uniqueGuides = Array.from(
    new Map(tours.map(t => [t.tourGuideId, { id: t.tourGuideId, name: t.guideName }])).values()
  );
  const uniqueLocations = [...new Set([...tours.map(t => t.locationCity), ...tours.map(t => t.locationCountry)])];

  return (
    <div className="">
      <div className="">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-2xl rounded-2xl p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Tours Administration
              </h1>
              <p className="text-white/70 text-lg">
                Manage tours, tour guides, and tour operations
              </p>
            </div>
            
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={fetchTours}
                className="bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
              >
                <i className="bi bi-arrow-clockwise text-lg"></i>
                Refresh Tours
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
              >
                <i className="bi bi-plus-lg text-lg"></i>
                Add Tour
              </button>
              <button
                onClick={() => setShowBulkModal(true)}
                className="bg-gradient-to-r from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
              >
                <i className="bi bi-collection text-lg"></i>
                Bulk Actions
              </button>
              <div className="relative group">
                <button className="bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2">
                  <i className="bi bi-download text-lg"></i>
                  Export
                  <i className="bi bi-chevron-down ml-1"></i>
                </button>
                <div className="absolute right-0 top-full mt-1 bg-[#0b1c36] border border-blue-900/20 rounded-lg shadow-xl py-1 min-w-[140px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={() => handleExport('excel')}
                    className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                  >
                    Export Excel
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                  >
                    Export PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Total Tours</p>
                <p className="text-white text-2xl font-bold">{stats.totalTours}</p>
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
                <p className="text-white text-2xl font-bold">{stats.activeTours}</p>
              </div>
              <div className="bg-green-400/20 p-3 rounded-xl">
                <i className="bi bi-check-circle text-green-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Verified</p>
                <p className="text-white text-2xl font-bold">{stats.verifiedTours}</p>
              </div>
              <div className="bg-purple-400/20 p-3 rounded-xl">
                <i className="bi bi-shield-check text-purple-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">High Rated</p>
                <p className="text-white text-2xl font-bold">{stats.highRatedTours}</p>
              </div>
              <div className="bg-yellow-400/20 p-3 rounded-xl">
                <i className="bi bi-star-fill text-yellow-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Total Bookings</p>
                <p className="text-white text-2xl font-bold">{stats.totalBookings}</p>
              </div>
              <div className="bg-orange-400/20 p-3 rounded-xl">
                <i className="bi bi-people text-orange-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Revenue</p>
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
                <p className="text-white/60 text-sm">Avg Rating</p>
                <p className="text-white text-2xl font-bold">{stats.averageRating.toFixed(1)}</p>
              </div>
              <div className="bg-indigo-400/20 p-3 rounded-xl">
                <i className="bi bi-graph-up text-indigo-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Pending</p>
                <p className="text-white text-2xl font-bold">{stats.pendingApproval}</p>
              </div>
              <div className="bg-red-400/20 p-3 rounded-xl">
                <i className="bi bi-clock text-red-400 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-2xl p-6 mb-8">
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { key: 'all', label: 'All Tours', count: stats.totalTours },
              { key: 'active', label: 'Active', count: stats.activeTours },
              { key: 'inactive', label: 'Inactive', count: stats.totalTours - stats.activeTours },
              { key: 'verified', label: 'Verified', count: stats.verifiedTours },
              { key: 'unverified', label: 'Unverified', count: stats.totalTours - stats.verifiedTours },
              { key: 'high-rated', label: 'High Rated', count: stats.highRatedTours },
              { key: 'pending-approval', label: 'Pending', count: stats.pendingApproval }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  activeTab === tab.key 
                    ? 'bg-pink-500 text-white' 
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {tab.label}
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
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
                <option value="inactive" className="bg-[#0b1c36] text-white">Inactive</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-400 transition-colors"
              >
                <option value="all" className="bg-[#0b1c36] text-white">All Categories</option>
                {uniqueCategories.map(category => (
                  <option key={category} value={category} className="bg-[#0b1c36] text-white">
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-400 transition-colors"
              >
                <option value="all" className="bg-[#0b1c36] text-white">All Types</option>
                <option value="guided" className="bg-[#0b1c36] text-white">Guided</option>
                <option value="self-guided" className="bg-[#0b1c36] text-white">Self-Guided</option>
                <option value="group" className="bg-[#0b1c36] text-white">Group</option>
                <option value="private" className="bg-[#0b1c36] text-white">Private</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
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

            {/* Guide Filter */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Tour Guide</label>
              <select
                value={guideFilter}
                onChange={(e) => setGuideFilter(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-400 transition-colors"
              >
                <option value="all" className="bg-[#0b1c36] text-white">All Guides</option>
                {uniqueGuides.map(guide => (
                  <option key={guide.id} value={guide.id.toString()} className="bg-[#0b1c36] text-white">
                    {guide.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Location</label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-400 transition-colors"
              >
                <option value="all" className="bg-[#0b1c36] text-white">All Locations</option>
                {uniqueLocations.map(location => (
                  <option key={location} value={location} className="bg-[#0b1c36] text-white">
                    {location}
                  </option>
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
                <option value="all" className="bg-[#0b1c36] text-white">All Status</option>
                <option value="verified" className="bg-[#0b1c36] text-white">Verified</option>
                <option value="unverified" className="bg-[#0b1c36] text-white">Unverified</option>
              </select>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Min Rating</label>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-400 transition-colors"
              >
                <option value="all" className="bg-[#0b1c36] text-white">Any Rating</option>
                <option value="1" className="bg-[#0b1c36] text-white">1+ Stars</option>
                <option value="2" className="bg-[#0b1c36] text-white">2+ Stars</option>
                <option value="3" className="bg-[#0b1c36] text-white">3+ Stars</option>
                <option value="4" className="bg-[#0b1c36] text-white">4+ Stars</option>
                <option value="4.5" className="bg-[#0b1c36] text-white">4.5+ Stars</option>
              </select>
            </div>
          </div>

          {/* Price Range, Duration Range and View Mode */}
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

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-white/80">Duration (hrs):</label>
                <input
                  type="number"
                  placeholder="Min"
                  value={durationRange.min}
                  onChange={(e) => setDurationRange(prev => ({ ...prev, min: e.target.value }))}
                  className="w-20 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-2 py-1 text-white placeholder-white/60 focus:outline-none focus:border-pink-400 transition-colors text-sm"
                />
                <span className="text-white/60">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={durationRange.max}
                  onChange={(e) => setDurationRange(prev => ({ ...prev, max: e.target.value }))}
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

        {/* Bulk Selection Controls */}
        {selectedTours.length > 0 && (
          <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-white">
                  {selectedTours.length} tour{selectedTours.length !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => setSelectedTours([])}
                  className="text-white/60 hover:text-white text-sm"
                >
                  Clear selection
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('activate', selectedTours)}
                  className="bg-green-500/20 text-green-400 hover:bg-green-500/30 px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate', selectedTours)}
                  className="bg-red-500/20 text-red-400 hover:bg-red-500/30 px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Deactivate
                </button>
                <button
                  onClick={() => handleBulkAction('verify', selectedTours)}
                  className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Verify
                </button>
                <button
                  onClick={() => handleBulkAction('delete', selectedTours)}
                  className="bg-red-500/20 text-red-400 hover:bg-red-500/30 px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

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
                  <img 
                    src={tour.images[0] || `https://picsum.photos/seed/${tour.id}/800/600`} 
                    alt={tour.title} 
                    className="w-full h-48 object-cover" 
                  />
                  <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(tour.isActive)}`}>
                      {tour.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(tour.type)}`}>
                      {tour.type}
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
                  <div className="absolute bottom-3 right-3">
                    <input
                      type="checkbox"
                      checked={selectedTours.includes(tour.id)}
                      onChange={() => toggleTourSelection(tour.id)}
                      className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500 focus:ring-2"
                    />
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="text-white font-semibold text-lg mb-1 truncate">{tour.title}</h3>
                  <p className="text-white/60 text-sm mb-2">Code: {tour.tourCode}</p>
                  <p className="text-white/80 text-sm font-medium mb-1">{tour.guideName}</p>
                  <p className="text-white/60 text-xs mb-3">{tour.locationCity}, {tour.locationCountry}</p>
                  
                  <div className="space-y-2 text-sm text-white/60 mb-3">
                    <div className="flex justify-between">
                      <span>Group Size:</span>
                      <span className="text-white">{tour.minGroupSize}-{tour.maxGroupSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rating:</span>
                      <div className="flex items-center gap-1">
                        <i className="bi bi-star-fill text-yellow-400 text-xs"></i>
                        <span className="text-white">{tour.rating.toFixed(1)}</span>
                        <span className="text-white/60">({tour.totalReviews})</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span>Verified:</span>
                      <i className={`bi ${tour.isVerified ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} ${getVerificationColor(tour.isVerified)}`}></i>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-white text-xl font-bold">{tour.price ? tour.price.toLocaleString() : '0'} USD</span>
                      <div className="text-white/60 text-xs">
                        per person
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 text-sm font-medium">
                        {tour.totalBookings} bookings
                      </div>
                      <div className="text-white/60 text-xs">
                        {tour.totalRevenue?.toLocaleString() ?? '0'} USD revenue
                      </div>
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
                          onClick={() => handleStatusUpdate(tour.id, !tour.isActive)}
                          className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                        >
                          {tour.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleVerificationUpdate(tour.id, !tour.isVerified)}
                          className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                        >
                          {tour.isVerified ? 'Unverify' : 'Verify'}
                        </button>
                        <button
                          onClick={() => {
                            const newPrice = prompt('Enter new price:', tour.price.toString());
                            if (newPrice && !isNaN(Number(newPrice))) {
                              handlePriceUpdate(tour.id, Number(newPrice));
                            }
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-yellow-400 hover:bg-yellow-500/20 transition-colors"
                        >
                          Update Price
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTour(tour);
                            setShowScheduleModal(true);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-blue-400 hover:bg-blue-500/20 transition-colors"
                        >
                          Manage Schedule
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
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedTours.length === paginatedTours.length && paginatedTours.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500 focus:ring-2"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white/80 uppercase tracking-wider">
                      Tour
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white/80 uppercase tracking-wider">
                      Guide
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('price')}
                        className="text-sm font-medium text-white/80 uppercase tracking-wider flex items-center gap-1 hover:text-white transition-colors"
                      >
                        Price
                        <i className={`bi bi-chevron-${sortField === 'price' && sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('isActive')}
                        className="text-sm font-medium text-white/80 uppercase tracking-wider flex items-center gap-1 hover:text-white transition-colors"
                      >
                        Status
                        <i className={`bi bi-chevron-${sortField === 'isActive' && sortOrder === 'asc' ? 'up' : 'down'}`}></i>
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
                  {paginatedTours.map((tour) => (
                    <tr key={tour.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedTours.includes(tour.id)}
                          onChange={() => toggleTourSelection(tour.id)}
                          className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500 focus:ring-2"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <img 
                            src={tour.images[0] || `https://picsum.photos/seed/${tour.id}/800/600`} 
                            alt={tour.title} 
                            className="w-16 h-12 rounded-lg object-cover mr-4" 
                          />
                          <div>
                            <div className="text-white font-medium">{tour.tourCode}</div>
                            <div className="text-white/60 text-sm truncate max-w-[200px]">{tour.title}</div>
                            <div className="text-white/50 text-xs">{tour.locationCity}</div>
                            <div className="flex items-center gap-1 mt-1">
                              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getTypeColor(tour.type)}`}>
                                {tour.type}
                              </span>
                              <span className={`text-xs font-medium ${getDifficultyColor(tour.difficulty)}`}>
                                {tour.difficulty}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{tour.guideName}</div>
                        <div className="text-white/60 text-sm">{tour.guideEmail}</div>
                        <div className="flex items-center gap-1 text-yellow-400 text-sm">
                          <i className="bi bi-star-fill text-xs"></i>
                          <span>{tour.guideRating}</span>
                          <span className="text-white/60">({tour.guideExperience}y)</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-bold">{tour.price ? tour.price.toLocaleString() : '0'} USD</div>
                        <div className="text-white/60 text-sm">per person</div>
                        <div className="text-white/60 text-xs">{tour.duration} hours</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(tour.isActive)}`}>
                          {tour.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <div className="flex items-center mt-1">
                          <i className={`bi ${tour.isVerified ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} ${getVerificationColor(tour.isVerified)} text-xs mr-1`}></i>
                          <span className="text-xs text-white/60">
                            {tour.isVerified ? 'Verified' : 'Unverified'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-bold">{tour.totalBookings}</div>
                        <div className="text-white/60 text-sm">${tour.totalRevenue?.toLocaleString()}</div>
                        <div className="text-white/50 text-xs">{tour.views} views</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <i className="bi bi-star-fill text-yellow-400"></i>
                          <span className="text-white font-medium">{tour.rating?.toFixed(1)}</span>
                        </div>
                        <div className="text-white/60 text-sm">({tour.totalReviews} reviews)</div>
                        <div className="text-white/60 text-xs">{tour.category}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetails(tour)}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                            title="View Details"
                          >
                            <i className="bi bi-eye text-lg"></i>
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(tour.id, !tour.isActive)}
                            className="text-green-400 hover:text-green-300 transition-colors"
                            title={tour.isActive ? 'Deactivate' : 'Activate'}
                          >
                            <i className="bi bi-power text-lg"></i>
                          </button>
                          <button
                            onClick={() => handleVerificationUpdate(tour.id, !tour.isVerified)}
                            className="text-purple-400 hover:text-purple-300 transition-colors"
                            title={tour.isVerified ? 'Unverify' : 'Verify'}
                          >
                            <i className="bi bi-shield-check text-lg"></i>
                          </button>
                          <button
                            onClick={() => {
                              const newPrice = prompt('Enter new price:', tour.price.toString());
                              if (newPrice && !isNaN(Number(newPrice))) {
                                handlePriceUpdate(tour.id, Number(newPrice));
                              }
                            }}
                            className="text-yellow-400 hover:text-yellow-300 transition-colors"
                            title="Update Price"
                          >
                            <i className="bi bi-currency-dollar text-lg"></i>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTour(tour);
                              setShowScheduleModal(true);
                            }}
                            className="text-indigo-400 hover:text-indigo-300 transition-colors"
                            title="Manage Schedule"
                          >
                            <i className="bi bi-calendar-event text-lg"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteTour(tour.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            title="Delete Tour"
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
      {showDetailsModal && selectedTour && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-blue-900/20 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
              
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-[#0b1c36] to-[#13294b] border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-2xl font-semibold text-white">Tour Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex items-center justify-center w-8 h-8 bg-white/10 hover:bg-red-500 text-white rounded-full transition-colors"
                >
                  <i className="bi bi-x text-xl"></i>
                </button>
              </div>

              {/* Modal Content - Tour Details Implementation goes here */}
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
                          <span className="text-white/60">Status</span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTour.isActive)}`}>
                            {selectedTour.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Verification</span>
                          <span className={`text-sm font-medium ${getVerificationColor(selectedTour.isVerified)}`}>
                            {selectedTour.isVerified ? 'Verified' : 'Unverified'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Category</span>
                          <span className="text-white font-medium">{selectedTour.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Type</span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(selectedTour.type)}`}>
                            {selectedTour.type}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Created</span>
                          <span className="text-white font-medium">{formatDate(selectedTour.createdAt)}</span>
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
                          <span className="text-white/60">Group Size</span>
                          <span className="text-white font-medium">{selectedTour.minGroupSize}-{selectedTour.maxGroupSize}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Price</span>
                          <span className="text-white font-bold">{selectedTour.price ? selectedTour.price.toLocaleString() : '0'} USD</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Weather Dependent</span>
                          <span className="text-white font-medium">{selectedTour.weatherDependent ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Meeting Point</span>
                          <span className="text-white font-medium text-right text-sm">{selectedTour.meetingPoint}</span>
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
                          <span className="text-green-400 font-medium">${selectedTour.totalRevenue?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Views</span>
                          <span className="text-white font-medium">{selectedTour.views}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-white/60">Average Rating</span>
                          <div className="flex items-center gap-1">
                            <i className="bi bi-star-fill text-yellow-400"></i>
                            <span className="text-white font-medium">{selectedTour.rating.toFixed(1)}</span>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Total Reviews</span>
                          <span className="text-white font-medium">{selectedTour.totalReviews}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Last Updated</span>
                          <span className="text-white font-medium">{formatDate(selectedTour.updatedAt)}</span>
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
                          {selectedTour.inclusions?.map((item, index) => (
                            <li key={index} className="flex items-center gap-2 text-white/80">
                              <i className="bi bi-check-circle text-green-400"></i>
                              {item}
                            </li>
                          )) ?? <li className="text-white/60">No inclusions listed</li>}
                        </ul>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Exclusions</h3>
                      <div className="bg-white/5 rounded-lg p-4">
                        <ul className="space-y-2">
                          {selectedTour.exclusions?.map((item, index) => (
                            <li key={index} className="flex items-center gap-2 text-white/80">
                              <i className="bi bi-check-circle text-green-400"></i>
                              {item}
                            </li>
                          )) ?? <li className="text-white/60">No inclusions listed</li>}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gradient-to-r from-[#0b1c36] to-[#13294b] border-t border-white/10 px-6 py-4 flex justify-end gap-3 z-10">
                <button
                  onClick={() => handleStatusUpdate(selectedTour.id, !selectedTour.isActive)}
                  className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-medium"
                >
                  {selectedTour.isActive ? 'Deactivate Tour' : 'Activate Tour'}
                </button>
                <button
                  onClick={() => handleVerificationUpdate(selectedTour.id, !selectedTour.isVerified)}
                  className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors font-medium"
                >
                  {selectedTour.isVerified ? 'Unverify Tour' : 'Verify Tour'}
                </button>
                <button
                  onClick={() => {
                    const newPrice = prompt('Enter new price:', selectedTour.price.toString());
                    if (newPrice && !isNaN(Number(newPrice))) {
                      handlePriceUpdate(selectedTour.id, Number(newPrice));
                      setShowDetailsModal(false);
                    }
                  }}
                  className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors font-medium"
                >
                  Update Price
                </button>
                <button
                  onClick={() => {
                    setShowScheduleModal(true);
                  }}
                  className="px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors font-medium"
                >
                  Manage Schedule
                </button>
                <button
                  onClick={() => {
                    handleDeleteTour(selectedTour.id);
                    setShowDetailsModal(false);
                  }}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-medium"
                >
                  Delete Tour
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white rounded-lg transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Placeholder modals for Create, Bulk Actions, and Schedule Management */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setShowCreateModal(false)} />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-[#0b1c36] border border-slate-700 rounded-lg shadow-xl w-full max-w-4xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Create New Tour</h2>
              <p className="text-white/60 mb-4">Tour creation form would be implemented here...</p>
              <button
                onClick={() => setShowCreateModal(false)}
                className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setShowBulkModal(false)} />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-[#0b1c36] border border-slate-700 rounded-lg shadow-xl w-full max-w-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Bulk Actions</h2>
              <p className="text-white/60 mb-4">Bulk operations interface would be implemented here...</p>
              <button
                onClick={() => setShowBulkModal(false)}
                className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showScheduleModal && selectedTour && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setShowScheduleModal(false)} />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-[#0b1c36] border border-slate-700 rounded-lg shadow-xl w-full max-w-4xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Manage Schedule: {selectedTour.title}</h2>
              <p className="text-white/60 mb-4">Schedule management interface would be implemented here...</p>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToursAdminPage;