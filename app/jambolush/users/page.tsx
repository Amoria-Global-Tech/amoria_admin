"use client";
import React, { useState, useEffect, useMemo } from 'react';
import api from '@/app/api/conn';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'guest' | 'host' | 'agent' | 'tourguide' | 'admin';
  status: 'active' | 'pending' | 'suspended' | 'inactive';
  verificationStatus: 'verified' | 'pending' | 'unverified' | 'rejected';
  kycStatus: 'approved' | 'pending' | 'rejected';
  provider?: string;
  country?: string;
  totalBookings?: number;
  totalProperties?: number;
  totalTours?: number;
  lastLogin?: string;
  createdAt: string;
  isVerified: boolean;
  profileImage?: string;
  phone?: string;
  phoneCountryCode?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    province?: string;
    country?: string;
    county?: string;
    district?: string;
    region?: string;
    sector?: string;
    zipCode?: string;
    postalCode?: string;
    postcode?: string;
    pinCode?: string;
    eircode?: string;
    cep?: string;
  };
  profile?: {
    bio?: string;
    experience?: number;
    languages?: string[];
    specializations?: string[];
    rating?: number;
    totalSessions?: number;
    averageRating?: number;
  };
  business?: {
    companyName?: string;
    companyTIN?: string;
    licenseNumber?: string;
    tourGuideType?: 'freelancer' | 'employed';
    certifications?: string[];
  };
  verification?: {
    isVerified: boolean;
    verificationDocument?: string;
    addressDocument?: string;
    nationalId?: string;
    passportPhotoUrl?: string;
    kycCompleted: boolean;
    kycSubmittedAt?: string;
    twoFactorEnabled: boolean;
  };
  metrics?: {
    totalEarnings?: number;
    pendingPayouts?: number;
    completedTransactions?: number;
    disputedTransactions?: number;
  };
  recentActivity?: any[];
  sessions?: any[];
  // Legacy fields for backward compatibility
  tourGuideType?: 'freelancer' | 'employed';
  city?: string;
  averageRating?: number;
  kycCompleted?: boolean;
  bio?: string;
  experience?: number;
  languages?: string[];
  specializations?: string[];
  licenseNumber?: string;
  verificationDocument?: string;
  addressDocument?: string;
  employmentContract?: string;
  nationalId?: string;
  companyName?: string;
  companyTIN?: string;
  twoFactorEnabled?: boolean;
  preferredCommunication?: string;
}

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




const StatCard = ({ title, value, icon, iconBg, iconColor }: {
  title: string;
  value: number;
  icon: string;
  iconBg: string;
  iconColor: string;
}) => (
  <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] border border-slate-700/50 p-6 rounded-xl shadow-xl">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-white/60 text-sm">{title}</p>
        <p className="text-white text-2xl font-bold">{value}</p>
      </div>
      <div className={`${iconBg} p-3 rounded-xl`}>
        <i className={`bi ${icon} ${iconColor} text-xl`}></i>
      </div>
    </div>
  </div>
);

const AddUserModal = ({ onClose, onUserAdded }: {
  onClose: () => void;
  onUserAdded: (user: User) => void;
}) => {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    phoneCountryCode: '+250',
    userType: 'guest',
    tourGuideType: 'freelancer',
    country: 'Rwanda',
    city: '',
    status: 'pending',
    password: '',
    bio: '',
    experience: '',
    licenseNumber: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        experience: formData.experience ? parseInt(formData.experience) : undefined,
        tourGuideType: formData.userType === 'tourguide' ? formData.tourGuideType : undefined
      };
      
      const response: any = await api.post('/admin/users', payload);
      if (response.success) {
        onUserAdded(response.user);
        onClose();
      }
    } catch (error) {
      console.error('Error creating user:', error);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#0b1c36] border border-slate-700 rounded-lg shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Add New User</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm mb-1">First Name *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-white text-sm mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-white text-sm mb-1">Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm mb-1">Phone</label>
              <div className="flex">
                <select
                  value={formData.phoneCountryCode}
                  onChange={(e) => setFormData({...formData, phoneCountryCode: e.target.value})}
                  className="bg-slate-800/60 border border-slate-700 rounded-l-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="+250">+250</option>
                  <option value="+1">+1</option>
                  <option value="+44">+44</option>
                </select>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="flex-1 bg-slate-800/60 border border-slate-700 border-l-0 rounded-r-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-white text-sm mb-1">User Type *</label>
              <select
                required
                value={formData.userType}
                onChange={(e) => setFormData({...formData, userType: e.target.value})}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="guest">Guest</option>
                <option value="host">Host</option>
                <option value="agent">Agent</option>
                <option value="tourguide">Tour Guide</option>
              </select>
            </div>
          </div>

          {formData.userType === 'tourguide' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white text-sm mb-1">Tour Guide Type</label>
                  <select
                    value={formData.tourGuideType}
                    onChange={(e) => setFormData({...formData, tourGuideType: e.target.value})}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="freelancer">Freelancer</option>
                    <option value="employed">Employed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white text-sm mb-1">Experience (years)</label>
                  <input
                    type="number"
                    value={formData.experience}
                    onChange={(e) => setFormData({...formData, experience: e.target.value})}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-white text-sm mb-1">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  rows={3}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-white text-sm mb-1">License Number</label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-white text-sm mb-1">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({...formData, country: e.target.value})}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-white text-sm mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-white text-sm mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-white text-sm mb-1">Password *</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const UserDetailsModal = ({ user, onClose, onUserUpdated }: {
  user: User | null;
  onClose: () => void;
  onUserUpdated: (user: User) => void;
}) => {
  const [userDetails, setUserDetails] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserDetails();
      setFormData(user);
    }
  }, [user]);

  const fetchUserDetails = async () => {
    if (!user) return;
    try {
      const response = await api.get(`/admin/users/${user.id}`);
      const data = response.data.data;

      // Normalize data - flatten nested structures for backward compatibility
      const normalizedUser = {
        ...data,
        // Flatten address
        city: data.address?.city || data.city,
        country: data.address?.country || data.country,

        // Flatten profile
        bio: data.profile?.bio || data.bio,
        experience: data.profile?.experience || data.experience,
        languages: data.profile?.languages || data.languages,
        specializations: data.profile?.specializations || data.specializations,
        averageRating: data.profile?.averageRating || data.averageRating,

        // Flatten business
        companyName: data.business?.companyName || data.companyName,
        companyTIN: data.business?.companyTIN || data.companyTIN,
        licenseNumber: data.business?.licenseNumber || data.licenseNumber,
        tourGuideType: data.business?.tourGuideType || data.tourGuideType,

        // Flatten verification
        verificationDocument: data.verification?.verificationDocument || data.verificationDocument,
        addressDocument: data.verification?.addressDocument || data.addressDocument,
        nationalId: data.verification?.nationalId || data.nationalId,
        passportPhotoUrl: data.verification?.passportPhotoUrl || data.passportPhotoUrl,
        kycCompleted: data.verification?.kycCompleted || data.kycCompleted,
        twoFactorEnabled: data.verification?.twoFactorEnabled || data.twoFactorEnabled,
      };

      setUserDetails(normalizedUser);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user details:', error);
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!user) return;
    setActionLoading('update');
    try {
      const response: any = await api.put(`/admin/users/${user.id}`, formData);
      if (response.success) {
        setUserDetails(response.user);
        onUserUpdated(response.user);
        setEditMode(false);
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
    setActionLoading(null);
  };

  const handleAction = async (action: string, data?: any) => {
    if (!user) return;
    setActionLoading(action);
    try {
      let response: any;
      switch (action) {
        case 'suspend':
          response = await api.post(`/admin/users/${user.id}/suspend`, data);
          break;
        case 'activate':
          response = await api.post(`/admin/users/${user.id}/activate`);
          break;
        case 'verify_kyc':
          response = await api.put(`/admin/users/${user.id}`, { kycStatus: 'approved', verificationStatus: 'verified' });
          break;
        case 'reject_kyc':
          response = await api.put(`/admin/users/${user.id}`, { kycStatus: 'rejected' });
          break;
        case 'verify_account':
          response = await api.put(`/admin/users/${user.id}`, { verificationStatus: 'verified', isVerified: true });
          break;
        case 'reset_password':
          response = await api.post(`/admin/users/${user.id}/reset-password`);
          break;
        case 'enable_2fa':
          response = await api.put(`/admin/users/${user.id}`, { twoFactorEnabled: true });
          break;
        case 'disable_2fa':
          response = await api.put(`/admin/users/${user.id}`, { twoFactorEnabled: false });
          break;
        default:
          return;
      }
      
      if (response.success) {
        await fetchUserDetails();
        onUserUpdated(response.user || response.data);
      }
    } catch (error) {
      console.error(`Error ${action}:`, error);
    }
    setActionLoading(null);
  };

  if (!user) return null;

  const getListingData = () => {
    if (!userDetails) return [];
    
    switch (userDetails.userType) {
      case 'host':
      case 'agent':
        return userDetails.totalProperties || 0;
      case 'tourguide':
        return userDetails.totalTours || 0;
      case 'guest':
        return userDetails.totalBookings || 0;
      default:
        return 0;
    }
  };

  const getListingLabel = () => {
    switch (userDetails?.userType) {
      case 'host':
      case 'agent':
        return 'Properties';
      case 'tourguide':
        return 'Tours';
      case 'guest':
        return 'Bookings';
      default:
        return 'Items';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#0b1c36] border border-slate-700 rounded-lg shadow-xl w-full max-w-6xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            User Details - {user.firstName} {user.lastName}
            <span className="ml-2 text-sm font-normal text-white/60">#{user.id}</span>
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <p className="text-white/60 text-sm">Account Status</p>
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
              user.status === 'active' ? 'bg-green-500/20 text-green-400' :
              user.status === 'suspended' ? 'bg-red-500/20 text-red-400' :
              'bg-yellow-500/20 text-yellow-400'
            }`}>
              {user.status}
            </span>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <p className="text-white/60 text-sm">KYC Status</p>
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
              user.kycStatus === 'approved' ? 'bg-green-500/20 text-green-400' :
              user.kycStatus === 'rejected' ? 'bg-red-500/20 text-red-400' :
              'bg-yellow-500/20 text-yellow-400'
            }`}>
              {user.kycStatus}
            </span>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <p className="text-white/60 text-sm">Rating</p>
            <p className="text-white font-bold">{user.averageRating || 0} ★</p>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <p className="text-white/60 text-sm">{getListingLabel()}</p>
            <p className="text-white font-bold">{getListingData()}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { key: 'profile', label: 'Profile' },
            { key: 'verification', label: 'Verification' },
            { key: 'activity', label: 'Activity' },
            { key: 'listings', label: getListingLabel() },
            { key: 'financial', label: 'Financial' },
            { key: 'security', label: 'Security' }
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

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-white">Profile Information</h3>
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md text-white text-sm"
                  >
                    {editMode ? 'Cancel' : 'Edit Profile'}
                  </button>
                </div>

                {/* Profile Image */}
                {userDetails?.profileImage && (
                  <div className="flex justify-center">
                    <div className="relative">
                      <img
                        src={userDetails.profileImage}
                        alt={`${userDetails.firstName} ${userDetails.lastName}`}
                        className="w-32 h-32 rounded-full object-cover border-4 border-blue-500/30"
                      />
                      <div className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2">
                        <i className="bi bi-camera-fill text-white"></i>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white/60 text-sm mb-1">First Name</label>
                      {editMode ? (
                        <input
                          type="text"
                          value={formData.firstName || ''}
                          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                          className="w-full bg-slate-800/60 border border-slate-700 rounded px-3 py-2 text-white"
                        />
                      ) : (
                        <p className="text-white">{userDetails?.firstName || 'N/A'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-white/60 text-sm mb-1">Last Name</label>
                      {editMode ? (
                        <input
                          type="text"
                          value={formData.lastName || ''}
                          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                          className="w-full bg-slate-800/60 border border-slate-700 rounded px-3 py-2 text-white"
                        />
                      ) : (
                        <p className="text-white">{userDetails?.lastName || 'N/A'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-white/60 text-sm mb-1">Email</label>
                      <p className="text-white">{userDetails?.email}</p>
                    </div>

                    <div>
                      <label className="block text-white/60 text-sm mb-1">Phone</label>
                      {editMode ? (
                        <div className="flex">
                          <select
                            value={formData.phoneCountryCode || '+250'}
                            onChange={(e) => setFormData({...formData, phoneCountryCode: e.target.value})}
                            className="bg-slate-800/60 border border-slate-700 rounded-l px-3 py-2 text-white"
                          >
                            <option value="+250">+250</option>
                            <option value="+1">+1</option>
                            <option value="+44">+44</option>
                          </select>
                          <input
                            type="tel"
                            value={formData.phone || ''}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            className="flex-1 bg-slate-800/60 border border-slate-700 border-l-0 rounded-r px-3 py-2 text-white"
                          />
                        </div>
                      ) : (
                        <p className="text-white">
                          {userDetails?.phoneCountryCode}{userDetails?.phone || 'N/A'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-white/60 text-sm mb-1">User Type</label>
                      {editMode ? (
                        <select
                          value={formData.userType || ''}
                          onChange={(e) => setFormData({...formData, userType: e.target.value as any})}
                          className="w-full bg-slate-800/60 border border-slate-700 rounded px-3 py-2 text-white"
                        >
                          <option value="guest">Guest</option>
                          <option value="host">Host</option>
                          <option value="agent">Agent</option>
                          <option value="tourguide">Tour Guide</option>
                        </select>
                      ) : (
                        <span className="px-2 py-1 rounded text-xs font-medium capitalize bg-blue-500/20 text-blue-400">
                          {userDetails?.userType}
                          {userDetails?.tourGuideType && ` (${userDetails.tourGuideType})`}
                        </span>
                      )}
                    </div>

                    {/* Tour Guide Type - only show if userType is tourguide */}
                    {(editMode ? formData.userType === 'tourguide' : userDetails?.userType === 'tourguide') && (
                      <div>
                        <label className="block text-white/60 text-sm mb-1">Tour Guide Type</label>
                        {editMode ? (
                          <select
                            value={formData.tourGuideType || 'freelancer'}
                            onChange={(e) => setFormData({...formData, tourGuideType: e.target.value as any})}
                            className="w-full bg-slate-800/60 border border-slate-700 rounded px-3 py-2 text-white"
                          >
                            <option value="freelancer">Freelancer</option>
                            <option value="employed">Employed</option>
                          </select>
                        ) : (
                          <p className="text-white capitalize">{userDetails?.tourGuideType || 'N/A'}</p>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-white/60 text-sm mb-1">Country</label>
                      {editMode ? (
                        <input
                          type="text"
                          value={formData.country || ''}
                          onChange={(e) => setFormData({...formData, country: e.target.value})}
                          className="w-full bg-slate-800/60 border border-slate-700 rounded px-3 py-2 text-white"
                        />
                      ) : (
                        <p className="text-white">{userDetails?.country || 'N/A'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-white/60 text-sm mb-1">City</label>
                      {editMode ? (
                        <input
                          type="text"
                          value={formData.city || ''}
                          onChange={(e) => setFormData({...formData, city: e.target.value})}
                          className="w-full bg-slate-800/60 border border-slate-700 rounded px-3 py-2 text-white"
                        />
                      ) : (
                        <p className="text-white">{userDetails?.city || 'N/A'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-white/60 text-sm mb-1">Member Since</label>
                      <p className="text-white">{formatDate(userDetails?.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                {userDetails?.address && (
                  <div className="border-t border-slate-700 pt-6">
                    <h4 className="text-white font-medium mb-4">Address Information</h4>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-white/60 text-sm mb-1">Street</label>
                          <p className="text-white">{userDetails.address.street || 'N/A'}</p>
                        </div>

                        <div>
                          <label className="block text-white/60 text-sm mb-1">City</label>
                          <p className="text-white">{userDetails.address.city || 'N/A'}</p>
                        </div>

                        <div>
                          <label className="block text-white/60 text-sm mb-1">Province/State</label>
                          <p className="text-white">{userDetails.address.province || userDetails.address.state || 'N/A'}</p>
                        </div>

                        <div>
                          <label className="block text-white/60 text-sm mb-1">District</label>
                          <p className="text-white">{userDetails.address.district || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-white/60 text-sm mb-1">Country</label>
                          <p className="text-white">{userDetails.address.country || 'N/A'}</p>
                        </div>

                        <div>
                          <label className="block text-white/60 text-sm mb-1">County</label>
                          <p className="text-white">{userDetails.address.county || 'N/A'}</p>
                        </div>

                        <div>
                          <label className="block text-white/60 text-sm mb-1">Region</label>
                          <p className="text-white">{userDetails.address.region || 'N/A'}</p>
                        </div>

                        <div>
                          <label className="block text-white/60 text-sm mb-1">Sector</label>
                          <p className="text-white">{userDetails.address.sector || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-white/60 text-sm mb-1">Postal/Zip Code</label>
                          <p className="text-white">
                            {userDetails.address.zipCode ||
                             userDetails.address.postalCode ||
                             userDetails.address.postcode ||
                             userDetails.address.pinCode ||
                             userDetails.address.eircode ||
                             userDetails.address.cep ||
                             'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Business Information for Agents and Hosts */}
                {(userDetails?.userType === 'agent' || userDetails?.userType === 'host') && (
                  <div className="border-t border-slate-700 pt-6">
                    <h4 className="text-white font-medium mb-4">Business Information</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-white/60 text-sm mb-1">Company Name</label>
                          <p className="text-white">{userDetails.companyName || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-white/60 text-sm mb-1">Company TIN</label>
                          <p className="text-white font-mono">{userDetails.companyTIN || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-white/60 text-sm mb-1">License Number</label>
                          <p className="text-white">{userDetails.licenseNumber || 'N/A'}</p>
                        </div>
                        {userDetails.bio && (
                          <div>
                            <label className="block text-white/60 text-sm mb-1">Bio</label>
                            <p className="text-white">{userDetails.bio}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tour Guide Specific Fields */}
                {userDetails?.userType === 'tourguide' && (
                  <div className="border-t border-slate-700 pt-6">
                    <h4 className="text-white font-medium mb-4">Tour Guide Information</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-white/60 text-sm mb-1">Bio</label>
                          {editMode ? (
                            <textarea
                              value={formData.bio || ''}
                              onChange={(e) => setFormData({...formData, bio: e.target.value})}
                              rows={3}
                              className="w-full bg-slate-800/60 border border-slate-700 rounded px-3 py-2 text-white"
                            />
                          ) : (
                            <p className="text-white">{userDetails.bio || 'N/A'}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-white/60 text-sm mb-1">Experience (years)</label>
                          <p className="text-white">{userDetails.experience || 0}</p>
                        </div>
                        <div>
                          <label className="block text-white/60 text-sm mb-1">Company Name</label>
                          <p className="text-white">{userDetails.companyName || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-white/60 text-sm mb-1">License Number</label>
                          <p className="text-white">{userDetails.licenseNumber || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-white/60 text-sm mb-1">Languages</label>
                          <p className="text-white">
                            {userDetails.languages?.join(', ') || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-white/60 text-sm mb-1">Specializations</label>
                          <p className="text-white">
                            {userDetails.specializations?.join(', ') || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Employment Contract for Employed Tour Guides */}
                    {userDetails.tourGuideType === 'employed' && (
                      <div className="mt-4">
                        <label className="block text-white/60 text-sm mb-1">Employment Contract</label>
                        {userDetails.employmentContract ? (
                          <a
                            href={userDetails.employmentContract}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
                          >
                            <i className="bi bi-file-earmark-text"></i>
                            View Employment Contract
                          </a>
                        ) : (
                          <p className="text-white/40 text-sm">No employment contract uploaded</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {editMode && (
                  <div className="flex gap-3 pt-6 border-t border-slate-700">
                    <button
                      onClick={handleUpdate}
                      disabled={actionLoading === 'update'}
                      className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-md text-white disabled:opacity-50"
                    >
                      {actionLoading === 'update' ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'verification' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white">Verification & KYC</h3>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-slate-800/50 p-4 rounded">
                      <p className="text-white/60 text-sm">Verification Status</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          userDetails?.verificationStatus === 'verified' ? 'bg-green-500/20 text-green-400' :
                          userDetails?.verificationStatus === 'rejected' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {userDetails?.verificationStatus || 'unverified'}
                        </span>
                        {userDetails?.verificationStatus !== 'verified' && (
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to verify this account? This will set verificationStatus to "verified" and isVerified to true.')) {
                                handleAction('verify_account');
                              }
                            }}
                            disabled={actionLoading === 'verify_account'}
                            className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs text-white disabled:opacity-50"
                          >
                            {actionLoading === 'verify_account' ? 'Verifying...' : 'Verify Account'}
                          </button>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-white/60">
                        Email Verified: {userDetails?.isVerified ? '✓ Yes' : '✗ No'}
                      </div>
                    </div>

                    <div className="bg-slate-800/50 p-4 rounded">
                      <p className="text-white/60 text-sm">KYC Status</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          userDetails?.kycStatus === 'approved' ? 'bg-green-500/20 text-green-400' :
                          userDetails?.kycStatus === 'rejected' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {userDetails?.kycStatus}
                        </span>
                        <div className="flex gap-2">
                          {userDetails?.kycStatus === 'pending' && (
                            <>
                              <button
                                onClick={() => {
                                  if (confirm('Are you sure you want to approve this KYC? This will:\n- Set kycStatus to "approved"\n- Set verificationStatus to "verified"\n- Set isVerified to true')) {
                                    handleAction('verify_kyc');
                                  }
                                }}
                                disabled={actionLoading === 'verify_kyc'}
                                className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs text-white disabled:opacity-50"
                              >
                                {actionLoading === 'verify_kyc' ? 'Approving...' : 'Approve KYC'}
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Please provide a reason for rejecting this KYC:');
                                  if (reason) {
                                    handleAction('reject_kyc', { reason });
                                  }
                                }}
                                disabled={actionLoading === 'reject_kyc'}
                                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs text-white disabled:opacity-50"
                              >
                                {actionLoading === 'reject_kyc' ? 'Rejecting...' : 'Reject KYC'}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-white/60">
                        KYC Completed: {userDetails?.kycCompleted ? '✓ Yes' : '✗ No'}
                        {userDetails?.verification?.kycSubmittedAt && (
                          <div>Submitted: {formatDate(userDetails.verification.kycSubmittedAt, true)}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-slate-800/50 p-4 rounded">
                      <p className="text-white/60 text-sm mb-2">Verification Documents</p>
                      <div className="space-y-2">
                        {/* National ID */}
                        {userDetails?.nationalId ? (
                          <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                            <div className="flex items-center gap-2">
                              <i className="bi bi-card-text text-indigo-400"></i>
                              <span className="text-white text-sm">National ID</span>
                            </div>
                            <span className="text-white/80 text-sm font-mono">{userDetails.nationalId}</span>
                          </div>
                        ) : (
                          <div className="p-2 bg-slate-700/30 rounded text-white/40 text-sm">
                            <i className="bi bi-card-text"></i> No National ID provided
                          </div>
                        )}

                        {/* Passport Photo */}
                        {userDetails?.verification?.passportPhotoUrl ? (
                          <div className="p-2 bg-slate-700/30 rounded">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <i className="bi bi-person-bounding-box text-cyan-400"></i>
                                <span className="text-white text-sm">Passport Photo</span>
                              </div>
                              <a
                                href={userDetails.verification.passportPhotoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                              >
                                <i className="bi bi-eye"></i> View
                              </a>
                            </div>
                            <img
                              src={userDetails.verification.passportPhotoUrl}
                              alt="Passport Photo"
                              className="w-24 h-24 object-cover rounded border border-cyan-400/30"
                            />
                          </div>
                        ) : (
                          <div className="p-2 bg-slate-700/30 rounded text-white/40 text-sm">
                            <i className="bi bi-person-bounding-box"></i> No passport photo uploaded
                          </div>
                        )}

                        {/* ID Document */}
                        {userDetails?.verificationDocument ? (
                          <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                            <div className="flex items-center gap-2">
                              <i className="bi bi-file-earmark-text text-blue-400"></i>
                              <span className="text-white text-sm">ID Document</span>
                            </div>
                            <a
                              href={userDetails.verificationDocument}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                            >
                              <i className="bi bi-eye"></i> View
                            </a>
                          </div>
                        ) : (
                          <div className="p-2 bg-slate-700/30 rounded text-white/40 text-sm">
                            <i className="bi bi-file-earmark-x"></i> No ID document uploaded
                          </div>
                        )}

                        {/* Address Document */}
                        {userDetails?.addressDocument ? (
                          <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                            <div className="flex items-center gap-2">
                              <i className="bi bi-file-earmark-text text-green-400"></i>
                              <span className="text-white text-sm">Address Proof</span>
                            </div>
                            <a
                              href={userDetails.addressDocument}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                            >
                              <i className="bi bi-eye"></i> View
                            </a>
                          </div>
                        ) : (
                          <div className="p-2 bg-slate-700/30 rounded text-white/40 text-sm">
                            <i className="bi bi-file-earmark-x"></i> No address document uploaded
                          </div>
                        )}

                        {/* Employment Contract */}
                        {userDetails?.employmentContract && (
                          <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                            <div className="flex items-center gap-2">
                              <i className="bi bi-file-earmark-text text-purple-400"></i>
                              <span className="text-white text-sm">Employment Contract</span>
                            </div>
                            <a
                              href={userDetails.employmentContract}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                            >
                              <i className="bi bi-eye"></i> View
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-800/50 p-4 rounded">
                      <p className="text-white/60 text-sm mb-2">Account Information</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-white/60">Provider:</span>
                          <span className="text-white capitalize">{userDetails?.provider || 'manual'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">2FA Enabled:</span>
                          <span className={`${userDetails?.twoFactorEnabled ? 'text-green-400' : 'text-red-400'}`}>
                            {userDetails?.twoFactorEnabled ? '✓ Yes' : '✗ No'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white">Security Settings</h3>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-slate-800/50 p-4 rounded">
                      <p className="text-white/60 text-sm">Two-Factor Authentication</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          userDetails?.twoFactorEnabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {userDetails?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <button
                          onClick={() => handleAction(userDetails?.twoFactorEnabled ? 'disable_2fa' : 'enable_2fa')}
                          disabled={actionLoading === 'enable_2fa' || actionLoading === 'disable_2fa'}
                          className={`px-3 py-1 rounded text-xs text-white disabled:opacity-50 ${
                            userDetails?.twoFactorEnabled 
                              ? 'bg-red-600 hover:bg-red-700' 
                              : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          {actionLoading === 'enable_2fa' || actionLoading === 'disable_2fa' 
                            ? 'Processing...' 
                            : (userDetails?.twoFactorEnabled ? 'Disable' : 'Enable')
                          }
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-800/50 p-4 rounded">
                      <p className="text-white/60 text-sm">Password Reset</p>
                      <div className="mt-2">
                        <button
                          onClick={() => handleAction('reset_password')}
                          disabled={actionLoading === 'reset_password'}
                          className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded text-sm text-white disabled:opacity-50"
                        >
                          {actionLoading === 'reset_password' ? 'Resetting...' : 'Reset Password'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-slate-800/50 p-4 rounded">
                      <p className="text-white/60 text-sm">Last Login</p>
                      <p className="text-white">
                        {userDetails?.lastLogin 
                          ? new Date(userDetails.lastLogin).toLocaleString() 
                          : 'Never'
                        }
                      </p>
                    </div>

                    <div className="bg-slate-800/50 p-4 rounded">
                      <p className="text-white/60 text-sm">Communication Preference</p>
                      <p className="text-white capitalize">
                        {userDetails?.preferredCommunication || 'Email'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white">Activity Overview</h3>

                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 p-6 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/60 text-sm">Total Bookings</p>
                        <p className="text-white text-2xl font-bold">{userDetails?.totalBookings || 0}</p>
                      </div>
                      <div className="bg-blue-500/20 p-3 rounded-xl">
                        <i className="bi bi-calendar-check text-blue-400 text-xl"></i>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 p-6 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/60 text-sm">Average Rating</p>
                        <p className="text-white text-2xl font-bold">{userDetails?.averageRating || 0} ★</p>
                      </div>
                      <div className="bg-purple-500/20 p-3 rounded-xl">
                        <i className="bi bi-star-fill text-purple-400 text-xl"></i>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 p-6 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/60 text-sm">Total Sessions</p>
                        <p className="text-white text-2xl font-bold">{userDetails?.profile?.totalSessions || 0}</p>
                      </div>
                      <div className="bg-green-500/20 p-3 rounded-xl">
                        <i className="bi bi-clock-history text-green-400 text-xl"></i>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 p-6 rounded-lg">
                  <h4 className="text-white font-medium mb-4">Recent Activity</h4>
                  {userDetails?.recentActivity && userDetails.recentActivity.length > 0 ? (
                    <div className="space-y-3">
                      {userDetails.recentActivity.map((activity: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded">
                          <div className="flex items-center gap-3">
                            <i className="bi bi-circle-fill text-blue-400 text-xs"></i>
                            <div>
                              <p className="text-white text-sm">{activity.action || activity.type}</p>
                              <p className="text-white/60 text-xs">{formatDate(activity.timestamp || activity.createdAt, true)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/40 text-sm italic">No recent activity recorded</p>
                  )}
                </div>

                <div className="bg-slate-800/50 p-6 rounded-lg">
                  <h4 className="text-white font-medium mb-4">Session History</h4>
                  {userDetails?.sessions && userDetails.sessions.length > 0 ? (
                    <div className="space-y-2">
                      {userDetails.sessions.slice(0, 5).map((session: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded text-sm">
                          <span className="text-white/60">Session #{session.id}</span>
                          <span className="text-white">{formatDate(session.createdAt || session.timestamp, true)}</span>
                        </div>
                      ))}
                      {userDetails.sessions.length > 5 && (
                        <p className="text-white/40 text-xs text-center pt-2">
                          +{userDetails.sessions.length - 5} more sessions
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-white/40 text-sm italic">No sessions recorded</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'listings' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white">{getListingLabel()} Management</h3>
                <div className="bg-slate-800/50 p-6 rounded">
                  <p className="text-white/60">
                    {userDetails?.userType === 'host' ? 'Property listings, bookings, and performance data would be displayed here.' :
                     userDetails?.userType === 'agent' ? 'Property listings, client interactions, and commission data would be displayed here.' :
                     userDetails?.userType === 'tourguide' ? 'Tour listings, bookings, and earnings data would be displayed here.' :
                     'Booking history and travel data would be displayed here.'}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'financial' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white">Financial Information</h3>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 p-6 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/60 text-sm">Total Earnings</p>
                        <p className="text-white text-2xl font-bold">
                          ${userDetails?.metrics?.totalEarnings?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div className="bg-green-500/20 p-3 rounded-xl">
                        <i className="bi bi-cash-stack text-green-400 text-2xl"></i>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 p-6 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/60 text-sm">Pending Payouts</p>
                        <p className="text-white text-2xl font-bold">
                          ${userDetails?.metrics?.pendingPayouts?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div className="bg-yellow-500/20 p-3 rounded-xl">
                        <i className="bi bi-clock-history text-yellow-400 text-2xl"></i>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 p-6 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/60 text-sm">Completed Transactions</p>
                        <p className="text-white text-2xl font-bold">
                          {userDetails?.metrics?.completedTransactions || 0}
                        </p>
                      </div>
                      <div className="bg-blue-500/20 p-3 rounded-xl">
                        <i className="bi bi-check-circle text-blue-400 text-2xl"></i>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/30 p-6 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/60 text-sm">Disputed Transactions</p>
                        <p className="text-white text-2xl font-bold">
                          {userDetails?.metrics?.disputedTransactions || 0}
                        </p>
                      </div>
                      <div className="bg-red-500/20 p-3 rounded-xl">
                        <i className="bi bi-exclamation-triangle text-red-400 text-2xl"></i>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 p-6 rounded-lg">
                  <h4 className="text-white font-medium mb-4">Transaction Summary</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-slate-700/30 rounded">
                      <p className="text-white/60 text-sm">Success Rate</p>
                      <p className="text-white text-xl font-bold">
                        {userDetails?.metrics?.completedTransactions && userDetails?.metrics?.disputedTransactions
                          ? ((userDetails.metrics.completedTransactions / (userDetails.metrics.completedTransactions + userDetails.metrics.disputedTransactions)) * 100).toFixed(1)
                          : '100'}%
                      </p>
                    </div>
                    <div className="text-center p-4 bg-slate-700/30 rounded">
                      <p className="text-white/60 text-sm">Average per Transaction</p>
                      <p className="text-white text-xl font-bold">
                        ${userDetails?.metrics?.totalEarnings && userDetails?.metrics?.completedTransactions
                          ? (userDetails.metrics.totalEarnings / userDetails.metrics.completedTransactions).toFixed(2)
                          : '0.00'}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-slate-700/30 rounded">
                      <p className="text-white/60 text-sm">Total Sessions</p>
                      <p className="text-white text-xl font-bold">
                        {userDetails?.profile?.totalSessions || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 p-6 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Recent Transactions</h4>
                  <p className="text-white/40 text-sm italic">
                    Transaction history integration pending
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Admin Actions */}
        <div className="flex gap-3 pt-6 border-t border-slate-700 mt-6 flex-wrap">
          {userDetails?.status === 'active' ? (
            <button
              onClick={() => handleAction('suspend')}
              disabled={actionLoading === 'suspend'}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-white text-sm disabled:opacity-50"
            >
              {actionLoading === 'suspend' ? 'Suspending...' : 'Suspend User'}
            </button>
          ) : (
            <button
              onClick={() => handleAction('activate')}
              disabled={actionLoading === 'activate'}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md text-white text-sm disabled:opacity-50"
            >
              {actionLoading === 'activate' ? 'Activating...' : 'Activate User'}
            </button>
          )}
          
          <button
            onClick={() => handleAction('reset_password')}
            disabled={actionLoading === 'reset_password'}
            className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-md text-white text-sm disabled:opacity-50"
          >
            {actionLoading === 'reset_password' ? 'Resetting...' : 'Reset Password'}
          </button>

          {userDetails?.kycStatus === 'pending' && (
            <>
              <button
                onClick={() => handleAction('verify_kyc')}
                disabled={actionLoading === 'verify_kyc'}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-white text-sm disabled:opacity-50"
              >
                {actionLoading === 'verify_kyc' ? 'Approving...' : 'Approve KYC'}
              </button>
              <button
                onClick={() => handleAction('reject_kyc')}
                disabled={actionLoading === 'reject_kyc'}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-white text-sm disabled:opacity-50"
              >
                {actionLoading === 'reject_kyc' ? 'Rejecting...' : 'Reject KYC'}
              </button>
            </>
          )}

          {userDetails?.verificationStatus !== 'verified' && (
            <button
              onClick={() => handleAction('verify_account')}
              disabled={actionLoading === 'verify_account'}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md text-white text-sm disabled:opacity-50"
            >
              {actionLoading === 'verify_account' ? 'Verifying...' : 'Verify Account'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const UserGrid = ({ users, onViewDetails, onUserAction }: {
  users: User[];
  onViewDetails: (user: User) => void;
  onUserAction: (action: string, user: User) => void;
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {users.map(user => (
        <div key={user.id} className="bg-[#0b1c36]/80 border border-slate-700/50 p-5 rounded-lg shadow-lg">
          <div className="flex gap-3 items-start mb-4">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-16 h-16 rounded-full object-cover border-2 border-blue-500/30"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-lg truncate">{user.firstName} {user.lastName}</h3>
              <p className="text-white/60 text-sm truncate">{user.email}</p>
              {user.phone && (
                <p className="text-white/60 text-sm">{user.phoneCountryCode}{user.phone}</p>
              )}
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                user.userType === 'host' ? 'bg-blue-500/20 text-blue-400' :
                user.userType === 'agent' ? 'bg-green-500/20 text-green-400' :
                user.userType === 'tourguide' ? 'bg-purple-500/20 text-purple-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {user.userType}
                {user.tourGuideType && ` (${user.tourGuideType})`}
              </span>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                user.status === 'active' ? 'bg-green-500/20 text-green-400' :
                user.status === 'suspended' ? 'bg-red-500/20 text-red-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                {user.status}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center border-y border-slate-700/50 py-3 mb-4">
            <div>
              <p className="text-white/60 text-xs">Rating</p>
              <p className="text-white font-bold">{user.averageRating || 0}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs">KYC</p>
              <span className={`text-xs px-1 py-0.5 rounded ${
                user.kycStatus === 'approved' ? 'bg-green-500/20 text-green-400' :
                user.kycStatus === 'rejected' ? 'bg-red-500/20 text-red-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                {user.kycStatus}
              </span>
            </div>
            <div>
              <p className="text-white/60 text-xs">
                {user.userType === 'tourguide' ? 'Tours' : 
                 user.userType === 'host' || user.userType === 'agent' ? 'Properties' : 'Bookings'}
              </p>
              <p className="text-white font-bold">
                {user.userType === 'tourguide' ? user.totalTours :
                 user.userType === 'host' || user.userType === 'agent' ? user.totalProperties :
                 user.totalBookings || 0}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onViewDetails(user)}
              className="flex-1 text-sm bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 px-3 py-2 rounded-md"
            >
              View Details
            </button>
            {user.status === 'active' ? (
              <button
                onClick={() => onUserAction('suspend', user)}
                className="text-sm bg-red-500/20 text-red-400 hover:bg-red-500/40 px-3 py-2 rounded-md"
              >
                Suspend
              </button>
            ) : (
              <button
                onClick={() => onUserAction('activate', user)}
                className="text-sm bg-green-500/20 text-green-400 hover:bg-green-500/40 px-3 py-2 rounded-md"
              >
                Activate
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const UserTable = ({ users, onViewDetails, onUserAction }: {
  users: User[];
  onViewDetails: (user: User) => void;
  onUserAction: (action: string, user: User) => void;
}) => {
  return (
    <div className="bg-[#0b1c36]/80 border border-slate-700/50 rounded-lg shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-white/80">
          <thead className="bg-slate-800/60">
            <tr>
              <th className="p-4">User</th>
              <th className="p-4">Type</th>
              <th className="p-4">Status</th>
              <th className="p-4">Verification</th>
              <th className="p-4">KYC</th>
              <th className="p-4">Rating</th>
              <th className="p-4">Listings</th>
              <th className="p-4">Joined</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-t border-slate-800 hover:bg-slate-800/40">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {user.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-10 h-10 rounded-full object-cover border border-blue-500/30"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                        {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-white">{user.firstName} {user.lastName}</div>
                      <div className="text-white/60 text-xs">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                    user.userType === 'host' ? 'bg-blue-500/20 text-blue-400' :
                    user.userType === 'agent' ? 'bg-green-500/20 text-green-400' :
                    user.userType === 'tourguide' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {user.userType}
                    {user.tourGuideType && <div className="text-xs mt-1">({user.tourGuideType})</div>}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    user.status === 'suspended' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.verificationStatus === 'verified' ? 'bg-green-500/20 text-green-400' :
                    user.verificationStatus === 'rejected' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {user.verificationStatus || 'unverified'}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.kycStatus === 'approved' ? 'bg-green-500/20 text-green-400' :
                    user.kycStatus === 'rejected' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {user.kycStatus}
                  </span>
                </td>
                <td className="p-4 text-white">{user.averageRating || 0} ★</td>
                <td className="p-4 text-white">
                  {user.userType === 'tourguide' ? user.totalTours :
                   user.userType === 'host' || user.userType === 'agent' ? user.totalProperties :
                   user.totalBookings || 0}
                </td>
                <td className="p-4 text-white/70">{formatDate(user.createdAt, true)}</td>
                <td className="p-4 text-center">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => onViewDetails(user)}
                      className="text-blue-400 hover:text-blue-300"
                      title="View Details"
                    >
                      <i className="bi bi-eye"></i>
                    </button>
                    {user.status === 'active' ? (
                      <button
                        onClick={() => onUserAction('suspend', user)}
                        className="text-red-400 hover:text-red-300"
                        title="Suspend User"
                      >
                        <i className="bi bi-pause-circle"></i>
                      </button>
                    ) : (
                      <button
                        onClick={() => onUserAction('activate', user)}
                        className="text-green-400 hover:text-green-300"
                        title="Activate User"
                      >
                        <i className="bi bi-play-circle"></i>
                      </button>
                    )}
                    {user.kycStatus === 'pending' && (
                      <button
                        onClick={() => onUserAction('verify_kyc', user)}
                        className="text-purple-400 hover:text-purple-300"
                        title="Approve KYC"
                      >
                        <i className="bi bi-check-circle"></i>
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

const UsersAdminPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [kycFilter, setKycFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/users');
      const filteredUsers = response.data.data?.filter((user: User) => user.userType !== 'admin') || [];
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
    setLoading(false);
  };

  const handleUserAction = async (action: string, user: User) => {
    try {
      let response: any;
      if (action === 'suspend') {
        response = await api.post(`/admin/users/${user.id}/suspend`);
      } else if (action === 'activate') {
        response = await api.post(`/admin/users/${user.id}/activate`);
      } else if (action === 'verify_kyc') {
        response = await api.put(`/admin/users/${user.id}`, { kycStatus: 'approved' });
      }
      
      if (response?.success) {
        fetchUsers();
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
    }
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const handleUserAdded = (newUser: User) => {
    setUsers([...users, newUser]);
  };

  const handleUserUpdated = (updatedUser: User) => {
    setUsers(users.map(user => user.id === updatedUser.id ? updatedUser : user));
  };

  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Filter by tab (user type or tour guide type)
    if (activeTab !== 'all') {
      if (activeTab === 'freelance') {
        filtered = filtered.filter(user => user.userType === 'tourguide' && user.tourGuideType === 'freelancer');
      } else if (activeTab === 'employed') {
        filtered = filtered.filter(user => user.userType === 'tourguide' && user.tourGuideType === 'employed');
      } else {
        filtered = filtered.filter(user => user.userType === activeTab);
      }
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    // Filter by verification status
    if (verificationFilter !== 'all') {
      filtered = filtered.filter(user => user.verificationStatus === verificationFilter);
    }

    // Filter by KYC status
    if (kycFilter !== 'all') {
      filtered = filtered.filter(user => user.kycStatus === kycFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [users, activeTab, statusFilter, verificationFilter, kycFilter, searchTerm]);

  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'active').length;
    const verifiedUsers = users.filter(u => u.verificationStatus === 'verified').length;
    const kycApproved = users.filter(u => u.kycStatus === 'approved').length;
    
    return { totalUsers, activeUsers, verifiedUsers, kycApproved };
  }, [users]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] border border-slate-700/50 p-8 mb-8 rounded-2xl shadow-2xl">
          <h1 className="text-3xl font-bold text-white mb-2">Users</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Users" value={stats.totalUsers} icon="bi-people" iconBg="bg-blue-400/20" iconColor="text-blue-400" />
          <StatCard title="Active Users" value={stats.activeUsers} icon="bi-person-check" iconBg="bg-green-400/20" iconColor="text-green-400" />
          <StatCard title="Verified Users" value={stats.verifiedUsers} icon="bi-patch-check" iconBg="bg-purple-400/20" iconColor="text-purple-400" />
          <StatCard title="KYC Approved" value={stats.kycApproved} icon="bi-shield-check" iconBg="bg-pink-400/20" iconColor="text-pink-400" />
        </div>

        {/* User Type Tabs */}
        <div className="bg-[#0b1c36]/80 border border-slate-700/50 rounded-lg mb-6 p-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { key: 'all', label: 'All Users' },
              { key: 'guest', label: 'Guests' },
              { key: 'host', label: 'Hosts' },
              { key: 'agent', label: 'Agents' },
              { key: 'tourguide', label: 'Tour Guides' },
              { key: 'freelance', label: 'Freelance Guides' },
              { key: 'employed', label: 'Employed Guides' }
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
                  placeholder="Search users..."
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
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
                
                <select
                  value={verificationFilter}
                  onChange={(e) => setVerificationFilter(e.target.value)}
                  className="bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Verification</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                  <option value="unverified">Unverified</option>
                  <option value="rejected">Rejected</option>
                </select>
                
                <select
                  value={kycFilter}
                  onChange={(e) => setKycFilter(e.target.value)}
                  className="bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All KYC</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
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
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md flex items-center gap-2 text-sm"
              >
                <i className="bi bi-plus-lg"></i>
                Add User
              </button>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-4">
          <p className="text-white/60">
            Showing {filteredUsers.length} of {users.length} users
            {activeTab !== 'all' && ` in ${activeTab.replace('_', ' ')}`}
            {statusFilter !== 'all' && ` with ${statusFilter} status`}
          </p>
        </div>

        {/* Users Display */}
        <div>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <i className="bi bi-people text-6xl text-white/20 mb-4"></i>
              <p className="text-white/60 text-lg">No users found matching your criteria</p>
            </div>
          ) : view === 'grid' ? (
            <UserGrid 
              users={filteredUsers} 
              onViewDetails={handleViewDetails}
              onUserAction={handleUserAction}
            />
          ) : (
            <UserTable 
              users={filteredUsers} 
              onViewDetails={handleViewDetails}
              onUserAction={handleUserAction}
            />
          )}
        </div>

        {/* Modals */}
        {showAddModal && (
          <AddUserModal
            onClose={() => setShowAddModal(false)}
            onUserAdded={handleUserAdded}
          />
        )}

        {showDetailsModal && (
          <UserDetailsModal
            user={selectedUser}
            onClose={() => setShowDetailsModal(false)}
            onUserUpdated={handleUserUpdated}
          />
        )}
      </div>
    </div>
  );
};

export default UsersAdminPage;