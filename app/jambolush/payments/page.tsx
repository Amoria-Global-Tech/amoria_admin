"use client";
import React, { useState, useEffect, useMemo } from 'react';
import api from '@/app/api/conn';

// Types based on your actual backend models
interface PaymentTransaction {
  id: string;
  userId: number;
  type: string;
  method: string;
  amount: number;
  currency: string;
  status: string;
  reference: string;
  externalId?: string;
  jengaTransactionId?: string;
  description?: string;
  metadata?: any;
  charges?: number;
  netAmount?: number;
  sourceAccount?: string;
  destinationAccount?: string;
  phoneNumber?: string;
  bankCode?: string;
  accountName?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  user?: {
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
  amount: number;
  currency: string;
  method: string;
  status: string;
  destination: any;
  pesapalPayoutId?: string;
  reference: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
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

interface FinancialStats {
  totalTransactions: number;
  totalVolume: number;
  totalEscrowHeld: number;
  totalWithdrawals: number;
  totalCommissions: number;
  averageTransactionSize: number;
  transactionsToday: number;
  volumeToday: number;
  pendingWithdrawals: number;
  activeWallets: number;
}

function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", 
                    "Aug", "Sep", "Oct", "Nov", "Dec"];
    const year = date.getFullYear();
    const month = months[date.getMonth()];
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    
    return `${month} ${day}, ${year} ${hours}:${minutes}`;
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
          {typeof value === 'number' && (title.includes('Volume') || title.includes('Commission') || title.includes('Held') || title.includes('Withdrawal')) 
            ? formatCurrency(value) 
            : value}
        </p>
        {subtitle && <p className="text-white/50 text-xs mt-1">{subtitle}</p>}
      </div>
      <div className={`${iconBg} p-3 rounded-xl`}>
        <i className={`bi ${icon} ${iconColor} text-xl`}></i>
      </div>
    </div>
  </div>
);

// Transaction Details Modal
const TransactionDetailsModal = ({ transaction, type, onClose, onAction }: {
  transaction: PaymentTransaction | EscrowTransaction | WithdrawalRequest | null;
  type: 'payment' | 'escrow' | 'withdrawal';
  onClose: () => void;
  onAction: (action: string, data?: any) => void;
}) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  if (!transaction) return null;

  const handleAction = async (action: string, data?: any) => {
    setActionLoading(action);
    try {
      await onAction(action, { ...data, transactionId: transaction.id, type });
    } catch (error) {
      console.error(`Action ${action} failed:`, error);
    }
    setActionLoading(null);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': case 'released': return 'bg-green-500/20 text-green-400';
      case 'processing': case 'held': return 'bg-blue-500/20 text-blue-400';
      case 'pending': case 'ready': return 'bg-yellow-500/20 text-yellow-400';
      case 'failed': case 'cancelled': return 'bg-red-500/20 text-red-400';
      case 'refunded': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getUserName = (user?: any) => {
    if (!user) return 'N/A';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || `User ${user.id}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-slate-700 rounded-lg shadow-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            {type === 'payment' ? 'Payment Transaction' : 
             type === 'escrow' ? 'Escrow Transaction' : 
             'Withdrawal Request'} Details
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <i className="bi bi-x-lg text-xl"></i>
          </button>
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/5 rounded-lg p-4 space-y-3">
              <h3 className="text-white font-semibold mb-3">Transaction Info</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/60">ID</span>
                  <span className="text-white font-medium">{transaction.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Reference</span>
                  <span className="text-white font-medium">{transaction.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Status</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                    {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Amount</span>
                  <span className="text-white font-bold text-lg">
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </span>
                </div>
                {type === 'payment' && (transaction as PaymentTransaction).netAmount && (
                  <div className="flex justify-between">
                    <span className="text-white/60">Net Amount</span>
                    <span className="text-green-400 font-medium">
                      {formatCurrency((transaction as PaymentTransaction).netAmount!, transaction.currency)}
                    </span>
                  </div>
                )}
                {type === 'payment' && (transaction as PaymentTransaction).charges && (
                  <div className="flex justify-between">
                    <span className="text-white/60">Charges</span>
                    <span className="text-red-400 font-medium">
                      {formatCurrency((transaction as PaymentTransaction).charges!, transaction.currency)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4 space-y-3">
              <h3 className="text-white font-semibold mb-3">User Info</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/60">User ID</span>
                  <span className="text-white font-medium">{transaction.userId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Name</span>
                  <span className="text-white font-medium">
                    {getUserName(transaction.user)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Email</span>
                  <span className="text-white font-medium">
                    {transaction.user?.email || 'N/A'}
                  </span>
                </div>
                {type === 'payment' && (
                  <div className="flex justify-between">
                    <span className="text-white/60">Method</span>
                    <span className="text-white font-medium capitalize">
                      {(transaction as PaymentTransaction).method?.replace('_', ' ')}
                    </span>
                  </div>
                )}
                {type === 'payment' && (transaction as PaymentTransaction).phoneNumber && (
                  <div className="flex justify-between">
                    <span className="text-white/60">Phone</span>
                    <span className="text-white font-medium">
                      {(transaction as PaymentTransaction).phoneNumber}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Escrow Specific Details */}
          {type === 'escrow' && (
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">Escrow Details</h3>
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
              
              {(transaction as EscrowTransaction).pesapalOrderId && (
                <div className="mt-4 p-3 bg-slate-800/50 rounded">
                  <p className="text-white/80 font-medium mb-2">External References</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60">Pesapal Order:</span>
                      <span className="text-white font-mono">{(transaction as EscrowTransaction).pesapalOrderId}</span>
                    </div>
                    {(transaction as EscrowTransaction).pesapalTrackingId && (
                      <div className="flex justify-between">
                        <span className="text-white/60">Tracking ID:</span>
                        <span className="text-white font-mono">{(transaction as EscrowTransaction).pesapalTrackingId}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Withdrawal Specific Details */}
          {type === 'withdrawal' && (
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">Withdrawal Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-white/60 text-sm">Method</p>
                  <p className="text-white font-medium capitalize">
                    {(transaction as WithdrawalRequest).method.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Destination</p>
                  <p className="text-white font-medium">
                    {(transaction as WithdrawalRequest).destination?.accountNumber || 
                     (transaction as WithdrawalRequest).destination?.phoneNumber || 'N/A'}
                  </p>
                </div>
                {(transaction as WithdrawalRequest).destination?.holderName && (
                  <div>
                    <p className="text-white/60 text-sm">Account Holder</p>
                    <p className="text-white font-medium">{(transaction as WithdrawalRequest).destination.holderName}</p>
                  </div>
                )}
                {(transaction as WithdrawalRequest).pesapalPayoutId && (
                  <div>
                    <p className="text-white/60 text-sm">Pesapal Payout ID</p>
                    <p className="text-white font-mono">{(transaction as WithdrawalRequest).pesapalPayoutId}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">Timeline</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-white/60 text-sm">Created</p>
                <p className="text-white">{formatDate(transaction.createdAt)}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Last Updated</p>
                <p className="text-white">{formatDate(transaction.updatedAt)}</p>
              </div>
              {(transaction as any).completedAt && (
                <div>
                  <p className="text-white/60 text-sm">Completed</p>
                  <p className="text-white">{formatDate((transaction as any).completedAt)}</p>
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
              {type === 'escrow' && (transaction as EscrowTransaction).refundedAt && (
                <div>
                  <p className="text-white/60 text-sm">Refunded</p>
                  <p className="text-white">{formatDate((transaction as EscrowTransaction).refundedAt!)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Error Information */}
          {(transaction as any).failureReason && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <h3 className="text-red-400 font-semibold mb-2">Failure Reason</h3>
              <p className="text-red-300">{(transaction as any).failureReason}</p>
            </div>
          )}

          {/* Dispute Information (for escrow) */}
          {type === 'escrow' && ((transaction as EscrowTransaction).disputeReason || (transaction as EscrowTransaction).resolutionReason) && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
              <h3 className="text-orange-400 font-semibold mb-2">Dispute Information</h3>
              {(transaction as EscrowTransaction).disputeReason && (
                <div className="mb-2">
                  <p className="text-orange-300 text-sm">Dispute Reason:</p>
                  <p className="text-orange-200">{(transaction as EscrowTransaction).disputeReason}</p>
                </div>
              )}
              {(transaction as EscrowTransaction).resolutionReason && (
                <div>
                  <p className="text-orange-300 text-sm">Resolution:</p>
                  <p className="text-orange-200">{(transaction as EscrowTransaction).resolutionReason}</p>
                </div>
              )}
            </div>
          )}

          {/* Metadata */}
          {transaction.metadata && (
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">Additional Information</h3>
              <pre className="text-white/80 text-sm overflow-x-auto">
                {JSON.stringify(transaction.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 border-t border-white/10 mt-6">
          {/* Payment Actions */}
          {type === 'payment' && transaction.status === 'pending' && (
            <>
              <button
                onClick={() => handleAction('approve_payment')}
                disabled={actionLoading === 'approve_payment'}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md text-white text-sm disabled:opacity-50"
              >
                {actionLoading === 'approve_payment' ? 'Approving...' : 'Approve'}
              </button>
              <button
                onClick={() => handleAction('reject_payment')}
                disabled={actionLoading === 'reject_payment'}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-white text-sm disabled:opacity-50"
              >
                {actionLoading === 'reject_payment' ? 'Rejecting...' : 'Reject'}
              </button>
            </>
          )}

          {/* Escrow Actions */}
          {type === 'escrow' && (
            <>
              {(transaction.status === 'pending' || transaction.status === 'funded') && (
                <button
                  onClick={() => handleAction('release_escrow')}
                  disabled={actionLoading === 'release_escrow'}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md text-white text-sm disabled:opacity-50"
                >
                  {actionLoading === 'release_escrow' ? 'Releasing...' : 'Release Funds'}
                </button>
              )}
              {(transaction.status === 'pending' || transaction.status === 'funded') && (
                <button
                  onClick={() => handleAction('refund_escrow')}
                  disabled={actionLoading === 'refund_escrow'}
                  className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md text-white text-sm disabled:opacity-50"
                >
                  {actionLoading === 'refund_escrow' ? 'Refunding...' : 'Refund'}
                </button>
              )}
              {transaction.status === 'disputed' && (
                <button
                  onClick={() => handleAction('resolve_dispute')}
                  disabled={actionLoading === 'resolve_dispute'}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-white text-sm disabled:opacity-50"
                >
                  {actionLoading === 'resolve_dispute' ? 'Resolving...' : 'Resolve Dispute'}
                </button>
              )}
            </>
          )}

          {/* Withdrawal Actions */}
          {type === 'withdrawal' && (
            <>
              {transaction.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleAction('approve_withdrawal')}
                    disabled={actionLoading === 'approve_withdrawal'}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md text-white text-sm disabled:opacity-50"
                  >
                    {actionLoading === 'approve_withdrawal' ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleAction('reject_withdrawal')}
                    disabled={actionLoading === 'reject_withdrawal'}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-white text-sm disabled:opacity-50"
                  >
                    {actionLoading === 'reject_withdrawal' ? 'Rejecting...' : 'Reject'}
                  </button>
                </>
              )}
            </>
          )}

          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-md text-white text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Wallet Management Modal
const WalletModal = ({ wallet, onClose, onAction }: {
  wallet: UserWallet | null;
  onClose: () => void;
  onAction: (action: string, data?: any) => void;
}) => {
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Correct: Call useEffect at the top level of the component.
  useEffect(() => {
    // The conditional logic is now safely inside the hook.
    if (wallet?.id) {
      fetchWalletTransactions();
    }
    // Using wallet?.id in the dependency array is a good practice
    // to handle the case where `wallet` itself might be null.
  }, [wallet?.id]);

  if (!wallet) return null;


  const fetchWalletTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const response = await api.get(`/admin/wallets/${wallet.id}/transactions`);
      if (response.data.success) {
        setWalletTransactions(response.data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
    }
    setLoadingTransactions(false);
  };

  const handleAction = async (action: string, data?: any) => {
    setActionLoading(action);
    try {
      await onAction(action, { ...data, walletId: wallet.id });
    } catch (error) {
      console.error(`Wallet action ${action} failed:`, error);
    }
    setActionLoading(null);
  };

  const handleAdjustment = () => {
    const amount = parseFloat(adjustmentAmount);
    if (isNaN(amount) || amount === 0) return;
    
    handleAction('adjust_balance', {
      walletId: wallet.id,
      amount,
      reason: adjustmentReason || 'Admin adjustment'
    });
  };

  const getUserName = () => {
    if (!wallet.user) return 'N/A';
    return `${wallet.user.firstName || ''} ${wallet.user.lastName || ''}`.trim() || wallet.user.email || `User ${wallet.user.id}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-slate-700 rounded-lg shadow-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Wallet Management</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <i className="bi bi-x-lg text-xl"></i>
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">Wallet Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-white/60 text-sm">User</p>
                <p className="text-white font-medium">{getUserName()}</p>
                <p className="text-white/70 text-sm">{wallet.user?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Current Balance</p>
                <p className="text-white text-2xl font-bold">
                  {formatCurrency(wallet.balance, wallet.currency)}
                </p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Account Number</p>
                <p className="text-white font-medium">{wallet.accountNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Status</p>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    wallet.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {wallet.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    wallet.isVerified ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {wallet.isVerified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-white/60 text-sm">Created</p>
                <p className="text-white">{formatDate(wallet.createdAt)}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Last Updated</p>
                <p className="text-white">{formatDate(wallet.updatedAt)}</p>
              </div>
            </div>
          </div>

          {/* Balance Adjustment */}
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">Adjust Balance</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm mb-1">Amount (+ or -)</label>
                <input
                  type="number"
                  step="0.01"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                  placeholder="e.g., +1000 or -500"
                  className="w-full bg-slate-800/60 border border-slate-700 rounded px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-white text-sm mb-1">Reason</label>
                <input
                  type="text"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Reason for adjustment"
                  className="w-full bg-slate-800/60 border border-slate-700 rounded px-3 py-2 text-white"
                />
              </div>
              <button
                onClick={handleAdjustment}
                disabled={!adjustmentAmount || actionLoading === 'adjust_balance'}
                className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded text-white text-sm disabled:opacity-50"
              >
                {actionLoading === 'adjust_balance' ? 'Adjusting...' : 'Adjust Balance'}
              </button>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">Recent Transactions</h3>
            {loadingTransactions ? (
              <p className="text-white/60">Loading transactions...</p>
            ) : walletTransactions.length === 0 ? (
              <p className="text-white/60">No transactions found</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {walletTransactions.slice(0, 10).map((txn) => (
                  <div key={txn.id} className="flex justify-between items-center p-2 bg-slate-800/30 rounded">
                    <div>
                      <p className="text-white text-sm">{txn.description}</p>
                      <p className="text-white/60 text-xs">{formatDate(txn.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${txn.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                        {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount, wallet.currency)}
                      </p>
                      <p className="text-white/60 text-xs">
                        Balance: {formatCurrency(txn.balanceAfter, wallet.currency)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-6 border-t border-white/10 mt-6">
          {!wallet.isVerified && (
            <button
              onClick={() => handleAction('verify_wallet')}
              disabled={actionLoading === 'verify_wallet'}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white text-sm disabled:opacity-50"
            >
              {actionLoading === 'verify_wallet' ? 'Verifying...' : 'Verify Wallet'}
            </button>
          )}
          
          <button
            onClick={() => handleAction(wallet.isActive ? 'deactivate_wallet' : 'activate_wallet')}
            disabled={actionLoading === 'deactivate_wallet' || actionLoading === 'activate_wallet'}
            className={`px-4 py-2 rounded text-white text-sm disabled:opacity-50 ${
              wallet.isActive 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {actionLoading === 'deactivate_wallet' || actionLoading === 'activate_wallet' 
              ? 'Processing...' 
              : (wallet.isActive ? 'Deactivate' : 'Activate')
            }
          </button>

          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Finance Admin Component
const FinanceAdminPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [stats, setStats] = useState<FinancialStats>({
    totalTransactions: 0,
    totalVolume: 0,
    totalEscrowHeld: 0,
    totalWithdrawals: 0,
    totalCommissions: 0,
    averageTransactionSize: 0,
    transactionsToday: 0,
    volumeToday: 0,
    pendingWithdrawals: 0,
    activeWallets: 0
  });

  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [escrowTransactions, setEscrowTransactions] = useState<EscrowTransaction[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [wallets, setWallets] = useState<UserWallet[]>([]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });

  // Modal states
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [selectedWallet, setSelectedWallet] = useState<UserWallet | null>(null);
  const [transactionType, setTransactionType] = useState<'payment' | 'escrow' | 'withdrawal'>('payment');
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  // Data fetching functions
  const fetchPayments = async () => {
    try {
      const response = await api.get('/admin/payments');
      if (response.data.success) {
        setPayments(response.data.data || response.data.payments || []);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      setPayments([]);
    }
  };

  const fetchEscrowTransactions = async () => {
    try {
      const response = await api.get('/admin/escrow');
      if (response.data.success) {
        setEscrowTransactions(response.data.data || response.data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching escrow transactions:', error);
      setEscrowTransactions([]);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const response = await api.get('/admin/withdrawals');
      if (response.data.success) {
        setWithdrawalRequests(response.data.data || response.data.withdrawals || []);
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      setWithdrawalRequests([]);
    }
  };

  const fetchWallets = async () => {
    try {
      const response = await api.get('/admin/wallets');
      if (response.data.success) {
        setWallets(response.data.data || response.data.wallets || []);
      }
    } catch (error) {
      console.error('Error fetching wallets:', error);
      setWallets([]);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPayments(),
        fetchEscrowTransactions(),
        fetchWithdrawals(),
        fetchWallets()
      ]);
    } catch (error) {
      console.error('Error fetching financial data:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Calculate stats from actual data
  useEffect(() => {
    if (payments.length || escrowTransactions.length || withdrawalRequests.length || wallets.length) {
      const totalVolume = payments.reduce((sum, p) => sum + p.amount, 0) + 
                         escrowTransactions.reduce((sum, e) => sum + e.amount, 0);
      
      const totalEscrowHeld = escrowTransactions
        .filter(e => e.status === 'pending' || e.status === 'funded')
        .reduce((sum, e) => sum + e.amount, 0);
      
      const totalWithdrawals = withdrawalRequests.reduce((sum, w) => sum + w.amount, 0);
      
      const today = new Date().toDateString();
      const transactionsToday = [...payments, ...escrowTransactions]
        .filter(t => new Date(t.createdAt).toDateString() === today).length;
      
      const volumeToday = [...payments, ...escrowTransactions]
        .filter(t => new Date(t.createdAt).toDateString() === today)
        .reduce((sum, t) => sum + t.amount, 0);

      setStats({
        totalTransactions: payments.length + escrowTransactions.length,
        totalVolume,
        totalEscrowHeld,
        totalWithdrawals,
        totalCommissions: totalVolume * 0.1, // Estimate 10% commission
        averageTransactionSize: totalVolume / Math.max(payments.length + escrowTransactions.length, 1),
        transactionsToday,
        volumeToday,
        pendingWithdrawals: withdrawalRequests.filter(w => w.status === 'pending').length,
        activeWallets: wallets.filter(w => w.isActive).length
      });
    }
  }, [payments, escrowTransactions, withdrawalRequests, wallets]);

  const handleTransactionAction = async (action: string, data?: any) => {
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
        case 'release_escrow':
          endpoint = `/admin/escrow/${data.transactionId}/release`;
          payload = {};
          break;
        case 'refund_escrow':
          endpoint = `/admin/escrow/${data.transactionId}/refund`;
          payload = {};
          break;
        case 'resolve_dispute':
          endpoint = `/admin/escrow/${data.transactionId}/dispute`;
          payload = { action: 'resolve' };
          break;
        case 'approve_withdrawal':
          endpoint = `/admin/withdrawals/${data.transactionId}/approve`;
          payload = {};
          break;
        case 'reject_withdrawal':
          endpoint = `/admin/withdrawals/${data.transactionId}/reject`;
          payload = {};
          break;
        default:
          console.warn(`Unknown action: ${action}`);
          return;
      }

      const response = await api.post(endpoint, payload);
      if (response.data.success) {
        // Refresh data after action
        await fetchAllData();
        setShowTransactionModal(false);
      }
    } catch (error) {
      console.error(`Action ${action} failed:`, error);
      throw error;
    }
  };

  const handleWalletAction = async (action: string, data?: any) => {
    try {
      let endpoint = '';
      let payload = {};

      switch (action) {
        case 'adjust_balance':
          endpoint = `/admin/wallets/${data.walletId}/adjust`;
          payload = { amount: data.amount, reason: data.reason };
          break;
        case 'verify_wallet':
          endpoint = `/admin/wallets/${data.walletId}`;
          payload = { isVerified: true };
          break;
        case 'activate_wallet':
          endpoint = `/admin/wallets/${data.walletId}`;
          payload = { isActive: true };
          break;
        case 'deactivate_wallet':
          endpoint = `/admin/wallets/${data.walletId}`;
          payload = { isActive: false };
          break;
        default:
          console.warn(`Unknown wallet action: ${action}`);
          return;
      }

      const method = action === 'adjust_balance' ? 'post' : 'put';
      const response = await api[method](endpoint, payload);
      
      if (response.data.success) {
        await fetchWallets();
        setShowWalletModal(false);
      }
    } catch (error) {
      console.error(`Wallet action ${action} failed:`, error);
      throw error;
    }
  };

  const viewTransactionDetails = (transaction: any, type: 'payment' | 'escrow' | 'withdrawal') => {
    setSelectedTransaction(transaction);
    setTransactionType(type);
    setShowTransactionModal(true);
  };

  const viewWalletDetails = (wallet: UserWallet) => {
    setSelectedWallet(wallet);
    setShowWalletModal(true);
  };

  // Filter current data based on active tab
  const getCurrentData = () => {
    let data: any[] = [];
    
    switch (activeTab) {
      case 'payments':
        data = payments;
        break;
      case 'escrow':
        data = escrowTransactions;
        break;
      case 'withdrawals':
        data = withdrawalRequests;
        break;
      case 'wallets':
        data = wallets;
        break;
      default:
        data = [];
    }

    // Apply filters
    if (searchTerm) {
      data = data.filter((item: any) => {
        const searchFields = [
          item.reference,
          item.id,
          item.user?.firstName,
          item.user?.lastName,
          item.user?.email,
          item.externalId,
          item.pesapalOrderId,
          item.pesapalTrackingId
        ].filter(Boolean);
        
        return searchFields.some(field => 
          field?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    if (statusFilter !== 'all') {
      data = data.filter((item: any) => item.status === statusFilter);
    }

    if (typeFilter !== 'all' && 'type' in (data[0] || {})) {
      data = data.filter((item: any) => item.type === typeFilter);
    }

    // Date filter
    if (dateRange.start || dateRange.end) {
      data = data.filter((item: any) => {
        const itemDate = new Date(item.createdAt);
        const start = dateRange.start ? new Date(dateRange.start) : new Date(0);
        const end = dateRange.end ? new Date(dateRange.end) : new Date();
        return itemDate >= start && itemDate <= end;
      });
    }

    // Amount filter
    if (amountRange.min || amountRange.max) {
      data = data.filter((item: any) => {
        const amount = item.amount || item.balance || 0;
        const min = amountRange.min ? parseFloat(amountRange.min) : 0;
        const max = amountRange.max ? parseFloat(amountRange.max) : Infinity;
        return amount >= min && amount <= max;
      });
    }

    return data;
  };

  const getUserName = (user?: any) => {
    if (!user) return 'N/A';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || `User ${user.id}`;
  };

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <StatCard 
          title="Total Volume" 
          value={stats.totalVolume} 
          icon="bi-cash-stack" 
          iconBg="bg-green-500/20" 
          iconColor="text-green-400"
          subtitle="All time"
        />
        <StatCard 
          title="Escrow Held" 
          value={stats.totalEscrowHeld} 
          icon="bi-shield-lock" 
          iconBg="bg-blue-500/20" 
          iconColor="text-blue-400"
          subtitle="Currently held"
        />
        <StatCard 
          title="Total Withdrawals" 
          value={stats.totalWithdrawals} 
          icon="bi-arrow-up-circle" 
          iconBg="bg-orange-500/20" 
          iconColor="text-orange-400"
          subtitle="Processed"
        />
        <StatCard 
          title="Commissions" 
          value={stats.totalCommissions} 
          icon="bi-percent" 
          iconBg="bg-purple-500/20" 
          iconColor="text-purple-400"
          subtitle="Platform fees"
        />
        <StatCard 
          title="Active Wallets" 
          value={stats.activeWallets} 
          icon="bi-wallet2" 
          iconBg="bg-pink-500/20" 
          iconColor="text-pink-400"
          subtitle="Users with wallets"
        />
      </div>

      {/* Today's Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-slate-700/50 p-6 rounded-xl">
          <h3 className="text-white font-semibold mb-4">Today&apos;s Activity</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-white/60">Transactions</span>
              <span className="text-white font-bold">{stats.transactionsToday}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Volume</span>
              <span className="text-white font-bold">{formatCurrency(stats.volumeToday)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Avg. Size</span>
              <span className="text-white font-bold">
                {formatCurrency(stats.volumeToday / Math.max(stats.transactionsToday, 1))}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-slate-700/50 p-6 rounded-xl">
          <h3 className="text-white font-semibold mb-4">Pending Actions</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-white/60">Pending Payments</span>
              <span className="text-yellow-400 font-bold">
                {payments.filter(p => p.status === 'pending').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Pending Withdrawals</span>
              <span className="text-orange-400 font-bold">{stats.pendingWithdrawals}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Escrow Ready</span>
              <span className="text-green-400 font-bold">
                {escrowTransactions.filter(e => e.status === 'funded').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-slate-700/50 p-6 rounded-xl">
        <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setActiveTab('payments')}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-white text-sm flex items-center gap-2"
          >
            <i className="bi bi-credit-card"></i>
            View Payments
          </button>
          <button
            onClick={() => setActiveTab('escrow')}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md text-white text-sm flex items-center gap-2"
          >
            <i className="bi bi-shield-lock"></i>
            Manage Escrow
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-md text-white text-sm flex items-center gap-2"
          >
            <i className="bi bi-arrow-up-circle"></i>
            Review Withdrawals
          </button>
          <button
            onClick={() => setActiveTab('wallets')}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md text-white text-sm flex items-center gap-2"
          >
            <i className="bi bi-wallet2"></i>
            Manage Wallets
          </button>
        </div>
      </div>
    </div>
  );

  const renderDataTable = (data: any[], type: 'payment' | 'escrow' | 'withdrawal' | 'wallet') => {
    if (data.length === 0) {
      return (
        <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-slate-700/50 rounded-lg p-12 text-center">
          <i className="bi bi-database text-6xl text-white/20 mb-4"></i>
          <p className="text-white/60 text-lg">No data found matching your criteria</p>
        </div>
      );
    }

    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case 'completed': case 'released': case 'active': return 'bg-green-500/20 text-green-400';
        case 'processing': case 'funded': return 'bg-blue-500/20 text-blue-400';
        case 'pending': case 'ready': return 'bg-yellow-500/20 text-yellow-400';
        case 'failed': case 'cancelled': case 'inactive': return 'bg-red-500/20 text-red-400';
        case 'refunded': return 'bg-purple-500/20 text-purple-400';
        case 'disputed': return 'bg-orange-500/20 text-orange-400';
        default: return 'bg-gray-500/20 text-gray-400';
      }
    };

    return (
      <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-slate-700/50 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/60 border-b border-slate-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-white/80">ID</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-white/80">User</th>
                {type !== 'wallet' && (
                  <>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white/80">Amount</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white/80">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white/80">Date</th>
                  </>
                )}
                {type === 'wallet' && (
                  <>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white/80">Balance</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white/80">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white/80">Verified</th>
                  </>
                )}
                <th className="px-6 py-4 text-center text-sm font-medium text-white/80">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {data.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-800/30">
                  <td className="px-6 py-4">
                    <div className="text-white font-medium">{item.id}</div>
                    {item.reference && (
                      <div className="text-white/60 text-sm">{item.reference}</div>
                    )}
                    {item.externalId && (
                      <div className="text-white/50 text-xs">Ext: {item.externalId}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-white">{getUserName(item.user)}</div>
                    <div className="text-white/60 text-sm">{item.user?.email || 'N/A'}</div>
                    {type === 'payment' && item.method && (
                      <div className="text-white/50 text-xs capitalize">{item.method.replace('_', ' ')}</div>
                    )}
                  </td>
                  {type !== 'wallet' && (
                    <>
                      <td className="px-6 py-4">
                        <div className="text-white font-bold">
                          {formatCurrency(item.amount, item.currency)}
                        </div>
                        {item.netAmount && item.netAmount !== item.amount && (
                          <div className="text-green-400 text-sm">
                            Net: {formatCurrency(item.netAmount, item.currency)}
                          </div>
                        )}
                        {item.charges && (
                          <div className="text-red-400 text-xs">
                            Fee: {formatCurrency(item.charges, item.currency)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>
                        {item.failureReason && (
                          <div className="text-red-400 text-xs mt-1 truncate max-w-32" title={item.failureReason}>
                            {item.failureReason}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-white/70">
                        <div>{formatDate(item.createdAt)}</div>
                        {item.completedAt && (
                          <div className="text-xs text-white/50">
                            Done: {formatDate(item.completedAt)}
                          </div>
                        )}
                      </td>
                    </>
                  )}
                  {type === 'wallet' && (
                    <>
                      <td className="px-6 py-4">
                        <div className="text-white font-bold text-lg">
                          {formatCurrency(item.balance, item.currency)}
                        </div>
                        {item.accountNumber && (
                          <div className="text-white/60 text-sm">#{item.accountNumber}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          item.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          item.isVerified ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {item.isVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </td>
                    </>
                  )}
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => 
                          type === 'wallet' 
                            ? viewWalletDetails(item)
                            : viewTransactionDetails(item, type as any)
                        }
                        className="text-blue-400 hover:text-blue-300 p-1"
                        title="View Details"
                      >
                        <i className="bi bi-eye text-lg"></i>
                      </button>
                      {type !== 'wallet' && item.status === 'pending' && (
                        <button
                          onClick={() => viewTransactionDetails(item, type as any)}
                          className="text-green-400 hover:text-green-300 p-1"
                          title="Take Action"
                        >
                          <i className="bi bi-check-circle text-lg"></i>
                        </button>
                      )}
                      {type === 'escrow' && (item.status === 'funded' || item.status === 'ready') && (
                        <button
                          onClick={() => viewTransactionDetails(item, type as any)}
                          className="text-yellow-400 hover:text-yellow-300 p-1"
                          title="Release Funds"
                        >
                          <i className="bi bi-unlock text-lg"></i>
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p>Loading financial data...</p>
        </div>
      </div>
    );
  }

  const currentData = getCurrentData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] border border-slate-700/50 p-8 mb-8 rounded-2xl shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Financial Management</h1>
              <p className="text-white/70 text-lg">Monitor and manage all financial operations</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchAllData}
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
              { key: 'payments', label: 'Payments', icon: 'bi-credit-card', count: payments.filter(p => p.status === 'pending').length },
              { key: 'escrow', label: 'Escrow', icon: 'bi-shield-lock', count: escrowTransactions.filter(e => e.status === 'pending' || e.status === 'funded').length },
              { key: 'withdrawals', label: 'Withdrawals', icon: 'bi-arrow-up-circle', count: withdrawalRequests.filter(w => w.status === 'pending').length },
              { key: 'wallets', label: 'Wallets', icon: 'bi-wallet2' }
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
                {tab.count && tab.count > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Filters (shown for non-overview tabs) */}
        {activeTab !== 'overview' && (
          <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] border border-slate-700/50 rounded-lg mb-6 p-4">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                <div className="relative w-full sm:w-auto">
                  <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-white/40"></i>
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-800/60 border border-slate-700 rounded-md pl-10 pr-4 py-2 w-full sm:w-64 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                  {activeTab === 'escrow' && (
                    <>
                      <option value="funded">Funded</option>
                      <option value="released">Released</option>
                      <option value="refunded">Refunded</option>
                      <option value="disputed">Disputed</option>
                    </>
                  )}
                  {activeTab === 'wallets' && (
                    <>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </>
                  )}
                </select>

                {(activeTab === 'payments' || activeTab === 'escrow') && (
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="deposit">Deposit</option>
                    <option value="withdrawal">Withdrawal</option>
                    <option value="payout">Payout</option>
                    <option value="refund">Refund</option>
                    {activeTab === 'payments' && (
                      <>
                        <option value="fee">Fee</option>
                        <option value="commission">Commission</option>
                      </>
                    )}
                    {activeTab === 'escrow' && (
                      <option value="payment">Payment</option>
                    )}
                  </select>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <span>Amount:</span>
                  <input
                    type="number"
                    placeholder="Min"
                    value={amountRange.min}
                    onChange={(e) => setAmountRange(prev => ({ ...prev, min: e.target.value }))}
                    className="w-20 bg-slate-800/60 border border-slate-700 rounded px-2 py-1 text-white text-sm"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={amountRange.max}
                    onChange={(e) => setAmountRange(prev => ({ ...prev, max: e.target.value }))}
                    className="w-20 bg-slate-800/60 border border-slate-700 rounded px-2 py-1 text-white text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-700">
              <p className="text-white/60 text-sm">
                Showing {currentData.length} {activeTab} 
                {statusFilter !== 'all' && ` with ${statusFilter} status`}
                {typeFilter !== 'all' && ` of type ${typeFilter}`}
              </p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-8">
          {activeTab === 'overview' && renderOverview()}
          
          {activeTab === 'payments' && renderDataTable(currentData, 'payment')}
          
          {activeTab === 'escrow' && renderDataTable(currentData, 'escrow')}
          
          {activeTab === 'withdrawals' && renderDataTable(currentData, 'withdrawal')}
          
          {activeTab === 'wallets' && renderDataTable(currentData, 'wallet')}
        </div>

        {/* Modals */}
        {showTransactionModal && (
          <TransactionDetailsModal
            transaction={selectedTransaction}
            type={transactionType}
            onClose={() => setShowTransactionModal(false)}
            onAction={handleTransactionAction}
          />
        )}

        {showWalletModal && (
          <WalletModal
            wallet={selectedWallet}
            onClose={() => setShowWalletModal(false)}
            onAction={handleWalletAction}
          />
        )}
      </div>
    </div>
  );
};

export default FinanceAdminPage;