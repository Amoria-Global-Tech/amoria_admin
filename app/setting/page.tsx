"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: number;
  full_name: string;
  role: string;
  username: string;
  email: string;
  phone_number: string;
  bio: string;
  photo_url: string;
  password?: string;
}

interface NotificationSettings {
  email_notifications: boolean;
  sms_notifications: boolean;
  new_booking_alerts: boolean;
  new_listing_alerts: boolean;
  new_user_alerts: boolean;
  new_host_alerts: boolean;
  new_field_agent_alerts: boolean;
}

interface SecuritySettings {
  two_factor_enabled: boolean;
  login_alerts_enabled: boolean;
}

interface LoginActivity {
  id: number;
  device_info: string;
  ip_address: string;
  location: string;
  login_time: string;
}

// -------------------------------------------------------------
// Main Component
// -------------------------------------------------------------
const SettingsPage: React.FC = () => {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>({
    id: 0,
    full_name: '',
    role: '',
    username: '',
    email: '',
    phone_number: '',
    bio: '',
    photo_url: '',
    password: ''
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_notifications: true,
    sms_notifications: false,
    new_booking_alerts: true,
    new_listing_alerts: true,
    new_user_alerts: false,
    new_host_alerts: false,
    new_field_agent_alerts: false,
  });

  const [security, setSecurity] = useState<SecuritySettings>({
    two_factor_enabled: false,
    login_alerts_enabled: true,
  });

  const [loginActivities, setLoginActivities] = useState<LoginActivity[]>([]);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Helper function to get user ID from localStorage
  const getUserId = (): number | null => {
    try {
      if (typeof window === 'undefined') return null;
      const userInfo = localStorage.getItem('userInfo');
      if (!userInfo) {
        return null;
      }
      const userData = JSON.parse(userInfo);
      const userId = userData?.id;
      return userId && !isNaN(Number(userId)) ? Number(userId) : null;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  };

  // Function to calculate password strength
  const getPasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length > 7) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/\d/)) strength++;
    if (password.match(/[^a-zA-Z\d]/)) strength++;
    return strength;
  };

  const strengthLabels = ['Very Weak', 'Weak', 'Moderate', 'Strong', 'Very Strong'];

  // Effect to update password strength
  useEffect(() => {
    setPasswordStrength(getPasswordStrength(profile.password || ''));
  }, [profile.password]);

  // Effect to fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const userId = getUserId();
        if (!userId) {
          router.push('/auth');
          return;
        }

        const response = await fetch(`/api/auth/user-data/${userId}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          const { user } = result;
          if (!user || !user.profile) {
            throw new Error('Invalid user data structure received from API');
          }

          setProfile({ ...user.profile, password: '' });
          // Ensure notifications and security are always defined
          setNotifications({
            email_notifications: user.notifications?.email_notifications ?? false,
            sms_notifications: user.notifications?.sms_notifications ?? false,
            new_booking_alerts: user.notifications?.new_booking_alerts ?? false,
            new_listing_alerts: user.notifications?.new_listing_alerts ?? false,
            new_user_alerts: user.notifications?.new_user_alerts ?? false,
            new_host_alerts: user.notifications?.new_host_alerts ?? false,
            new_field_agent_alerts: user.notifications?.new_field_agent_alerts ?? false,
          });
          setSecurity({
            two_factor_enabled: user.security?.two_factor_enabled ?? false,
            login_alerts_enabled: user.security?.login_alerts_enabled ?? false,
          });
          setLoginActivities(user.loginActivities || []);
        } else {
          setError(result.message || 'Failed to load user data');
        }

      } catch (err) {
        let errorMessage = 'Failed to load user data';
        if (err instanceof Error) {
          errorMessage = `Error: ${err.message}`;
        }
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchUserData, 100);
    return () => clearTimeout(timer);
  }, [router]);

  // Handle profile update form submission
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const userId = getUserId();
      if (!userId) {
        setError('User ID not found');
        return;
      }

      const updateData = {
        full_name: profile.full_name,
        username: profile.username,
        email: profile.email,
        phone_number: profile.phone_number,
        bio: profile.bio,
        photo_url: profile.photo_url,
        ...(profile.password && { password: profile.password })
      };

      const response = await fetch(`/api/auth/user-data/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('Profile updated successfully!');
        setIsEditMode(false);
        setProfile(prev => ({ ...prev, password: '' }));
        if (result.user) {
          localStorage.setItem('userInfo', JSON.stringify(result.user));
        }
      } else {
        setError(result.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Generic function to handle settings updates (notifications/security)
  const handleUpdateSetting = async <T, K extends keyof T>(
    stateSetter: React.Dispatch<React.SetStateAction<T>>,
    key: K,
    value: T[K]
  ) => {
    // Optimistic update
    stateSetter(prev => ({ ...prev, [key]: value }));
    setError(null);
    setSuccessMessage(null);

    try {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID not found');
      }

      const requestData = { [key]: value };
      const response = await fetch(`/api/auth/user-data/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to update settings');
      }
      setSuccessMessage('Settings updated successfully!');
    } catch (err) {
      console.error('Settings update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      // Revert on failure
      stateSetter(prev => ({ ...prev, [key]: !value }));
    }
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const userId = getUserId();
      if (!userId) {
        setError('User ID not found');
        return;
      }

      const formData = new FormData();
      formData.append('photo', file);
      formData.append('userId', userId.toString());

      const response = await fetch('/api/auth/upload-photo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setProfile(prev => ({ ...prev, photo_url: result.photo_url }));
        setSuccessMessage('Profile picture updated successfully!');
      } else {
        setError(result.message || 'Failed to upload photo');
      }
    } catch (err) {
      console.error('Photo upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'NA';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-2xl rounded-2xl p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-white/30 border-t-white rounded-full mr-3"></div>
            <span className="text-white">Loading settings...</span>
          </div>
        </div>
      </div>
    );
  }

  // Main JSX structure
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4 sm:p-6 lg:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
                My Profile
              </h1>
              <p className="text-white/70 text-sm sm:text-base">
                View and manage your account information
              </p>
            </div>
            <button 
              onClick={() => router.back()}
              className="self-start sm:self-auto bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 text-sm cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              Back
            </button>
          </div>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          </div>
        )}
        {successMessage && (
          <div className="mb-6 bg-green-500/20 border border-green-500/30 text-green-300 px-4 py-3 rounded-xl">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              {successMessage}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-2xl rounded-2xl p-6 text-center">
              {/* Profile Picture */}
              <div className="relative mb-6">
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-pink-400/30 shadow-lg mx-auto group">
                  {profile.photo_url ? (
                    <img className="object-cover w-full h-full" src={profile.photo_url} alt="Profile" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-pink-400 to-pink-500 flex items-center justify-center">
                      <span className="text-white text-xl sm:text-2xl font-bold">
                        {getInitials(profile.full_name)}
                      </span>
                    </div>
                  )}
                  <label htmlFor="profile-photo-upload" className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    Upload
                    <input id="profile-photo-upload" type="file" className="sr-only" onChange={handleProfilePictureUpload} accept="image/*" />
                  </label>
                </div>
                <div className="absolute -bottom-2 -right-2 w-6 h-6 sm:w-8 sm:h-8 bg-pink-400 border-4 border-white rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              {/* Basic Info */}
              <h3 className="text-lg sm:text-xl font-bold text-white mb-1">{profile.full_name || 'No Name'}</h3>
              <p className="text-pink-400 font-medium text-sm sm:text-base mb-1">{profile.role || 'No Role'}</p>
              <p className="text-white/60 text-xs sm:text-sm mb-4">{`@${profile.username || 'no-username'}`}</p>
              
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/30 text-green-300 px-3 py-1 rounded-full text-sm font-medium mb-6">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Active Account
              </div>

              {/* Bio */}
              <div className="text-left">
                <h4 className="font-semibold text-white mb-2 text-sm sm:text-base">About</h4>
                <p className="text-sm text-white/70 leading-relaxed">{profile.bio || 'No bio available'}</p>
              </div>
            </div>
          </div>

          {/* Right Column - All Settings Sections */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information Form */}
            <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-2xl rounded-2xl p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-white">Personal Information</h3>
                <button 
                  onClick={() => setIsEditMode(!isEditMode)} 
                  disabled={isSaving}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                    isEditMode 
                      ? 'bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white' 
                      : 'bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white'
                  }`}
                >
                  {isSaving ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  )}
                  {isSaving ? 'Saving...' : isEditMode ? 'Save' : 'Edit'}
                </button>
              </div>

              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* Full Name */}
                  <div className="flex flex-col">
                    <label className="text-white/80 text-sm font-semibold mb-2">Full Name</label>
                    <input
                      type="text"
                      className={`w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white transition-all ${
                        isEditMode 
                          ? 'focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400/50' 
                          : 'cursor-not-allowed opacity-60'
                      }`}
                      value={profile.full_name}
                      onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                      disabled={!isEditMode}
                      required
                    />
                  </div>

                  {/* Username */}
                  <div className="flex flex-col">
                    <label className="text-white/80 text-sm font-semibold mb-2">Username</label>
                    <input
                      type="text"
                      className={`w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white transition-all ${
                        isEditMode 
                          ? 'focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400/50' 
                          : 'cursor-not-allowed opacity-60'
                      }`}
                      value={profile.username}
                      onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
                      disabled={!isEditMode}
                      required
                    />
                  </div>

                  {/* Email Address */}
                  <div className="flex flex-col">
                    <label className="text-white/80 text-sm font-semibold mb-2">Email Address</label>
                    <input
                      type="email"
                      className={`w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white transition-all ${
                        isEditMode 
                          ? 'focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400/50' 
                          : 'cursor-not-allowed opacity-60'
                      }`}
                      value={profile.email}
                      onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                      disabled={!isEditMode}
                      required
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="flex flex-col">
                    <label className="text-white/80 text-sm font-semibold mb-2">Phone Number</label>
                    <input
                      type="tel"
                      className={`w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white transition-all ${
                        isEditMode 
                          ? 'focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400/50' 
                          : 'cursor-not-allowed opacity-60'
                      }`}
                      value={profile.phone_number}
                      onChange={(e) => setProfile(prev => ({ ...prev, phone_number: e.target.value }))}
                      disabled={!isEditMode}
                    />
                  </div>

                  {/* Role */}
                  <div className="flex flex-col">
                    <label className="text-white/80 text-sm font-semibold mb-2">Role</label>
                    <div className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white/60 cursor-not-allowed">
                      {profile.role || 'No Role Assigned'}
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div className="flex flex-col">
                  <label className="text-white/80 text-sm font-semibold mb-2">Bio</label>
                  <textarea
                    className={`w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white transition-all resize-none ${
                      isEditMode 
                        ? 'focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400/50' 
                        : 'cursor-not-allowed opacity-60'
                    }`}
                    rows={4}
                    value={profile.bio}
                    onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                    disabled={!isEditMode}
                  />
                </div>

                {/* Password section */}
                {isEditMode && (
                  <div className="pt-4 border-t border-white/20">
                    <label className="text-white/80 text-sm font-semibold mb-2 block">Change Password (optional)</label>
                    <input
                      type="password"
                      className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400/50 transition-all"
                      placeholder="Enter new password"
                      value={profile.password}
                      onChange={(e) => setProfile(prev => ({ ...prev, password: e.target.value }))}
                    />
                    {profile.password && (
                      <div className="mt-3">
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-300 ease-in-out"
                            style={{ 
                              width: `${(passwordStrength / 4) * 100}%`, 
                              backgroundColor: passwordStrength > 2 ? '#4ade80' : passwordStrength > 1 ? '#fbbf24' : '#ef4444' 
                            }}
                          />
                        </div>
                        <p className="text-xs text-right mt-1" style={{ 
                          color: passwordStrength > 2 ? '#4ade80' : passwordStrength > 1 ? '#fbbf24' : '#ef4444' 
                        }}>
                          Password Strength: {strengthLabels[passwordStrength]}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>

            {/* Security & Authentication */}
            <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-2xl rounded-2xl p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Security & Authentication</h3>
              <div className="space-y-4">
                {/* Two Factor Auth */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <span className="text-white/90 font-medium">Two-Factor Authentication (2FA)</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={security.two_factor_enabled} 
                      onChange={(e) => handleUpdateSetting<SecuritySettings, 'two_factor_enabled'>(
                        setSecurity,
                        'two_factor_enabled',
                        e.target.checked
                      )}
                    />
                    <div className="w-11 h-6 bg-white/20 rounded-full peer peer-checked:bg-pink-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>

                {/* Login Alerts */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <span className="text-white/90 font-medium">Login Alerts</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={security.login_alerts_enabled} 
                      onChange={(e) => handleUpdateSetting<SecuritySettings, 'login_alerts_enabled'>(
                        setSecurity,
                        'login_alerts_enabled',
                        e.target.checked
                      )} 
                    />
                    <div className="w-11 h-6 bg-white/20 rounded-full peer peer-checked:bg-pink-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>
              </div>

              {/* Recent Login Activity */}
              <div className="mt-6 pt-6 border-t border-white/20">
                <h4 className="text-base sm:text-lg font-bold text-white mb-4">Recent Login Activity</h4>
                <div className="space-y-3">
                  {loginActivities.length > 0 ? (
                    loginActivities.map((activity) => (
                      <div key={activity.id} className="bg-white/5 border border-white/10 rounded-lg p-3 text-sm">
                        <div className="flex items-center gap-2 text-white/80">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          {activity.device_info}, {activity.location}, IP: {activity.ip_address} 
                          <span className="text-white/60">({formatDate(activity.login_time)})</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-sm">
                      <div className="flex items-center gap-2 text-white/80">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        No recent activity found
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notifications settings */}
            <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-2xl rounded-2xl p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Notifications Settings</h3>
              <div className="space-y-4">

                {/* Email Notifications */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <span className="text-white/90 font-medium">Email Notifications</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notifications.email_notifications} 
                      onChange={(e) => handleUpdateSetting<NotificationSettings, 'email_notifications'>(
                        setNotifications,
                        'email_notifications',
                        e.target.checked
                      )} 
                    />
                    <div className="w-11 h-6 bg-white/20 rounded-full peer peer-checked:bg-pink-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>

                {/* SMS Notifications */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <span className="text-white/90 font-medium">SMS Notifications</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notifications.sms_notifications} 
                      onChange={(e) => handleUpdateSetting<NotificationSettings, 'sms_notifications'>(
                        setNotifications,
                        'sms_notifications',
                        e.target.checked
                      )} 
                    />
                    <div className="w-11 h-6 bg-white/20 rounded-full peer peer-checked:bg-pink-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>

               {/* New Listing Alerts */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <span className="text-white/90 font-medium">New Listing Alerts</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notifications.new_listing_alerts} 
                      onChange={(e) => handleUpdateSetting<NotificationSettings, 'new_listing_alerts'>(
                        setNotifications,
                        'new_listing_alerts',
                        e.target.checked
                      )} 
                    />
                    <div className="w-11 h-6 bg-white/20 rounded-full peer peer-checked:bg-pink-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>

                {/* New User Alerts */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <span className="text-white/90 font-medium">New User Alerts</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notifications.new_user_alerts} 
                      onChange={(e) => handleUpdateSetting<NotificationSettings, 'new_user_alerts'>(
                        setNotifications,
                        'new_user_alerts',
                        e.target.checked
                      )} 
                    />
                    <div className="w-11 h-6 bg-white/20 rounded-full peer peer-checked:bg-pink-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>

                {/* New Booking Alerts */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <span className="text-white/90 font-medium">New Booking Alerts</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notifications.new_booking_alerts} 
                      onChange={(e) => handleUpdateSetting<NotificationSettings, 'new_booking_alerts'>(
                        setNotifications,
                        'new_booking_alerts',
                        e.target.checked
                      )} 
                    />
                    <div className="w-11 h-6 bg-white/20 rounded-full peer peer-checked:bg-pink-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>

                {/* New Host Alerts */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <span className="text-white/90 font-medium">New Host Alerts</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notifications.new_host_alerts} 
                      onChange={(e) => handleUpdateSetting<NotificationSettings, 'new_host_alerts'>(
                        setNotifications,
                        'new_host_alerts',
                        e.target.checked
                      )} 
                    />
                    <div className="w-11 h-6 bg-white/20 rounded-full peer peer-checked:bg-pink-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>

                {/* New Field Agent Alerts */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <span className="text-white/90 font-medium">New Field Agent Alerts</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notifications.new_field_agent_alerts}
                        onChange={(e) => handleUpdateSetting<NotificationSettings, 'new_field_agent_alerts'>(
                          setNotifications,
                          'new_field_agent_alerts',
                          e.target.checked
                        )}
                    />
                    <div className="w-11 h-6 bg-white/20 rounded-full peer peer-checked:bg-pink-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>
        
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
