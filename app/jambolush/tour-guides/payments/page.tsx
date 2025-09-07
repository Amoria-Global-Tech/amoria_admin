'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../api/jambolush/api-conn'; // Correct import path

interface Payment {
  id: number;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  transactionId: string;
  paymentMethod: string;
  dateCreated: string;
  dateProcessed?: string;
  description: string;
  tourTitle?: string;
}

// Payment Details Modal Component (No changes needed here)
const PaymentDetailsModal = ({ isOpen, onClose, payment }: {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment;
}) => {
  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-400/20';
      case 'pending': return 'text-yellow-400 bg-yellow-400/20';
      case 'failed': return 'text-red-400 bg-red-400/20';
      default: return 'text-white/60 bg-white/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'bi-check-circle';
      case 'pending': return 'bi-clock';
      case 'failed': return 'bi-x-circle';
      default: return 'bi-question-circle';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-95 backdrop-blur-xl border border-blue-900/20 shadow-2xl rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="bg-pink-400/20 p-3 rounded-xl">
              <i className="bi bi-credit-card text-pink-400 text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Payment Details</h2>
              <p className="text-white/60">Transaction #{payment.transactionId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl transition-colors cursor-pointer"
          >
            <i className="bi bi-x text-xl"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Section */}
          <div className="bg-white/5 rounded-xl p-4">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <i className="bi bi-info-circle text-blue-400"></i>
              Payment Status
            </h3>
            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-full font-semibold flex items-center gap-2 ${getStatusColor(payment.status)}`}>
                <i className={`bi ${getStatusIcon(payment.status)}`}></i>
                {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
              </span>
            </div>
          </div>

          {/* Tour Information */}
          {payment.tourTitle && (
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <i className="bi bi-geo-alt text-blue-400"></i>
                Tour Information
              </h3>
              <p className="text-white font-semibold">{payment.tourTitle}</p>
            </div>
          )}

          {/* Payment Information */}
          <div className="bg-white/5 rounded-xl p-4">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <i className="bi bi-cash text-blue-400"></i>
              Payment Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-white/60 text-sm">Amount</p>
                <p className="text-white font-bold text-xl">{payment.currency} {payment.amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Payment Method</p>
                <p className="text-white font-semibold">{payment.paymentMethod}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Transaction ID</p>
                <p className="text-white font-mono text-sm">{payment.transactionId}</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white/5 rounded-xl p-4">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <i className="bi bi-clock text-blue-400"></i>
              Timeline
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-blue-400/20 p-2 rounded-lg">
                  <i className="bi bi-plus-circle text-blue-400"></i>
                </div>
                <div>
                  <p className="text-white font-semibold">Payment Created</p>
                  <p className="text-white/60 text-sm">
                    {new Date(payment.dateCreated).toLocaleString()}
                  </p>
                </div>
              </div>
              
              {payment.dateProcessed && (
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${payment.status === 'completed' ? 'bg-green-400/20' : 'bg-red-400/20'}`}>
                    <i className={`${payment.status === 'completed' ? 'bi-check-circle text-green-400' : 'bi-x-circle text-red-400'}`}></i>
                  </div>
                  <div>
                    <p className="text-white font-semibold">
                      {payment.status === 'completed' ? 'Payment Completed' : 'Payment Failed'}
                    </p>
                    <p className="text-white/60 text-sm">
                      {new Date(payment.dateProcessed).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {payment.description && (
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <i className="bi bi-file-text text-blue-400"></i>
                Description
              </h3>
              <p className="text-white/80">{payment.description}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-6">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-xl font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Process Payment Modal Component (No changes needed here)
const ProcessPaymentModal = ({ isOpen, onClose, payment, onProcessPayment }: {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment;
  onProcessPayment: (paymentId: number, status: string, transactionId?: string) => Promise<void>;
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionId, setTransactionId] = useState(payment?.transactionId || '');
  const [notes, setNotes] = useState('');

  if (!isOpen || !payment) return null;

  const handleProcess = async (status: 'completed' | 'failed') => {
    setIsProcessing(true);
    try {
      await onProcessPayment(payment.id, status, transactionId);
      onClose();
    } catch (error) {
      console.error('Error processing payment:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-95 backdrop-blur-xl border border-blue-900/20 shadow-2xl rounded-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-400/20 p-3 rounded-xl">
              <i className="bi bi-gear text-yellow-400 text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Process Payment</h2>
              <p className="text-white/60">Update payment status</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl transition-colors cursor-pointer"
          >
            <i className="bi bi-x text-xl"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Payment Summary */}
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/60">Amount:</span>
              <span className="text-white font-bold">{payment.currency} {payment.amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/60">Current Status:</span>
              <span className="text-yellow-400 font-semibold">{payment.status}</span>
            </div>
          </div>

          {/* Transaction ID */}
          <div>
            <label className="block text-white/70 text-sm font-semibold mb-2">
              Transaction ID
            </label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:border-pink-400 transition-colors"
              placeholder="Enter transaction ID..."
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-white/70 text-sm font-semibold mb-2">
              Processing Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:border-pink-400 transition-colors resize-none"
              placeholder="Add any notes about this payment..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-6">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => handleProcess('failed')}
              disabled={isProcessing}
              className="flex-1 bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <i className="bi bi-arrow-clockwise animate-spin"></i>
              ) : (
                <i className="bi bi-x-circle"></i>
              )}
              Mark Failed
            </button>
            <button
              onClick={() => handleProcess('completed')}
              disabled={isProcessing}
              className="flex-1 bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <i className="bi bi-arrow-clockwise animate-spin"></i>
              ) : (
                <i className="bi bi-check-circle"></i>
              )}
              Mark Completed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


// Main Payment Dashboard Component
export default function PaymentAdminDashboard() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<number | null>(null);

  // Fetches payments from the API based on current filters
  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (searchTerm) params.q = searchTerm;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;

      const response = await api.get<Payment[]>('/payments', params);

      if (response.success && response.data) {
        setPayments(response.data);
      } else {
        setError(response.error || 'Failed to fetch payments.');
        setPayments([]); // Clear payments on error
      }
    } catch (err) {
      setError('An unexpected error occurred. Please check your connection.');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedStatus, dateRange]);

  // Initial data fetch and re-fetch when filters change
  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsDetailsModalOpen(true);
  };

  const handleProcessPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsProcessModalOpen(true);
  };

  const handleUpdatePaymentStatus = async (paymentId: number, newStatus: string, transactionId?: string) => {
    setIsProcessing(paymentId);
    try {
      // Use the API to update the payment status
      const response = await api.put(`/payments/${paymentId}/status`, {
        status: newStatus,
        transactionId: transactionId,
      });

      if (response.success) {
        alert(`Payment ${newStatus} successfully`);
        await fetchPayments(); // Refresh the list to show the update
      } else {
        throw new Error(response.error || 'Failed to update payment');
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      alert(error instanceof Error ? error.message : 'Failed to update payment');
    } finally {
      setIsProcessing(null);
      setIsProcessModalOpen(false);
    }
  };

  const handleRetryPayment = async (paymentId: number) => {
    await handleUpdatePaymentStatus(paymentId, 'pending');
  };

  const refreshPayments = () => {
    fetchPayments(); // Simply call fetchPayments to refresh
  };

  const handleExportReport = () => {
    const csvContent = generateCSVReport(payments); // Use current payments state
    downloadCSV(csvContent, 'payment-report.csv');
  };

  // The generateCSVReport and downloadCSV functions remain unchanged
  const generateCSVReport = (paymentsToExport: Payment[]) => {
    const headers = ['ID', 'Amount', 'Status', 'Date Created', 'Date Processed', 'Transaction ID', 'Tour Title'];
    const csvRows = [
      headers.join(','),
      ...paymentsToExport.map(p => [
        p.id,
        `${p.currency} ${p.amount}`,
        p.status,
        p.dateCreated,
        p.dateProcessed || 'N/A',
        `"${p.transactionId}"`, // Enclose in quotes for safety
        `"${p.tourTitle || 'N/A'}"`
      ].join(','))
    ];
    return csvRows.join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Note: The filtering logic is now handled by the backend via API params.
  // The 'filteredPayments' variable is no longer needed as the `payments` state
  // directly reflects the filtered data from the server.

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-400/20';
      case 'pending': return 'text-yellow-400 bg-yellow-400/20';
      case 'failed': return 'text-red-400 bg-red-400/20';
      default: return 'text-white/60 bg-white/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'bi-check-circle';
      case 'pending': return 'bi-clock';
      case 'failed': return 'bi-x-circle';
      default: return 'bi-question-circle';
    }
  };

  const statuses = ['all', 'pending', 'completed', 'failed'];

  return (
    <>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-2xl rounded-2xl p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Payment Management
              </h1>
              <p className="text-white/70 text-lg">
                Manage and process tour payments
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={refreshPayments}
                className="bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white px-4 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 cursor-pointer"
              >
                <i className="bi bi-arrow-clockwise text-lg"></i>
                Refresh
              </button>
              
              <button
                onClick={handleExportReport}
                className="bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white px-4 py-2 rounded-xl font-semibold shadow-lg hover:show-xl transition-all duration-300 flex items-center gap-2 cursor-pointer"
              >
                <i className="bi bi-download text-lg"></i>
                Download Report
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <i className="bi bi-exclamation-triangle text-red-400 text-xl"></i>
              <div>
                <h3 className="text-red-400 font-semibold">Error</h3>
                <p className="text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* These stats can be derived from the fetched payments or from a separate API endpoint */}
          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Total Payments</p>
                <p className="text-white text-2xl font-bold">{payments.length}</p>
              </div>
              <div className="bg-pink-400/20 p-3 rounded-xl">
                <i className="bi bi-credit-card text-pink-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Completed</p>
                <p className="text-white text-2xl font-bold">
                  {payments.filter(p => p.status === 'completed').length}
                </p>
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
                <p className="text-white text-2xl font-bold">
                  {payments.filter(p => p.status === 'pending').length}
                </p>
              </div>
              <div className="bg-yellow-400/20 p-3 rounded-xl">
                <i className="bi bi-clock text-yellow-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Failed</p>
                <p className="text-white text-2xl font-bold">
                  {payments.filter(p => p.status === 'failed').length}
                </p>
              </div>
              <div className="bg-red-400/20 p-3 rounded-xl">
                <i className="bi bi-x-circle text-red-400 text-xl"></i>
              </div>
            </div>
          </div>
        </div>
        
        {/* Search and Filter */}
        <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="relative">
              <i className="bi bi-search absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60"></i>
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/60 focus:outline-none focus:border-pink-400 transition-colors"
              />
            </div>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-400 transition-colors"
            >
              {statuses.map(status => (
                <option key={status} value={status} className="bg-[#0b1c36] text-white">
                  {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="flex-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-400 transition-colors"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="flex-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-400 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8">
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-white/10 h-16 rounded-lg"></div>
                ))}
              </div>
            </div>
          ) : payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="text-left text-white/70 font-semibold p-4">Tour</th>
                    <th className="text-left text-white/70 font-semibold p-4">Amount</th>
                    <th className="text-left text-white/70 font-semibold p-4">Status</th>
                    <th className="text-left text-white/70 font-semibold p-4">Date</th>
                    <th className="text-left text-white/70 font-semibold p-4">Transaction ID</th>
                    <th className="text-right text-white/70 font-semibold p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div>
                          {payment.tourTitle && (
                            <p className="text-white font-semibold">{payment.tourTitle}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-white font-semibold">
                          {payment.currency} {payment.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2 w-fit ${getStatusColor(payment.status)}`}>
                          <i className={`bi ${getStatusIcon(payment.status)}`}></i>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="text-white">{new Date(payment.dateCreated).toLocaleDateString()}</p>
                        <p className="text-white/60 text-sm">{new Date(payment.dateCreated).toLocaleTimeString()}</p>
                      </td>
                      <td className="p-4">
                        <span className="text-white/80 font-mono text-sm">{payment.transactionId}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleViewPayment(payment)}
                            className="bg-blue-400/20 hover:bg-blue-400/30 text-blue-400 px-3 py-1 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <i className="bi bi-eye"></i>
                            View
                          </button>
                          
                          {payment.status === 'pending' && (
                            <button
                              onClick={() => handleProcessPayment(payment)}
                              disabled={isProcessing === payment.id}
                              className="bg-green-400/20 hover:bg-green-400/30 text-green-400 px-3 py-1 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                            >
                              <i className="bi bi-check-circle"></i>
                              {isProcessing === payment.id ? 'Processing...' : 'Process'}
                            </button>
                          )}
                          
                          {payment.status === 'failed' && (
                            <button
                              onClick={() => handleRetryPayment(payment.id)}
                              disabled={isProcessing === payment.id}
                              className="bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-400 px-3 py-1 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                            >
                              <i className="bi bi-arrow-clockwise"></i>
                              {isProcessing === payment.id ? 'Retrying...' : 'Retry'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <i className="bi bi-credit-card text-white/40 text-6xl mb-4"></i>
              <h3 className="text-white text-xl font-semibold mb-2">
                {error ? 'Failed to load payments' : 'No payments found'}
              </h3>
              <p className="text-white/60">
                {error ? 'Please try refreshing the page' : 'Try adjusting your search or filter criteria'}
              </p>
              {error && (
                <button
                  onClick={refreshPayments}
                  className="mt-4 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300 cursor-pointer"
                >
                  Try Again
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Payment Details Modal */}
      {selectedPayment && (
        <PaymentDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedPayment(null);
          }}
          payment={selectedPayment}
        />
      )}

      {/* Process Payment Modal */}
      {selectedPayment && (
        <ProcessPaymentModal
          isOpen={isProcessModalOpen}
          onClose={() => {
            setIsProcessModalOpen(false);
            setSelectedPayment(null);
          }}
          payment={selectedPayment}
          onProcessPayment={handleUpdatePaymentStatus}
        />
      )}
    </>
  );
}