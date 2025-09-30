"use client";

import { JSX, useEffect, useState, useMemo } from "react";
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
import api from "./api/conn";

// TypeScript interfaces matching your API structure
interface DayStats {
  date: string;
  count: number;
  views: number;
  formattedDate?: string;
  originalDate?: string;
}

interface VisitorRecord {
  id: number;
  ipAddress: string | null;
  location: string;
  country: string;
  city: string;
  region: string;
  timezone: string;
  userAgent: string | null;
  pageUrl: string | null;
  referrer: string | null;
  sessionId: string | null;
  createdAt: string;
}

interface ProcessedVisit {
  id: number;
  ip: string;
  location: string;
  timestamp: string;
  page: string;
  duration: string;
  browser: string;
}

interface AnalyticsStats {
  total: number;
  perDay: DayStats[];
  uniqueVisitors: number;
  topCountries: { country: string; count: number }[];
  topPages: { page: string; count: number }[];
}

interface AnalyticsData {
  stats: AnalyticsStats;
  visits: ProcessedVisit[];
}

interface APIResponse {
  success: boolean;
  data: {
    data: VisitorRecord[];
  };
}

type DateRange = "today" | "week" | "month" | "all" | "custom";
type ViewMode = "bar" | "line";

// Helper function to extract browser from user agent
function getBrowserName(userAgent: string | null): string {
  if (!userAgent) return 'Unknown';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Other';
}

// Helper function to check if date is within range
function isDateInRange(date: Date, range: DateRange, customStart?: string, customEnd?: string): boolean {
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  
  const startOfToday = new Date(today);
  startOfToday.setHours(0, 0, 0, 0);
  
  const weekAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
  weekAgo.setHours(0, 0, 0, 0);
  
  const monthAgo = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
  monthAgo.setHours(0, 0, 0, 0);

  switch (range) {
    case "today":
      return date >= startOfToday && date <= today;
    case "week":
      return date >= weekAgo && date <= today;
    case "month":
      return date >= monthAgo && date <= today;
    case "custom":
      if (!customStart || !customEnd) return true;
      const start = new Date(customStart);
      const end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    case "all":
    default:
      return true;
  }
}

// Helper function to get date range bounds
function getDateRangeBounds(range: DateRange, customStart?: string, customEnd?: string): { start: Date; end: Date } {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  const startOfToday = new Date(today);
  startOfToday.setHours(0, 0, 0, 0);

  switch (range) {
    case "today":
      return { start: startOfToday, end: today };
    case "week":
      const weekAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
      weekAgo.setHours(0, 0, 0, 0);
      return { start: weekAgo, end: today };
    case "month":
      const monthAgo = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
      monthAgo.setHours(0, 0, 0, 0);
      return { start: monthAgo, end: today };
    case "custom":
      if (!customStart || !customEnd) {
        return { start: new Date(0), end: today };
      }
      const start = new Date(customStart);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    case "all":
    default:
      return { start: new Date(0), end: today };
  }
}

// Helper function to generate all dates in range
function generateDateRange(startDate: Date, endDate: Date): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

// Helper function to process raw visitor data into analytics with filtering
function processVisitorData(visitors: VisitorRecord[], dateRange: DateRange, customStart?: string, customEnd?: string): AnalyticsStats {
  const { start, end } = getDateRangeBounds(dateRange, customStart, customEnd);
  
  // Filter visitors based on date range
  const filteredVisitors = visitors.filter(visitor => {
    const visitDate = new Date(visitor.createdAt);
    return visitDate >= start && visitDate <= end;
  });

  // Generate all dates in the range to ensure complete chart data
  const allDatesInRange = dateRange === "all" ? [] : generateDateRange(start, end);
  
  // Group by date for daily stats
  const dailyStats = new Map<string, { count: number; views: number }>();
  const uniqueIPs = new Set<string>();
  const countryCount = new Map<string, number>();
  const pageCount = new Map<string, number>();

  // Initialize all dates in range with zero counts
  allDatesInRange.forEach(date => {
    dailyStats.set(date, { count: 0, views: 0 });
  });

  filteredVisitors.forEach(visitor => {
    const date = visitor.createdAt.split('T')[0];
    const existing = dailyStats.get(date) || { count: 0, views: 0 };
    dailyStats.set(date, { count: existing.count + 1, views: existing.views + 1 });
    
    if (visitor.ipAddress) {
      uniqueIPs.add(visitor.ipAddress);
    }
    
    if (visitor.country) {
      countryCount.set(visitor.country, (countryCount.get(visitor.country) || 0) + 1);
    }
    
    if (visitor.pageUrl) {
      pageCount.set(visitor.pageUrl, (pageCount.get(visitor.pageUrl) || 0) + 1);
    }
  });

  // Convert to arrays and sort
  const perDay = Array.from(dailyStats.entries())
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const topCountries = Array.from(countryCount.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topPages = Array.from(pageCount.entries())
    .map(([page, count]) => ({ page, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    total: filteredVisitors.length,
    perDay,
    uniqueVisitors: uniqueIPs.size,
    topCountries,
    topPages
  };
}

// Fetch function for API - now fetches all data
async function fetchAllAnalytics(): Promise<VisitorRecord[]> {
  try {
    const response = await api.get('/admin/analytics/visitors');
    if (!response.ok) throw new Error('API request failed');
    
    const apiData: APIResponse = await response.data;
    
    if (!apiData.success) {
      throw new Error('API returned error');
    }

    return apiData.data.data;
    
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return [];
  }
}

// Format date for display based on range
function formatDateLabel(dateString: string, dateRange: DateRange): string {
  const date = new Date(dateString);
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  // For today range, show hours
  if (dateRange === "today") {
    if (diffDays === 0) return 'Today';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  
  // For week range, show day names
  if (dateRange === "week") {
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  
  // For month and longer ranges, show dates
  if (dateRange === "month" || dateRange === "custom") {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  
  // For all time, show month/day or month/year for older dates
  const currentYear = today.getFullYear();
  const dateYear = date.getFullYear();
  
  if (dateYear === currentYear) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }
}

export default function VisitorAnalytics(): JSX.Element {
  const [allVisitors, setAllVisitors] = useState<VisitorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>("week");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("bar");

  // Load all data once on component mount
  async function loadAllData(): Promise<void> {
    setLoading(true);
    setError(null);
    
    try {
      const visitors = await fetchAllAnalytics();
      setAllVisitors(visitors);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics loading error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAllData();
  }, []);

  // Process analytics data based on current filters - using useMemo for performance
  const analytics = useMemo((): AnalyticsData => {
    if (allVisitors.length === 0) {
      return {
        stats: {
          total: 0,
          perDay: [],
          uniqueVisitors: 0,
          topCountries: [],
          topPages: []
        },
        visits: []
      };
    }

    // Filter visitors for recent visits display (last 10 from filtered data)
    const { start, end } = getDateRangeBounds(dateRange, customStart, customEnd);
    const filteredVisitors = allVisitors.filter(visitor => {
      const visitDate = new Date(visitor.createdAt);
      return visitDate >= start && visitDate <= end;
    });

    const stats = processVisitorData(allVisitors, dateRange, customStart, customEnd);
    
    // Process chart data with proper date formatting
    const processedPerDay = stats.perDay.map((item: DayStats) => ({
      ...item,
      formattedDate: formatDateLabel(item.date, dateRange),
      originalDate: item.date
    }));

    // Convert recent visitor records to processed visits
    const recentVisits: ProcessedVisit[] = filteredVisitors
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(visitor => {
        let locationStr = 'Unknown';
        try {
          if (visitor.location && visitor.location !== 'null') {
            const locationData = JSON.parse(visitor.location);
            locationStr = locationData.city && locationData.country 
              ? `${locationData.city}, ${locationData.country}`
              : locationData.country || 'Unknown';
          } else if (visitor.city && visitor.country) {
            locationStr = `${visitor.city}, ${visitor.country}`;
          } else if (visitor.country) {
            locationStr = visitor.country;
          }
        } catch {
          if (visitor.city && visitor.country) {
            locationStr = `${visitor.city}, ${visitor.country}`;
          } else if (visitor.country) {
            locationStr = visitor.country;
          }
        }

        return {
          id: visitor.id,
          ip: visitor.ipAddress || 'Unknown',
          location: locationStr,
          timestamp: visitor.createdAt,
          page: visitor.pageUrl || '/',
          duration: '0m 0s', // Duration not tracked in current schema
          browser: getBrowserName(visitor.userAgent)
        };
      });

    return {
      stats: {
        ...stats,
        perDay: processedPerDay
      },
      visits: recentVisits
    };
  }, [allVisitors, dateRange, customStart, customEnd]);

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
      <div className="space-y-6 text-white/40">
        <div className="text-center py-8 text-white/70">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400"></div>
          <p className="mt-2">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 text-white/40">
        <div className="text-center py-8">
          <div className="text-red-400 mb-2">⚠️ {error}</div>
          <button 
            onClick={loadAllData}
            className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const ChartComponent = viewMode === "line" ? LineChart : BarChart;
  const ChartElement = viewMode === "line" ? 
    <Line type="monotone" dataKey="count" stroke="#ec4899" strokeWidth={2} dot={{ fill: "#ec4899", r: 3 }} /> :
    <Bar dataKey="count" fill="#ec4899" radius={[2, 2, 0, 0]} />;

  const dailyAverage = analytics.stats.perDay.length > 0 ? 
    Math.round(analytics.stats.total / analytics.stats.perDay.length) : 0;
  const peakDay = analytics.stats.perDay.length > 0 ? 
    Math.max(...analytics.stats.perDay.map(d => d.count)) : 0;
  const totalDays = analytics.stats.perDay.length;

  const dateRangeOptions: { value: DateRange; label: string }[] = [
    { value: "today", label: "Today" },
    { value: "week", label: "Week" },
    { value: "month", label: "Month" },
    { value: "all", label: "All Time" },
    { value: "custom", label: "Custom" }
  ];

  return (
    <div className="space-y-6 text-white/40">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Visitor Analytics</h1>
        <div className="flex gap-2">
          <div className="text-xs text-white/50 px-3 py-1">
            {allVisitors.length} total records loaded
          </div>
          <button
            onClick={handleViewModeToggle}
            className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 rounded-md transition-colors text-white/70 hover:text-white"
            type="button"
          >
            {viewMode === "bar" ? "Line View" : "Bar View"}
          </button>
          <button
            onClick={loadAllData}
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
          <div className="text-2xl font-bold text-pink-400">{analytics.stats.total}</div>
          <div className="text-sm text-white/60">Total Visits</div>
        </div>
        <div className="bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 rounded-xl p-4 shadow-lg">
          <div className="text-2xl font-bold text-pink-400">{analytics.stats.uniqueVisitors}</div>
          <div className="text-sm text-white/60">Unique Visitors</div>
        </div>
        <div className="bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 rounded-xl p-4 shadow-lg">
          <div className="text-2xl font-bold text-pink-400">{dailyAverage}</div>
          <div className="text-sm text-white/60">Daily Average</div>
        </div>
        <div className="bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 rounded-xl p-4 shadow-lg">
          <div className="text-2xl font-bold text-pink-400">{totalDays}</div>
          <div className="text-sm text-white/60">Days in Range</div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-medium mb-4 text-white">Visitor Trends</h3>
        {analytics.stats.perDay.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <ChartComponent data={analytics.stats.perDay}>
              <XAxis 
                dataKey="formattedDate" 
                stroke="#e2e8f0"
                fontSize={10}
                interval={dateRange === "today" ? 0 : dateRange === "week" ? 0 : 'preserveStartEnd'}
                angle={dateRange === "month" || dateRange === "custom" ? -45 : 0}
                textAnchor={dateRange === "month" || dateRange === "custom" ? "end" : "middle"}
                height={dateRange === "month" || dateRange === "custom" ? 60 : 40}
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

        {/* Top Pages */}
        <div className="bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-medium mb-4 text-white">Top Pages</h3>
          <div className="space-y-2">
            {analytics.stats.topPages.length > 0 ? 
              analytics.stats.topPages.map((page, index) => (
                <div key={page.page} className="flex justify-between items-center">
                  <span className="text-white/70 truncate max-w-40">{index + 1}. {page.page}</span>
                  <span className="text-pink-400 font-medium">{page.count}</span>
                </div>
              )) : 
              <div className="text-white/50 text-sm">No page data available</div>
            }
          </div>
        </div>
      </div>

      {/* Recent Visits */}
      <div className="bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-medium mb-4 text-white">Recent Visitors ({dateRange})</h3>
        <div className="space-y-3">
          {analytics.visits.length > 0 ? 
            analytics.visits.map((visit: ProcessedVisit) => (
              <div key={visit.id} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                <div className="flex-1">
                  <div className="font-medium text-sm text-white">{visit.location}</div>
                  <div className="text-xs text-white/50">{visit.ip}</div>
                </div>
                <div className="flex-1 px-4">
                  <div className="text-xs text-white/70 truncate max-w-32">
                    {visit.page}
                  </div>
                  <div className="text-xs text-white/50">{visit.browser}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-white/60">
                    {new Date(visit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-xs text-white/50">
                    {new Date(visit.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )) : 
            <div className="text-white/50 text-sm text-center py-4">No recent visitors</div>
          }
        </div>
      </div>
    </div>
  );
}