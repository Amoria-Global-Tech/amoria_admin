"use client";

import { JSX, useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
} from "recharts";
import { api } from '../../../api/jambolush/api-conn';

// TypeScript interfaces for host analytics
interface DayStats {
  date: string;
  registrations: number;
  revenue: number;
  formattedDate?: string;
  originalDate?: string;
}

interface HostRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  region: string;
  timezone: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  verificationStatus: 'verified' | 'pending' | 'unverified';
  propertiesCount: number;
  totalRevenue: number;
  totalBookings: number;
  rating: number;
  reviewsCount: number;
  joinedAt: string;
  lastActiveAt: string;
  profileCompleteness: number;
}

interface PerformingHost {
  hostId: string;
  hostName: string;
  revenue: number;
  bookings: number;
  properties: number;
  rating: number;
}

interface HostAnalyticsStats {
  totalHosts: number;
  activeHosts: number;
  pendingVerification: number;
  suspendedHosts: number;
  totalRevenue: number;
  averageRating: number;
  registrationsPerDay: DayStats[];
  topCountries: { country: string; count: number }[];
  topPerformingHosts: PerformingHost[];
  verificationStats: { verified: number; pending: number; unverified: number };
}

interface HostAnalyticsData {
  stats: HostAnalyticsStats;
  recentHosts: HostRecord[];
}

interface APIResponse {
  success: boolean;
  data: HostRecord[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    pages: number;
  };
}

type DateRange = "today" | "week" | "month" | "custom";
type ViewMode = "bar" | "line";

// Helper function to process raw host data into analytics
function processHostData(hosts: HostRecord[]): HostAnalyticsStats {
  // Group by date for daily registrations
  const dailyRegistrations = new Map<string, { registrations: number; revenue: number }>();
  const countryCount = new Map<string, number>();
  let totalRevenue = 0;
  let totalRatings = 0;
  let ratingCount = 0;

  hosts.forEach(host => {
    const date = host.joinedAt.split('T')[0];
    const existing = dailyRegistrations.get(date) || { registrations: 0, revenue: 0 };
    dailyRegistrations.set(date, { 
      registrations: existing.registrations + 1, 
      revenue: existing.revenue + host.totalRevenue 
    });
    
    if (host.country) {
      countryCount.set(host.country, (countryCount.get(host.country) || 0) + 1);
    }
    
    totalRevenue += host.totalRevenue;
    
    if (host.rating > 0) {
      totalRatings += host.rating;
      ratingCount++;
    }
  });

  // Convert to arrays and sort
  const registrationsPerDay = Array.from(dailyRegistrations.entries())
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const topCountries = Array.from(countryCount.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topPerformingHosts = hosts
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5)
    .map(host => ({
      hostId: host.id,
      hostName: host.name,
      revenue: host.totalRevenue,
      bookings: host.totalBookings,
      properties: host.propertiesCount,
      rating: host.rating
    }));

  const verificationStats = {
    verified: hosts.filter(h => h.verificationStatus === 'verified').length,
    pending: hosts.filter(h => h.verificationStatus === 'pending').length,
    unverified: hosts.filter(h => h.verificationStatus === 'unverified').length
  };

  return {
    totalHosts: hosts.length,
    activeHosts: hosts.filter(h => h.status === 'active').length,
    pendingVerification: hosts.filter(h => h.verificationStatus === 'pending').length,
    suspendedHosts: hosts.filter(h => h.status === 'suspended').length,
    totalRevenue,
    averageRating: ratingCount > 0 ? totalRatings / ratingCount : 0,
    registrationsPerDay,
    topCountries,
    topPerformingHosts,
    verificationStats
  };
}

// Generate mock data for fallback
function generateMockHostData(): HostRecord[] {
  const statuses: ('active' | 'inactive' | 'suspended' | 'pending')[] = ['active', 'inactive', 'suspended', 'pending'];
  const verificationStatuses: ('verified' | 'pending' | 'unverified')[] = ['verified', 'pending', 'unverified'];
  const countries = ['USA', 'Canada', 'UK', 'France', 'Germany', 'Spain', 'Italy', 'Australia'];
  const cities = ['New York', 'Los Angeles', 'London', 'Paris', 'Berlin', 'Madrid', 'Rome', 'Sydney'];
  const names = ['John Smith', 'Emma Wilson', 'Michael Brown', 'Sarah Davis', 'James Johnson', 'Lisa Garcia', 'David Miller', 'Ana Rodriguez'];

  return Array.from({ length: 50 }, (_, i) => ({
    id: `HOST${String(i + 1).padStart(5, '0')}`,
    name: names[Math.floor(Math.random() * names.length)],
    email: `host${i + 1}@example.com`,
    phone: `+1 555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
    country: countries[Math.floor(Math.random() * countries.length)],
    city: cities[Math.floor(Math.random() * cities.length)],
    region: 'Region',
    timezone: 'UTC',
    status: statuses[Math.floor(Math.random() * statuses.length)],
    verificationStatus: verificationStatuses[Math.floor(Math.random() * verificationStatuses.length)],
    propertiesCount: Math.floor(Math.random() * 10) + 1,
    totalRevenue: Math.floor(Math.random() * 50000) + 1000,
    totalBookings: Math.floor(Math.random() * 200) + 10,
    rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
    reviewsCount: Math.floor(Math.random() * 100) + 5,
    joinedAt: new Date(2025, Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1).toISOString(),
    lastActiveAt: new Date(2025, Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1).toISOString(),
    profileCompleteness: Math.floor(Math.random() * 40) + 60
  }));
}

// Fetch function for API
async function fetchHostAnalytics(start?: string, end?: string, limit = 500): Promise<HostAnalyticsData> {
  try {
    const params = new URLSearchParams();
    if (start) params.append('start_date', start);
    if (end) params.append('end_date', end);
    params.append('limit', limit.toString());
    
    const response = await api.get<HostRecord[]>(`/hosts/analytics?${params}`);
    
    if (response.success && response.data) {
      // Process the real data
      const stats = processHostData(response.data);
      const recentHosts = response.data.slice(0, 10);
      
      return { stats, recentHosts };
    } else {
      console.error('Failed to fetch host analytics:', response.error);
      throw new Error('API request failed');
    }
  } catch (error) {
    console.error('Error fetching host analytics:', error);
    
    // Return mock data structure on error
    const mockHosts = generateMockHostData();
    const stats = processHostData(mockHosts);
    const recentHosts = mockHosts.slice(0, 10);
    
    return { stats, recentHosts };
  }
}

// Format date for display
function formatDateLabel(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday'; 
  if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function HostAnalytics(): JSX.Element {
  const [analytics, setAnalytics] = useState<HostAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>("week");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("bar");

  async function loadData(range: DateRange): Promise<void> {
    setLoading(true);
    setError(null);
    
    try {
      let start: string | undefined, end: string | undefined;
      const now = new Date();

      switch (range) {
        case "today":
          start = end = now.toISOString().split("T")[0];
          break;
        case "week":
          end = now.toISOString().split("T")[0];
          start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
          break;
        case "month":
          end = now.toISOString().split("T")[0];
          start = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
          break;
        case "custom":
          start = customStart;
          end = customEnd;
          break;
      }

      const result = await fetchHostAnalytics(start, end);
      
      // Process chart data with proper date formatting
      const processedData = result.stats.registrationsPerDay.map((item: DayStats) => ({
        ...item,
        formattedDate: formatDateLabel(item.date),
        originalDate: item.date
      }));
      
      setAnalytics({
        ...result,
        stats: {
          ...result.stats,
          registrationsPerDay: processedData
        }
      });
    } catch (err) {
      setError('Failed to load host analytics data');
      console.error('Host analytics loading error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(dateRange);
  }, [dateRange, customStart, customEnd]);

  const handleDateRangeChange = (range: DateRange): void => {
    setDateRange(range);
  };

  const handleViewModeToggle = (): void => {
    setViewMode(viewMode === "bar" ? "line" : "bar");
  };

  const handleCustomStartChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setCustomStart(e.target.value);
  };

  const handleCustomEndChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setCustomEnd(e.target.value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8 text-white/70">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400"></div>
            <p className="mt-2">Loading host analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8">
            <div className="text-red-400 mb-2">⚠️ {error}</div>
            <button 
              onClick={() => loadData(dateRange)}
              className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8 text-white/70">No data available</div>
        </div>
      </div>
    );
  }

  const ChartComponent = viewMode === "line" ? LineChart : BarChart;
  const ChartElement = viewMode === "line" ? 
    <Line type="monotone" dataKey="registrations" stroke="#ec4899" strokeWidth={2} dot={{ fill: "#ec4899", r: 3 }} /> :
    <Bar dataKey="registrations" fill="#ec4899" radius={[2, 2, 0, 0]} />;

  const dailyAverage = analytics.stats.registrationsPerDay.length > 0 ? 
    Math.round(analytics.stats.registrationsPerDay.reduce((acc, day) => acc + day.registrations, 0) / analytics.stats.registrationsPerDay.length) : 0;
  const peakDay = analytics.stats.registrationsPerDay.length > 0 ? 
    Math.max(...analytics.stats.registrationsPerDay.map(d => d.registrations)) : 0;

  const dateRangeOptions: { value: DateRange; label: string }[] = [
    { value: "today", label: "Today" },
    { value: "week", label: "Week" },
    { value: "month", label: "Month" },
    { value: "custom", label: "Custom" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 text-white/40">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-white">Host Analytics</h1>
          <div className="flex gap-2">
            <button
              onClick={handleViewModeToggle}
              className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 rounded-md transition-colors text-white/70 hover:text-white"
              type="button"
            >
              {viewMode === "bar" ? "Line View" : "Bar View"}
            </button>
            <button
              onClick={() => loadData(dateRange)}
              className="px-3 py-1 text-xs bg-pink-500/20 hover:bg-pink-500/30 rounded-md transition-colors text-pink-300 hover:text-pink-200"
              type="button"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Date Range Controls */}
        <div className="flex flex-wrap gap-2 items-center">
          {dateRangeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleDateRangeChange(option.value)}
              className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                dateRange === option.value
                  ? "bg-pink-500 text-white shadow-sm"
                  : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
              }`}
              type="button"
            >
              {option.label}
            </button>
          ))}
          
          {dateRange === "custom" && (
            <div className="flex gap-2 ml-3 items-center text-sm">
              <input
                type="date"
                value={customStart}
                onChange={handleCustomStartChange}
                className="px-2 py-1 border border-white/20 bg-white/10 text-white rounded text-xs"
              />
              <span className="text-white/50">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={handleCustomEndChange}
                className="px-2 py-1 border border-white/20 bg-white/10 text-white rounded text-xs"
              />
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 rounded-xl p-4 shadow-lg">
            <div className="text-2xl font-bold text-pink-400">{analytics.stats.totalHosts}</div>
            <div className="text-sm text-white/60">Total Hosts</div>
          </div>
          <div className="bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 rounded-xl p-4 shadow-lg">
            <div className="text-2xl font-bold text-pink-400">{analytics.stats.activeHosts}</div>
            <div className="text-sm text-white/60">Active Hosts</div>
          </div>
          <div className="bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 rounded-xl p-4 shadow-lg">
            <div className="text-2xl font-bold text-pink-400">{dailyAverage}</div>
            <div className="text-sm text-white/60">Daily Average</div>
          </div>
          <div className="bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 rounded-xl p-4 shadow-lg">
            <div className="text-2xl font-bold text-pink-400">${analytics.stats.totalRevenue.toLocaleString()}</div>
            <div className="text-sm text-white/60">Total Revenue</div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-medium mb-4 text-white">Host Registrations</h3>
          {analytics.stats.registrationsPerDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <ChartComponent data={analytics.stats.registrationsPerDay}>
                <XAxis 
                  dataKey="formattedDate" 
                  stroke="#e2e8f0"
                  fontSize={12}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#e2e8f0" fontSize={12} />
                <Tooltip 
                  labelFormatter={(label: string, payload: any[]) => {
                    const item = payload?.[0]?.payload;
                    return item ? `${item.formattedDate} (${item.originalDate})` : label;
                  }}
                  contentStyle={{ 
                    backgroundColor: '#0b1c36', 
                    border: '1px solid #1e3a8a20',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#ffffff'
                  }}
                />
                {ChartElement}
              </ChartComponent>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-white/50">No data for selected period</div>
          )}
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Countries */}
          <div className="bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-medium mb-4 text-white">Top Countries</h3>
            <div className="space-y-2">
              {analytics.stats.topCountries.length > 0 ? 
                analytics.stats.topCountries.map((country, index) => (
                  <div key={country.country} className="flex justify-between items-center">
                    <span className="text-white/70">{index + 1}. {country.country}</span>
                    <span className="text-pink-400 font-medium">{country.count}</span>
                  </div>
                )) : 
                <div className="text-white/50 text-sm">No country data available</div>
              }
            </div>
          </div>

          {/* Verification Status */}
          <div className="bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-medium mb-4 text-white">Verification Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Verified</span>
                <span className="text-green-400 font-medium">{analytics.stats.verificationStats.verified}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Pending</span>
                <span className="text-yellow-400 font-medium">{analytics.stats.verificationStats.pending}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Unverified</span>
                <span className="text-gray-400 font-medium">{analytics.stats.verificationStats.unverified}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performing Hosts */}
        <div className="bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-medium mb-4 text-white">Top Performing Hosts</h3>
          <div className="space-y-3">
            {analytics.stats.topPerformingHosts.length > 0 ? 
              analytics.stats.topPerformingHosts.map((host, index) => (
                <div key={host.hostId} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-white">{index + 1}. {host.hostName}</div>
                    <div className="text-xs text-white/50">{host.hostId}</div>
                  </div>
                  <div className="flex-1 px-4">
                    <div className="text-xs text-white/70">{host.properties} properties</div>
                    <div className="text-xs text-white/50">{host.bookings} bookings</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-pink-400 font-medium">${host.revenue.toLocaleString()}</div>
                    <div className="text-xs text-white/60 flex items-center gap-1">
                      <i className="bi bi-star-fill text-yellow-400"></i>
                      {host.rating.toFixed(1)}
                    </div>
                  </div>
                </div>
              )) : 
              <div className="text-white/50 text-sm text-center py-4">No host performance data available</div>
            }
          </div>
        </div>

        {/* Recent Hosts */}
        <div className="bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-medium mb-4 text-white">Recent Registrations</h3>
          <div className="space-y-3">
            {analytics.recentHosts.length > 0 ? 
              analytics.recentHosts.map((host: HostRecord) => (
                <div key={host.id} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-white">{host.name}</div>
                    <div className="text-xs text-white/50">{host.email}</div>
                  </div>
                  <div className="flex-1 px-4">
                    <div className="text-xs text-white/70">{host.city}, {host.country}</div>
                    <div className="text-xs text-white/50">{host.propertiesCount} properties</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-white/60">
                      {new Date(host.joinedAt).toLocaleDateString()}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      host.status === 'active' ? 'bg-green-400/20 text-green-400' :
                      host.status === 'pending' ? 'bg-yellow-400/20 text-yellow-400' :
                      host.status === 'suspended' ? 'bg-red-400/20 text-red-400' :
                      'bg-gray-400/20 text-gray-400'
                    }`}>
                      {host.status}
                    </div>
                  </div>
                </div>
              )) : 
              <div className="text-white/50 text-sm text-center py-4">No recent hosts</div>
            }
          </div>
        </div>
      </div>
    </div>
  );
}