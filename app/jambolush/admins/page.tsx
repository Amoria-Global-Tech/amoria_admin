"use client";

import React, { useState, useEffect, useMemo, useCallback, ChangeEvent } from 'react';
import api from '@/app/api/conn';
import { usePreventDoubleClick } from '@/app/hooks/usePreventDoubleClick';
import AlertNotification from '@/app/components/menu/notify';

// --- TYPE DEFINITIONS ---
// The User interface remains the same to handle the full data structure from the API
interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'guest' | 'host' | 'agent' | 'tourguide' | 'admin';
  status: 'active' | 'pending' | 'suspended' | 'inactive';
  verificationStatus: 'verified' | 'pending' | 'unverified' | 'rejected';
  kycStatus: 'approved' | 'pending' | 'rejected';
  phone?: string;
  phoneCountryCode?: string;
  country?: string;
  city?: string;
  createdAt: string;
  lastLogin?: string;
  twoFactorEnabled: boolean;
}

// --- UTILITY & CONFIGURATION ---

function formatDate(dateString?: string, relativeOnly: boolean = false): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';

  if (relativeOnly) {
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  }
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const BADGE_CONFIG = {
  status: {
    active: 'bg-green-500/20 text-green-400',
    suspended: 'bg-red-500/20 text-red-400',
    pending: 'bg-yellow-500/20 text-yellow-400',
    inactive: 'bg-slate-500/20 text-slate-400',
  },
};

// --- REUSABLE UI COMPONENTS ---

const StatCard = ({ title, value, icon }: { title: string; value: number | string; icon: string; }) => (
  <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-slate-700/50 p-6 rounded-xl shadow-xl">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-white/60 text-sm">{title}</p>
        <p className="text-white text-2xl font-bold">{value}</p>
      </div>
      <div className="bg-slate-700/50 p-3 rounded-xl">
        <i className={`bi ${icon} text-blue-400 text-xl`}></i>
      </div>
    </div>
  </div>
);

const StatusBadge = ({ value }: { value: User['status']; }) => {
  const className = BADGE_CONFIG.status[value] || 'bg-gray-500/20 text-gray-400';
  return (
    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium capitalize ${className}`}>
      {value}
    </span>
  );
};

// --- MODAL COMPONENTS ---

const AddAdminModal = ({ onClose, onAdminAdded }: { onClose: () => void; onAdminAdded: (user: User) => void; }) => {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    status: 'active' as User['status'],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Double-click prevention hook
  const { isProcessing, withPreventDoubleClick: wrapSubmitAction } = usePreventDoubleClick({
    cooldownMs: 2000,
    onCooldownClick: () => setError('Please wait, your request is being processed...')
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = wrapSubmitAction(async () => {
    setLoading(true);
    setError(null);
    try {
      // Hardcode userType to 'admin'
      const payload = { ...formData, userType: 'admin' };
      const response = await api.post<{ success: boolean; user: User }>('/admin/users', payload);
      if (response.data.success) {
        onAdminAdded(response.data.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create administrator.');
      console.error('Error creating admin:', err);
    } finally {
      setLoading(false);
    }
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#0b1c36] border border-slate-700 rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Add New Administrator</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white"><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input name="firstName" placeholder="First Name *" onChange={handleChange} className="w-full bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input name="lastName" placeholder="Last Name *" onChange={handleChange} className="w-full bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <input name="email" type="email" placeholder="Email *" onChange={handleChange} className="w-full bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input name="password" type="password" placeholder="Temporary Password *" onChange={handleChange} className="w-full bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-md">Cancel</button>
            <button onClick={handleSubmit} disabled={loading || isProcessing} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md disabled:opacity-50">
              {loading || isProcessing ? 'Creating...' : 'Create Admin'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---

const AdminsOnlyPage = () => {
  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setAddModalOpen] = useState(false);

  // Alert notification state
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<{ data: User[] }>('/admin/users');
      // **MODIFIED: Filter to only include admin users**
      const adminUsers = response.data.data?.filter(user => user.userType === 'admin') || [];
      setAdmins(adminUsers);
    } catch (error) {
      console.error('Error fetching admin users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleAdminAdded = (newAdmin: User) => {
    setAdmins(prev => [newAdmin, ...prev]);
    setAlert({ message: 'Administrator created successfully!', type: 'success' });
  };

  const filteredAdmins = useMemo(() => {
    return admins.filter(admin => {
      const searchLower = searchTerm.toLowerCase();
      return (
        admin.firstName?.toLowerCase().includes(searchLower) ||
        admin.lastName?.toLowerCase().includes(searchLower) ||
        admin.email?.toLowerCase().includes(searchLower)
      );
    });
  }, [admins, searchTerm]);

  const stats = useMemo(() => ({
    total: admins.length,
    active: admins.filter(u => u.status === 'active').length,
  }), [admins]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-white">Loading Administrators...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center bg-gradient-to-r from-[#0b1c36] to-[#13294b] border border-slate-700/50 p-6 mb-8 rounded-2xl shadow-2xl">
        <h1 className="text-3xl font-bold text-white">Administrator Management</h1>
        <button
          onClick={() => setAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md flex items-center gap-2 text-sm"
        >
          <i className="bi bi-plus-lg"></i>
          Add Admin
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Admins" value={stats.total} icon="bi-shield-shaded" />
        <StatCard title="Active Admins" value={stats.active} icon="bi-shield-check" />
      </div>

      <div className="bg-[#0b1c36]/80 border border-slate-700/50 p-4 rounded-lg mb-6">
        <input 
          type="text" 
          placeholder="Search by name or email..." 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="bg-slate-800/60 border border-slate-700 rounded-md pl-4 pr-4 py-2 w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      {/* Admin Table View */}
      <div className="bg-[#0b1c36]/80 border border-slate-700/50 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-white/80">
            <thead className="bg-slate-800/60">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Status</th>
                <th className="p-4">Last Login</th>
                <th className="p-4">Date Added</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.map(admin => (
                <tr key={admin.id} className="border-t border-slate-800 hover:bg-slate-800/40">
                  <td className="p-4 font-medium text-white">{admin.firstName} {admin.lastName}</td>
                  <td className="p-4">{admin.email}</td>
                  <td className="p-4"><StatusBadge value={admin.status} /></td>
                  <td className="p-4 text-white/70">{formatDate(admin.lastLogin)}</td>
                  <td className="p-4 text-white/70">{formatDate(admin.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredAdmins.length === 0 && (
             <div className="text-center py-12">
                <i className="bi bi-shield-slash text-6xl text-white/20 mb-4"></i>
                <p className="text-white/60 text-lg">No administrators found</p>
            </div>
          )}
        </div>
      </div>

      {isAddModalOpen && <AddAdminModal onClose={() => setAddModalOpen(false)} onAdminAdded={handleAdminAdded} />}

      {/* Alert Notification */}
      {alert && (
        <AlertNotification
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}
    </div>
  );
};

export default AdminsOnlyPage;