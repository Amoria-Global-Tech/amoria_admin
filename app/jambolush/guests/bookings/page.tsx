"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../../api/jambolush/api-conn';

// Types
interface GuestBooking {
  id: string;
  bookingReference: string;
  guestId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  propertyId: string;
  propertyTitle: string;
  propertyImage: string;
  propertyLocation: string;
  checkInDate: Date;
  checkOutDate: Date;
  nights: number;
  guests: number;
  adults: number;
  children: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  bookingStatus: 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'no-show';
  paymentStatus: 'paid' | 'partial' | 'pending' | 'failed' | 'refunded';
  paymentMethod: string;
  specialRequests: string;
  guestNotes: string;
  adminNotes: string;
  createdAt: Date;
  updatedAt: Date;
  lastModifiedBy: string;
  cancellationReason?: string;
  refundAmount?: number;
  rating?: number;
  review?: string;
}

type ViewMode = 'grid' | 'list';
type SortField = 'bookingReference' | 'guestName' | 'checkInDate' | 'totalAmount' | 'bookingStatus' | 'createdAt' | 'paymentStatus';
type SortOrder = 'asc' | 'desc';

// Mock data generator function (fallback)
const generateMockGuestBookings = (): GuestBooking[] => {
  const bookingStatuses: ('confirmed' | 'pending' | 'cancelled' | 'completed' | 'no-show')[] = ['confirmed', 'pending', 'cancelled', 'completed', 'no-show'];
  const paymentStatuses: ('paid' | 'partial' | 'pending' | 'failed' | 'refunded')[] = ['paid', 'partial', 'pending', 'failed', 'refunded'];
  const paymentMethods = ['Credit Card', 'PayPal', 'Bank Transfer', 'Cash', 'Cryptocurrency'];
  const guestNames = ['John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis', 'David Wilson', 'Lisa Anderson', 'James Martinez', 'Maria Garcia'];
  const propertyTitles = ['Luxury Villa in Miami', 'Downtown Apartment NYC', 'Beachfront Condo LA', 'Mountain Cabin Aspen', 'City Loft Chicago'];
  
  return Array.from({ length: 48 }, (_, i) => {
    const checkIn = new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    const nights = Math.floor(Math.random() * 14) + 1;
    const checkOut = new Date(checkIn.getTime() + (nights * 24 * 60 * 60 * 1000));
    const totalAmount = Math.floor(Math.random() * 2500) + 200;
    const paidAmount = Math.floor(totalAmount * (Math.random() * 0.8 + 0.2));
    
    return {
      id: `BKG${String(i + 1).padStart(5, '0')}`,
      bookingReference: `JMB-${String(Math.floor(Math.random() * 900000) + 100000)}`,
      guestId: `GST${String(i + 1).padStart(4, '0')}`,
      guestName: guestNames[Math.floor(Math.random() * guestNames.length)],
      guestEmail: `guest${i + 1}@example.com`,
      guestPhone: `+1 555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      propertyId: `PROP${String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')}`,
      propertyTitle: propertyTitles[Math.floor(Math.random() * propertyTitles.length)],
      propertyImage: `https://picsum.photos/seed/${i}/800/600`,
      propertyLocation: ['New York, NY', 'Los Angeles, CA', 'Miami, FL', 'Chicago, IL', 'Aspen, CO'][Math.floor(Math.random() * 5)],
      checkInDate: checkIn,
      checkOutDate: checkOut,
      nights: nights,
      guests: Math.floor(Math.random() * 6) + 1,
      adults: Math.floor(Math.random() * 4) + 1,
      children: Math.floor(Math.random() * 3),
      totalAmount: totalAmount,
      paidAmount: paidAmount,
      remainingAmount: totalAmount - paidAmount,
      bookingStatus: bookingStatuses[Math.floor(Math.random() * bookingStatuses.length)],
      paymentStatus: paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)],
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      specialRequests: Math.random() > 0.7 ? 'Late check-in requested, extra towels needed' : '',
      guestNotes: Math.random() > 0.8 ? 'First time visitor, celebrating anniversary' : '',
      adminNotes: Math.random() > 0.9 ? 'VIP guest, upgraded room provided' : '',
      createdAt: new Date(2025, Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1),
      updatedAt: new Date(2025, Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1),
      lastModifiedBy: 'admin@jambolush.com',
      cancellationReason: Math.random() > 0.8 ? 'Change of plans' : undefined,
      refundAmount: Math.random() > 0.9 ? Math.floor(totalAmount * 0.8) : undefined,
      rating: Math.random() > 0.6 ? Math.round((Math.random() * 2 + 3) * 10) / 10 : undefined,
      review: Math.random() > 0.7 ? 'Great stay, wonderful property and excellent service!' : undefined
    };
  });
};

const GuestsAdminBookingsPage: React.FC = () => {
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
  const [bookings, setBookings] = useState<GuestBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<GuestBooking[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<GuestBooking | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [goToPageInput, setGoToPageInput] = useState('');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });
  
  // Sort states
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const fetchBookings = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await api.get<GuestBooking[]>('/admin/bookings');
      
      if (response.success && response.data) {
        setBookings(response.data);
      } else {
        console.error('Failed to fetch guest bookings:', response.error);
        // Use mock data as fallback for demonstration
        const mockData = generateMockGuestBookings();
        setBookings(mockData);
      }
    } catch (error) {
      console.error('Error fetching guest bookings:', error);
      // Use mock data as fallback for demonstration
      const mockData = generateMockGuestBookings();
      setBookings(mockData);
    } finally {
      setLoading(false);
    }
  };

  // Load bookings on component mount
  useEffect(() => {
    fetchBookings();
  }, []);

  // Update goToPageInput when currentPage changes
  useEffect(() => {
    setGoToPageInput(currentPage.toString());
  }, [currentPage]);

  // Filter and sort logic
  useEffect(() => {
    let filtered = [...bookings];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.bookingReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.guestEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.bookingStatus === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(booking => booking.paymentStatus === paymentFilter);
    }

    // Date range filter
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter(booking => {
        const checkIn = booking.checkInDate;
        const start = dateRange.start ? new Date(dateRange.start) : new Date('1900-01-01');
        const end = dateRange.end ? new Date(dateRange.end) : new Date('2100-12-31');
        return checkIn >= start && checkIn <= end;
      });
    }

    // Amount range filter
    if (amountRange.min || amountRange.max) {
      filtered = filtered.filter(booking => {
        const amount = booking.totalAmount;
        const min = amountRange.min ? parseFloat(amountRange.min) : 0;
        const max = amountRange.max ? parseFloat(amountRange.max) : Infinity;
        return amount >= min && amount <= max;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'bookingReference':
          comparison = a.bookingReference.localeCompare(b.bookingReference);
          break;
        case 'guestName':
          comparison = a.guestName.localeCompare(b.guestName);
          break;
        case 'checkInDate':
          comparison = a.checkInDate.getTime() - b.checkInDate.getTime();
          break;
        case 'totalAmount':
          comparison = a.totalAmount - b.totalAmount;
          break;
        case 'bookingStatus':
          comparison = a.bookingStatus.localeCompare(b.bookingStatus);
          break;
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'paymentStatus':
          comparison = a.paymentStatus.localeCompare(b.paymentStatus);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredBookings(filtered);
    setCurrentPage(1);
  }, [bookings, searchTerm, statusFilter, paymentFilter, dateRange, amountRange, sortField, sortOrder]);

  // Pagination
  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBookings.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBookings, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  // Handlers
  const handleSort = (field: SortField): void => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleViewDetails = (booking: GuestBooking): void => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: GuestBooking['bookingStatus']): Promise<void> => {
    try {
      const response = await api.patch(`/admin/bookings/${bookingId}/status`, {
        status: newStatus
      });
      
      if (response.success) {
        setBookings(prev => prev.map(b => 
          b.id === bookingId ? { ...b, bookingStatus: newStatus } : b
        ));
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, bookingStatus: newStatus } : b
      ));
    }
  };

  const handlePaymentUpdate = async (bookingId: string, newPaymentStatus: GuestBooking['paymentStatus']): Promise<void> => {
    try {
      const response = await api.patch(`/admin/bookings/${bookingId}/payment`, {
        paymentStatus: newPaymentStatus
      });
      
      if (response.success) {
        setBookings(prev => prev.map(b => 
          b.id === bookingId ? { ...b, paymentStatus: newPaymentStatus } : b
        ));
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, paymentStatus: newPaymentStatus } : b
      ));
    }
  };

  const handleRefund = async (bookingId: string, refundAmount: number): Promise<void> => {
    if (confirm(`Are you sure you want to process a refund of $${refundAmount}?`)) {
      try {
        const response = await api.post(`/admin/bookings/${bookingId}/refund`, {
          amount: refundAmount
        });
        
        if (response.success) {
          setBookings(prev => prev.map(b => 
            b.id === bookingId ? { ...b, paymentStatus: 'refunded', refundAmount } : b
          ));
        }
      } catch (error) {
        console.error('Error processing refund:', error);
        setBookings(prev => prev.map(b => 
          b.id === bookingId ? { ...b, paymentStatus: 'refunded', refundAmount } : b
        ));
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
      case 'confirmed': return 'bg-green-400/20 text-green-400';
      case 'pending': return 'bg-yellow-400/20 text-yellow-400';
      case 'cancelled': return 'bg-red-400/20 text-red-400';
      case 'completed': return 'bg-blue-400/20 text-blue-400';
      case 'no-show': return 'bg-gray-400/20 text-gray-400';
      default: return 'bg-gray-400/20 text-gray-400';
    }
  };

  const getPaymentColor = (status: string): string => {
    switch (status) {
      case 'paid': return 'text-green-400';
      case 'partial': return 'text-yellow-400';
      case 'pending': return 'text-orange-400';
      case 'failed': return 'text-red-400';
      case 'refunded': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const totalRevenue = bookings.reduce((sum, b) => sum + b.paidAmount, 0);
    const pendingRevenue = bookings.filter(b => b.paymentStatus === 'pending').reduce((sum, b) => sum + b.remainingAmount, 0);
    
    return {
      total: bookings.length,
      confirmed: bookings.filter(b => b.bookingStatus === 'confirmed').length,
      pending: bookings.filter(b => b.bookingStatus === 'pending').length,
      totalRevenue: totalRevenue,
      pendingRevenue: pendingRevenue
    };
  }, [bookings]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-2xl rounded-2xl p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Guest Bookings Administration
              </h1>
              <p className="text-white/70 text-lg">
                Monitor and manage all guest bookings and reservations
              </p>
            </div>
            
            <button
              onClick={fetchBookings}
              className="bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 self-start lg:self-center"
            >
              <i className="bi bi-arrow-clockwise text-lg"></i>
              Refresh Bookings
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Total Bookings</p>
                <p className="text-white text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="bg-blue-400/20 p-3 rounded-xl">
                <i className="bi bi-calendar-check text-blue-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Confirmed</p>
                <p className="text-white text-2xl font-bold">{stats.confirmed}</p>
              </div>
              <div className="bg-green-400/20 p-3 rounded-xl">
                <i className="bi bi-check-circle text-green-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Pending</p>
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
                <p className="text-white/60 text-sm">Pending Revenue</p>
                <p className="text-white text-2xl font-bold">${stats.pendingRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-orange-400/20 p-3 rounded-xl">
                <i className="bi bi-hourglass-split text-orange-400 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {/* Search */}
            <div className="xl:col-span-2">
              <label className="block text-sm font-medium text-white/80 mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Booking ref, guest, or property..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/60 focus:outline-none focus:border-pink-400 transition-colors"
                />
                <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-white/60"></i>
              </div>
            </div>

            {/* Booking Status Filter */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Booking Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-400 transition-colors"
              >
                <option value="all" className="bg-[#0b1c36] text-white">All Status</option>
                <option value="confirmed" className="bg-[#0b1c36] text-white">Confirmed</option>
                <option value="pending" className="bg-[#0b1c36] text-white">Pending</option>
                <option value="cancelled" className="bg-[#0b1c36] text-white">Cancelled</option>
                <option value="completed" className="bg-[#0b1c36] text-white">Completed</option>
                <option value="no-show" className="bg-[#0b1c36] text-white">No Show</option>
              </select>
            </div>

            {/* Payment Status Filter */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Payment Status</label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-400 transition-colors"
              >
                <option value="all" className="bg-[#0b1c36] text-white">All Payments</option>
                <option value="paid" className="bg-[#0b1c36] text-white">Paid</option>
                <option value="partial" className="bg-[#0b1c36] text-white">Partial</option>
                <option value="pending" className="bg-[#0b1c36] text-white">Pending</option>
                <option value="failed" className="bg-[#0b1c36] text-white">Failed</option>
                <option value="refunded" className="bg-[#0b1c36] text-white">Refunded</option>
              </select>
            </div>
          </div>

          {/* Date Range, Amount Range and View Mode */}
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-white/80">Date Range:</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-32 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-2 py-1 text-white focus:outline-none focus:border-pink-400 transition-colors text-sm"
                />
                <span className="text-white/60">-</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-32 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-2 py-1 text-white focus:outline-none focus:border-pink-400 transition-colors text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-white/80">Amount Range:</label>
                <input
                  type="number"
                  placeholder="Min"
                  value={amountRange.min}
                  onChange={(e) => setAmountRange(prev => ({ ...prev, min: e.target.value }))}
                  className="w-20 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-2 py-1 text-white placeholder-white/60 focus:outline-none focus:border-pink-400 transition-colors text-sm"
                />
                <span className="text-white/60">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={amountRange.max}
                  onChange={(e) => setAmountRange(prev => ({ ...prev, max: e.target.value }))}
                  className="w-20 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-2 py-1 text-white placeholder-white/60 focus:outline-none focus:border-pink-400 transition-colors text-sm"
                />
              </div>
              <p className="text-white/60 text-sm">
                Showing {paginatedBookings.length} of {filteredBookings.length} bookings
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
            <p className="text-white/60 mt-4">Loading guest bookings...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredBookings.length === 0 && (
          <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-2xl p-12 text-center">
            <i className="bi bi-calendar-x text-white/40 text-6xl mb-4"></i>
            <h3 className="text-white text-xl font-semibold mb-2">No bookings found</h3>
            <p className="text-white/60">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Grid View */}
        {!loading && filteredBookings.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedBookings.map((booking) => (
              <div key={booking.id} className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative">
                  <img src={booking.propertyImage} alt={booking.propertyTitle} className="w-full h-48 object-cover" />
                  <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.bookingStatus)}`}>
                      {booking.bookingStatus}
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-white/20 ${getPaymentColor(booking.paymentStatus)}`}>
                      {booking.paymentStatus}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
                    <div className="text-white text-sm font-bold">
                      {booking.nights} nights
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="text-white font-semibold text-lg mb-1 truncate">{booking.propertyTitle}</h3>
                  <p className="text-white/60 text-sm mb-2">Ref: {booking.bookingReference}</p>
                  <p className="text-white/80 text-sm font-medium mb-1">{booking.guestName}</p>
                  <p className="text-white/60 text-xs mb-3">{booking.guestEmail}</p>
                  
                  <div className="space-y-2 text-sm text-white/60 mb-3">
                    <div className="flex justify-between">
                      <span>Check-in:</span>
                      <span className="text-white">{format(booking.checkInDate, 'MMM dd')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Check-out:</span>
                      <span className="text-white">{format(booking.checkOutDate, 'MMM dd')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Guests:</span>
                      <span className="text-white">{booking.guests} guests</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-white text-xl font-bold">${booking.totalAmount}</span>
                      <div className="text-white/60 text-xs">
                        Paid: ${booking.paidAmount}
                      </div>
                    </div>
                    {booking.remainingAmount > 0 && (
                      <div className="text-right">
                        <div className="text-orange-400 text-sm font-medium">
                          ${booking.remainingAmount}
                        </div>
                        <div className="text-white/60 text-xs">remaining</div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(booking)}
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
                          onClick={() => handleStatusUpdate(booking.id, booking.bookingStatus === 'confirmed' ? 'pending' : 'confirmed')}
                          className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                        >
                          {booking.bookingStatus === 'confirmed' ? 'Mark Pending' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => handlePaymentUpdate(booking.id, booking.paymentStatus === 'paid' ? 'pending' : 'paid')}
                          className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                        >
                          {booking.paymentStatus === 'paid' ? 'Mark Pending' : 'Mark Paid'}
                        </button>
                        {booking.paymentStatus !== 'refunded' && (
                          <button
                            onClick={() => handleRefund(booking.id, booking.paidAmount)}
                            className="w-full text-left px-3 py-2 text-sm text-purple-400 hover:bg-purple-500/20 transition-colors"
                          >
                            Process Refund
                          </button>
                        )}
                        <button
                          onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                          className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          Cancel Booking
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
        {!loading && filteredBookings.length > 0 && viewMode === 'list' && (
          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white/80 uppercase tracking-wider">
                      Booking
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white/80 uppercase tracking-wider">
                      Guest
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('checkInDate')}
                        className="text-sm font-medium text-white/80 uppercase tracking-wider flex items-center gap-1 hover:text-white transition-colors"
                      >
                        Dates
                        <i className={`bi bi-chevron-${sortField === 'checkInDate' && sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('totalAmount')}
                        className="text-sm font-medium text-white/80 uppercase tracking-wider flex items-center gap-1 hover:text-white transition-colors"
                      >
                        Amount
                        <i className={`bi bi-chevron-${sortField === 'totalAmount' && sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('bookingStatus')}
                        className="text-sm font-medium text-white/80 uppercase tracking-wider flex items-center gap-1 hover:text-white transition-colors"
                      >
                        Status
                        <i className={`bi bi-chevron-${sortField === 'bookingStatus' && sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('paymentStatus')}
                        className="text-sm font-medium text-white/80 uppercase tracking-wider flex items-center gap-1 hover:text-white transition-colors"
                      >
                        Payment
                        <i className={`bi bi-chevron-${sortField === 'paymentStatus' && sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                      </button>
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-white/80 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {paginatedBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <img src={booking.propertyImage} alt={booking.propertyTitle} className="w-16 h-12 rounded-lg object-cover mr-4" />
                          <div>
                            <div className="text-white font-medium">{booking.bookingReference}</div>
                            <div className="text-white/60 text-sm truncate max-w-[200px]">{booking.propertyTitle}</div>
                            <div className="text-white/50 text-xs">{booking.propertyLocation}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{booking.guestName}</div>
                        <div className="text-white/60 text-sm">{booking.guestEmail}</div>
                        <div className="text-white/50 text-xs">{booking.guests} guests</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">
                          {format(booking.checkInDate, 'MMM dd')} - {format(booking.checkOutDate, 'MMM dd')}
                        </div>
                        <div className="text-white/60 text-sm">{booking.nights} nights</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-bold">${booking.totalAmount}</div>
                        <div className="text-white/60 text-sm">Paid: ${booking.paidAmount}</div>
                        {booking.remainingAmount > 0 && (
                          <div className="text-orange-400 text-sm">Due: ${booking.remainingAmount}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.bookingStatus)}`}>
                          {booking.bookingStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium ${getPaymentColor(booking.paymentStatus)}`}>
                          {booking.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetails(booking)}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <i className="bi bi-eye text-lg"></i>
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(booking.id, booking.bookingStatus === 'confirmed' ? 'pending' : 'confirmed')}
                            className="text-green-400 hover:text-green-300 transition-colors"
                          >
                            <i className="bi bi-check-circle text-lg"></i>
                          </button>
                          <button
                            onClick={() => handlePaymentUpdate(booking.id, booking.paymentStatus === 'paid' ? 'pending' : 'paid')}
                            className="text-yellow-400 hover:text-yellow-300 transition-colors"
                          >
                            <i className="bi bi-credit-card text-lg"></i>
                          </button>
                          {booking.paymentStatus !== 'refunded' && (
                            <button
                              onClick={() => handleRefund(booking.id, booking.paidAmount)}
                              className="text-purple-400 hover:text-purple-300 transition-colors"
                            >
                              <i className="bi bi-arrow-return-left text-lg"></i>
                            </button>
                          )}
                          <button
                            onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <i className="bi bi-x-circle text-lg"></i>
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

      {/* Booking Details Modal */}
      {showModal && selectedBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-blue-900/20 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
              
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-[#0b1c36] to-[#13294b] border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-2xl font-semibold text-white">Booking Details</h2>
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
                  
                  {/* Booking Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Booking Information</h3>
                      <div className="bg-white/5 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between">
                          <span className="text-white/60">Booking Reference</span>
                          <span className="text-white font-medium">{selectedBooking.bookingReference}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Booking ID</span>
                          <span className="text-white font-medium">{selectedBooking.id}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/60">Status</span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedBooking.bookingStatus)}`}>
                            {selectedBooking.bookingStatus}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Created</span>
                          <span className="text-white font-medium">{format(selectedBooking.createdAt, 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Last Modified</span>
                          <span className="text-white font-medium">{format(selectedBooking.updatedAt, 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Modified By</span>
                          <span className="text-white font-medium text-right">{selectedBooking.lastModifiedBy}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Stay Details</h3>
                      <div className="bg-white/5 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between">
                          <span className="text-white/60">Check-in</span>
                          <span className="text-white font-medium">{format(selectedBooking.checkInDate, 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Check-out</span>
                          <span className="text-white font-medium">{format(selectedBooking.checkOutDate, 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Nights</span>
                          <span className="text-white font-medium">{selectedBooking.nights}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Total Guests</span>
                          <span className="text-white font-medium">{selectedBooking.guests}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Adults</span>
                          <span className="text-white font-medium">{selectedBooking.adults}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Children</span>
                          <span className="text-white font-medium">{selectedBooking.children}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Guest Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Guest Information</h3>
                    <div className="bg-white/5 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-white/60">Guest ID</span>
                          <span className="text-white font-medium">{selectedBooking.guestId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Name</span>
                          <span className="text-white font-medium">{selectedBooking.guestName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Email</span>
                          <span className="text-white font-medium text-right">{selectedBooking.guestEmail}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-white/60">Phone</span>
                          <span className="text-white font-medium">{selectedBooking.guestPhone}</span>
                        </div>
                        {selectedBooking.rating && (
                          <div className="flex justify-between items-center">
                            <span className="text-white/60">Rating</span>
                            <div className="flex items-center gap-1">
                              <i className="bi bi-star-fill text-yellow-400"></i>
                              <span className="text-white font-medium">{selectedBooking.rating}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Property Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Property Information</h3>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center mb-4">
                        <img src={selectedBooking.propertyImage} alt={selectedBooking.propertyTitle} className="w-20 h-16 rounded-lg object-cover mr-4" />
                        <div>
                          <div className="text-white font-semibold">{selectedBooking.propertyTitle}</div>
                          <div className="text-white/60 text-sm">{selectedBooking.propertyLocation}</div>
                          <div className="text-white/50 text-sm">Property ID: {selectedBooking.propertyId}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Payment Information</h3>
                    <div className="bg-white/5 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-white/60">Total Amount</span>
                          <span className="text-white font-bold text-lg">${selectedBooking.totalAmount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Paid Amount</span>
                          <span className="text-green-400 font-medium">${selectedBooking.paidAmount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Remaining</span>
                          <span className={`font-medium ${selectedBooking.remainingAmount > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                            ${selectedBooking.remainingAmount}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-white/60">Payment Status</span>
                          <span className={`text-sm font-medium ${getPaymentColor(selectedBooking.paymentStatus)}`}>
                            {selectedBooking.paymentStatus}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Payment Method</span>
                          <span className="text-white font-medium">{selectedBooking.paymentMethod}</span>
                        </div>
                        {selectedBooking.refundAmount && (
                          <div className="flex justify-between">
                            <span className="text-white/60">Refund Amount</span>
                            <span className="text-purple-400 font-medium">${selectedBooking.refundAmount}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Special Requests & Notes */}
                  {(selectedBooking.specialRequests || selectedBooking.guestNotes || selectedBooking.adminNotes) && (
                    <div className="space-y-4">
                      {selectedBooking.specialRequests && (
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">Special Requests</h3>
                          <div className="bg-white/5 rounded-lg p-4">
                            <p className="text-white/80">{selectedBooking.specialRequests}</p>
                          </div>
                        </div>
                      )}

                      {selectedBooking.guestNotes && (
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">Guest Notes</h3>
                          <div className="bg-white/5 rounded-lg p-4">
                            <p className="text-white/80">{selectedBooking.guestNotes}</p>
                          </div>
                        </div>
                      )}

                      {selectedBooking.adminNotes && (
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">Admin Notes</h3>
                          <div className="bg-white/5 rounded-lg p-4">
                            <p className="text-white/80">{selectedBooking.adminNotes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Review & Cancellation */}
                  {(selectedBooking.review || selectedBooking.cancellationReason) && (
                    <div className="space-y-4">
                      {selectedBooking.review && (
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">Guest Review</h3>
                          <div className="bg-white/5 rounded-lg p-4">
                            <p className="text-white/80">{selectedBooking.review}</p>
                          </div>
                        </div>
                      )}

                      {selectedBooking.cancellationReason && (
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">Cancellation Reason</h3>
                          <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
                            <p className="text-red-400">{selectedBooking.cancellationReason}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gradient-to-r from-[#0b1c36] to-[#13294b] border-t border-white/10 px-6 py-4 flex justify-end gap-3 z-10">
                <button
                  onClick={() => handleStatusUpdate(selectedBooking.id, selectedBooking.bookingStatus === 'confirmed' ? 'pending' : 'confirmed')}
                  className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-medium"
                >
                  {selectedBooking.bookingStatus === 'confirmed' ? 'Mark Pending' : 'Confirm Booking'}
                </button>
                <button
                  onClick={() => handlePaymentUpdate(selectedBooking.id, selectedBooking.paymentStatus === 'paid' ? 'pending' : 'paid')}
                  className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors font-medium"
                >
                  {selectedBooking.paymentStatus === 'paid' ? 'Mark Payment Pending' : 'Mark as Paid'}
                </button>
                {selectedBooking.paymentStatus !== 'refunded' && (
                  <button
                    onClick={() => {
                      handleRefund(selectedBooking.id, selectedBooking.paidAmount);
                      setShowModal(false);
                    }}
                    className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors font-medium"
                  >
                    Process Refund
                  </button>
                )}
                <button
                  onClick={() => {
                    handleStatusUpdate(selectedBooking.id, 'cancelled');
                    setShowModal(false);
                  }}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-medium"
                >
                  Cancel Booking
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

export default GuestsAdminBookingsPage;