"use client";
import React, { useState, useEffect, useMemo } from 'react';
import api from '@/app/api/conn';

interface BookingItem {
  id: string;
  type: 'property' | 'tour';
  guestId: number;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  guestCountry?: string;
  providerId: number;
  providerName: string;
  providerEmail: string;
  resourceId: string | number;
  resourceName: string;
  resourceLocation?: string;
  totalPrice: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';
  paymentStatus: 'pending' | 'paid' | 'partial' | 'failed' | 'refunded';
  paymentMethod?: string;
  transactionId?: string;
  dates: {
    checkIn?: string;
    checkOut?: string;
    bookingDate?: string;
    tourDate?: string;
  };
  guests?: number;
  participants?: number;
  nights?: number;
  duration?: number;
  specialRequests?: string;
  notes?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
  // Property specific
  propertyLocation?: string;
  propertyImages?: string[];
  checkInInstructions?: string;
  checkOutInstructions?: string;
  // Tour specific
  tourCategory?: string;
  tourDifficulty?: string;
  tourLocation?: string;
  tourMeetingPoint?: string;
  checkInStatus?: 'pending' | 'checked_in' | 'checked_out' | 'no_show';
  scheduleId?: string;
}

interface BookingStats {
  totalBookings: number;
  totalRevenue: number;
  pendingBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  completedBookings: number;
  pendingRevenue: number;
  refundedAmount: number;
  propertyBookings: number;
  tourBookings: number;
  averageBookingValue: number;
  cancellationRate: number;
}

type ViewMode = 'grid' | 'list';

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

const StatCard = ({ title, value, icon, iconBg, iconColor, subtitle }: {
  title: string;
  value: number | string;
  icon: string;
  iconBg: string;
  iconColor: string;
  subtitle?: string;
}) => (
  <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-slate-700/50 p-6 rounded-xl shadow-xl">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-white/60 text-sm">{title}</p>
        <p className="text-white text-2xl font-bold">
          {typeof value === 'number' && title.toLowerCase().includes('revenue') || title.toLowerCase().includes('amount') ? `$${value.toLocaleString()}` : value}
        </p>
        {subtitle && <p className="text-white/50 text-xs mt-1">{subtitle}</p>}
      </div>
      <div className={`${iconBg} p-3 rounded-xl`}>
        <i className={`bi ${icon} ${iconColor} text-xl`}></i>
      </div>
    </div>
  </div>
);

const BookingDetailsModal = ({ booking, onClose, onUpdate }: {
  booking: BookingItem | null;
  onClose: () => void;
  onUpdate: (booking: BookingItem) => void;
}) => {
  const [loading, setLoading] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [statusReason, setStatusReason] = useState('');

  if (!booking) return null;

  const handleStatusUpdate = async (newStatus: string) => {
    setLoading(true);
    try {
      const response: any = await api.put(`/admin/bookings/${booking.id}/${booking.type}`, { 
        status: newStatus, 
        reason: statusReason 
      });
      if (response.success) {
        onUpdate({ ...booking, status: newStatus as any });
        setStatusReason('');
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
    setLoading(false);
  };

  const handlePaymentUpdate = async (newPaymentStatus: string) => {
    setLoading(true);
    try {
      const response: any = await api.patch(`/admin/bookings/${booking.id}/${booking.type}`, { 
        paymentStatus: newPaymentStatus 
      });
      if (response.success) {
        onUpdate({ ...booking, paymentStatus: newPaymentStatus as any });
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
    setLoading(false);
  };

  const handleRefund = async () => {
    const amount = parseFloat(refundAmount);
    if (!amount || !refundReason.trim()) return;

    setLoading(true);
    try {
      const response: any = await api.post(`/admin/bookings/${booking.id}/${booking.type}/cancel`, { 
        refundAmount: amount, 
        reason: refundReason 
      });
      if (response.success) {
        onUpdate({ 
          ...booking, 
          paymentStatus: 'refunded', 
          refundAmount: amount 
        });
        setRefundAmount('');
        setRefundReason('');
      }
    } catch (error) {
      console.error('Error processing refund:', error);
    }
    setLoading(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'pending': 'bg-yellow-400/20 text-yellow-400',
      'confirmed': 'bg-green-400/20 text-green-400',
      'cancelled': 'bg-red-400/20 text-red-400',
      'completed': 'bg-blue-400/20 text-blue-400',
      'no-show': 'bg-gray-400/20 text-gray-400'
    };
    return colors[status] || 'bg-gray-400/20 text-gray-400';
  };

  const getPaymentColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'paid': 'text-green-400',
      'pending': 'text-yellow-400',
      'partial': 'text-orange-400',
      'failed': 'text-red-400',
      'refunded': 'text-purple-400'
    };
    return colors[status] || 'text-gray-400';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#0b1c36] border border-slate-700 rounded-lg shadow-xl w-full max-w-6xl p-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            {booking.type === 'property' ? 'Property' : 'Tour'} Booking Details
            <span className="ml-2 text-sm font-normal text-white/60">#{booking.id}</span>
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <p className="text-white/60 text-sm">Booking Status</p>
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(booking.status)}`}>
              {booking.status}
            </span>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <p className="text-white/60 text-sm">Payment Status</p>
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium bg-white/20 ${getPaymentColor(booking.paymentStatus)}`}>
              {booking.paymentStatus}
            </span>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <p className="text-white/60 text-sm">Total Amount</p>
            <p className="text-white font-bold">${booking.totalPrice.toLocaleString()}</p>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <p className="text-white/60 text-sm">{booking.type === 'property' ? 'Guests' : 'Participants'}</p>
            <p className="text-white font-bold">{booking.guests || booking.participants}</p>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          
          {/* Booking Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Booking Information</h3>
              <div className="bg-slate-800/50 p-4 rounded space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/60">Booking ID</span>
                  <span className="text-white font-medium">{booking.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Type</span>
                  <span className="text-white font-medium capitalize">{booking.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Created</span>
                  <span className="text-white font-medium">{formatDate(booking.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Last Updated</span>
                  <span className="text-white font-medium">{formatDate(booking.updatedAt)}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Financial Details</h3>
              <div className="bg-slate-800/50 p-4 rounded space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/60">Total Amount</span>
                  <span className="text-white font-bold text-lg">${booking.totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Currency</span>
                  <span className="text-white font-medium">{booking.currency}</span>
                </div>
                {booking.paymentMethod && (
                  <div className="flex justify-between">
                    <span className="text-white/60">Payment Method</span>
                    <span className="text-white font-medium">{booking.paymentMethod}</span>
                  </div>
                )}
                {booking.refundAmount && (
                  <div className="flex justify-between">
                    <span className="text-white/60">Refund Amount</span>
                    <span className="text-purple-400 font-medium">${booking.refundAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Guest Information */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Guest Information</h3>
            <div className="bg-slate-800/50 p-4 rounded grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/60">Guest ID</span>
                  <span className="text-white font-medium">{booking.guestId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Name</span>
                  <span className="text-white font-medium">{booking.guestName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Email</span>
                  <span className="text-white font-medium text-right break-all">{booking.guestEmail}</span>
                </div>
              </div>
              <div className="space-y-3">
                {booking.guestPhone && (
                  <div className="flex justify-between">
                    <span className="text-white/60">Phone</span>
                    <span className="text-white font-medium">{booking.guestPhone}</span>
                  </div>
                )}
                {booking.guestCountry && (
                  <div className="flex justify-between">
                    <span className="text-white/60">Country</span>
                    <span className="text-white font-medium">{booking.guestCountry}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Resource Information */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">
              {booking.type === 'property' ? 'Property' : 'Tour'} Information
            </h3>
            <div className="bg-slate-800/50 p-4 rounded">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/60">Name</span>
                  <span className="text-white font-medium text-right">{booking.resourceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Location</span>
                  <span className="text-white font-medium text-right">
                    {booking.resourceLocation || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Provider</span>
                  <span className="text-white font-medium text-right">{booking.providerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Provider Email</span>
                  <span className="text-white font-medium text-right break-all">{booking.providerEmail}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Special Requests & Notes */}
          {(booking.specialRequests || booking.notes || booking.cancellationReason) && (
            <div className="space-y-4">
              {booking.specialRequests && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Special Requests</h3>
                  <div className="bg-slate-800/50 p-4 rounded">
                    <p className="text-white/80">{booking.specialRequests}</p>
                  </div>
                </div>
              )}

              {booking.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Notes</h3>
                  <div className="bg-slate-800/50 p-4 rounded">
                    <p className="text-white/80">{booking.notes}</p>
                  </div>
                </div>
              )}

              {booking.cancellationReason && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Cancellation Reason</h3>
                  <div className="bg-red-500/10 rounded p-4 border border-red-500/20">
                    <p className="text-red-400">{booking.cancellationReason}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Admin Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-3">Admin Actions</h3>
            
            {/* Status Updates */}
            <div className="bg-slate-800/50 p-4 rounded">
              <h4 className="text-white font-medium mb-3">Update Status</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-white/70 text-sm mb-1">Reason (optional)</label>
                  <input
                    type="text"
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    placeholder="Enter reason for status change..."
                    className="w-full bg-slate-800/60 border border-slate-700 rounded px-3 py-2 text-white placeholder-white/50"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {['pending', 'confirmed', 'cancelled', 'completed', 'no-show'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusUpdate(status)}
                      disabled={loading || booking.status === status}
                      className={`px-3 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        booking.status === status
                          ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                          : status === 'confirmed'
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : status === 'cancelled'
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : status === 'completed'
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Payment Actions */}
            <div className="bg-slate-800/50 p-4 rounded">
              <h4 className="text-white font-medium mb-3">Payment Actions</h4>
              <div className="flex gap-2 flex-wrap">
                {['pending', 'paid', 'partial', 'failed'].map((paymentStatus) => (
                  <button
                    key={paymentStatus}
                    onClick={() => handlePaymentUpdate(paymentStatus)}
                    disabled={loading || booking.paymentStatus === paymentStatus}
                    className={`px-3 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      booking.paymentStatus === paymentStatus
                        ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                        : paymentStatus === 'paid'
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : paymentStatus === 'failed'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    }`}
                  >
                    Mark as {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Refund Section */}
            {booking.paymentStatus !== 'refunded' && booking.paymentStatus !== 'pending' && (
              <div className="bg-purple-500/10 rounded p-4 border border-purple-500/20">
                <h4 className="text-white font-medium mb-3">Process Refund</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-white/70 text-sm mb-1">Refund Amount ($)</label>
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      max={booking.totalPrice}
                      placeholder={`Max: ${booking.totalPrice}`}
                      className="w-full bg-slate-800/60 border border-slate-700 rounded px-3 py-2 text-white placeholder-white/50"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-1">Refund Reason</label>
                    <textarea
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="Enter reason for refund..."
                      rows={3}
                      className="w-full bg-slate-800/60 border border-slate-700 rounded px-3 py-2 text-white placeholder-white/50"
                    />
                  </div>
                  <button
                    onClick={handleRefund}
                    disabled={loading || !refundAmount || !refundReason.trim()}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : 'Process Refund'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const BookingGrid = ({ bookings, onViewDetails, onBookingAction }: {
  bookings: BookingItem[];
  onViewDetails: (booking: BookingItem) => void;
  onBookingAction: (action: string, booking: BookingItem) => void;
}) => {
  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'pending': 'bg-yellow-400/20 text-yellow-400',
      'confirmed': 'bg-green-400/20 text-green-400',
      'cancelled': 'bg-red-400/20 text-red-400',
      'completed': 'bg-blue-400/20 text-blue-400',
      'no-show': 'bg-gray-400/20 text-gray-400'
    };
    return colors[status] || 'bg-gray-400/20 text-gray-400';
  };

  const getPaymentColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'paid': 'text-green-400',
      'pending': 'text-yellow-400',
      'partial': 'text-orange-400',
      'failed': 'text-red-400',
      'refunded': 'text-purple-400'
    };
    return colors[status] || 'text-gray-400';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {bookings.map(booking => (
        <div key={booking.id} className="bg-[#0b1c36]/80 border border-slate-700/50 p-5 rounded-lg shadow-lg">
          <div className="flex justify-between items-start mb-4 gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-lg truncate" title={booking.resourceName}>{booking.resourceName}</h3>
              <p className="text-white/60 text-sm truncate" title={booking.id}>ID: {booking.id}</p>
              <p className="text-white/60 text-sm">Type: {booking.type}</p>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${
                booking.type === 'property' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
              }`}>
                {booking.type}
              </span>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${getStatusColor(booking.status)}`}>
                {booking.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center border-y border-slate-700/50 py-3 mb-4">
            <div>
              <p className="text-white/60 text-xs">Amount</p>
              <p className="text-white font-bold">${booking.totalPrice.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs">Payment</p>
              <span className={`text-xs px-1 py-0.5 rounded ${getPaymentColor(booking.paymentStatus)}`}>
                {booking.paymentStatus}
              </span>
            </div>
            <div>
              <p className="text-white/60 text-xs">
                {booking.type === 'property' ? 'Guests' : 'Participants'}
              </p>
              <p className="text-white font-bold">{booking.guests || booking.participants}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm text-white/60 mb-4">
            <div className="flex justify-between gap-2 min-w-0">
              <span className="flex-shrink-0">Guest:</span>
              <span className="text-white truncate text-right" title={booking.guestName}>{booking.guestName}</span>
            </div>
            <div className="flex justify-between gap-2 min-w-0">
              <span className="flex-shrink-0">Provider:</span>
              <span className="text-white truncate text-right" title={booking.providerName}>{booking.providerName}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="flex-shrink-0">Created:</span>
              <span className="text-white">{formatDate(booking.createdAt, true)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onViewDetails(booking)}
              className="flex-1 text-sm bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 px-3 py-2 rounded-md whitespace-nowrap"
            >
              View Details
            </button>
            {booking.status === 'pending' ? (
              <button
                onClick={() => onBookingAction('confirm', booking)}
                className="text-sm bg-green-500/20 text-green-400 hover:bg-green-500/40 px-3 py-2 rounded-md whitespace-nowrap"
              >
                Confirm
              </button>
            ) : booking.status === 'confirmed' ? (
              <button
                onClick={() => onBookingAction('complete', booking)}
                className="text-sm bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 px-3 py-2 rounded-md whitespace-nowrap"
              >
                Complete
              </button>
            ) : (
              <button
                onClick={() => onBookingAction('cancel', booking)}
                className="text-sm bg-red-500/20 text-red-400 hover:bg-red-500/40 px-3 py-2 rounded-md whitespace-nowrap"
                disabled={booking.status === 'cancelled'}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const BookingTable = ({ bookings, onViewDetails, onBookingAction }: {
  bookings: BookingItem[];
  onViewDetails: (booking: BookingItem) => void;
  onBookingAction: (action: string, booking: BookingItem) => void;
}) => {
  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'pending': 'bg-yellow-400/20 text-yellow-400',
      'confirmed': 'bg-green-400/20 text-green-400',
      'cancelled': 'bg-red-400/20 text-red-400',
      'completed': 'bg-blue-400/20 text-blue-400',
      'no-show': 'bg-gray-400/20 text-gray-400'
    };
    return colors[status] || 'bg-gray-400/20 text-gray-400';
  };

  const getPaymentColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'paid': 'text-green-400',
      'pending': 'text-yellow-400',
      'partial': 'text-orange-400',
      'failed': 'text-red-400',
      'refunded': 'text-purple-400'
    };
    return colors[status] || 'text-gray-400';
  };

  return (
    <div className="bg-[#0b1c36]/80 border border-slate-700/50 rounded-lg shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-white/80">
          <thead className="bg-slate-800/60">
            <tr>
              <th className="p-4">Booking</th>
              <th className="p-4">Type</th>
              <th className="p-4">Guest</th>
              <th className="p-4">Resource</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Status</th>
              <th className="p-4">Payment</th>
              <th className="p-4">Created</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(booking => (
              <tr key={booking.id} className="border-t border-slate-800 hover:bg-slate-800/40">
                <td className="p-4">
                  <div>
                    <div className="font-medium text-white">{booking.id}</div>
                    <div className="text-white/60 text-xs">{booking.currency}</div>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                    booking.type === 'property' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                  }`}>
                    {booking.type}
                  </span>
                </td>
                <td className="p-4">
                  <div>
                    <div className="font-medium text-white">{booking.guestName}</div>
                    <div className="text-white/60 text-xs">{booking.guestEmail}</div>
                  </div>
                </td>
                <td className="p-4">
                  <div>
                    <div className="font-medium text-white truncate max-w-[200px]">{booking.resourceName}</div>
                    <div className="text-white/60 text-xs">{booking.providerName}</div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-white font-bold">${booking.totalPrice.toLocaleString()}</div>
                  <div className="text-white/60 text-xs">{booking.guests || booking.participants} {booking.type === 'property' ? 'guests' : 'participants'}</div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`text-sm font-medium ${getPaymentColor(booking.paymentStatus)}`}>
                    {booking.paymentStatus}
                  </span>
                </td>
                <td className="p-4 text-white/70">{formatDate(booking.createdAt, true)}</td>
                <td className="p-4 text-center">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => onViewDetails(booking)}
                      className="text-blue-400 hover:text-blue-300"
                      title="View Details"
                    >
                      <i className="bi bi-eye"></i>
                    </button>
                    {booking.status === 'pending' && (
                      <button
                        onClick={() => onBookingAction('confirm', booking)}
                        className="text-green-400 hover:text-green-300"
                        title="Confirm Booking"
                      >
                        <i className="bi bi-check-circle"></i>
                      </button>
                    )}
                    {booking.status !== 'cancelled' && (
                      <button
                        onClick={() => onBookingAction('cancel', booking)}
                        className="text-red-400 hover:text-red-300"
                        title="Cancel Booking"
                      >
                        <i className="bi bi-x-circle"></i>
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

const BookingsAdminPage = () => {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('grid');
  const [activeTab, setActiveTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchBookings();
    fetchStats();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/bookings');
      setBookings(response.data.data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const response: any = await api.get('/admin/analytics');
      if (response.data.success && response.data) {
        const data = response.data.data;
        setStats({
          totalBookings: data.bookings?.total || 0,
          totalRevenue: data.bookings?.revenue || 0,
          pendingBookings: data.bookings?.byStatus?.pending || 0,
          confirmedBookings: data.bookings?.byStatus?.confirmed || 0,
          cancelledBookings: data.bookings?.byStatus?.cancelled || 0,
          completedBookings: data.bookings?.byStatus?.completed || 0,
          pendingRevenue: data.payments?.pendingRevenue || 0,
          refundedAmount: data.payments?.refundedAmount || 0,
          propertyBookings: data.bookings?.byType?.property || 0,
          tourBookings: data.bookings?.byType?.tour || 0,
          averageBookingValue: data.bookings?.averageValue || 0,
          cancellationRate: data.bookings?.cancellationRate || 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleBookingAction = async (action: string, booking: BookingItem) => {
    try {
      let response: any;
      if (action === 'confirm') {
        response = await api.put(`/admin/bookings/${booking.id}/${booking.type}`, { status: 'confirmed' });
      } else if (action === 'cancel') {
        response = await api.post(`/admin/bookings/${booking.id}/${booking.type}/cancel`, { reason: 'Admin cancellation' });
      } else if (action === 'complete') {
        response = await api.put(`/admin/bookings/${booking.id}/${booking.type}`, { status: 'completed' });
      }
      
      if (response?.success) {
        fetchBookings();
        fetchStats();
      }
    } catch (error) {
      console.error(`Error ${action}ing booking:`, error);
    }
  };

  const handleViewDetails = (booking: BookingItem) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  const handleBookingUpdate = (updatedBooking: BookingItem) => {
    setBookings(bookings.map(b => b.id === updatedBooking.id ? updatedBooking : b));
    setSelectedBooking(updatedBooking);
    fetchStats();
  };

  const handleExport = async () => {
    try {
      const response: any = await api.post('/admin/export/bookings', {
        type: 'bookings',
        format: 'csv',
        filters: {}
      });
      if (response.success) {
        console.log('Export initiated successfully');
      }
    } catch (error) {
      console.error('Error exporting bookings:', error);
    }
  };

  const filteredBookings = useMemo(() => {
    let filtered = bookings;

    // Filter by tab (booking type)
    if (activeTab !== 'all') {
      filtered = filtered.filter(booking => booking.type === activeTab);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Filter by payment status
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(booking => booking.paymentStatus === paymentFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.guestEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.resourceName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [bookings, activeTab, statusFilter, paymentFilter, searchTerm]);

  const calculatedStats = useMemo(() => {
    if (stats) return stats;
    
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
    const pendingBookings = bookings.filter(b => b.status === 'pending').length;
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
    const completedBookings = bookings.filter(b => b.status === 'completed').length;
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.status === 'completed' ? b.totalPrice : 0), 0);
    
    return {
      totalBookings,
      totalRevenue,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      completedBookings,
      pendingRevenue: bookings.filter(b => b.paymentStatus === 'pending').reduce((sum, b) => sum + b.totalPrice, 0),
      refundedAmount: bookings.filter(b => b.paymentStatus === 'refunded').reduce((sum, b) => sum + (b.refundAmount || 0), 0),
      propertyBookings: bookings.filter(b => b.type === 'property').length,
      tourBookings: bookings.filter(b => b.type === 'tour').length,
      averageBookingValue: totalBookings > 0 ? totalRevenue / totalBookings : 0,
      cancellationRate: totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0
    };
  }, [bookings, stats]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p>Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] border border-slate-700/50 p-8 mb-8 rounded-2xl shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Bookings Management</h1>
              <p className="text-white/70 text-lg">Monitor and manage all property and tour bookings</p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                className="bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
              >
                <i className="bi bi-download text-lg"></i>
                Export
              </button>
              <button
                onClick={fetchBookings}
                className="bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
              >
                <i className="bi bi-arrow-clockwise text-lg"></i>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-8">
          <StatCard title="Total Bookings" value={calculatedStats.totalBookings} icon="bi-calendar-check" iconBg="bg-blue-400/20" iconColor="text-blue-400" />
          <StatCard title="Total Revenue" value={calculatedStats.totalRevenue} icon="bi-currency-dollar" iconBg="bg-green-400/20" iconColor="text-green-400" />
          <StatCard title="Confirmed" value={calculatedStats.confirmedBookings} icon="bi-check-circle" iconBg="bg-emerald-400/20" iconColor="text-emerald-400" subtitle={`${((calculatedStats.confirmedBookings / calculatedStats.totalBookings) * 100 || 0).toFixed(1)}%`} />
          <StatCard title="Pending" value={calculatedStats.pendingBookings} icon="bi-clock" iconBg="bg-yellow-400/20" iconColor="text-yellow-400" subtitle={`$${calculatedStats.pendingRevenue.toLocaleString()}`} />
          <StatCard title="Cancelled" value={calculatedStats.cancelledBookings} icon="bi-x-circle" iconBg="bg-red-400/20" iconColor="text-red-400" subtitle={`${calculatedStats.cancellationRate.toFixed(1)}% rate`} />
          <StatCard title="Avg. Value" value={calculatedStats.averageBookingValue.toFixed(0)} icon="bi-graph-up" iconBg="bg-purple-400/20" iconColor="text-purple-400" subtitle="Per booking" />
        </div>

        {/* Booking Type Tabs */}
        <div className="bg-[#0b1c36]/80 border border-slate-700/50 rounded-lg mb-6 p-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { key: 'all', label: 'All Bookings' },
              { key: 'property', label: 'Property Bookings' },
              { key: 'tour', label: 'Tour Bookings' }
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
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-800/60 border border-slate-700 rounded-md pl-10 pr-4 py-2 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                  <option value="no-show">No Show</option>
                </select>
                
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Payments</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <p className="text-white/60 text-sm mr-4">
                Showing {filteredBookings.length} of {bookings.length} bookings
              </p>
              <div className="flex items-center bg-slate-800/60 border border-slate-700 rounded-md p-1">
                <button
                  onClick={() => setView('grid')}
                  className={`px-3 py-1 rounded text-sm ${view === 'grid' ? 'bg-blue-600' : 'hover:bg-slate-700/50'}`}
                >
                  <i className="bi bi-grid-3x3-gap-fill"></i>
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`px-3 py-1 rounded text-sm ${view === 'list' ? 'bg-blue-600' : 'hover:bg-slate-700/50'}`}
                >
                  <i className="bi bi-list-ul"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bookings Display */}
        <div>
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <i className="bi bi-calendar-x text-6xl text-white/20 mb-4"></i>
              <p className="text-white/60 text-lg">No bookings found matching your criteria</p>
            </div>
          ) : view === 'grid' ? (
            <BookingGrid 
              bookings={filteredBookings} 
              onViewDetails={handleViewDetails}
              onBookingAction={handleBookingAction}
            />
          ) : (
            <BookingTable 
              bookings={filteredBookings} 
              onViewDetails={handleViewDetails}
              onBookingAction={handleBookingAction}
            />
          )}
        </div>

        {/* Modals */}
        {showDetailsModal && (
          <BookingDetailsModal
            booking={selectedBooking}
            onClose={() => setShowDetailsModal(false)}
            onUpdate={handleBookingUpdate}
          />
        )}
      </div>
    </div>
  );
};

export default BookingsAdminPage;