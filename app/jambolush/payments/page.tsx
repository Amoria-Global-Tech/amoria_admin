"use client";
import React, { useState, useEffect, useCallback } from 'react';
import api from '@/app/api/conn';
import { usePreventDoubleClick } from '@/app/hooks/usePreventDoubleClick';
import AlertNotification from '@/app/components/menu/notify';

// Types based on your actual API response
interface PaymentTransaction {
  id: string;
  reference: string;
  provider: string;
  type: string;
  method: string;
  userId?: number | null;
  userName?: string | null;
  userEmail?: string | null;
  userPhone?: string | null;
  recipientId?: number | null;
  recipientName?: string | null;
  recipientEmail?: string | null;
  amount: number;
  currency: string;
  requestedAmount?: number;
  netAmount?: number | null;
  charges?: number | null;
  platformFee?: number | null;
  agentCommission?: number | null;
  hostShare?: number | null;
  status: string;
  failureReason?: string | null;
  failureCode?: string | null;
  externalId?: string | null;
  providerTransactionId?: string | null;
  financialTransactionId?: string | null;
  sourceAccount?: string | null;
  destinationAccount?: string | null;
  payerPhone?: string | null;
  recipientPhone?: string | null;
  payerEmail?: string | null;
  correspondent?: string | null;
  description?: string | null;
  statementDescription?: string | null;
  bookingId?: string | null;
  propertyId?: string | null;
  tourId?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  processedAt?: string | null;
  receivedByProvider?: string | null;
  customerTimestamp?: string | null;
  isRefund: boolean;
  refundedAt?: string | null;
  refundedAmount?: number | null;
  depositedAmount?: number | null;
  relatedTransactionId?: string | null;
  isP2P: boolean;
  country?: string | null;
  metadata?: any;
  isEscrowBased: boolean;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  recipient?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface EscrowTransaction {
  id: string;
  userId: number;
  recipientId?: number;
  type: string;
  amount: number;
  currency: string;
  status: string;
  reference: string;
  description?: string;
  escrowId?: string;
  externalId?: string;
  paymentUrl?: string;
  transferType?: string;
  isP2P: boolean;
  notifyBySMS: boolean;
  fundedAt?: string;
  releasedAt?: string;
  releasedBy?: number;
  releaseReason?: string;
  disputedAt?: string;
  disputedBy?: number;
  disputeReason?: string;
  resolvedAt?: string;
  resolvedBy?: number;
  resolutionReason?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: any;
  refundedAt?: string;
  pesapalOrderId?: string;
  pesapalTrackingId?: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  recipient?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface WithdrawalRequest {
  id: string;
  userId: number;
  userName: string;
  userEmail: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  destination: string | {
    holderName?: string;
    accountNumber?: string;
    phoneNumber?: string;
    email?: string;
    providerCode?: string;
    providerName?: string;
    providerType?: string;
    countryCode?: string;
    bankName?: string;
  };
  pesapalPayoutId?: string;
  reference: string;
  failureReason?: string;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  metadata?: any;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface UserWallet {
  id: string;
  userId: number;
  balance: number;
  currency: string;
  accountNumber?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface WalletTransaction {
  id: string;
  walletId: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reference: string;
  description: string;
  transactionId?: string;
  createdAt: string;
}

// New Interface for Withdrawal Method Requests
interface WithdrawalMethodRequest {
  id: string;
  userId: number;
  methodType: string;
  accountName: string;
  accountDetails: string | {
    country: string;
    currency: string;
    providerId: string;
    accountType: string;
    providerCode: string;
    providerName: string;
    providerType: string;
    accountNumber: string;
    bankAccountNumber?: string;
    phoneNumber?: string;
  };
  isDefault: boolean;
  isVerified: boolean;
  isApproved: boolean;
  approvedBy: number | null;
  approvedAt: string | null;
  rejectedBy: number | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  verificationStatus: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    kycStatus: string;
  };
}


interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface AnalyticsData {
  revenue: {
    total: number;
    monthly: number;
    weekly: number;
    daily: number;
    growth: number;
  };
  transactions: {
    total: number;
    successful: number;
    failed: number;
    pending: number;
    averageValue: number;
  };
  users: {
    total: number;
    active: number;
    new: number;
    verified: number;
  };
  performance: {
    successRate: number;
    avgProcessingTime: number;
    peakHour: number;
    systemUptime: number;
  };
  topCountries?: Array<{
    country: string;
    transactions: number;
    volume: number;
  }>;
}

// Utility functions
function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return date.toLocaleDateString('en-US', options);
  } catch (error) {
    return 'Invalid Date';
  }
}

function formatCurrency(amount: number, currency: string = 'RWF'): string {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Stat Card Component
const StatCard = ({ title, value, icon, iconBg, iconColor, subtitle, trend }: {
  title: string;
  value: number | string;
  icon: string;
  iconBg: string;
  iconColor: string;
  subtitle?: string;
  trend?: number;
}) => (
  <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-slate-700/50 p-6 rounded-xl shadow-xl">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-white/60 text-sm">{title}</p>
        <p className="text-white text-2xl font-bold mt-1">
          {typeof value === 'number' && (title.includes('Volume') || title.includes('Revenue') || title.includes('Held') || title.includes('Withdrawal') || title.includes('Balance')) 
            ? formatCurrency(value) 
            : value}
        </p>
        {subtitle && <p className="text-white/50 text-xs mt-1">{subtitle}</p>}
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-2 ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            <i className={`bi bi-arrow-${trend >= 0 ? 'up' : 'down'} text-sm`}></i>
            <span className="text-sm font-medium">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className={`${iconBg} p-3 rounded-xl`}>
        <i className={`bi ${icon} ${iconColor} text-xl`}></i>
      </div>
    </div>
  </div>
);

// Pagination Component
const Pagination = ({ 
  pagination, 
  onPageChange, 
  onLimitChange,
  limitOptions = [10, 20, 50, 100]
}: {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  limitOptions?: number[];
}) => {
  if (!pagination || pagination.total === 0) return null;

  const { page, limit, total, totalPages, hasNext, hasPrev } = pagination;
  
  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 3) {
        for (let i = 1; i <= Math.min(4, totalPages); i++) {
          pages.push(i);
        }
        if (totalPages > 4) {
          pages.push('...');
          pages.push(totalPages);
        }
      } else if (page >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(page - 1);
        pages.push(page);
        pages.push(page + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-4 bg-slate-800/40 rounded-lg">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-white/60 text-sm">Items per page:</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="bg-slate-700 border border-slate-600 rounded px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {limitOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        
        <div className="text-white/60 text-sm">
          Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total} items
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(1)}
          disabled={!hasPrev}
          className="p-2 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          title="First page"
        >
          <i className="bi bi-chevron-bar-left"></i>
        </button>
        
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrev}
          className="p-2 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          title="Previous page"
        >
          <i className="bi bi-chevron-left"></i>
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((pageNum, index) => (
            pageNum === '...' ? (
              <span key={`dots-${index}`} className="px-2 text-white/40">...</span>
            ) : (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum as number)}
                className={`px-3 py-1 rounded ${
                  pageNum === page 
                    ? 'bg-blue-600 text-white' 
                    : 'text-white/60 hover:text-white hover:bg-slate-700'
                }`}
              >
                {pageNum}
              </button>
            )
          ))}
        </div>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext}
          className="p-2 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          title="Next page"
        >
          <i className="bi bi-chevron-right"></i>
        </button>
        
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={!hasNext}
          className="p-2 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          title="Last page"
        >
          <i className="bi bi-chevron-bar-right"></i>
        </button>
      </div>
    </div>
  );
};

// Transaction Details Modal
const TransactionDetailsModal = ({ 
  transaction, 
  type, 
  onClose, 
  onAction,
  onNotifyUser 
}: {
  transaction: PaymentTransaction | EscrowTransaction | WithdrawalRequest | null;
  type: 'payment' | 'escrow' | 'withdrawal';
  onClose: () => void;
  onAction: (action: string, data?: any) => void;
  onNotifyUser?: (transactionId: string, message: string) => void;
}) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notificationMessage, setNotificationMessage] = useState('');

  if (!transaction) return null;

  const handleAction = async (action: string, data?: any) => {
    setActionLoading(action);
    try {
      await onAction(action, { ...data, transactionId: transaction.id, type });
      onClose();
    } catch (error) {
      console.error(`Action ${action} failed:`, error);
    }
    setActionLoading(null);
  };

  const handleNotifyUser = () => {
    if (onNotifyUser && notificationMessage) {
      onNotifyUser(transaction.id, notificationMessage);
      setNotificationMessage('');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': case 'released': case 'approved': return 'bg-green-500/20 text-green-400';
      case 'processing': case 'funded': case 'accepted': return 'bg-blue-500/20 text-blue-400';
      case 'pending': case 'ready': return 'bg-yellow-500/20 text-yellow-400';
      case 'failed': case 'cancelled': case 'rejected': return 'bg-red-500/20 text-red-400';
      case 'refunded': return 'bg-purple-500/20 text-purple-400';
      case 'disputed': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getUserName = (user?: any) => {
    if (!user) {
      if ('userName' in transaction && transaction.userName) {
        return transaction.userName;
      }
      return 'N/A';
    }
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || `User ${user.id}`;
  };

  const isPaymentTransaction = (t: any): t is PaymentTransaction => {
    return type === 'payment';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-slate-700 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">
            {type === 'payment' ? 'Payment Transaction' : 
             type === 'escrow' ? 'Escrow Transaction' : 
             'Withdrawal Request'} Details
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <i className="bi bi-x-lg text-xl"></i>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-lg p-4 space-y-3">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <i className="bi bi-info-circle text-blue-400"></i>
                  Transaction Info
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-white/60">ID</span>
                    <span className="text-white font-mono text-sm break-all text-right max-w-[200px]">{transaction.id}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-white/60">Reference</span>
                    <span className="text-white font-medium break-all text-right max-w-[200px]">{transaction.reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Status</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Amount</span>
                    <span className="text-white font-bold text-lg">
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </span>
                  </div>
                  {isPaymentTransaction(transaction) && (
                    <>
                      {transaction.provider && (
                        <div className="flex justify-between">
                          <span className="text-white/60">Provider</span>
                          <span className="text-white font-medium">{transaction.provider}</span>
                        </div>
                      )}
                      {transaction.correspondent && (
                        <div className="flex justify-between">
                          <span className="text-white/60">Correspondent</span>
                          <span className="text-white font-medium">{transaction.correspondent}</span>
                        </div>
                      )}
                      {transaction.method && (
                        <div className="flex justify-between">
                          <span className="text-white/60">Method</span>
                          <span className="text-white font-medium capitalize">
                            {transaction.method?.replace(/_/g, ' ')}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4 space-y-3">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <i className="bi bi-person-circle text-green-400"></i>
                  User Info
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-white/60">User ID</span>
                    <span className="text-white font-medium">{transaction.userId || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Name</span>
                    <span className="text-white font-medium">
                      {getUserName(transaction.user)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Email</span>
                    <span className="text-white font-medium text-sm">
                      {transaction.user?.email || (isPaymentTransaction(transaction) ? transaction.userEmail : null) || 'N/A'}
                    </span>
                  </div>
                  {isPaymentTransaction(transaction) && transaction.payerPhone && (
                    <div className="flex justify-between">
                      <span className="text-white/60">Phone</span>
                      <span className="text-white font-medium">
                        {transaction.payerPhone}
                      </span>
                    </div>
                  )}
                  {isPaymentTransaction(transaction) && transaction.country && (
                    <div className="flex justify-between">
                      <span className="text-white/60">Country</span>
                      <span className="text-white font-medium">{transaction.country}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description and Statement */}
            {isPaymentTransaction(transaction) && (transaction.description || transaction.statementDescription) && (
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <i className="bi bi-card-text text-purple-400"></i>
                  Description
                </h3>
                {transaction.description && (
                  <p className="text-white/80 mb-2">{transaction.description}</p>
                )}
                {transaction.statementDescription && transaction.statementDescription !== transaction.description && (
                  <div>
                    <p className="text-white/60 text-sm">Statement Description:</p>
                    <p className="text-white/80">{transaction.statementDescription}</p>
                  </div>
                )}
              </div>
            )}

            {/* Related IDs */}
            {isPaymentTransaction(transaction) && (transaction.externalId || transaction.bookingId || transaction.propertyId) && (
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <i className="bi bi-link-45deg text-cyan-400"></i>
                  Related Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {transaction.externalId && (
                    <div>
                      <p className="text-white/60 text-sm">External ID</p>
                      <p className="text-white font-mono text-sm">{transaction.externalId}</p>
                    </div>
                  )}
                  {transaction.bookingId && (
                    <div>
                      <p className="text-white/60 text-sm">Booking ID</p>
                      <p className="text-white font-mono text-sm">{transaction.bookingId}</p>
                    </div>
                  )}
                  {transaction.propertyId && (
                    <div>
                      <p className="text-white/60 text-sm">Property ID</p>
                      <p className="text-white font-mono text-sm">{transaction.propertyId}</p>
                    </div>
                  )}
                  {transaction.tourId && (
                    <div>
                      <p className="text-white/60 text-sm">Tour ID</p>
                      <p className="text-white font-mono text-sm">{transaction.tourId}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Escrow Specific Details */}
            {type === 'escrow' && (
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <i className="bi bi-shield-lock text-blue-400"></i>
                  Escrow Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-white/60 text-sm">Sender</p>
                    <p className="text-white font-medium">{getUserName((transaction as EscrowTransaction).user)}</p>
                  </div>
                  {(transaction as EscrowTransaction).recipient && (
                    <div>
                      <p className="text-white/60 text-sm">Recipient</p>
                      <p className="text-white font-medium">{getUserName((transaction as EscrowTransaction).recipient)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-white/60 text-sm">Transfer Type</p>
                    <p className="text-white font-medium">{(transaction as EscrowTransaction).transferType || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Is P2P</p>
                    <p className="text-white font-medium">{(transaction as EscrowTransaction).isP2P ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Withdrawal Specific Details */}
            {type === 'withdrawal' && (
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <i className="bi bi-arrow-up-circle text-orange-400"></i>
                  Withdrawal Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-white/60 text-sm">Method</p>
                    <p className="text-white font-medium capitalize">
                      {(transaction as WithdrawalRequest).method.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Destination</p>
                    <p className="text-white font-medium">
                      {(() => {
                        const dest = (transaction as WithdrawalRequest).destination;
                        if (typeof dest === 'string') return dest;
                        return dest?.accountNumber || dest?.phoneNumber || 'N/A';
                      })()}
                    </p>
                  </div>
                  {(() => {
                    const dest = (transaction as WithdrawalRequest).destination;
                    return typeof dest !== 'string' && dest?.holderName && (
                      <div>
                        <p className="text-white/60 text-sm">Account Holder</p>
                        <p className="text-white font-medium">{dest.holderName}</p>
                      </div>
                    );
                  })()}
                  {(transaction as WithdrawalRequest).pesapalPayoutId && (
                    <div>
                      <p className="text-white/60 text-sm">Pesapal Payout ID</p>
                      <p className="text-white font-mono text-sm">{(transaction as WithdrawalRequest).pesapalPayoutId}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <i className="bi bi-clock-history text-yellow-400"></i>
                Timeline
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-white/60 text-sm">Created</p>
                  <p className="text-white">{formatDate(transaction.createdAt)}</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Last Updated</p>
                  <p className="text-white">{transaction.updatedAt ? formatDate(transaction.updatedAt) : 'N/A'}</p>
                </div>
                {isPaymentTransaction(transaction) && transaction.completedAt && (
                  <div>
                    <p className="text-white/60 text-sm">Completed</p>
                    <p className="text-white">{formatDate(transaction.completedAt)}</p>
                  </div>
                )}
                {isPaymentTransaction(transaction) && transaction.customerTimestamp && (
                  <div>
                    <p className="text-white/60 text-sm">Customer Timestamp</p>
                    <p className="text-white">{formatDate(transaction.customerTimestamp)}</p>
                  </div>
                )}
                {type === 'escrow' && (transaction as EscrowTransaction).fundedAt && (
                  <div>
                    <p className="text-white/60 text-sm">Funded</p>
                    <p className="text-white">{formatDate((transaction as EscrowTransaction).fundedAt!)}</p>
                  </div>
                )}
                {type === 'escrow' && (transaction as EscrowTransaction).releasedAt && (
                  <div>
                    <p className="text-white/60 text-sm">Released</p>
                    <p className="text-white">{formatDate((transaction as EscrowTransaction).releasedAt!)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Error Information */}
            {((isPaymentTransaction(transaction) && transaction.failureReason) || 
              ('failureReason' in transaction && transaction.failureReason)) && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <h3 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                  <i className="bi bi-exclamation-triangle"></i>
                  Failure Information
                </h3>
                <p className="text-red-300">
                  {isPaymentTransaction(transaction) ? transaction.failureReason : 
                   ('failureReason' in transaction ? transaction.failureReason : '')}
                </p>
                {isPaymentTransaction(transaction) && transaction.failureCode && (
                  <p className="text-red-400 text-sm mt-2">Code: {transaction.failureCode}</p>
                )}
              </div>
            )}

            {/* Metadata */}
            {transaction.metadata && (
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <i className="bi bi-code-slash text-indigo-400"></i>
                  Metadata
                </h3>
                <pre className="text-white/80 text-sm overflow-x-auto bg-slate-800/50 p-3 rounded">
                  {typeof transaction.metadata === 'string' 
                    ? transaction.metadata 
                    : JSON.stringify(transaction.metadata, null, 2)}
                </pre>
              </div>
            )}

            {/* User Notification Section */}
            {transaction.status === 'FAILED' && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                <h3 className="text-orange-400 font-semibold mb-3 flex items-center gap-2">
                  <i className="bi bi-bell"></i>
                  Notify User
                </h3>
                <div className="space-y-3">
                  <p className="text-orange-300 text-sm">System may have failed to notify user about this failure.</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter notification message..."
                      value={notificationMessage}
                      onChange={(e) => setNotificationMessage(e.target.value)}
                      className="flex-1 bg-slate-800/60 border border-slate-700 rounded px-3 py-2 text-white text-sm"
                    />
                    <button
                      onClick={handleNotifyUser}
                      disabled={!notificationMessage}
                      className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded text-white text-sm disabled:opacity-50"
                    >
                      Send Notification
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 p-6 border-t border-slate-700">
          {/* Payment Actions */}
          {type === 'payment' && transaction.status === 'PENDING' && (
            <>
              <button
                onClick={() => handleAction('approve_payment')}
                disabled={actionLoading === 'approve_payment'}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md text-white text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading === 'approve_payment' ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Approving...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle"></i>
                    Approve
                  </>
                )}
              </button>
              <button
                onClick={() => handleAction('reject_payment')}
                disabled={actionLoading === 'reject_payment'}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-white text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading === 'reject_payment' ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Rejecting...
                  </>
                ) : (
                  <>
                    <i className="bi bi-x-circle"></i>
                    Reject
                  </>
                )}
              </button>
            </>
          )}

          {/* Mark as Resolved for Failed Transactions */}
          {transaction.status === 'FAILED' && (
            <button
              onClick={() => handleAction('mark_resolved')}
              disabled={actionLoading === 'mark_resolved'}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-white text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {actionLoading === 'mark_resolved' ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Marking...
                </>
              ) : (
                <>
                  <i className="bi bi-check-square"></i>
                  Mark as Resolved
                </>
              )}
            </button>
          )}

          {/* Escrow Actions */}
          {type === 'escrow' && (
            <>
              {(transaction.status === 'PENDING' || transaction.status === 'FUNDED') && (
                <button
                  onClick={() => handleAction('release_escrow')}
                  disabled={actionLoading === 'release_escrow'}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md text-white text-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading === 'release_escrow' ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Releasing...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-unlock"></i>
                      Release Funds
                    </>
                  )}
                </button>
              )}
              {(transaction.status === 'PENDING' || transaction.status === 'FUNDED') && (
                <button
                  onClick={() => handleAction('refund_escrow')}
                  disabled={actionLoading === 'refund_escrow'}
                  className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md text-white text-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading === 'refund_escrow' ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Refunding...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-arrow-return-left"></i>
                      Refund
                    </>
                  )}
                </button>
              )}
              {transaction.status === 'DISPUTED' && (
                <button
                  onClick={() => handleAction('resolve_dispute')}
                  disabled={actionLoading === 'resolve_dispute'}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-white text-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading === 'resolve_dispute' ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Resolving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-handshake"></i>
                      Resolve Dispute
                    </>
                  )}
                </button>
              )}
            </>
          )}

          {/* Withdrawal Actions */}
          {type === 'withdrawal' && (
            <>
              {transaction.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => handleAction('approve_withdrawal')}
                    disabled={actionLoading === 'approve_withdrawal'}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md text-white text-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {actionLoading === 'approve_withdrawal' ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        Approving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle"></i>
                        Approve
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleAction('reject_withdrawal')}
                    disabled={actionLoading === 'reject_withdrawal'}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-white text-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {actionLoading === 'reject_withdrawal' ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-x-circle"></i>
                        Reject
                      </>
                    )}
                  </button>
                </>
              )}
            </>
          )}

          <button
            onClick={onClose}
            className="ml-auto bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-md text-white text-sm flex items-center gap-2"
          >
            <i className="bi bi-x"></i>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// New Modal for Method Requests
const MethodRequestModal = ({
  method,
  onClose,
  onApprove,
  onReject
}: {
  method: WithdrawalMethodRequest | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Helper function to parse accountDetails if it's a string
  const parseAccountDetails = (accountDetails: string | object): any => {
    if (typeof accountDetails === 'string') {
      try {
        return JSON.parse(accountDetails);
      } catch {
        return {};
      }
    }
    return accountDetails;
  };

  if (!method) return null;

  const handleApprove = async () => {
    setLoadingAction('approve');
    try {
      await onApprove(method.id);
      onClose();
    } catch (error) {
      console.error('Approval failed:', error);
      // Error will be shown via main page's error state
    }
    setLoadingAction(null);
  };

  const handleReject = async () => {
    if (!rejectionReason) {
      alert('Please provide a reason for rejection.');
      return;
    }
    setLoadingAction('reject');
    try {
      await onReject(method.id, rejectionReason);
      onClose();
    } catch (error) {
      console.error('Rejection failed:', error);
      // Error will be shown via main page's error state
    }
    setLoadingAction(null);
  };

  const details = parseAccountDetails(method.accountDetails);
  const user = method.user;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-slate-700 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Review Withdrawal Method</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <i className="bi bi-x-lg text-xl"></i>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* User Info */}
          <div className="bg-white/5 rounded-lg p-4 space-y-3">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <i className="bi bi-person-circle text-green-400"></i>
              User Information
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-white/60 text-sm">Name</span>
                <p className="text-white font-medium">{`${user.firstName} ${user.lastName}`}</p>
              </div>
              <div>
                <span className="text-white/60 text-sm">Email</span>
                <p className="text-white font-medium">{user.email}</p>
              </div>
              <div>
                <span className="text-white/60 text-sm">Phone</span>
                <p className="text-white font-medium">{user.phone || 'N/A'}</p>
              </div>
              <div>
                <span className="text-white/60 text-sm">KYC Status</span>
                <p className={`font-medium ${user.kycStatus === 'approved' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {user.kycStatus.toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          {/* Method Details */}
          <div className="bg-white/5 rounded-lg p-4 space-y-3">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <i className="bi bi-credit-card-2-front text-blue-400"></i>
              Method Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-white/60 text-sm">Method Type</span>
                <p className="text-white font-medium">{details.providerType || method.methodType}</p>
              </div>
              <div>
                <span className="text-white/60 text-sm">Provider</span>
                <p className="text-white font-medium">{details.providerName}</p>
              </div>
              <div>
                <span className="text-white/60 text-sm">Account Name</span>
                <p className="text-white font-medium">{method.accountName}</p>
              </div>
              <div>
                <span className="text-white/60 text-sm">Account Number / Phone</span>
                <p className="text-white font-medium font-mono">{details.accountNumber}</p>
              </div>
              <div>
                <span className="text-white/60 text-sm">Currency</span>
                <p className="text-white font-medium">{details.currency}</p>
              </div>
              <div>
                <span className="text-white/60 text-sm">Country</span>
                <p className="text-white font-medium">{details.country}</p>
              </div>
            </div>
          </div>
          
          {/* Rejection Reason Input (for reject action) */}
          <div className="space-y-2">
             <label className="text-white/60 text-sm" htmlFor="rejectionReason">
               Rejection Reason (if rejecting)
             </label>
             <textarea
               id="rejectionReason"
               value={rejectionReason}
               onChange={(e) => setRejectionReason(e.target.value)}
               rows={3}
               className="w-full bg-slate-800/60 border border-slate-700 rounded px-3 py-2 text-white text-sm"
               placeholder="Enter reason for rejection..."
             />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 p-6 border-t border-slate-700">
          <button
            onClick={handleApprove}
            disabled={loadingAction === 'approve'}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md text-white text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {loadingAction === 'approve' ? (
              <>
                <span className="animate-spin">⏳</span>
                Approving...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle"></i>
                Approve
              </>
            )}
          </button>
          <button
            onClick={handleReject}
            disabled={!rejectionReason || loadingAction === 'reject'}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-white text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {loadingAction === 'reject' ? (
              <>
                <span className="animate-spin">⏳</span>
                Rejecting...
              </>
            ) : (
              <>
                <i className="bi bi-x-circle"></i>
                Reject
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="ml-auto bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-md text-white text-sm flex items-center gap-2"
          >
            <i className="bi bi-x"></i>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};


// Main Finance Admin Component
const FinanceAdminPage = () => {
  // Helper function to parse accountDetails if it's a string
  const parseAccountDetails = (accountDetails: string | object): any => {
    if (typeof accountDetails === 'string') {
      try {
        return JSON.parse(accountDetails);
      } catch {
        return {};
      }
    }
    return accountDetails;
  };

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Alert notification state
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  // Double-click prevention hooks
  const { isProcessing: isProcessingTransaction, withPreventDoubleClick: wrapTransactionAction } = usePreventDoubleClick({
    cooldownMs: 2000,
    onCooldownClick: () => setAlert({ message: 'Please wait, action is already being processed...', type: 'warning' })
  });

  const { isProcessing: isProcessingMethod, withPreventDoubleClick: wrapMethodAction } = usePreventDoubleClick({
    cooldownMs: 2000,
    onCooldownClick: () => setAlert({ message: 'Please wait, action is already being processed...', type: 'warning' })
  });
  
  // Data states
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [escrowTransactions, setEscrowTransactions] = useState<EscrowTransaction[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [wallets, setWallets] = useState<UserWallet[]>([]);
  const [methodRequests, setMethodRequests] = useState<WithdrawalMethodRequest[]>([]);

  // Pagination states
  const [paymentsPagination, setPaymentsPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [escrowPagination, setEscrowPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [withdrawalsPagination, setWithdrawalsPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [walletsPagination, setWalletsPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [methodRequestsPagination, setMethodRequestsPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Modal states
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [transactionType, setTransactionType] = useState<'payment' | 'escrow' | 'withdrawal'>('payment');
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedMethodRequest, setSelectedMethodRequest] = useState<WithdrawalMethodRequest | null>(null);
  const [showMethodRequestModal, setShowMethodRequestModal] = useState(false);

  // Data fetching functions
  const fetchPayments = useCallback(async (page = 1, limit = 10) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(dateRange.start && { startDate: dateRange.start }),
        ...(dateRange.end && { endDate: dateRange.end })
      });

      const response = await api.get(`/admin/payments?${params}`);
      if (response.data.success) {
        setPayments(response.data.data || []);
        if (response.data.pagination) {
          setPaymentsPagination(response.data.pagination);
        }
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError('Failed to fetch payment transactions');
    }
  }, [searchTerm, statusFilter, typeFilter, dateRange]);

  const fetchEscrowTransactions = useCallback(async (page = 1, limit = 10) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      const response = await api.get(`/admin/escrow?${params}`);
      if (response.data.success) {
        setEscrowTransactions(response.data.data || []);
        if (response.data.pagination) {
          setEscrowPagination(response.data.pagination);
        }
      }
    } catch (error) {
      console.error('Error fetching escrow transactions:', error);
    }
  }, [searchTerm, statusFilter]);

  const fetchWithdrawals = useCallback(async (page = 1, limit = 10) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      const response = await api.get(`/admin/withdrawals?${params}`);
      if (response.data.success) {
        setWithdrawalRequests(response.data.data || []);
        if (response.data.pagination) {
          setWithdrawalsPagination(response.data.pagination);
        }
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    }
  }, [searchTerm, statusFilter]);

  const fetchWallets = useCallback(async (page = 1, limit = 10) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await api.get(`/admin/wallets?${params}`);
      if (response.data.success) {
        setWallets(response.data.data || []);
        if (response.data.pagination) {
          setWalletsPagination(response.data.pagination);
        }
      }
    } catch (error) {
      console.error('Error fetching wallets:', error);
    }
  }, [searchTerm]);

  const fetchMethodRequests = useCallback(async (page = 1, limit = 10) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await api.get(`/transactions/withdrawal-methods/pending/all?${params}`);
      if (response.data.success) {
        setMethodRequests(response.data.data || []);
        if (response.data.pagination) { // Assume standard pagination response
          setMethodRequestsPagination(response.data.pagination);
        } else {
           // Fallback for sample/non-paginated response
           const total = response.data.total || response.data.data.length;
           const totalPages = Math.ceil(total / limit);
           setMethodRequestsPagination({
              page: page,
              limit: limit,
              total: total,
              totalPages: totalPages,
              hasNext: page < totalPages,
              hasPrev: page > 1
           });
        }
      }
    } catch (error) {
      console.error('Error fetching method requests:', error);
      setError('Failed to fetch pending withdrawal methods.');
    }
  }, [searchTerm]);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/admin/analytics');
      if (response.data.success && response.data.data) {
        setAnalyticsData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Calculate analytics from existing data if endpoint fails
      calculateAnalyticsFromData();
    }
  };

  const calculateAnalyticsFromData = () => {
    // Calculate analytics from the fetched transaction data
    const allTransactions = [...payments, ...escrowTransactions];
    const successfulTransactions = allTransactions.filter(t => 
      t.status === 'COMPLETED' || t.status === 'ACCEPTED'
    );
    const failedTransactions = allTransactions.filter(t => 
      t.status === 'FAILED' || t.status === 'REJECTED'
    );
    const pendingTransactions = allTransactions.filter(t => 
      t.status === 'PENDING' || t.status === 'PROCESSING'
    );

    const totalRevenue = successfulTransactions.reduce((sum, t) => sum + t.amount, 0);
    const avgTransactionValue = totalRevenue / Math.max(successfulTransactions.length, 1);

    // Calculate time-based revenues
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const monthlyRevenue = successfulTransactions
      .filter(t => new Date(t.createdAt) >= startOfMonth)
      .reduce((sum, t) => sum + t.amount, 0);

    const weeklyRevenue = successfulTransactions
      .filter(t => new Date(t.createdAt) >= startOfWeek)
      .reduce((sum, t) => sum + t.amount, 0);

    const dailyRevenue = successfulTransactions
      .filter(t => new Date(t.createdAt) >= startOfDay)
      .reduce((sum, t) => sum + t.amount, 0);

    const calculatedAnalytics: AnalyticsData = {
      revenue: {
        total: totalRevenue,
        monthly: monthlyRevenue,
        weekly: weeklyRevenue,
        daily: dailyRevenue,
        growth: 0 // Would need historical data to calculate
      },
      transactions: {
        total: allTransactions.length,
        successful: successfulTransactions.length,
        failed: failedTransactions.length,
        pending: pendingTransactions.length,
        averageValue: avgTransactionValue
      },
      users: {
        total: new Set(allTransactions.map(t => t.userId).filter(Boolean)).size,
        active: 0,
        new: 0,
        verified: 0
      },
      performance: {
        successRate: (successfulTransactions.length / Math.max(allTransactions.length, 1)) * 100,
        avgProcessingTime: 2.3,
        peakHour: 14,
        systemUptime: 99.98
      }
    };

    setAnalyticsData(calculatedAnalytics);
  };

  // Fetch all data on mount and tab change
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (activeTab === 'overview') {
          await Promise.all([
            fetchAnalytics(),
            fetchPayments(1, 5),
            fetchWithdrawals(1, 5),
            fetchMethodRequests(1, 5) // Also fetch recent method requests for overview
          ]);
        } else if (activeTab === 'transactions') {
          await fetchPayments(paymentsPagination.page, paymentsPagination.limit);
        } else if (activeTab === 'escrow') {
          await fetchEscrowTransactions(escrowPagination.page, escrowPagination.limit);
        } else if (activeTab === 'withdrawals') {
          await fetchWithdrawals(withdrawalsPagination.page, withdrawalsPagination.limit);
        } else if (activeTab === 'wallets') {
          await fetchWallets(walletsPagination.page, walletsPagination.limit);
        } else if (activeTab === 'method_requests') {
          await fetchMethodRequests(methodRequestsPagination.page, methodRequestsPagination.limit);
        } else if (activeTab === 'analytics') {
          await fetchPayments(1, 100); // Fetch more data for analytics
          await fetchAnalytics();
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  // Refetch when filters change
  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchPayments(paymentsPagination.page, paymentsPagination.limit);
    } else if (activeTab === 'escrow') {
      fetchEscrowTransactions(escrowPagination.page, escrowPagination.limit);
    } else if (activeTab === 'withdrawals') {
      fetchWithdrawals(withdrawalsPagination.page, withdrawalsPagination.limit);
    } else if (activeTab === 'wallets') {
      fetchWallets(walletsPagination.page, walletsPagination.limit);
    } else if (activeTab === 'method_requests') {
      fetchMethodRequests(methodRequestsPagination.page, methodRequestsPagination.limit);
    }
  }, [searchTerm, statusFilter, typeFilter, dateRange]);

  const handleTransactionAction = wrapTransactionAction(async (action: string, data?: any) => {
    try {
      let endpoint = '';
      let payload = {};

      switch (action) {
        case 'approve_payment':
          endpoint = `/admin/payments/${data.transactionId}/action`;
          payload = { action: 'approve' };
          break;
        case 'reject_payment':
          endpoint = `/admin/payments/${data.transactionId}/action`;
          payload = { action: 'reject' };
          break;
        case 'mark_resolved':
          endpoint = `/admin/payments/${data.transactionId}/action`;
          payload = { action: 'resolve' };
          break;
        case 'release_escrow':
          endpoint = `/admin/escrow/${data.transactionId}/release`;
          break;
        case 'refund_escrow':
          endpoint = `/admin/escrow/${data.transactionId}/refund`;
          break;
        case 'resolve_dispute':
          endpoint = `/admin/escrow/${data.transactionId}/dispute`;
          payload = { action: 'resolve' };
          break;
        case 'approve_withdrawal':
          endpoint = `/admin/withdrawals/${data.transactionId}/approve`;
          break;
        case 'reject_withdrawal':
          endpoint = `/admin/withdrawals/${data.transactionId}/reject`;
          break;
        default:
          console.warn(`Unknown action: ${action}`);
          return;
      }

      const response = await api.post(endpoint, payload);
      if (response.data.success) {
        setAlert({ message: 'Action completed successfully!', type: 'success' });
        // Refresh data after action
        if (data.type === 'payment') {
          await fetchPayments(paymentsPagination.page, paymentsPagination.limit);
        } else if (data.type === 'escrow') {
          await fetchEscrowTransactions(escrowPagination.page, escrowPagination.limit);
        } else if (data.type === 'withdrawal') {
          await fetchWithdrawals(withdrawalsPagination.page, withdrawalsPagination.limit);
        }
      }
    } catch (error) {
      console.error(`Action ${action} failed:`, error);
      setAlert({ message: `Action failed: ${error instanceof Error ? error.message : 'Unknown error'}`, type: 'error' });
      throw error;
    }
  });

  // Handlers for new Method Requests
  const handleApproveMethod = wrapMethodAction(async (id: string) => {
    try {
      // Check authentication
        const isAuthenticated = localStorage.getItem('authToken');

        if (!isAuthenticated) {
          window.location.assign('/auth');
          return;
        }
        api.setAuth(isAuthenticated);
      // Assuming adminId is handled by backend auth middleware
      const user: any = await api.get(`/auth/me`);
      if(!user.data.id) throw new Error('Failed to retrieve admin info');

      const adminId = user.data.id; // Replace with actual admin ID retrieval logic
      const response = await api.post(`/transactions/withdrawal-methods/${id}/approve`, {adminId: adminId});
      if (response.data.success) {
        setAlert({ message: 'Withdrawal method approved successfully!', type: 'success' });
        await fetchMethodRequests(methodRequestsPagination.page, methodRequestsPagination.limit);
      }
    } catch (error) {
      console.error('Failed to approve method:', error);
      setAlert({ message: 'Failed to approve method.', type: 'error' });
      setError('Failed to approve method.');
      throw error; // Re-throw to be caught by modal
    }
  });

  const handleRejectMethod = wrapMethodAction(async (id: string, reason: string) => {
    try {
      // Assuming adminId is handled by backend auth middleware
      const response = await api.post(`/transactions/withdrawal-methods/${id}/reject`, { reason });
      if (response.data.success) {
        setAlert({ message: 'Withdrawal method rejected successfully!', type: 'success' });
        await fetchMethodRequests(methodRequestsPagination.page, methodRequestsPagination.limit);
      }
    } catch (error) {
      console.error('Failed to reject method:', error);
      setAlert({ message: 'Failed to reject method.', type: 'error' });
      setError('Failed to reject method.');
      throw error; // Re-throw to be caught by modal
    }
  });

  const handleNotifyUser = async (transactionId: string, message: string) => {
    try {
      await api.post(`/admin/notifications/send`, {
        transactionId,
        message,
        type: 'transaction_update'
      });
      alert('Notification sent successfully');
    } catch (error) {
      console.error('Failed to send notification:', error);
      alert('Failed to send notification');
    }
  };

  const viewTransactionDetails = async (transaction: any, type: 'payment' | 'escrow' | 'withdrawal') => {
    try {
      // Fetch full details if needed
      let fullTransaction = transaction;
      
      if (type === 'payment' && !transaction.metadata) {
        const response = await api.get(`/admin/payments/${transaction.id}`);
        if (response.data.success) {
          fullTransaction = response.data.data;
        }
      }
      
      setSelectedTransaction(fullTransaction);
      setTransactionType(type);
      setShowTransactionModal(true);
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      setSelectedTransaction(transaction);
      setTransactionType(type);
      setShowTransactionModal(true);
    }
  };

  const viewMethodRequestDetails = (method: WithdrawalMethodRequest) => {
    setSelectedMethodRequest(method);
    setShowMethodRequestModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': case 'released': case 'approved': return 'bg-green-500/20 text-green-400';
      case 'processing': case 'funded': case 'accepted': return 'bg-blue-500/20 text-blue-400';
      case 'pending': case 'ready': return 'bg-yellow-500/20 text-yellow-400';
      case 'failed': case 'cancelled': case 'rejected': return 'bg-red-500/20 text-red-400';
      case 'refunded': return 'bg-purple-500/20 text-purple-400';
      case 'disputed': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const parseDestination = (destination: string | any) => {
    if (typeof destination === 'string') {
      try {
        return JSON.parse(destination);
      } catch (e) {
        return null;
      }
    }
    return destination;
  };

  const renderOverview = () => {
    // Show loading state if no analytics data
    if (!analyticsData) {
      // Calculate basic stats from available data
      const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
      const pendingWithdrawalsCount = withdrawalRequests.filter(w => w.status === 'PENDING').length;
      const failedPaymentsCount = payments.filter(p => p.status === 'FAILED').length;
      const pendingMethodsCount = methodRequests.length;
      
      return (
        <div className="space-y-8">
          {/* Basic stats without full analytics */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Quick Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="Transaction Volume" 
                value={totalPayments} 
                icon="bi-cash-stack" 
                iconBg="bg-green-500/20" 
                iconColor="text-green-400"
                subtitle="Total amount"
              />
              <StatCard 
                title="Pending Withdrawals" 
                value={pendingWithdrawalsCount} 
                icon="bi-clock" 
                iconBg="bg-yellow-500/20" 
                iconColor="text-yellow-400"
                subtitle="Needs approval"
              />
              <StatCard 
                title="Pending Methods" 
                value={pendingMethodsCount} 
                icon="bi-bank" 
                iconBg="bg-blue-500/20" 
                iconColor="text-blue-400"
                subtitle="Needs review"
              />
              <StatCard 
                title="Failed Payments" 
                value={failedPaymentsCount} 
                icon="bi-x-circle" 
                iconBg="bg-red-500/20" 
                iconColor="text-red-400"
                subtitle="Requires attention"
              />
            </div>
          </div>

          {/* Recent Activity Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Failed Payments */}
            <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <i className="bi bi-exclamation-triangle text-red-400"></i>
                Recent Failed Payments
              </h3>
              <div className="space-y-3">
                {payments.filter(p => p.status === 'FAILED').slice(0, 5).map(payment => (
                  <div key={payment.id} className="flex justify-between items-center p-3 bg-red-500/10 rounded-lg">
                    <div>
                      <p className="text-white text-sm font-medium">{payment.reference}</p>
                      <p className="text-white/60 text-xs">{formatDate(payment.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-red-400 font-medium">{formatCurrency(payment.amount, payment.currency)}</p>
                      <button
                        onClick={() => viewTransactionDetails(payment, 'payment')}
                        className="text-blue-400 hover:text-blue-300 text-xs"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
                {payments.filter(p => p.status === 'FAILED').length === 0 && (
                  <p className="text-white/40 text-center py-4">No failed payments</p>
                )}
              </div>
            </div>

            {/* Pending Withdrawals */}
            <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <i className="bi bi-clock-history text-yellow-400"></i>
                Pending Withdrawals
              </h3>
              <div className="space-y-3">
                {withdrawalRequests.filter(w => w.status === 'PENDING').slice(0, 5).map(withdrawal => (
                  <div key={withdrawal.id} className="flex justify-between items-center p-3 bg-yellow-500/10 rounded-lg">
                    <div>
                      <p className="text-white text-sm font-medium">{withdrawal.reference}</p>
                      <p className="text-white/60 text-xs">{withdrawal.userEmail || withdrawal.user?.email || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-yellow-400 font-medium">{formatCurrency(withdrawal.amount, withdrawal.currency)}</p>
                      <button
                        onClick={() => viewTransactionDetails(withdrawal, 'withdrawal')}
                        className="text-blue-400 hover:text-blue-300 text-xs"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                ))}
                {withdrawalRequests.filter(w => w.status === 'PENDING').length === 0 && (
                  <p className="text-white/40 text-center py-4">No pending withdrawals</p>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {/* Main Revenue Stats */}
        <div>
          <h3 className="text-white text-lg font-semibold mb-4">Revenue Analytics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Total Revenue" 
              value={analyticsData.revenue?.total || 0} 
              icon="bi-cash-stack" 
              iconBg="bg-green-500/20" 
              iconColor="text-green-400"
              subtitle="All time"
              trend={analyticsData.revenue?.growth}
            />
            <StatCard 
              title="Monthly Revenue" 
              value={analyticsData.revenue?.monthly || 0} 
              icon="bi-calendar-month" 
              iconBg="bg-blue-500/20" 
              iconColor="text-blue-400"
              subtitle="Current month"
            />
            <StatCard 
              title="Weekly Revenue" 
              value={analyticsData.revenue?.weekly || 0} 
              icon="bi-calendar-week" 
              iconBg="bg-purple-500/20" 
              iconColor="text-purple-400"
              subtitle="Current week"
            />
            <StatCard 
              title="Daily Revenue" 
              value={analyticsData.revenue?.daily || 0} 
              icon="bi-calendar-day" 
              iconBg="bg-orange-500/20" 
              iconColor="text-orange-400"
              subtitle="Today"
            />
          </div>
        </div>

        {/* Transaction Stats */}
        <div>
          <h3 className="text-white text-lg font-semibold mb-4">Transaction Overview</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatCard 
              title="Total Transactions" 
              value={(analyticsData.transactions?.total || 0).toLocaleString()} 
              icon="bi-receipt" 
              iconBg="bg-indigo-500/20" 
              iconColor="text-indigo-400"
              subtitle="All time"
            />
            <StatCard 
              title="Successful" 
              value={(analyticsData.transactions?.successful || 0).toLocaleString()} 
              icon="bi-check-circle" 
              iconBg="bg-green-500/20" 
              iconColor="text-green-400"
              subtitle={`${((analyticsData.transactions?.successful || 0) / Math.max(analyticsData.transactions?.total || 1, 1) * 100).toFixed(1)}% rate`}
            />
            <StatCard 
              title="Failed" 
              value={(analyticsData.transactions?.failed || 0).toLocaleString()} 
              icon="bi-x-circle" 
              iconBg="bg-red-500/20" 
              iconColor="text-red-400"
              subtitle={`${((analyticsData.transactions?.failed || 0) / Math.max(analyticsData.transactions?.total || 1, 1) * 100).toFixed(1)}% rate`}
            />
            <StatCard 
              title="Pending" 
              value={(analyticsData.transactions?.pending || 0).toLocaleString()} 
              icon="bi-clock" 
              iconBg="bg-yellow-500/20" 
              iconColor="text-yellow-400"
              subtitle="Needs action"
            />
            <StatCard 
              title="Avg Transaction" 
              value={formatCurrency(analyticsData.transactions?.averageValue || 0)} 
              icon="bi-graph-up" 
              iconBg="bg-cyan-500/20" 
              iconColor="text-cyan-400"
              subtitle="Per transaction"
            />
          </div>
        </div>

        {/* Recent Activity Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Method Requests */}
          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <i className="bi bi-bank text-blue-400"></i>
              Pending Method Requests
            </h3>
            <div className="space-y-3">
              {methodRequests.slice(0, 5).map(method => {
                const details = parseAccountDetails(method.accountDetails);
                return (
                <div key={method.id} className="flex justify-between items-center p-3 bg-blue-500/10 rounded-lg">
                  <div>
                    <p className="text-white text-sm font-medium">{details.providerName}</p>
                    <p className="text-white/60 text-xs">{method.user?.email || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-400 font-medium">{method.accountName}</p>
                    <button
                      onClick={() => viewMethodRequestDetails(method)}
                      className="text-blue-400 hover:text-blue-300 text-xs"
                    >
                      Review
                    </button>
                  </div>
                </div>
                );
              })}
              {methodRequests.length === 0 && (
                <p className="text-white/40 text-center py-4">No pending method requests</p>
              )}
            </div>
          </div>

          {/* Pending Withdrawals */}
          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <i className="bi bi-clock-history text-yellow-400"></i>
              Pending Withdrawals
            </h3>
            <div className="space-y-3">
              {withdrawalRequests.filter(w => w.status === 'PENDING').slice(0, 5).map(withdrawal => (
                <div key={withdrawal.id} className="flex justify-between items-center p-3 bg-yellow-500/10 rounded-lg">
                  <div>
                    <p className="text-white text-sm font-medium">{withdrawal.reference}</p>
                    <p className="text-white/60 text-xs">{withdrawal.userEmail || withdrawal.user?.email || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-yellow-400 font-medium">{formatCurrency(withdrawal.amount, withdrawal.currency)}</p>
                    <button
                      onClick={() => viewTransactionDetails(withdrawal, 'withdrawal')}
                      className="text-blue-400 hover:text-blue-300 text-xs"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))}
              {withdrawalRequests.filter(w => w.status === 'PENDING').length === 0 && (
                <p className="text-white/40 text-center py-4">No pending withdrawals</p>
              )}
            </div>
          </div>
        </div>

        {/* System Performance */}
        {analyticsData.performance && (
          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">System Performance</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-white/60 text-sm">Success Rate</p>
                <p className="text-white text-2xl font-bold">{analyticsData.performance.successRate.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Avg Processing Time</p>
                <p className="text-white text-2xl font-bold">{analyticsData.performance.avgProcessingTime}s</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Peak Hour</p>
                <p className="text-white text-2xl font-bold">{analyticsData.performance.peakHour}:00</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">System Uptime</p>
                <p className="text-white text-2xl font-bold">{analyticsData.performance.systemUptime}%</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTransactionTable = (
    data: PaymentTransaction[],
    pagination: PaginationInfo,
    onPageChange: (page: number) => void,
    onLimitChange: (limit: number) => void
  ) => {
    if (data.length === 0 && !loading) {
      return (
        <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-slate-700/50 rounded-lg p-12 text-center">
          <i className="bi bi-database text-6xl text-white/20 mb-4"></i>
          <p className="text-white/60 text-lg">No transactions found</p>
        </div>
      );
    }

    return (
      <>
        <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-slate-700/50 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/60 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white/80">Transaction ID</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white/80">User</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white/80">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white/80">Provider</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white/80">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white/80">Date</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-white/80">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {data.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-slate-800/30">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-white font-mono text-xs">{transaction.id}</div>
                        <div className="text-white/60 text-xs mt-1">{transaction.reference}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-white text-sm">
                          {transaction.userName || transaction.userEmail || `User ${transaction.userId}` || 'Guest'}
                        </div>
                        {transaction.payerPhone && (
                          <div className="text-white/60 text-xs">{transaction.payerPhone}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white font-bold">
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </div>
                      {transaction.metadata?.originalAmountUSD && (
                        <div className="text-white/60 text-xs">
                          ${transaction.metadata.originalAmountUSD} USD
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-white text-sm">{transaction.provider}</div>
                        {transaction.correspondent && (
                          <div className="text-white/60 text-xs">{transaction.correspondent}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                      {transaction.failureReason && (
                        <div className="text-red-400 text-xs mt-1" title={transaction.failureReason}>
                          <i className="bi bi-exclamation-triangle"></i> Failed
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-white/70 text-sm">
                      {formatDate(transaction.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => viewTransactionDetails(transaction, 'payment')}
                        className="text-blue-400 hover:text-blue-300 p-1"
                        title="View Details"
                      >
                        <i className="bi bi-eye text-lg"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <Pagination
          pagination={pagination}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
          limitOptions={[10, 20, 50, 100]}
        />
      </>
    );
  };

  if (loading && activeTab === 'overview') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p>Loading financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] border border-slate-700/50 p-8 mb-8 rounded-2xl shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Financial Management</h1>
              <p className="text-white/70 text-lg">Monitor and manage all financial operations</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (activeTab === 'overview') {
                    fetchAnalytics();
                    fetchPayments(1, 5);
                    fetchWithdrawals(1, 5);
                    fetchMethodRequests(1, 5);
                  } else if (activeTab === 'transactions') {
                    fetchPayments(paymentsPagination.page, paymentsPagination.limit);
                  } else if (activeTab === 'withdrawals') {
                    fetchWithdrawals(withdrawalsPagination.page, withdrawalsPagination.limit);
                  } else if (activeTab === 'wallets') {
                    fetchWallets(walletsPagination.page, walletsPagination.limit);
                  } else if (activeTab === 'method_requests') {
                    fetchMethodRequests(methodRequestsPagination.page, methodRequestsPagination.limit);
                  }
                }}
                className="bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
              >
                <i className="bi bi-arrow-clockwise text-lg"></i>
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] border border-slate-700/50 rounded-lg mb-6 p-4">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'overview', label: 'Overview', icon: 'bi-bar-chart' },
              { key: 'transactions', label: 'Transactions', icon: 'bi-credit-card', count: paymentsPagination.total },
              { key: 'withdrawals', label: 'Withdrawals', icon: 'bi-arrow-up-circle', count: withdrawalRequests.filter(w => w.status === 'PENDING').length },
              { key: 'wallets', label: 'Wallets', icon: 'bi-wallet2' },
              { key: 'method_requests', label: 'Method Requests', icon: 'bi-bank', count: methodRequestsPagination.total },
              { key: 'analytics', label: 'Revenue Analytics', icon: 'bi-graph-up' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-md text-sm flex items-center gap-2 relative ${
                  activeTab === tab.key 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-700 hover:bg-slate-600 text-white/80'
                }`}
              >
                <i className={tab.icon}></i>
                {tab.label}
                {tab.count && tab.count > 0 ? (
                  <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {tab.count}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {/* Filters (shown for non-overview tabs) */}
        {activeTab !== 'overview' && activeTab !== 'analytics' && (
          <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] border border-slate-700/50 rounded-lg mb-6 p-4">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                <div className="relative w-full sm:w-auto">
                  <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-white/40"></i>
                  <input
                    type="text"
                    placeholder="Search by user, email, ref..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-800/60 border border-slate-700 rounded-md pl-10 pr-4 py-2 w-full sm:w-64 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {activeTab !== 'wallets' && activeTab !== 'method_requests' && (
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ACCEPTED">Accepted</option>
                    <option value="FAILED">Failed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                )}

                {activeTab === 'transactions' && (
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="DEPOSIT">Deposit</option>
                    <option value="WITHDRAWAL">Withdrawal</option>
                    <option value="PAYOUT">Payout</option>
                    <option value="REFUND">Refund</option>
                  </select>
                )}
              </div>
              
              {activeTab !== 'wallets' && activeTab !== 'method_requests' && (
                <div className="flex items-center gap-2">
                  <span className="text-white/60 text-sm">Date Range:</span>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="bg-slate-800/60 border border-slate-700 rounded px-2 py-1 text-white text-sm"
                  />
                  <span className="text-white/60">-</span>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="bg-slate-800/60 border border-slate-700 rounded px-2 py-1 text-white text-sm"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-8">
          {activeTab === 'overview' && renderOverview()}
          
          {activeTab === 'transactions' && (
            <>
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <p className="text-white/60 mt-2">Loading transactions...</p>
                </div>
              ) : (
                renderTransactionTable(
                  payments,
                  paymentsPagination,
                  (page) => fetchPayments(page, paymentsPagination.limit),
                  (limit) => {
                    setPaymentsPagination(prev => ({ ...prev, limit }));
                    fetchPayments(1, limit);
                  }
                )
              )}
            </>
          )}
          
          {activeTab === 'withdrawals' && (
            <>
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <p className="text-white/60 mt-2">Loading withdrawals...</p>
                </div>
              ) : (
                <>
                  {withdrawalRequests.length === 0 && !loading ? (
                    <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-slate-700/50 rounded-lg p-12 text-center">
                      <i className="bi bi-arrow-up-circle text-6xl text-white/20 mb-4"></i>
                      <p className="text-white/60 text-lg">No withdrawal requests found</p>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-slate-700/50 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-slate-800/60 border-b border-slate-700">
                            <tr>
                              <th className="px-6 py-4 text-left text-sm font-medium text-white/80">Request ID</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-white/80">User</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-white/80">Amount</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-white/80">Method</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-white/80">Destination</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-white/80">Status</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-white/80">Requested</th>
                              <th className="px-6 py-4 text-center text-sm font-medium text-white/80">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700">
                            {withdrawalRequests.map((withdrawal) => (
                              <tr key={withdrawal.id} className="hover:bg-slate-800/30">
                                <td className="px-6 py-4">
                                  <div>
                                    <div className="text-white font-mono text-xs">{withdrawal.id}</div>
                                    <div className="text-white/60 text-xs mt-1">{withdrawal.reference}</div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div>
                                    <div className="text-white text-sm">
                                      {withdrawal.userName || (withdrawal.user ? `${withdrawal.user.firstName} ${withdrawal.user.lastName}` : `User ${withdrawal.userId}`)}
                                    </div>
                                    {(withdrawal.userEmail || withdrawal.user?.email) && (
                                      <div className="text-white/60 text-xs">{withdrawal.userEmail || withdrawal.user?.email}</div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-white font-bold">
                                    {formatCurrency(withdrawal.amount, withdrawal.currency)}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-white text-sm capitalize">
                                    {withdrawal.method.replace(/_/g, ' ')}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  {(() => {
                                    const dest = parseDestination(withdrawal.destination);
                                    return (
                                      <>
                                        <div className="text-white text-sm">
                                          {dest?.accountNumber || dest?.phoneNumber || dest?.email || 'N/A'}
                                        </div>
                                        {(dest?.providerName || dest?.bankName) && (
                                          <div className="text-white/60 text-xs">{dest.providerName || dest.bankName}</div>
                                        )}
                                      </>
                                    );
                                  })()}
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(withdrawal.status)}`}>
                                    {withdrawal.status}
                                  </span>
                                  {withdrawal.failureReason && (
                                    <div className="text-red-400 text-xs mt-1" title={withdrawal.failureReason}>
                                      <i className="bi bi-exclamation-triangle"></i> Failed
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-white/70 text-sm">
                                  {formatDate(withdrawal.createdAt)}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => viewTransactionDetails(withdrawal, 'withdrawal')}
                                      className="text-blue-400 hover:text-blue-300 p-1"
                                      title="View Details"
                                    >
                                      <i className="bi bi-eye text-lg"></i>
                                    </button>
                                    {withdrawal.status === 'PENDING' && (
                                      <>
                                        <button
                                          onClick={() => handleTransactionAction('approve_withdrawal', { transactionId: withdrawal.id, type: 'withdrawal' })}
                                          className={`text-green-400 hover:text-green-300 p-1 ${isProcessingTransaction ? 'opacity-50 cursor-not-allowed' : ''}`}
                                          title="Approve"
                                          disabled={isProcessingTransaction}
                                        >
                                          {isProcessingTransaction ? (
                                            <i className="bi bi-hourglass-split text-lg animate-spin"></i>
                                          ) : (
                                            <i className="bi bi-check-circle text-lg"></i>
                                          )}
                                        </button>
                                        <button
                                          onClick={() => handleTransactionAction('reject_withdrawal', { transactionId: withdrawal.id, type: 'withdrawal' })}
                                          className={`text-red-400 hover:text-red-300 p-1 ${isProcessingTransaction ? 'opacity-50 cursor-not-allowed' : ''}`}
                                          title="Reject"
                                          disabled={isProcessingTransaction}
                                        >
                                          {isProcessingTransaction ? (
                                            <i className="bi bi-hourglass-split text-lg animate-spin"></i>
                                          ) : (
                                            <i className="bi bi-x-circle text-lg"></i>
                                          )}
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  <Pagination
                    pagination={withdrawalsPagination}
                    onPageChange={(page) => fetchWithdrawals(page, withdrawalsPagination.limit)}
                    onLimitChange={(limit) => {
                      setWithdrawalsPagination(prev => ({ ...prev, limit }));
                      fetchWithdrawals(1, limit);
                    }}
                  />
                </>
              )}
            </>
          )}
          
          {activeTab === 'wallets' && (
            <>
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <p className="text-white/60 mt-2">Loading wallets...</p>
                </div>
              ) : (
                <>
                  {/* Wallet Summary Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <StatCard 
                      title="Total Wallets" 
                      value={walletsPagination.total} 
                      icon="bi-wallet2" 
                      iconBg="bg-blue-500/20" 
                      iconColor="text-blue-400"
                      subtitle="All user wallets"
                    />
                    <StatCard 
                      title="Active Wallets" 
                      value={wallets.filter(w => w.isActive).length} // Note: This only counts loaded wallets
                      icon="bi-check-circle" 
                      iconBg="bg-green-500/20" 
                      iconColor="text-green-400"
                      subtitle="Currently active"
                    />
                    <StatCard 
                      title="Total Balance" 
                      value={wallets.reduce((sum, w) => sum + w.balance, 0)} // Note: Only for loaded wallets
                      icon="bi-cash-stack" 
                      iconBg="bg-yellow-500/20" 
                      iconColor="text-yellow-400"
                      subtitle="Across loaded wallets"
                    />
                    <StatCard 
                      title="Verified Wallets" 
                      value={wallets.filter(w => w.isVerified).length} // Note: Only for loaded wallets
                      icon="bi-shield-check" 
                      iconBg="bg-purple-500/20" 
                      iconColor="text-purple-400"
                      subtitle="KYC verified"
                    />
                  </div>

                  {wallets.length === 0 && !loading ? (
                    <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-slate-700/50 rounded-lg p-12 text-center">
                      <i className="bi bi-wallet2 text-6xl text-white/20 mb-4"></i>
                      <p className="text-white/60 text-lg">No wallets found</p>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-slate-700/50 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-slate-800/60 border-b border-slate-700">
                            <tr>
                              <th className="px-6 py-4 text-left text-sm font-medium text-white/80">Wallet ID</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-white/80">User</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-white/80">Account Number</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-white/80">Balance</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-white/80">Status</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-white/80">Verification</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-white/80">Created</th>
                              <th className="px-6 py-4 text-center text-sm font-medium text-white/80">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700">
                            {wallets.map((wallet) => (
                              <tr key={wallet.id} className="hover:bg-slate-800/30">
                                <td className="px-6 py-4">
                                  <div className="text-white font-mono text-xs">{wallet.id}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <div>
                                    <div className="text-white text-sm">
                                      {wallet.user ? `${wallet.user.firstName} ${wallet.user.lastName}` : `User ${wallet.userId}`}
                                    </div>
                                    {wallet.user?.email && (
                                      <div className="text-white/60 text-xs">{wallet.user.email}</div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-white font-mono text-sm">
                                    {wallet.accountNumber || 'N/A'}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-white font-bold text-lg">
                                    {formatCurrency(wallet.balance, wallet.currency)}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    wallet.isActive 
                                      ? 'bg-green-500/20 text-green-400'
                                      : 'bg-red-500/20 text-red-400'
                                  }`}>
                                    {wallet.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    {wallet.isVerified ? (
                                      <span className="bg-blue-500/20 text-blue-400 px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1">
                                        <i className="bi bi-check-circle"></i>
                                        Verified
                                      </span>
                                    ) : (
                                      <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1">
                                        <i className="bi bi-clock"></i>
                                        Pending
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-white/70 text-sm">
                                  {formatDate(wallet.createdAt)}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      className="text-blue-400 hover:text-blue-300 p-1"
                                      title="View Details"
                                      // onClick={() => {/* TODO: Implement Wallet Details View */}}
                                    >
                                      <i className="bi bi-eye text-lg"></i>
                                    </button>
                                    <button
                                      className="text-yellow-400 hover:text-yellow-300 p-1"
                                      title="Adjust Balance"
                                      // onClick={() => {/* TODO: Implement Balance Adjustment */}}
                                    >
                                      <i className="bi bi-pencil text-lg"></i>
                                    </button>
                                    {!wallet.isActive && (
                                      <button
                                        className="text-green-400 hover:text-green-300 p-1"
                                        title="Activate"
                                        // onClick={() => {/* TODO: Implement Wallet Activation */}}
                                      >
                                        <i className="bi bi-toggle-off text-lg"></i>
                                      </button>
                                    )}
                                    {wallet.isActive && (
                                      <button
                                        className="text-red-400 hover:text-red-300 p-1"
                                        title="Deactivate"
                                        // onClick={() => {/* TODO: Implement Wallet Deactivation */}}
                                      >
                                        <i className="bi bi-toggle-on text-lg"></i>
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
                  )}
                  <Pagination
                    pagination={walletsPagination}
                    onPageChange={(page) => fetchWallets(page, walletsPagination.limit)}
                    onLimitChange={(limit) => {
                      setWalletsPagination(prev => ({ ...prev, limit }));
                      fetchWallets(1, limit);
                    }}
                  />
                </>
              )}
            </>
          )}

          {activeTab === 'method_requests' && (
            <>
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <p className="text-white/60 mt-2">Loading method requests...</p>
                </div>
              ) : (
                <>
                  {methodRequests.length === 0 && !loading ? (
                    <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-slate-700/50 rounded-lg p-12 text-center">
                      <i className="bi bi-bank text-6xl text-white/20 mb-4"></i>
                      <p className="text-white/60 text-lg">No pending withdrawal method requests found</p>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-slate-700/50 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-slate-800/60 border-b border-slate-700">
                            <tr>
                              <th className="px-6 py-4 text-left text-sm font-medium text-white/80">Request ID</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-white/80">User</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-white/80">Method Type</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-white/80">Provider</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-white/80">Account Name</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-white/80">Account Number</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-white/80">Requested</th>
                              <th className="px-6 py-4 text-center text-sm font-medium text-white/80">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700">
                            {methodRequests.map((method) => {
                              const details = parseAccountDetails(method.accountDetails);
                              return (
                              <tr key={method.id} className="hover:bg-slate-800/30">
                                <td className="px-6 py-4">
                                  <div className="text-white font-mono text-xs">{method.id}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <div>
                                    <div className="text-white text-sm">
                                      {`${method.user.firstName} ${method.user.lastName}`}
                                    </div>
                                    <div className="text-white/60 text-xs">{method.user.email}</div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-white text-sm capitalize">
                                    {method.methodType.replace(/_/g, ' ')}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-white text-sm">{details.providerName}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-white text-sm">{method.accountName}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-white font-mono text-sm">{details.accountNumber}</span>
                                </td>
                                <td className="px-6 py-4 text-white/70 text-sm">
                                  {formatDate(method.createdAt)}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => viewMethodRequestDetails(method)}
                                      className="text-blue-400 hover:text-blue-300 p-1"
                                      title="View & Action"
                                    >
                                      <i className="bi bi-pencil-square text-lg"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  <Pagination
                    pagination={methodRequestsPagination}
                    onPageChange={(page) => fetchMethodRequests(page, methodRequestsPagination.limit)}
                    onLimitChange={(limit) => {
                      setMethodRequestsPagination(prev => ({ ...prev, limit }));
                      fetchMethodRequests(1, limit);
                    }}
                  />
                </>
              )}
            </>
          )}
          
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Revenue Overview Cards */}
              <div>
                <h3 className="text-white text-xl font-bold mb-4">Revenue Analytics Overview</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard 
                    title="Total Revenue" 
                    value={analyticsData?.revenue?.total || payments.filter(p => p.status === 'COMPLETED' || p.status === 'ACCEPTED').reduce((sum, p) => sum + p.amount, 0)} 
                    icon="bi-cash-stack" 
                    iconBg="bg-green-500/20" 
                    iconColor="text-green-400"
                    subtitle="All time earnings"
                    trend={analyticsData?.revenue?.growth}
                  />
                  <StatCard 
                    title="Platform Fees" 
                    value={payments.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + (p.platformFee || 0), 0)} 
                    icon="bi-percent" 
                    iconBg="bg-blue-500/20" 
                    iconColor="text-blue-400"
                    subtitle="Total collected"
                  />
                  <StatCard 
                    title="Processing Fees" 
                    value={payments.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + (p.charges || 0), 0)} 
                    icon="bi-credit-card" 
                    iconBg="bg-purple-500/20" 
                    iconColor="text-purple-400"
                    subtitle="Payment charges"
                  />
                  <StatCard 
                    title="Net Revenue" 
                    value={payments.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + (p.netAmount || p.amount) - (p.charges || 0) - (p.platformFee || 0), 0)} 
                    icon="bi-graph-up-arrow" 
                    iconBg="bg-cyan-500/20" 
                    iconColor="text-cyan-400"
                    subtitle="After fees"
                  />
                </div>
              </div>

              {/* Transaction Analytics */}
              <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-white text-lg font-semibold mb-4">Transaction Analytics</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <p className="text-white/60 text-sm">Success Rate</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-white text-2xl font-bold">
                        {((payments.filter(p => p.status === 'COMPLETED' || p.status === 'ACCEPTED').length / Math.max(payments.length, 1)) * 100).toFixed(1)}%
                      </p>
                      {/* Placeholder trend */}
                      <span className="text-green-400 text-sm">
                        <i className="bi bi-arrow-up"></i> 0.0%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Average Transaction</p>
                    <p className="text-white text-2xl font-bold">
                      {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0) / Math.max(payments.length, 1))}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Failed Rate</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-white text-2xl font-bold">
                        {((payments.filter(p => p.status === 'FAILED').length / Math.max(payments.length, 1)) * 100).toFixed(1)}%
                      </p>
                      {/* Placeholder trend */}
                      <span className="text-red-400 text-sm">
                        <i className="bi bi-arrow-down"></i> 0.0%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Refund Rate</p>
                    <p className="text-white text-2xl font-bold">
                      {((payments.filter(p => p.isRefund).length / Math.max(payments.length, 1)) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
                 {/* Placeholder for Charts */}
                 <div className="mt-8 h-64 bg-slate-800/40 rounded-lg flex items-center justify-center">
                   <p className="text-white/40">Revenue & Transaction Charts Placeholder</p>
                 </div>
              </div>

              {/* Provider Performance */}
              <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-white text-lg font-semibold mb-4">Payment Provider Performance</h3>
                <div className="space-y-4">
                  {Array.from(new Set(payments.map(p => p.provider))).filter(Boolean).map(provider => {
                    const providerPayments = payments.filter(p => p.provider === provider);
                    const successful = providerPayments.filter(p => p.status === 'COMPLETED' || p.status === 'ACCEPTED');
                    const failed = providerPayments.filter(p => p.status === 'FAILED');
                    const totalVolume = providerPayments.reduce((sum, p) => sum + p.amount, 0);
                    const successRate = (successful.length / Math.max(providerPayments.length, 1)) * 100;
                    
                    return (
                      <div key={provider} className="flex items-center justify-between p-4 bg-slate-800/40 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-white font-semibold">{provider}</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              successRate >= 95 ? 'bg-green-500/20 text-green-400' :
                              successRate >= 85 ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {successRate.toFixed(1)}% Success
                            </span>
                          </div>
                          <div className="mt-2 text-white/60 text-sm">
                            {providerPayments.length} transactions • {formatCurrency(totalVolume)} volume
                          </div>
                          <div className="mt-2 flex items-center gap-4 text-xs">
                            <span className="text-green-400">
                              <i className="bi bi-check-circle"></i> {successful.length} successful
                            </span>
                            <span className="text-red-400">
                              <i className="bi bi-x-circle"></i> {failed.length} failed
                            </span>
                            <span className="text-yellow-400">
                              <i className="bi bi-clock"></i> {providerPayments.filter(p => p.status === 'PENDING').length} pending
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white text-xl font-bold">{formatCurrency(totalVolume)}</p>
                          <p className="text-white/60 text-xs">Total Volume</p>
                        </div>
                      </div>
                    );
                  })}
                  {Array.from(new Set(payments.map(p => p.provider))).filter(Boolean).length === 0 && (
                    <p className="text-white/40 text-center py-4">No payment provider data available</p>
                  )}
                </div>
              </div>

              {/* Country Analytics */}
              <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-white text-lg font-semibold mb-4">Geographic Distribution</h3>
                <div className="space-y-3">
                  {Array.from(new Set(payments.map(p => p.country).filter(Boolean)))
                    .map(country => {
                      const countryPayments = payments.filter(p => p.country === country);
                      const volume = countryPayments.reduce((sum, p) => sum + p.amount, 0);
                      const percentage = (countryPayments.length / Math.max(payments.length, 1)) * 100;
                      
                      return {
                        country,
                        transactions: countryPayments.length,
                        volume,
                        percentage
                      };
                    })
                    .sort((a, b) => b.volume - a.volume)
                    .slice(0, 10)
                    .map((item, index) => (
                      <div key={item.country} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-white/60 font-mono text-sm">#{index + 1}</span>
                          <div>
                            <p className="text-white font-medium">{item.country || 'Unknown'}</p>
                            <p className="text-white/60 text-xs">
                              {item.transactions} transactions • {item.percentage.toFixed(1)}% of total
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">{formatCurrency(item.volume)}</p>
                          <p className="text-white/60 text-xs">Total Volume</p>
                        </div>
                      </div>
                    ))}
                  {Array.from(new Set(payments.map(p => p.country).filter(Boolean))).length === 0 && (
                    <p className="text-white/40 text-center py-4">No geographic data available</p>
                  )}
                </div>
              </div>

              {/* Monthly Trends */}
              <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-white text-lg font-semibold mb-4">Monthly Transaction Trends</h3>
                <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
                  {[...Array(6)].map((_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - (5 - i));
                    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
                    
                    // Filter transactions for this month
                    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
                    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                    const monthTransactions = payments.filter(p => {
                      const pDate = new Date(p.createdAt);
                      return pDate >= monthStart && pDate <= monthEnd;
                    });
                    const monthVolume = monthTransactions.reduce((sum, p) => sum + p.amount, 0);
                    
                    return (
                      <div key={i} className="bg-slate-800/40 rounded-lg p-4 text-center">
                        <p className="text-white/60 text-sm mb-1">{monthName}</p>
                        <p className="text-white text-lg font-bold">{monthTransactions.length}</p>
                        <p className="text-white/60 text-xs">transactions</p>
                        <p className="text-blue-400 text-sm font-semibold mt-2">
                          {formatCurrency(monthVolume)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-white text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <button className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg text-white flex items-center gap-2 justify-center">
                    <i className="bi bi-file-earmark-arrow-down"></i>
                    Export Report
                  </button>
                  <button className="bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-lg text-white flex items-center gap-2 justify-center">
                    <i className="bi bi-calendar-range"></i>
                    Schedule Report
                  </button>
                  <button className="bg-green-600 hover:bg-green-700 px-4 py-3 rounded-lg text-white flex items-center gap-2 justify-center">
                    <i className="bi bi-envelope"></i>
                    Email Summary
                  </button>
                  <button className="bg-orange-600 hover:bg-orange-700 px-4 py-3 rounded-lg text-white flex items-center gap-2 justify-center">
                    <i className="bi bi-gear"></i>
                    Configure Alerts
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Transaction Details Modal */}
        {showTransactionModal && (
          <TransactionDetailsModal
            transaction={selectedTransaction}
            type={transactionType}
            onClose={() => setShowTransactionModal(false)}
            onAction={handleTransactionAction}
            onNotifyUser={handleNotifyUser}
          />
        )}

        {/* Method Request Modal */}
        {showMethodRequestModal && (
          <MethodRequestModal
            method={selectedMethodRequest}
            onClose={() => setShowMethodRequestModal(false)}
            onApprove={handleApproveMethod}
            onReject={handleRejectMethod}
          />
        )}

        {/* Alert Notification */}
        {alert && (
          <AlertNotification
            message={alert.message}
            type={alert.type}
            onClose={() => setAlert(null)}
          />
        )}
      </div>
    </div>
  );
};

export default FinanceAdminPage;