"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../../api/jambolush/api-conn';

// Types
interface Payment {
  id: string;
  hostId: string;
  hostName: string;
  hostEmail: string;
  bookingId: string;
  propertyId: string;
  propertyTitle: string;
  amount: number;
  commission: number;
  netAmount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'on_hold';
  paymentMethod: 'bank_transfer' | 'paypal' | 'stripe' | 'wire' | 'check';
  transactionId: string;
  processedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  dueDate: Date;
  notes: string;
  refundAmount: number;
  isRefund: boolean;
  originalPaymentId?: string;
}

interface PaymentStats {
  totalPending: number;
  totalProcessing: number;
  totalCompleted: number;
  totalFailed: number;
  totalAmount: number;
  totalCommission: number;
  averageAmount: number;
  paymentsToday: number;
}

type ViewMode = 'grid' | 'list';
type SortField = 'createdAt' | 'amount' | 'hostName' | 'status' | 'dueDate';
type SortOrder = 'asc' | 'desc';

const HostsPaymentsPage: React.FC = () => {
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
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [goToPageInput, setGoToPageInput] = useState('');
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });
  
  // Sort states
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Generate mock data
  const generateMockData = () => {
    const statuses: ('pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'on_hold')[] = 
      ['pending', 'processing', 'completed', 'failed', 'cancelled', 'on_hold'];
    const paymentMethods: ('bank_transfer' | 'paypal' | 'stripe' | 'wire' | 'check')[] = 
      ['bank_transfer', 'paypal', 'stripe', 'wire', 'check'];
    const hosts = ['John Smith', 'Emma Wilson', 'Michael Brown', 'Sarah Davis', 'James Johnson'];
    const properties = ['Luxury Villa Miami', 'Downtown Apartment NYC', 'Beach House Malibu', 'Mountain Cabin Aspen', 'City Loft Chicago'];
    
    const mockPayments: Payment[] = Array.from({ length: 50 }, (_, i) => {
      const amount = Math.floor(Math.random() * 2000) + 100;
      const commission = Math.floor(amount * 0.15); // 15% commission
      const isRefund = Math.random() < 0.1; // 10% chance of refund
      const createdDate = new Date(2025, Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1);
      const dueDate = new Date(createdDate.getTime() + (Math.floor(Math.random() * 14) + 1) * 24 * 60 * 60 * 1000);
      
      return {
        id: `PAY${String(i + 1).padStart(5, '0')}`,
        hostId: `HOST${String(Math.floor(Math.random() * 20) + 1).padStart(3, '0')}`,
        hostName: hosts[Math.floor(Math.random() * hosts.length)],
        hostEmail: `host${i + 1}@email.com`,
        bookingId: `BOOK${String(Math.floor(Math.random() * 1000) + 1).padStart(4, '0')}`,
        propertyId: `PROP${String(Math.floor(Math.random() * 100) + 1).padStart(4, '0')}`,
        propertyTitle: properties[Math.floor(Math.random() * properties.length)],
        amount: amount,
        commission: commission,
        netAmount: amount - commission,
        currency: 'USD',
        status: statuses[Math.floor(Math.random() * statuses.length)],
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        transactionId: `TXN${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        processedAt: Math.random() > 0.5 ? new Date(createdDate.getTime() + Math.random() * 24 * 60 * 60 * 1000) : null,
        createdAt: createdDate,
        updatedAt: new Date(createdDate.getTime() + Math.random() * 48 * 60 * 60 * 1000),
        dueDate: dueDate,
        notes: Math.random() > 0.7 ? 'Payment requires manual review' : '',
        refundAmount: isRefund ? Math.floor(amount * 0.5) : 0,
        isRefund: isRefund,
        originalPaymentId: isRefund ? `PAY${String(Math.floor(Math.random() * i + 1)).padStart(5, '0')}` : undefined
      };
    });
    
    setPayments(mockPayments);
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await api.get<Payment[]>('/hosts/payments');
      
      if (response.success && response.data) {
        setPayments(response.data);
      } else {
        console.error('Failed to fetch payments:', response.error);
        // Fallback to mock data
        generateMockData();
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      // Fallback to mock data
      generateMockData();
    } finally {
      setLoading(false);
    }
  };

  // Load payments on component mount
  useEffect(() => {
    fetchPayments();
  }, []);

  // Update goToPageInput when currentPage changes
  useEffect(() => {
    setGoToPageInput(currentPage.toString());
  }, [currentPage]);

  // Filter and sort logic
  useEffect(() => {
    let filtered = [...payments];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment.hostName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.hostEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }

    // Payment method filter
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(payment => payment.paymentMethod === paymentMethodFilter);
    }

    // Date range filter
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter(payment => {
        const paymentDate = payment.createdAt;
        const start = dateRange.start ? new Date(dateRange.start) : new Date(0);
        const end = dateRange.end ? new Date(dateRange.end) : new Date();
        return paymentDate >= start && paymentDate <= end;
      });
    }

    // Amount range filter
    if (amountRange.min || amountRange.max) {
      filtered = filtered.filter(payment => {
        const amount = payment.amount;
        const min = amountRange.min ? parseFloat(amountRange.min) : 0;
        const max = amountRange.max ? parseFloat(amountRange.max) : Infinity;
        return amount >= min && amount <= max;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'hostName':
          comparison = a.hostName.localeCompare(b.hostName);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'dueDate':
          comparison = a.dueDate.getTime() - b.dueDate.getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredPayments(filtered);
    setCurrentPage(1);
  }, [payments, searchTerm, statusFilter, paymentMethodFilter, dateRange, amountRange, sortField, sortOrder]);

  // Pagination
  const paginatedPayments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPayments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPayments, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

  // Calculate stats
  const stats = useMemo((): PaymentStats => {
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalCommission = payments.reduce((sum, p) => sum + p.commission, 0);
    const today = new Date();
    const paymentsToday = payments.filter(p => 
      p.createdAt.toDateString() === today.toDateString()
    ).length;

    return {
      totalPending: payments.filter(p => p.status === 'pending').length,
      totalProcessing: payments.filter(p => p.status === 'processing').length,
      totalCompleted: payments.filter(p => p.status === 'completed').length,
      totalFailed: payments.filter(p => p.status === 'failed').length,
      totalAmount,
      totalCommission,
      averageAmount: payments.length > 0 ? totalAmount / payments.length : 0,
      paymentsToday
    };
  }, [payments]);

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowModal(true);
  };

  const handleStatusUpdate = async (paymentId: string, newStatus: Payment['status']) => {
    try {
      const response = await api.patch(`/hosts/payments/${paymentId}/status`, {
        status: newStatus
      });
      
      if (response.success) {
        setPayments(prev => prev.map(p => 
          p.id === paymentId ? { ...p, status: newStatus, updatedAt: new Date() } : p
        ));
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      // For demo, update locally
      setPayments(prev => prev.map(p => 
        p.id === paymentId ? { ...p, status: newStatus, updatedAt: new Date() } : p
      ));
    }
  };

  const handleBulkStatusUpdate = async (status: Payment['status']) => {
    if (selectedPayments.size === 0) return;
    
    try {
      const response = await api.patch('/hosts/payments/bulk-status', {
        paymentIds: Array.from(selectedPayments),
        status
      });
      
      if (response.success) {
        setPayments(prev => prev.map(p => 
          selectedPayments.has(p.id) ? { ...p, status, updatedAt: new Date() } : p
        ));
        setSelectedPayments(new Set());
      }
    } catch (error) {
      console.error('Error updating bulk payment status:', error);
      // For demo, update locally
      setPayments(prev => prev.map(p => 
        selectedPayments.has(p.id) ? { ...p, status, updatedAt: new Date() } : p
      ));
      setSelectedPayments(new Set());
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
      case 'completed': return 'bg-green-400/20 text-green-400';
      case 'processing': return 'bg-blue-400/20 text-blue-400';
      case 'pending': return 'bg-yellow-400/20 text-yellow-400';
      case 'failed': return 'bg-red-400/20 text-red-400';
      case 'cancelled': return 'bg-gray-400/20 text-gray-400';
      case 'on_hold': return 'bg-orange-400/20 text-orange-400';
      default: return 'bg-gray-400/20 text-gray-400';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'bank_transfer': return 'bi-bank';
      case 'paypal': return 'bi-paypal';
      case 'stripe': return 'bi-credit-card';
      case 'wire': return 'bi-send';
      case 'check': return 'bi-check2-square';
      default: return 'bi-cash';
    }
  };

  const handleSelectPayment = (paymentId: string) => {
    setSelectedPayments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(paymentId)) {
        newSet.delete(paymentId);
      } else {
        newSet.add(paymentId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedPayments.size === paginatedPayments.length) {
      setSelectedPayments(new Set());
    } else {
      setSelectedPayments(new Set(paginatedPayments.map(p => p.id)));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-2xl rounded-2xl p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Host Payments Management
              </h1>
              <p className="text-white/70 text-lg">
                Monitor and manage all host payments and transactions
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={fetchPayments}
                className="bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
              >
                <i className="bi bi-arrow-clockwise text-lg"></i>
                Refresh
              </button>
              
              {selectedPayments.size > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBulkStatusUpdate('completed')}
                    className="bg-green-500/20 text-green-400 px-4 py-3 rounded-xl font-semibold hover:bg-green-500/30 transition-colors flex items-center gap-2"
                  >
                    <i className="bi bi-check-circle"></i>
                    Mark Completed ({selectedPayments.size})
                  </button>
                  <button
                    onClick={() => handleBulkStatusUpdate('failed')}
                    className="bg-red-500/20 text-red-400 px-4 py-3 rounded-xl font-semibold hover:bg-red-500/30 transition-colors flex items-center gap-2"
                  >
                    <i className="bi bi-x-circle"></i>
                    Mark Failed ({selectedPayments.size})
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-4">
            <div className="text-lg font-bold text-green-400">{stats.totalCompleted}</div>
            <div className="text-xs text-white/60">Completed</div>
          </div>
          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-4">
            <div className="text-lg font-bold text-yellow-400">{stats.totalPending}</div>
            <div className="text-xs text-white/60">Pending</div>
          </div>
          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-4">
            <div className="text-lg font-bold text-blue-400">{stats.totalProcessing}</div>
            <div className="text-xs text-white/60">Processing</div>
          </div>
          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-4">
            <div className="text-lg font-bold text-red-400">{stats.totalFailed}</div>
            <div className="text-xs text-white/60">Failed</div>
          </div>
          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-4">
            <div className="text-lg font-bold text-pink-400">${stats.totalAmount.toLocaleString()}</div>
            <div className="text-xs text-white/60">Total Volume</div>
          </div>
          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-4">
            <div className="text-lg font-bold text-purple-400">${stats.totalCommission.toLocaleString()}</div>
            <div className="text-xs text-white/60">Commission</div>
          </div>
          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-4">
            <div className="text-lg font-bold text-cyan-400">${Math.round(stats.averageAmount).toLocaleString()}</div>
            <div className="text-xs text-white/60">Avg Amount</div>
          </div>
          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-4">
            <div className="text-lg font-bold text-orange-400">{stats.paymentsToday}</div>
            <div className="text-xs text-white/60">Today</div>
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
                  placeholder="Host, property, transaction ID..."
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
                <option value="pending" className="bg-[#0b1c36] text-white">Pending</option>
                <option value="processing" className="bg-[#0b1c36] text-white">Processing</option>
                <option value="completed" className="bg-[#0b1c36] text-white">Completed</option>
                <option value="failed" className="bg-[#0b1c36] text-white">Failed</option>
                <option value="cancelled" className="bg-[#0b1c36] text-white">Cancelled</option>
                <option value="on_hold" className="bg-[#0b1c36] text-white">On Hold</option>
              </select>
            </div>

            {/* Payment Method Filter */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Payment Method</label>
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-400 transition-colors"
              >
                <option value="all" className="bg-[#0b1c36] text-white">All Methods</option>
                <option value="bank_transfer" className="bg-[#0b1c36] text-white">Bank Transfer</option>
                <option value="paypal" className="bg-[#0b1c36] text-white">PayPal</option>
                <option value="stripe" className="bg-[#0b1c36] text-white">Stripe</option>
                <option value="wire" className="bg-[#0b1c36] text-white">Wire Transfer</option>
                <option value="check" className="bg-[#0b1c36] text-white">Check</option>
              </select>
            </div>

            {/* View Mode */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">View</label>
              <div className="flex gap-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex-1 px-3 py-3 rounded-l-xl transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-pink-500 text-white' 
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  <i className="bi bi-list-ul"></i>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex-1 px-3 py-3 rounded-r-xl transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-pink-500 text-white' 
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  <i className="bi bi-grid-3x3-gap"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Date and Amount Ranges */}
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-white/80">Date Range:</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-2 py-1 text-white focus:outline-none focus:border-pink-400 transition-colors text-sm"
                />
                <span className="text-white/60">-</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-2 py-1 text-white focus:outline-none focus:border-pink-400 transition-colors text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-white/80">Amount:</label>
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
            </div>
            
            <p className="text-white/60 text-sm">
              Showing {paginatedPayments.length} of {filteredPayments.length} payments
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-pink-400 border-t-transparent rounded-full"></div>
            <p className="text-white/60 mt-4">Loading payments...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredPayments.length === 0 && (
          <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-2xl p-12 text-center">
            <i className="bi bi-credit-card-2-front text-white/40 text-6xl mb-4"></i>
            <h3 className="text-white text-xl font-semibold mb-2">No payments found</h3>
            <p className="text-white/60">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* List View */}
        {!loading && filteredPayments.length > 0 && viewMode === 'list' && (
          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedPayments.size === paginatedPayments.length && paginatedPayments.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-white/20 bg-white/10 text-pink-500 focus:ring-pink-400"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white/80 uppercase tracking-wider">
                      Payment Info
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white/80 uppercase tracking-wider">
                      Host
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('amount')}
                        className="text-sm font-medium text-white/80 uppercase tracking-wider flex items-center gap-1 hover:text-white transition-colors"
                      >
                        Amount
                        <i className={`bi bi-chevron-${sortField === 'amount' && sortOrder === 'asc' ? 'up' : 'down'}`}></i>
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
                        onClick={() => handleSort('dueDate')}
                        className="text-sm font-medium text-white/80 uppercase tracking-wider flex items-center gap-1 hover:text-white transition-colors"
                      >
                        Due Date
                        <i className={`bi bi-chevron-${sortField === 'dueDate' && sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                      </button>
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-white/80 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {paginatedPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedPayments.has(payment.id)}
                          onChange={() => handleSelectPayment(payment.id)}
                          className="rounded border-white/20 bg-white/10 text-pink-500 focus:ring-pink-400"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-white font-medium">{payment.id}</div>
                          <div className="text-white/60 text-sm">{payment.transactionId}</div>
                          <div className="text-white/50 text-xs flex items-center gap-1">
                            <i className={`bi ${getPaymentMethodIcon(payment.paymentMethod)}`}></i>
                            {payment.paymentMethod.replace('_', ' ')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{payment.hostName}</div>
                        <div className="text-white/60 text-sm">{payment.hostEmail}</div>
                        <div className="text-white/50 text-xs">{payment.propertyTitle}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-bold">${payment.amount.toLocaleString()}</div>
                        <div className="text-white/60 text-sm">Commission: ${payment.commission}</div>
                        <div className="text-green-400 text-sm">Net: ${payment.netAmount.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                          {payment.status.replace('_', ' ')}
                        </span>
                        {payment.isRefund && (
                          <div className="text-red-400 text-xs mt-1">Refund: ${payment.refundAmount}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{format(payment.dueDate, 'MMM dd, yyyy')}</div>
                        <div className="text-white/60 text-sm">Created: {format(payment.createdAt, 'MMM dd')}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetails(payment)}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <i className="bi bi-eye text-lg"></i>
                          </button>
                          <div className="relative group">
                            <button className="text-yellow-400 hover:text-yellow-300 transition-colors">
                              <i className="bi bi-gear text-lg"></i>
                            </button>
                            <div className="absolute right-0 top-full mt-1 bg-[#0b1c36] border border-blue-900/20 rounded-lg shadow-xl py-1 min-w-[120px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                              <button
                                onClick={() => handleStatusUpdate(payment.id, 'completed')}
                                className="w-full text-left px-3 py-2 text-sm text-green-400 hover:bg-green-500/20 transition-colors"
                              >
                                Mark Completed
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(payment.id, 'failed')}
                                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors"
                              >
                                Mark Failed
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(payment.id, 'on_hold')}
                                className="w-full text-left px-3 py-2 text-sm text-orange-400 hover:bg-orange-500/20 transition-colors"
                              >
                                Put On Hold
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Grid View */}
        {!loading && filteredPayments.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedPayments.map((payment) => (
              <div key={payment.id} className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-6 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-white font-bold text-lg">{payment.id}</div>
                    <div className="text-white/60 text-sm">{payment.transactionId}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedPayments.has(payment.id)}
                      onChange={() => handleSelectPayment(payment.id)}
                      className="rounded border-white/20 bg-white/10 text-pink-500 focus:ring-pink-400"
                    />
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                      {payment.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-white font-medium">{payment.hostName}</div>
                    <div className="text-white/60 text-sm">{payment.hostEmail}</div>
                  </div>

                  <div>
                    <div className="text-white/70 text-sm truncate">{payment.propertyTitle}</div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-white font-bold text-xl">${payment.amount.toLocaleString()}</div>
                      <div className="text-green-400 text-sm">Net: ${payment.netAmount.toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-white/60 text-sm flex items-center gap-1">
                        <i className={`bi ${getPaymentMethodIcon(payment.paymentMethod)}`}></i>
                        {payment.paymentMethod.replace('_', ' ')}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <div className="text-white/60">Due: {format(payment.dueDate, 'MMM dd')}</div>
                    <div className="text-white/60">Created: {format(payment.createdAt, 'MMM dd')}</div>
                  </div>

                  {payment.isRefund && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-2">
                      <div className="text-red-400 text-sm font-medium">
                        Refund: ${payment.refundAmount.toLocaleString()}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleViewDetails(payment)}
                      className="flex-1 bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300"
                    >
                      <i className="bi bi-eye mr-1"></i>View Details
                    </button>
                    <div className="relative group">
                      <button className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
                        <i className="bi bi-three-dots-vertical"></i>
                      </button>
                      <div className="absolute right-0 top-full mt-1 bg-[#0b1c36] border border-blue-900/20 rounded-lg shadow-xl py-1 min-w-[120px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                        <button
                          onClick={() => handleStatusUpdate(payment.id, 'completed')}
                          className="w-full text-left px-3 py-2 text-sm text-green-400 hover:bg-green-500/20 transition-colors"
                        >
                          Mark Completed
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(payment.id, 'failed')}
                          className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          Mark Failed
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(payment.id, 'on_hold')}
                          className="w-full text-left px-3 py-2 text-sm text-orange-400 hover:bg-orange-500/20 transition-colors"
                        >
                          Put On Hold
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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

      {/* Payment Details Modal */}
      {showModal && selectedPayment && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-blue-900/20 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-[#0b1c36] to-[#13294b] border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-2xl font-semibold text-white">Payment Details</h2>
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
                  
                  {/* Payment Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Payment Information</h3>
                      <div className="bg-white/5 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between">
                          <span className="text-white/60">Payment ID</span>
                          <span className="text-white font-medium">{selectedPayment.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Transaction ID</span>
                          <span className="text-white font-medium">{selectedPayment.transactionId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Booking ID</span>
                          <span className="text-white font-medium">{selectedPayment.bookingId}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/60">Status</span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedPayment.status)}`}>
                            {selectedPayment.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/60">Payment Method</span>
                          <div className="flex items-center gap-2 text-white font-medium">
                            <i className={`bi ${getPaymentMethodIcon(selectedPayment.paymentMethod)}`}></i>
                            {selectedPayment.paymentMethod.replace('_', ' ')}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Host Information</h3>
                      <div className="bg-white/5 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between">
                          <span className="text-white/60">Host ID</span>
                          <span className="text-white font-medium">{selectedPayment.hostId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Name</span>
                          <span className="text-white font-medium">{selectedPayment.hostName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Email</span>
                          <span className="text-white font-medium text-right">{selectedPayment.hostEmail}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Property</span>
                          <span className="text-white font-medium text-right">{selectedPayment.propertyTitle}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Property ID</span>
                          <span className="text-white font-medium">{selectedPayment.propertyId}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial Details */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Financial Details</h3>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-pink-400">${selectedPayment.amount.toLocaleString()}</div>
                          <div className="text-white/60 text-sm">Total Amount</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-400">${selectedPayment.commission.toLocaleString()}</div>
                          <div className="text-white/60 text-sm">Commission</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400">${selectedPayment.netAmount.toLocaleString()}</div>
                          <div className="text-white/60 text-sm">Net Amount</div>
                        </div>
                      </div>
                      
                      {selectedPayment.isRefund && (
                        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-red-400 font-medium">Refund Amount</span>
                            <span className="text-red-400 font-bold">${selectedPayment.refundAmount.toLocaleString()}</span>
                          </div>
                          {selectedPayment.originalPaymentId && (
                            <div className="text-red-400/70 text-sm mt-1">
                              Original Payment: {selectedPayment.originalPaymentId}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Important Dates</h3>
                      <div className="bg-white/5 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between">
                          <span className="text-white/60">Created</span>
                          <span className="text-white font-medium">{format(selectedPayment.createdAt, 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Due Date</span>
                          <span className="text-white font-medium">{format(selectedPayment.dueDate, 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Last Updated</span>
                          <span className="text-white font-medium">{format(selectedPayment.updatedAt, 'MMM dd, yyyy')}</span>
                        </div>
                        {selectedPayment.processedAt && (
                          <div className="flex justify-between">
                            <span className="text-white/60">Processed</span>
                            <span className="text-white font-medium">{format(selectedPayment.processedAt, 'MMM dd, yyyy')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedPayment.notes && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Notes</h3>
                        <div className="bg-white/5 rounded-lg p-4">
                          <p className="text-white/80">{selectedPayment.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gradient-to-r from-[#0b1c36] to-[#13294b] border-t border-white/10 px-6 py-4 flex justify-end gap-3 z-10">
                <button
                  onClick={() => handleStatusUpdate(selectedPayment.id, 'completed')}
                  className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-medium"
                >
                  Mark Completed
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedPayment.id, 'failed')}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-medium"
                >
                  Mark Failed
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedPayment.id, 'on_hold')}
                  className="px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors font-medium"
                >
                  Put On Hold
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

export default HostsPaymentsPage;