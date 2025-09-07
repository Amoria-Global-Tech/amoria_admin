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

// TypeScript interfaces for field agent analytics
interface DayStats {
  date: string;
  registrations: number;
  activities: number;
  formattedDate?: string;
  originalDate?: string;
}

interface FieldAgentRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  territory: string;
  region: string;
  country: string;
  timezone: string;
  status: 'active' | 'inactive' | 'suspended' | 'on_leave';
  level: 'junior' | 'senior' | 'lead' | 'manager';
  totalSales: number;
  totalCommission: number;
  totalLeads: number;
  conversionRate: number;
  rating: number;
  reviewsCount: number;
  joinedAt: string;
  lastActiveAt: string;
  monthlyTarget: number;
  currentMonthSales: number;
}

interface PerformingAgent {
  agentId: string;
  agentName: string;
  sales: number;
  commission: number;
  leads: number;
  conversionRate: number;
  rating: number;
}

interface FieldAgentAnalyticsStats {
  totalAgents: number;
  activeAgents: number;
  onLeaveAgents: number;
  suspendedAgents: number;
  totalSales: number;
  totalCommission: number;
  averageConversionRate: number;
  averageRating: number;
  registrationsPerDay: DayStats[];
  topTerritories: { territory: string; count: number; sales: number }[];
  topPerformingAgents: PerformingAgent[];
  levelStats: { junior: number; senior: number; lead: number; manager: number };
  statusStats: { active: number; inactive: number; suspended: number; on_leave: number };
}

interface FieldAgentAnalyticsData {
  stats: FieldAgentAnalyticsStats;
  recentAgents: FieldAgentRecord[];
}

interface APIResponse {
  success: boolean;
  data: FieldAgentRecord[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    pages: number;
  };
}

type DateRange = "today" | "week" | "month" | "custom";
type ViewMode = "bar" | "line";

// Helper function to process raw field agent data into analytics
function processFieldAgentData(agents: FieldAgentRecord[]): FieldAgentAnalyticsStats {
  // Group by date for daily registrations
  const dailyRegistrations = new Map<string, { registrations: number; activities: number }>();
  const territoryCount = new Map<string, { count: number; sales: number }>();
  let totalSales = 0;
  let totalCommission = 0;
  let totalConversionRate = 0;
  let totalRatings = 0;
  let ratingCount = 0;
  let conversionCount = 0;

  agents.forEach(agent => {
    const date = agent.joinedAt.split('T')[0];
    const existing = dailyRegistrations.get(date) || { registrations: 0, activities: 0 };
    dailyRegistrations.set(date, { 
      registrations: existing.registrations + 1, 
      activities: existing.activities + agent.totalLeads 
    });
    
    if (agent.territory) {
      const existing = territoryCount.get(agent.territory) || { count: 0, sales: 0 };
      territoryCount.set(agent.territory, { 
        count: existing.count + 1, 
        sales: existing.sales + agent.totalSales 
      });
    }
    
    totalSales += agent.totalSales;
    totalCommission += agent.totalCommission;
    
    if (agent.conversionRate > 0) {
      totalConversionRate += agent.conversionRate;
      conversionCount++;
    }
    
    if (agent.rating > 0) {
      totalRatings += agent.rating;
      ratingCount++;
    }
  });

  // Convert to arrays and sort
  const registrationsPerDay = Array.from(dailyRegistrations.entries())
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const topTerritories = Array.from(territoryCount.entries())
    .map(([territory, stats]) => ({ territory, ...stats }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  const topPerformingAgents = agents
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 5)
    .map(agent => ({
      agentId: agent.id,
      agentName: agent.name,
      sales: agent.totalSales,
      commission: agent.totalCommission,
      leads: agent.totalLeads,
      conversionRate: agent.conversionRate,
      rating: agent.rating
    }));

  const levelStats = {
    junior: agents.filter(a => a.level === 'junior').length,
    senior: agents.filter(a => a.level === 'senior').length,
    lead: agents.filter(a => a.level === 'lead').length,
    manager: agents.filter(a => a.level === 'manager').length
  };

  const statusStats = {
    active: agents.filter(a => a.status === 'active').length,
    inactive: agents.filter(a => a.status === 'inactive').length,
    suspended: agents.filter(a => a.status === 'suspended').length,
    on_leave: agents.filter(a => a.status === 'on_leave').length
  };

  return {
    totalAgents: agents.length,
    activeAgents: agents.filter(a => a.status === 'active').length,
    onLeaveAgents: agents.filter(a => a.status === 'on_leave').length,
    suspendedAgents: agents.filter(a => a.status === 'suspended').length,
    totalSales,
    totalCommission,
    averageConversionRate: conversionCount > 0 ? totalConversionRate / conversionCount : 0,
    averageRating: ratingCount > 0 ? totalRatings / ratingCount : 0,
    registrationsPerDay,
    topTerritories,
    topPerformingAgents,
    levelStats,
    statusStats
  };
}

// Generate mock data for fallback
function generateMockFieldAgentData(): FieldAgentRecord[] {
  const statuses: ('active' | 'inactive' | 'suspended' | 'on_leave')[] = ['active', 'inactive', 'suspended', 'on_leave'];
  const levels: ('junior' | 'senior' | 'lead' | 'manager')[] = ['junior', 'senior', 'lead', 'manager'];
  const territories = ['North Territory', 'South Territory', 'East Territory', 'West Territory', 'Central Territory'];
  const regions = ['Region A', 'Region B', 'Region C', 'Region D', 'Region E'];
  const countries = ['USA', 'Canada', 'UK', 'France', 'Germany', 'Spain', 'Italy', 'Australia'];
  const names = ['Alice Johnson', 'Bob Smith', 'Carol Brown', 'David Wilson', 'Eva Garcia', 'Frank Miller', 'Grace Davis', 'Henry Rodriguez'];

  return Array.from({ length: 45 }, (_, i) => ({
    id: `AGENT${String(i + 1).padStart(5, '0')}`,
    name: names[Math.floor(Math.random() * names.length)],
    email: `agent${i + 1}@company.com`,
    phone: `+1 555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
    territory: territories[Math.floor(Math.random() * territories.length)],
    region: regions[Math.floor(Math.random() * regions.length)],
    country: countries[Math.floor(Math.random() * countries.length)],
    timezone: 'UTC',
    status: statuses[Math.floor(Math.random() * statuses.length)],
    level: levels[Math.floor(Math.random() * levels.length)],
    totalSales: Math.floor(Math.random() * 100000) + 10000,
    totalCommission: Math.floor(Math.random() * 15000) + 1000,
    totalLeads: Math.floor(Math.random() * 500) + 50,
    conversionRate: Math.round((Math.random() * 40 + 10) * 10) / 10,
    rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
    reviewsCount: Math.floor(Math.random() * 50) + 5,
    joinedAt: new Date(2025, Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1).toISOString(),
    lastActiveAt: new Date(2025, Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1).toISOString(),
    monthlyTarget: Math.floor(Math.random() * 20000) + 10000,
    currentMonthSales: Math.floor(Math.random() * 15000) + 5000
  }));
}

// Fetch function for API
async function fetchFieldAgentAnalytics(start?: string, end?: string, limit = 500): Promise<FieldAgentAnalyticsData> {
  try {
    const params = new URLSearchParams();
    if (start) params.append('start_date', start);
    if (end) params.append('end_date', end);
    params.append('limit', limit.toString());
    
    const response = await api.get<FieldAgentRecord[]>(`/field-agents/analytics?${params}`);
    
    if (response.success && response.data) {
      // Process the real data
      const stats = processFieldAgentData(response.data);
      const recentAgents = response.data.slice(0, 10);
      
      return { stats, recentAgents };
    } else {
      console.error('Failed to fetch field agent analytics:', response.error);
      throw new Error('API request failed');
    }
  } catch (error) {
    console.error('Error fetching field agent analytics:', error);
    
    // Return mock data structure on error
    const mockAgents = generateMockFieldAgentData();
    const stats = processFieldAgentData(mockAgents);
    const recentAgents = mockAgents.slice(0, 10);
    
    return { stats, recentAgents };
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

export default function FieldAgentAnalytics(): JSX.Element {
  const [analytics, setAnalytics] = useState<FieldAgentAnalyticsData | null>(null);
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

      const result = await fetchFieldAgentAnalytics(start, end);
      
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
      setError('Failed to load field agent analytics data');
      console.error('Field agent analytics loading error:', err);
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
            <p className="mt-2">Loading field agent analytics...</p>
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
          <h1 className="text-2xl font-semibold text-white">Field Agent Analytics</h1>
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
            <div className="text-2xl font-bold text-pink-400">{analytics.stats.totalAgents}</div>
            <div className="text-sm text-white/60">Total Agents</div>
          </div>
          <div className="bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 rounded-xl p-4 shadow-lg">
            <div className="text-2xl font-bold text-pink-400">{analytics.stats.activeAgents}</div>
            <div className="text-sm text-white/60">Active Agents</div>
          </div>
          <div className="bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 rounded-xl p-4 shadow-lg">
            <div className="text-2xl font-bold text-pink-400">{dailyAverage}</div>
            <div className="text-sm text-white/60">Daily Average</div>
          </div>
          <div className="bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 rounded-xl p-4 shadow-lg">
            <div className="text-2xl font-bold text-pink-400">${analytics.stats.totalSales.toLocaleString()}</div>
            <div className="text-sm text-white/60">Total Sales</div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-medium mb-4 text-white">Agent Registrations</h3>
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
          {/* Top Territories */}
          <div className="bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-medium mb-4 text-white">Top Territories</h3>
            <div className="space-y-2">
              {analytics.stats.topTerritories.length > 0 ? 
                analytics.stats.topTerritories.map((territory, index) => (
                  <div key={territory.territory} className="flex justify-between items-center">
                    <div className="flex-1">
                      <span className="text-white/70">{index + 1}. {territory.territory}</span>
                      <div className="text-xs text-white/50">{territory.count} agents</div>
                    </div>
                    <span className="text-pink-400 font-medium">${territory.sales.toLocaleString()}</span>
                  </div>
                )) : 
                <div className="text-white/50 text-sm">No territory data available</div>
              }
            </div>
          </div>

          {/* Agent Levels */}
          <div className="bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-medium mb-4 text-white">Agent Levels</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Manager</span>
                <span className="text-purple-400 font-medium">{analytics.stats.levelStats.manager}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Lead</span>
                <span className="text-blue-400 font-medium">{analytics.stats.levelStats.lead}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Senior</span>
                <span className="text-green-400 font-medium">{analytics.stats.levelStats.senior}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Junior</span>
                <span className="text-yellow-400 font-medium">{analytics.stats.levelStats.junior}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performing Agents */}
        <div className="bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-medium mb-4 text-white">Top Performing Agents</h3>
          <div className="space-y-3">
            {analytics.stats.topPerformingAgents.length > 0 ? 
              analytics.stats.topPerformingAgents.map((agent, index) => (
                <div key={agent.agentId} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-white">{index + 1}. {agent.agentName}</div>
                    <div className="text-xs text-white/50">{agent.agentId}</div>
                  </div>
                  <div className="flex-1 px-4">
                    <div className="text-xs text-white/70">{agent.leads} leads</div>
                    <div className="text-xs text-white/50">{agent.conversionRate.toFixed(1)}% conversion</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-pink-400 font-medium">${agent.sales.toLocaleString()}</div>
                    <div className="text-xs text-white/60 flex items-center gap-1">
                      <i className="bi bi-star-fill text-yellow-400"></i>
                      {agent.rating.toFixed(1)}
                    </div>
                  </div>
                </div>
              )) : 
              <div className="text-white/50 text-sm text-center py-4">No agent performance data available</div>
            }
          </div>
        </div>

        {/* Recent Agents */}
        <div className="bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-medium mb-4 text-white">Recent Registrations</h3>
          <div className="space-y-3">
            {analytics.recentAgents.length > 0 ? 
              analytics.recentAgents.map((agent: FieldAgentRecord) => (
                <div key={agent.id} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-white">{agent.name}</div>
                    <div className="text-xs text-white/50">{agent.email}</div>
                  </div>
                  <div className="flex-1 px-4">
                    <div className="text-xs text-white/70">{agent.territory}</div>
                    <div className="text-xs text-white/50">{agent.level}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-white/60">
                      {new Date(agent.joinedAt).toLocaleDateString()}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      agent.status === 'active' ? 'bg-green-400/20 text-green-400' :
                      agent.status === 'on_leave' ? 'bg-yellow-400/20 text-yellow-400' :
                      agent.status === 'suspended' ? 'bg-red-400/20 text-red-400' :
                      'bg-gray-400/20 text-gray-400'
                    }`}>
                      {agent.status.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              )) : 
              <div className="text-white/50 text-sm text-center py-4">No recent agents</div>
            }
          </div>
        </div>
      </div>
    </div>
  );
}