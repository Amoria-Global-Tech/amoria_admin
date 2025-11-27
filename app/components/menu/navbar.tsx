"use client";

import api from "@/app/api/conn";
import Cookies from "js-cookie";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface UserInfo {
  id: number;
  userType: string;
  name: string;
  email: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  
  // Dropdown states
  const [jamboLushOpen, setJamboLushOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Overview", icon: "bi bi-bar-chart-line" },
    { href: "/products", label: "Products", icon: "bi bi-box-seam" },
    { href: "/services", label: "Services", icon: "bi bi-gear-wide-connected" },
    { href: "/messages", label: "Messages", icon: "bi bi-chat-dots" },
  ];

  // Simplified JamboLush navigation structure
  const jamboLushItems = [
    { href: "/jambolush/users", label: "Users", icon: "bi bi-people" },
    { href: "/jambolush/properties", label: "Properties", icon: "bi bi-house-door" },
    { href: "/jambolush/tours", label: "Tours", icon: "bi bi-map" },
    { href: "/jambolush/payments", label: "Payments", icon: "bi bi-credit-card" },
    { href: "/jambolush/bookings", label: "Bookings", icon: "bi bi-calendar-check" },
    { href: "/jambolush/inquiries", label: "Inquiries", icon: "bi bi-ticket" },
    { href: "/jambolush/settings", label: "Settings", icon: "bi bi-gear" },
    { href: "/jambolush/contracts", label: "Contracts", icon: "bi bi-file-earmark-text" },
    { href: "/jambolush/admins", label: "Admins", icon: "bi bi-shield-check" },
    { href: "/jambolush/inbox", label: "Inbox", icon: "bi bi-inbox" },
  ];

  // Check if current path is within JamboLush sections
  const isJamboLushPath = pathname.startsWith('/jambolush');

  // Auto-expand dropdowns based on current path
  useEffect(() => {
    if (pathname.startsWith('/jambolush')) {
      setJamboLushOpen(true);
    }
  }, [pathname]);

  // Fetch unread messages count
  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/admin/content/contacts');

      if (response.ok) {
        const result = await response.data;
        const newMessages = result.data?.filter((message: any) => 
          message.status === "new"
        ) || [];
        
        setUnreadCount(newMessages.length);
      } else {
        console.warn('Failed to fetch contact messages');
      }
    } catch (error) {
      console.error('Error fetching contact messages:', error);
    }
  };

  // Check authentication status and get user info
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Fix the typo: 'autToken' -> 'authToken'
        const authToken = localStorage.getItem('authToken');
        
        // Check if user is authenticated (has a token)
        if (!authToken) {
          router.push('/auth');
          return;
        }

        // Set the auth token for the API instance
        api.setAuth(authToken);

        try {
          // Make the API call to verify the token and get user info
          const response: any = await api.get("/auth/me");

           if (response.data) {
            // If your API returns user directly in response
            setUserInfo(response.data);
            fetchUnreadCount();
          } else {
            // Invalid response structure
            throw new Error('Invalid user data structure');
          }
        } catch (apiError: any) {
          console.error('API Error:', apiError);
          
          // Check if it's a 401 (Unauthorized) error
          if (apiError.response?.status === 401) {
            // Clear auth data and redirect to login
            localStorage.removeItem('authenticated');
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userInfo');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('authOTP');
            localStorage.removeItem('otpTimestamp');
            router.push('/auth');
            return;
          }
          
          // For other errors, log but don't necessarily redirect
          console.error('Auth check failed:', apiError.message);
          // You could set an error state here if needed
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        // Clear auth data and redirect for critical errors
        localStorage.removeItem('authenticated');
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('authOTP');
        localStorage.removeItem('otpTimestamp');
        router.push('/auth');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Refresh unread count periodically
  useEffect(() => {
    if (!userInfo) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 10000);

    return () => clearInterval(interval);
  }, [userInfo, unreadCount]);

  // Auto-hide navbar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const sidebar = document.getElementById('sidebar');
      const toggleButton = document.getElementById('toggle-button');
      
      if (
        isOpen && 
        sidebar && 
        !sidebar.contains(target) && 
        toggleButton && 
        !toggleButton.contains(target) &&
        window.innerWidth < 1024
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      if (isOpen && window.innerWidth < 1024) {
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isOpen]);

  // Handle logout
  const handleLogout = async () => {
    try {
      const userInfoData = localStorage.getItem('userInfo');
      let userData = null;
      
      if (userInfoData) {
        try {
          userData = JSON.parse(userInfoData);
        } catch (parseError) {
          console.warn('Failed to parse user data for logout:', parseError);
        }
      }

      localStorage.removeItem('authenticated');
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('authOTP');
      localStorage.removeItem('otpTimestamp');

      // Clear cookies
      Cookies.remove('authToken');
      Cookies.remove('refreshToken');

      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: userData?.username,
            userId: userData?.id
          })
        });
      } catch (apiError) {
        console.warn('Server logout failed:', apiError);
      }

      router.push('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/auth');
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="fixed top-0 left-0 h-screen w-72 bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border-r border-blue-900/20 shadow-2xl flex items-center justify-center z-40">
        <div className="animate-spin w-8 h-8 border-2 border-white/30 border-t-white rounded-full"></div>
      </div>
    );
  }

  return (
    <>
      {/* Toggle Button - Mobile Only */}
      <button
        id="toggle-button"
        className="lg:hidden fixed top-4 right-4 z-50 text-2xl text-white bg-[#0b1c36] bg-opacity-70 backdrop-blur-sm p-2 rounded-md shadow-md hover:bg-opacity-90 transition-all"
        onClick={() => setIsOpen(!isOpen)}
      >
        <i className={`bi ${isOpen ? 'bi-x' : 'bi-list'}`}></i>
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 backdrop-brightness-50 backdrop-blur-sm bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        id="sidebar"
        className={`fixed top-0 left-0 h-screen w-72 
          bg-gradient-to-b from-[#0b1c36] to-[#13294b] 
          bg-opacity-90 backdrop-blur-xl border-r border-blue-900/20 shadow-2xl 
          text-white p-6 flex flex-col z-40 overflow-y-auto
          transition-transform duration-300 ease-in-out
          ${
            isOpen
              ? "translate-x-0"
              : "translate-x-[-100%] lg:translate-x-0"
          }`}
      >
        {/* Profile Section */}
        <div className="flex items-center space-x-4 mb-10">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-pink-500 rounded-full flex items-center justify-center border-2 border-white/40 shadow-lg">
              <i className="bi bi-person text-white text-xl"></i>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white/60">Welcome</p>
            <h3 className="text-lg font-semibold text-white truncate">
              {userInfo?.name|| 'User'}
            </h3>
            <p className="text-xs text-pink-400 font-medium truncate">
              {userInfo?.userType || 'Team Member'}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1">
          <h2 className="text-sm font-semibold text-white/50 mb-4 uppercase tracking-wide">
            Company Dashboard
          </h2>
          <ul className="space-y-1">
            {/* Regular Navigation Items */}
            {navItems.map(({ href, label, icon }) => (
              <li key={href}>
                <Link href={href}>
                  <div
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-sm font-medium cursor-pointer transition-all group
                      ${
                        pathname === href
                          ? "bg-gradient-to-r from-pink-400/20 to-pink-500/20 text-white font-semibold shadow-inner border border-pink-400/30"
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <i className={`${icon} text-lg ${pathname === href ? 'text-pink-400' : 'group-hover:text-pink-300'}`}></i>
                      {label}
                    </div>
                    {label === 'Messages' && unreadCount > 0 && (
                      <span className="text-white bg-red-500 px-2 py-1 text-xs rounded-full shadow-lg animate-pulse min-w-[20px] text-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}

            {/* JamboLush Dropdown */}
            <li>
              <div
                onClick={() => setJamboLushOpen(!jamboLushOpen)}
                className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-sm font-medium cursor-pointer transition-all group
                  ${
                    isJamboLushPath
                      ? "bg-gradient-to-r from-pink-400/20 to-pink-500/20 text-white font-semibold shadow-inner border border-pink-400/30"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <i className={`bi bi-building text-lg ${isJamboLushPath ? 'text-pink-400' : 'group-hover:text-pink-300'}`}></i>
                  JamboLush
                </div>
                <i className={`bi bi-chevron-${jamboLushOpen ? 'down' : 'right'} text-sm transition-transform`}></i>
              </div>

              {/* JamboLush Dropdown Content */}
              {jamboLushOpen && (
                <ul className="mt-2 ml-4 space-y-1 border-l border-white/10 pl-4">
                  {jamboLushItems.map(({ href, label, icon }) => (
                    <li key={href}>
                      <Link href={href}>
                        <div
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all
                            ${
                              pathname === href
                                ? "bg-pink-400/20 text-pink-300 font-semibold"
                                : "text-white/70 hover:bg-white/10 hover:text-white"
                            }`}
                        >
                          <i className={`${icon} text-sm`}></i>
                          {label}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          </ul>

          {/* User Actions */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <h3 className="text-sm font-semibold text-white/50 mb-3 uppercase tracking-wide">
              Account
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/profile');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all group"
              >
                <i className="bi bi-person-gear text-lg group-hover:text-blue-300"></i>
                Profile Settings
              </button>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/70 hover:bg-red-500/20 hover:text-red-300 transition-all group"
              >
                <i className="bi bi-box-arrow-right text-lg group-hover:text-red-300"></i>
                Sign Out
              </button>
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="text-xs text-white/40 text-center">
            <p>&copy; {new Date().getFullYear()} <span className="text-white font-medium">Amoria</span></p>
            <p className="mt-1">All rights reserved.</p>
          </div>
        </div>
      </aside>
    </>
  );
}