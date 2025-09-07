"use client";

import React, { useState, useEffect, useMemo } from 'react';
// Assuming the api-conn file is in a relative path like this
// Adjust the import path as per your project structure
import { api } from '../../../api/jambolush/api-conn';

// Types
interface Payment {
  id: string;
  guestId: string;
  guestName: string;
  guestEmail: string;
  bookingId: string;
  propertyId: string;
  propertyTitle: string;
  amount: number;
  serviceFee: number;
  totalAmount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  paymentMethod: 'credit_card' | 'paypal' | 'google_pay' | 'apple_pay' | 'bank_transfer';
  transactionId: string;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  notes: string;
  refundAmount: number;
  isRefund: boolean;
  originalPaymentId?: string;
}

interface PaymentStats {
  totalPending: number;
  totalCompleted: number;
  totalFailed: number;
  totalRefunded: number;
  totalVolume: number;
  totalServiceFees: number;
  averagePayment: number;
  paymentsToday: number;
}

type ViewMode = 'grid' | 'list';
type SortField = 'createdAt' | 'amount' | 'guestName' | 'status';
type SortOrder = 'asc' | 'desc';

const GuestsPaymentsPage: React.FC = () => {
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

  // Generate mock data for fallback
  const generateMockData = () => {
    const statuses: ('pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded')[] = 
      ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'];
    const paymentMethods: ('credit_card' | 'paypal' | 'google_pay' | 'apple_pay' | 'bank_transfer')[] = 
      ['credit_card', 'paypal', 'google_pay', 'apple_pay', 'bank_transfer'];
    const guests = ['Alice Johnson', 'Bob Williams', 'Charlie Miller', 'Diana Garcia', 'Ethan Rodriguez'];
    const properties = ['Cozy Studio Downtown', 'Ocean View Condo', 'Ski Chalet Getaway', 'Urban Oasis Loft', 'Riverside Cottage'];
    
    const mockPayments: Payment[] = Array.from({ length: 50 }, (_, i) => {
      const amount = Math.floor(Math.random() * 500) + 50;
      const serviceFee = Math.floor(amount * 0.12); // 12% service fee
      const isRefund = Math.random() < 0.1;
      const createdDate = new Date(2025, Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1);
      
      return {
        id: `PAYG${String(i + 1).padStart(5, '0')}`,
        guestId: `GUEST${String(Math.floor(Math.random() * 20) + 1).padStart(3, '0')}`,
        guestName: guests[Math.floor(Math.random() * guests.length)],
        guestEmail: `guest${i + 1}@email.com`,
        bookingId: `BOOK${String(Math.floor(Math.random() * 1000) + 1).padStart(4, '0')}`,
        propertyId: `PROP${String(Math.floor(Math.random() * 100) + 1).padStart(4, '0')}`,
        propertyTitle: properties[Math.floor(Math.random() * properties.length)],
        amount: amount,
        serviceFee: serviceFee,
        totalAmount: amount + serviceFee,
        currency: 'USD',
        status: statuses[Math.floor(Math.random() * statuses.length)],
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        transactionId: `TXN${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        paidAt: Math.random() > 0.3 ? new Date(createdDate.getTime() + Math.random() * 24 * 60 * 60 * 1000) : null,
        createdAt: createdDate,
        updatedAt: new Date(createdDate.getTime() + Math.random() * 48 * 60 * 60 * 1000),
        notes: Math.random() > 0.8 ? 'Guest requested a late check-out.' : '',
        refundAmount: isRefund ? Math.floor((amount + serviceFee) * 0.8) : 0,
        isRefund: isRefund,
        originalPaymentId: isRefund ? `PAYG${String(Math.floor(Math.random() * i + 1)).padStart(5, '0')}` : undefined
      };
    });
    
    setPayments(mockPayments);
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      // IMPORTANT: Changed API endpoint to /guests/payments
      const response = await api.get<Payment[]>('/guests/payments');
      
      if (response.success && response.data) {
        setPayments(response.data);
      } else {
        console.error('Failed to fetch guest payments:', response.error);
        generateMockData(); // Fallback to mock data on failure
      }
    } catch (error) {
      console.error('Error fetching guest payments:', error);
      generateMockData(); // Fallback to mock data on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    setGoToPageInput(currentPage.toString());
  }, [currentPage]);

  useEffect(() => {
    let filtered = [...payments];

    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.guestEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }

    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(payment => payment.paymentMethod === paymentMethodFilter);
    }

    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter(payment => {
        const paymentDate = payment.createdAt;
        const start = dateRange.start ? new Date(dateRange.start) : new Date(0);
        const end = dateRange.end ? new Date(dateRange.end) : new Date();
        return paymentDate >= start && paymentDate <= end;
      });
    }

    if (amountRange.min || amountRange.max) {
      filtered = filtered.filter(payment => {
        const amount = payment.totalAmount;
        const min = amountRange.min ? parseFloat(amountRange.min) : 0;
        const max = amountRange.max ? parseFloat(amountRange.max) : Infinity;
        return amount >= min && amount <= max;
      });
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'amount':
          comparison = a.totalAmount - b.totalAmount;
          break;
        case 'guestName':
          comparison = a.guestName.localeCompare(b.guestName);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredPayments(filtered);
    setCurrentPage(1);
  }, [payments, searchTerm, statusFilter, paymentMethodFilter, dateRange, amountRange, sortField, sortOrder]);

  const paginatedPayments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPayments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPayments, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

  const stats = useMemo((): PaymentStats => {
    const totalVolume = payments.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalServiceFees = payments.reduce((sum, p) => sum + p.serviceFee, 0);
    const today = new Date();
    const paymentsToday = payments.filter(p => p.createdAt.toDateString() === today.toDateString()).length;

    return {
      totalPending: payments.filter(p => p.status === 'pending').length,
      totalCompleted: payments.filter(p => p.status === 'completed').length,
      totalFailed: payments.filter(p => p.status === 'failed').length,
      totalRefunded: payments.filter(p => p.status === 'refunded').length,
      totalVolume,
      totalServiceFees,
      averagePayment: payments.length > 0 ? totalVolume / payments.length : 0,
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
      case 'refunded': return 'bg-purple-400/20 text-purple-400';
      default: return 'bg-gray-400/20 text-gray-400';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'credit_card': return 'bi-credit-card';
      case 'paypal': return 'bi-paypal';
      case 'google_pay': return 'bi-google';
      case 'apple_pay': return 'bi-apple';
      case 'bank_transfer': return 'bi-bank';
      default: return 'bi-cash';
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
                Guest Payments Overview
              </h1>
              <p className="text-white/70 text-lg">
                Track and manage all incoming guest payments.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={fetchPayments}
                className="bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
              >
                <i className="bi bi-arrow-clockwise text-lg"></i>
                Refresh Data
              </button>
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
                <div className="text-lg font-bold text-red-400">{stats.totalFailed}</div>
                <div className="text-xs text-white/60">Failed</div>
            </div>
            <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-4">
                <div className="text-lg font-bold text-purple-400">{stats.totalRefunded}</div>
                <div className="text-xs text-white/60">Refunded</div>
            </div>
            <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-4">
                <div className="text-lg font-bold text-pink-400">${stats.totalVolume.toLocaleString()}</div>
                <div className="text-xs text-white/60">Total Volume</div>
            </div>
            <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-4">
                <div className="text-lg font-bold text-blue-400">${stats.totalServiceFees.toLocaleString()}</div>
                <div className="text-xs text-white/60">Service Fees</div>
            </div>
            <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-4">
                <div className="text-lg font-bold text-cyan-400">${Math.round(stats.averagePayment).toLocaleString()}</div>
                <div className="text-xs text-white/60">Avg Payment</div>
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
                        placeholder="Guest name, email, transaction ID..."
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
                        <option value="completed" className="bg-[#0b1c36] text-white">Completed</option>
                        <option value="failed" className="bg-[#0b1c36] text-white">Failed</option>
                        <option value="cancelled" className="bg-[#0b1c36] text-white">Cancelled</option>
                        <option value="refunded" className="bg-[#0b1c36] text-white">Refunded</option>
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
                        <option value="credit_card" className="bg-[#0b1c36] text-white">Credit Card</option>
                        <option value="paypal" className="bg-[#0b1c36] text-white">PayPal</option>
                        <option value="google_pay" className="bg-[#0b1c36] text-white">Google Pay</option>
                        <option value="apple_pay" className="bg-[#0b1c36] text-white">Apple Pay</option>
                        <option value="bank_transfer" className="bg-[#0b1c36] text-white">Bank Transfer</option>
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

        {/* Loading & Empty States */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-pink-400 border-t-transparent rounded-full"></div>
            <p className="text-white/60 mt-4">Loading payments...</p>
          </div>
        )}
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
                    <th className="px-6 py-4 text-left text-sm font-medium text-white/80 uppercase tracking-wider">Payment Info</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white/80 uppercase tracking-wider">Guest</th>
                    <th className="px-6 py-4 text-left"><button onClick={() => handleSort('amount')} className="text-sm font-medium text-white/80 uppercase tracking-wider flex items-center gap-1 hover:text-white transition-colors">Amount <i className={`bi bi-chevron-${sortField === 'amount' && sortOrder === 'asc' ? 'up' : 'down'}`}></i></button></th>
                    <th className="px-6 py-4 text-left"><button onClick={() => handleSort('status')} className="text-sm font-medium text-white/80 uppercase tracking-wider flex items-center gap-1 hover:text-white transition-colors">Status <i className={`bi bi-chevron-${sortField === 'status' && sortOrder === 'asc' ? 'up' : 'down'}`}></i></button></th>
                    <th className="px-6 py-4 text-left"><button onClick={() => handleSort('createdAt')} className="text-sm font-medium text-white/80 uppercase tracking-wider flex items-center gap-1 hover:text-white transition-colors">Date <i className={`bi bi-chevron-${sortField === 'createdAt' && sortOrder === 'asc' ? 'up' : 'down'}`}></i></button></th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-white/80 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {paginatedPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-white font-medium">{payment.id}</div>
                          <div className="text-white/60 text-sm">{payment.transactionId}</div>
                          <div className="text-white/50 text-xs flex items-center gap-1"><i className={`bi ${getPaymentMethodIcon(payment.paymentMethod)}`}></i> {payment.paymentMethod.replace('_', ' ')}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{payment.guestName}</div>
                        <div className="text-white/60 text-sm">{payment.guestEmail}</div>
                        <div className="text-white/50 text-xs">{payment.propertyTitle}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-bold">${payment.totalAmount.toLocaleString()}</div>
                        <div className="text-white/60 text-sm">Fee: ${payment.serviceFee}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>{payment.status.replace('_', ' ')}</span>
                        {payment.isRefund && (<div className="text-purple-400 text-xs mt-1">Refunded: ${payment.refundAmount}</div>)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{format(payment.createdAt, 'MMM dd, yyyy')}</div>
                        {payment.paidAt && <div className="text-white/60 text-sm">Paid: {format(payment.paidAt, 'MMM dd')}</div>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleViewDetails(payment)} className="text-blue-400 hover:text-blue-300 transition-colors"><i className="bi bi-eye text-lg"></i></button>
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
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>{payment.status.replace('_', ' ')}</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-white font-medium">{payment.guestName}</div>
                    <div className="text-white/60 text-sm">{payment.guestEmail}</div>
                  </div>
                  <div><div className="text-white/70 text-sm truncate">{payment.propertyTitle}</div></div>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-white font-bold text-xl">${payment.totalAmount.toLocaleString()}</div>
                      <div className="text-blue-400 text-sm">Fee: ${payment.serviceFee.toLocaleString()}</div>
                    </div>
                    <div className="text-right"><div className="text-white/60 text-sm flex items-center gap-1"><i className={`bi ${getPaymentMethodIcon(payment.paymentMethod)}`}></i> {payment.paymentMethod.replace('_', ' ')}</div></div>
                  </div>
                  <div className="flex justify-between items-center text-sm"><div className="text-white/60">Created: {format(payment.createdAt, 'MMM dd')}</div></div>
                  {payment.isRefund && (<div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-2"><div className="text-purple-400 text-sm font-medium">Refunded: ${payment.refundAmount.toLocaleString()}</div></div>)}
                  <div className="flex gap-2 pt-2"><button onClick={() => handleViewDetails(payment)} className="flex-1 bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300"><i className="bi bi-eye mr-1"></i>View Details</button></div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white font-medium hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><i className="bi bi-chevron-left"></i></button>
                <div className="hidden sm:flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) { pageNum = i + 1; } 
                  else if (currentPage <= 3) { pageNum = i + 1; } 
                  else if (currentPage >= totalPages - 2) { pageNum = totalPages - 4 + i; } 
                  else { pageNum = currentPage - 2 + i; }
                  return (<button key={i} onClick={() => setCurrentPage(pageNum)} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${ currentPage === pageNum ? 'bg-pink-500 text-white' : 'bg-white/10 border border-white/20 text-white hover:bg-white/20' }`}>{pageNum}</button>);
                })}
              </div>
              <div className="sm:hidden text-sm text-white/70">Page {currentPage} of {totalPages}</div>
              <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white font-medium hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><i className="bi bi-chevron-right"></i></button>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <span className="text-white/70 text-sm">Go to page:</span>
              <input type="number" min="1" max={totalPages} value={goToPageInput} onChange={(e) => setGoToPageInput(e.target.value)} onBlur={(e) => handleGoToPage(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter') { handleGoToPage((e.target as HTMLInputElement).value); } }} className="w-16 px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none focus:border-pink-400 transition-colors"/>
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
              <div className="sticky top-0 bg-gradient-to-r from-[#0b1c36] to-[#13294b] border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-2xl font-semibold text-white">Payment Details</h2>
                <button onClick={() => setShowModal(false)} className="flex items-center justify-center w-8 h-8 bg-white/10 hover:bg-red-500 text-white rounded-full transition-colors"><i className="bi bi-x text-xl"></i></button>
              </div>
              <div className="px-6 py-6 overflow-y-auto flex-1">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Payment Information</h3>
                      <div className="bg-white/5 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between"><span className="text-white/60">Payment ID</span><span className="text-white font-medium">{selectedPayment.id}</span></div>
                        <div className="flex justify-between"><span className="text-white/60">Transaction ID</span><span className="text-white font-medium">{selectedPayment.transactionId}</span></div>
                        <div className="flex justify-between"><span className="text-white/60">Booking ID</span><span className="text-white font-medium">{selectedPayment.bookingId}</span></div>
                        <div className="flex justify-between items-center"><span className="text-white/60">Status</span><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedPayment.status)}`}>{selectedPayment.status.replace('_', ' ')}</span></div>
                        <div className="flex justify-between items-center"><span className="text-white/60">Payment Method</span><div className="flex items-center gap-2 text-white font-medium"><i className={`bi ${getPaymentMethodIcon(selectedPayment.paymentMethod)}`}></i>{selectedPayment.paymentMethod.replace('_', ' ')}</div></div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Guest Information</h3>
                      <div className="bg-white/5 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between"><span className="text-white/60">Guest ID</span><span className="text-white font-medium">{selectedPayment.guestId}</span></div>
                        <div className="flex justify-between"><span className="text-white/60">Name</span><span className="text-white font-medium">{selectedPayment.guestName}</span></div>
                        <div className="flex justify-between"><span className="text-white/60">Email</span><span className="text-white font-medium text-right">{selectedPayment.guestEmail}</span></div>
                        <div className="flex justify-between"><span className="text-white/60">Property</span><span className="text-white font-medium text-right">{selectedPayment.propertyTitle}</span></div>
                        <div className="flex justify-between"><span className="text-white/60">Property ID</span><span className="text-white font-medium">{selectedPayment.propertyId}</span></div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Financial Breakdown</h3>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center"><div className="text-2xl font-bold text-pink-400">${selectedPayment.amount.toLocaleString()}</div><div className="text-white/60 text-sm">Base Amount</div></div>
                        <div className="text-center"><div className="text-2xl font-bold text-blue-400">${selectedPayment.serviceFee.toLocaleString()}</div><div className="text-white/60 text-sm">Service Fee</div></div>
                        <div className="text-center"><div className="text-2xl font-bold text-green-400">${selectedPayment.totalAmount.toLocaleString()}</div><div className="text-white/60 text-sm">Total Paid</div></div>
                      </div>
                      {selectedPayment.isRefund && (<div className="mt-4 p-3 bg-purple-500/20 border border-purple-500/30 rounded-lg"><div className="flex justify-between items-center"><span className="text-purple-400 font-medium">Refund Amount</span><span className="text-purple-400 font-bold">${selectedPayment.refundAmount.toLocaleString()}</span></div>{selectedPayment.originalPaymentId && (<div className="text-purple-400/70 text-sm mt-1">Original Payment: {selectedPayment.originalPaymentId}</div>)}</div>)}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Important Dates</h3>
                      <div className="bg-white/5 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between"><span className="text-white/60">Created</span><span className="text-white font-medium">{format(selectedPayment.createdAt, 'MMM dd, yyyy')}</span></div>
                        <div className="flex justify-between"><span className="text-white/60">Last Updated</span><span className="text-white font-medium">{format(selectedPayment.updatedAt, 'MMM dd, yyyy')}</span></div>
                        {selectedPayment.paidAt && (<div className="flex justify-between"><span className="text-white/60">Paid</span><span className="text-white font-medium">{format(selectedPayment.paidAt, 'MMM dd, yyyy')}</span></div>)}
                      </div>
                    </div>
                    {selectedPayment.notes && (<div><h3 className="text-lg font-semibold text-white mb-3">Notes</h3><div className="bg-white/5 rounded-lg p-4"><p className="text-white/80">{selectedPayment.notes}</p></div></div>)}
                  </div>
                </div>
              </div>
              <div className="sticky bottom-0 bg-gradient-to-r from-[#0b1c36] to-[#13294b] border-t border-white/10 px-6 py-4 flex justify-end gap-3 z-10">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white rounded-lg transition-colors font-medium">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestsPaymentsPage;
