"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface UserInfo {
  id: number;
  username: string;
  fullName: string;
  role: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const navItems = [
    { href: "/", label: "Overview", icon: "bi bi-bar-chart-line" },
    { href: "/products", label: "Products", icon: "bi bi-box-seam" },
    { href: "/services", label: "Services", icon: "bi bi-gear-wide-connected" },
    { href: "/messages", label: "Messages", icon: "bi bi-chat-dots" },
  ];

  // Fetch unread messages count
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/contact_messages', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        // Use same logic as MessagesPage - filter messages with status "new"
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
    const checkAuth = () => {
      try {
        // Check for authentication in localStorage
        const isAuthenticated = localStorage.getItem('authenticated');
        const userInfoData = localStorage.getItem('userInfo');

        if (!isAuthenticated || isAuthenticated !== 'true') {
          router.push('/auth');
          return;
        }

        // Get user info from localStorage
        if (userInfoData) {
          const parsedUserInfo = JSON.parse(userInfoData);
          setUserInfo(parsedUserInfo);
          
          // Fetch unread messages count after authentication
          fetchUnreadCount();
        } else {
          // If no user info found, redirect to auth
          router.push('/auth');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        // Clear potentially corrupted data
        localStorage.removeItem('authenticated');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userInfo');
        router.push('/auth');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Refresh unread count periodically (every 30 seconds)
  useEffect(() => {
    if (!userInfo) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [userInfo, unreadCount]);

  // Auto-hide navbar on mobile when user scrolls or touches outside
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
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
      // Get user info before clearing localStorage
      const userInfoData = localStorage.getItem('userInfo');
      let userData = null;
      
      if (userInfoData) {
        try {
          userData = JSON.parse(userInfoData);
        } catch (parseError) {
          console.warn('Failed to parse user data for logout:', parseError);
        }
      }

      // Clear all localStorage data first (immediate logout)
      localStorage.removeItem('authenticated');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('authOTP');
      localStorage.removeItem('otpTimestamp');
      
      // Make API call to logout on server side (with user info)
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
        // Continue with client-side logout even if server call fails
      }
      
      // Redirect to auth page
      router.push('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if there's an error
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
          text-white p-6 flex flex-col z-40
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
              {userInfo?.fullName || userInfo?.username || 'User'}
            </h3>
            <p className="text-xs text-pink-400 font-medium truncate">
              {userInfo?.role || 'Team Member'}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1">
          <h2 className="text-sm font-semibold text-white/50 mb-4 uppercase tracking-wide">
            Company Dashboard
          </h2>
          <ul className="space-y-1">
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