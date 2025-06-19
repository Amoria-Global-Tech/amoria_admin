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
  ip_address: string;
  country: string;
  city: string;
  region: string;
  timezone: string;
  page_url: string;
  referrer: string;
  created_at: string;
  user_agent: string;
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
  data: VisitorRecord[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    pages: number;
  };
}

type DateRange = "today" | "week" | "month" | "custom";
type ViewMode = "bar" | "line";

// Helper function to extract browser from user agent
function getBrowserName(userAgent: string): string {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Other';
}

// Helper function to process raw visitor data into analytics
function processVisitorData(visitors: VisitorRecord[]): AnalyticsStats {
  // Group by date for daily stats
  const dailyStats = new Map<string, { count: number; views: number }>();
  const uniqueIPs = new Set<string>();
  const countryCount = new Map<string, number>();
  const pageCount = new Map<string, number>();

  visitors.forEach(visitor => {
    const date = visitor.created_at.split('T')[0];
    const existing = dailyStats.get(date) || { count: 0, views: 0 };
    dailyStats.set(date, { count: existing.count + 1, views: existing.views + 1 });
    
    uniqueIPs.add(visitor.ip_address);
    
    if (visitor.country) {
      countryCount.set(visitor.country, (countryCount.get(visitor.country) || 0) + 1);
    }
    
    if (visitor.page_url) {
      // page_url is already a path like /about, so use it directly
      pageCount.set(visitor.page_url, (pageCount.get(visitor.page_url) || 0) + 1);
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
    total: visitors.length,
    perDay,
    uniqueVisitors: uniqueIPs.size,
    topCountries,
    topPages
  };
}

// Fetch function for API
async function fetchAnalytics(start?: string, end?: string, limit = 500): Promise<AnalyticsData> {
  try {
    const params = new URLSearchParams();
    if (start) params.append('start_date', start);
    if (end) params.append('end_date', end);
    params.append('limit', limit.toString());
    
    const response = await fetch(`/api/overview?${params}`);
    if (!response.ok) throw new Error('API request failed');
    
    const apiData: APIResponse = await response.json();
    
    if (!apiData.success) {
      throw new Error('API returned error');
    }

    // Process the raw data
    const stats = processVisitorData(apiData.data);
    
    // Convert visitor records to processed visits
    const visits: ProcessedVisit[] = apiData.data.slice(0, 10).map(visitor => ({
      id: visitor.id,
      ip: visitor.ip_address,
      location: visitor.city && visitor.country ? `${visitor.city}, ${visitor.country}` : 
                visitor.country || 'Unknown',
      timestamp: visitor.created_at,
      page: visitor.page_url,
      duration: '0m 0s', // Duration not tracked in current schema
      browser: getBrowserName(visitor.user_agent)
    }));

    return { stats, visits };
    
  } catch (error) {
    console.error('Error fetching analytics:', error);
    
    // Return empty data structure on error
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

export default function VisitorAnalytics(): JSX.Element {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
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

      const result = await fetchAnalytics(start, end);
      
      // Process chart data with proper date formatting
      const processedData = result.stats.perDay.map((item: DayStats) => ({
        ...item,
        formattedDate: formatDateLabel(item.date),
        originalDate: item.date
      }));
      
      setAnalytics({
        ...result,
        stats: {
          ...result.stats,
          perDay: processedData
        }
      });
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics loading error:', err);
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
            onClick={() => loadData(dateRange)}
            className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return <div className="text-center py-8 text-white/70">No data available</div>;
  }

  const ChartComponent = viewMode === "line" ? LineChart : BarChart;
  const ChartElement = viewMode === "line" ? 
    <Line type="monotone" dataKey="count" stroke="#ec4899" strokeWidth={2} dot={{ fill: "#ec4899", r: 3 }} /> :
    <Bar dataKey="count" fill="#ec4899" radius={[2, 2, 0, 0]} />;

  const dailyAverage = analytics.stats.perDay.length > 0 ? 
    Math.round(analytics.stats.perDay.reduce((acc, day) => acc + day.count, 0) / analytics.stats.perDay.length) : 0;
  const peakDay = analytics.stats.perDay.length > 0 ? 
    Math.max(...analytics.stats.perDay.map(d => d.count)) : 0;

  const dateRangeOptions: { value: DateRange; label: string }[] = [
    { value: "today", label: "Today" },
    { value: "week", label: "Week" },
    { value: "month", label: "Month" },
    { value: "custom", label: "Custom" }
  ];

  return (
    <div className="space-y-6 text-white/40">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Visitor Analytics</h1>
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
          <div className="text-2xl font-bold text-pink-400">{peakDay}</div>
          <div className="text-sm text-white/60">Peak Day</div>
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
        <h3 className="text-lg font-medium mb-4 text-white">Recent Visitors</h3>
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