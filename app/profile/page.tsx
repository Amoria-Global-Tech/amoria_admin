"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: number;
  full_name: string;
  role: string;
  bio: string;
  email: string;
  phone_number: string;
  photo_url: string;
  username: string;
  last_login: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Check authentication
        const isAuthenticated = localStorage.getItem('authenticated');
        const userInfo = localStorage.getItem('userInfo');

        if (!isAuthenticated || isAuthenticated !== 'true') {
          router.push('/auth');
          return;
        }

        if (!userInfo) {
          router.push('/auth');
          return;
        }

        const userData = JSON.parse(userInfo);
        
        // Fetch complete user profile from database
        const response = await fetch(`/api/auth/profile/${userData.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }

        const result = await response.json();

        if (result.success) {
          setUserProfile(result.user);
        } else {
          setError(result.message || 'Failed to load profile');
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
        setError('Unable to load profile. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-2xl rounded-2xl p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-white/30 border-t-white rounded-full mr-3"></div>
            <span className="text-white">Loading profile...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-red-500/20 shadow-2xl rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="bi bi-exclamation-triangle text-red-400 text-2xl"></i>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Profile</h2>
          <p className="text-white/70 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white px-6 py-2 rounded-xl font-semibold transition-all"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return null;
  }

  return (
    <div className="">
      <div className="">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                My Profile
              </h1>
              <p className="text-white/70">
                View and manage your account information
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2"
            >
              <i className="bi bi-arrow-left"></i>
              Back
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-2xl rounded-2xl p-6 text-center">
              {/* Profile Picture */}
              <div className="relative mb-6">
                {userProfile.photo_url ? (
                  <img
                    src={userProfile.photo_url}
                    alt={userProfile.full_name}
                    className="w-24 h-24 rounded-full mx-auto border-4 border-pink-400/30 shadow-lg object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-r from-pink-400 to-pink-500 rounded-full mx-auto border-4 border-pink-400/30 shadow-lg flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      {getInitials(userProfile.full_name)}
                    </span>
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 border-4 border-white rounded-full flex items-center justify-center">
                  <i className="bi bi-check text-white text-sm"></i>
                </div>
              </div>

              {/* Basic Info */}
              <h2 className="text-xl font-bold text-white mb-1">
                {userProfile.full_name}
              </h2>
              <p className="text-pink-400 font-medium mb-1">
                {userProfile.role}
              </p>
              <p className="text-white/60 text-sm mb-4">
                @{userProfile.username}
              </p>

              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/30 text-green-300 px-3 py-1 rounded-full text-sm font-medium mb-6">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Active Account
              </div>

              {/* Bio */}
              {userProfile.bio && (
                <div className="text-left">
                  <h3 className="text-white font-semibold mb-2">About</h3>
                  <p className="text-white/70 text-sm leading-relaxed">
                    {userProfile.bio}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-2xl rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Personal Information</h3>
                <button
                  disabled
                  className="bg-gray-400/20 border border-gray-400/30 text-gray-400 px-4 py-2 rounded-xl font-medium cursor-not-allowed flex items-center gap-2"
                >
                  <i className="bi bi-pencil"></i>
                  Edit (Disabled)
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={userProfile.full_name}
                    disabled
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white cursor-not-allowed opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={userProfile.username}
                    disabled
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white cursor-not-allowed opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={userProfile.email}
                    disabled
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white cursor-not-allowed opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={userProfile.phone_number || 'Not provided'}
                    disabled
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white cursor-not-allowed opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    value={userProfile.role}
                    disabled
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white cursor-not-allowed opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">
                    Photo URL
                  </label>
                  <input
                    type="url"
                    value={userProfile.photo_url || 'No photo uploaded'}
                    disabled
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white cursor-not-allowed opacity-60"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-white/80 text-sm font-semibold mb-2">
                  Bio
                </label>
                <textarea
                  value={userProfile.bio || 'No bio provided'}
                  disabled
                  rows={4}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white cursor-not-allowed opacity-60 resize-none"
                />
              </div>
            </div>

            {/* Account Activity */}
            <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-2xl rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-6">Account Activity</h3>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-400/20 rounded-lg flex items-center justify-center">
                      <i className="bi bi-clock text-blue-400"></i>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Last Login</h4>
                      <p className="text-white/60 text-sm">
                        {formatDate(userProfile.last_login)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-green-400/20 rounded-lg flex items-center justify-center">
                      <i className="bi bi-calendar-plus text-green-400"></i>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Member Since</h4>
                      <p className="text-white/60 text-sm">
                        {formatDate(userProfile.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-yellow-400/20 rounded-lg flex items-center justify-center">
                      <i className="bi bi-pencil-square text-yellow-400"></i>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Last Updated</h4>
                      <p className="text-white/60 text-sm">
                        {formatDate(userProfile.updated_at)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-pink-400/20 rounded-lg flex items-center justify-center">
                      <i className="bi bi-hash text-pink-400"></i>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">User ID</h4>
                      <p className="text-white/60 text-sm">
                        #{userProfile.id}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}