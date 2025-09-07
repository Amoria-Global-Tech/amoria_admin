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

// TypeScript interfaces for tour guide analytics
interface DayStats {
  date: string;
  registrations: number;
  toursCompleted: number;
  formattedDate?: string;
  originalDate?: string;
}

interface TourGuideRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending_approval';
  verificationStatus: 'verified' | 'pending' | 'unverified';
  totalTours: number;
  totalEarnings: number;
  averageTourValue: number;
  lastTourAt: string;
  specialties: string[];
  languagesSpoken: string[];
  rating: number;
  reviewsReceived: number;
  joinedAt: string;
  lastActiveAt: string;
  profileCompleteness: number;
  experienceLevel: 'beginner' | 'intermediate' | 'expert' | 'master';
}

interface PerformingTourGuide {
  guideId: string;
  guideName: string;
  totalEarnings: number;
  tours: number;
  averageTourValue: number;
  experienceLevel: string;
  rating: number;
}

interface TourGuideAnalyticsStats {
  totalTourGuides: number;
  activeTourGuides: number;
  pendingApproval: number;
  suspendedTourGuides: number;
  totalRevenueGenerated: number;
  totalToursCompleted: number;
  averageTourPrice: number;
  averageRating: number;
  registrationsPerDay: DayStats[];
  topCountries: { country: string; count: number; earnings: number }[];
  topPerformingTourGuides: PerformingTourGuide[];
  verificationStats: { verified: number; pending: number; unverified: number };
  experienceStats: { beginner: number; intermediate: number; expert: number; master: number };
  topSpecialties: { specialty: string; count: number }[];
}

interface TourGuideAnalyticsData {
  stats: TourGuideAnalyticsStats;
  recentTourGuides: TourGuideRecord[];
}

type DateRange = "today" | "week" | "month" | "custom";
type ViewMode = "bar" | "line";

// Helper function to process raw tour guide data into analytics
function processTourGuideData(guides: TourGuideRecord[]): TourGuideAnalyticsStats {
  const dailyRegistrations = new Map<string, { registrations: number; toursCompleted: number }>();
  const countryCount = new Map<string, { count: number; earnings: number }>();
  const specialtyCount = new Map<string, number>();
  let totalRevenueGenerated = 0;
  let totalToursCompleted = 0;
  let totalRatings = 0;
  let ratingCount = 0;

  guides.forEach(guide => {
    const date = guide.joinedAt.split('T')[0];
    const existing = dailyRegistrations.get(date) || { registrations: 0, toursCompleted: 0 };
    dailyRegistrations.set(date, { 
      registrations: existing.registrations + 1, 
      toursCompleted: existing.toursCompleted + guide.totalTours 
    });
    
    if (guide.country) {
      const existing = countryCount.get(guide.country) || { count: 0, earnings: 0 };
      countryCount.set(guide.country, { 
        count: existing.count + 1, 
        earnings: existing.earnings + guide.totalEarnings 
      });
    }
    
    guide.specialties.forEach(specialty => {
      specialtyCount.set(specialty, (specialtyCount.get(specialty) || 0) + 1);
    });
    
    totalRevenueGenerated += guide.totalEarnings;
    totalToursCompleted += guide.totalTours;
    
    if (guide.rating > 0) {
      totalRatings += guide.rating;
      ratingCount++;
    }
  });

  const registrationsPerDay = Array.from(dailyRegistrations.entries())
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const topCountries = Array.from(countryCount.entries())
    .map(([country, stats]) => ({ country, ...stats }))
    .sort((a, b) => b.earnings - a.earnings)
    .slice(0, 5);
    
  const topSpecialties = Array.from(specialtyCount.entries())
    .map(([specialty, count]) => ({ specialty, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topPerformingTourGuides = guides
    .sort((a, b) => b.totalEarnings - a.totalEarnings)
    .slice(0, 5)
    .map(guide => ({
      guideId: guide.id,
      guideName: guide.name,
      totalEarnings: guide.totalEarnings,
      tours: guide.totalTours,
      averageTourValue: guide.averageTourValue,
      experienceLevel: guide.experienceLevel,
      rating: guide.rating
    }));

  const verificationStats = {
    verified: guides.filter(g => g.verificationStatus === 'verified').length,
    pending: guides.filter(g => g.verificationStatus === 'pending').length,
    unverified: guides.filter(g => g.verificationStatus === 'unverified').length
  };

  const experienceStats = {
    beginner: guides.filter(g => g.experienceLevel === 'beginner').length,
    intermediate: guides.filter(g => g.experienceLevel === 'intermediate').length,
    expert: guides.filter(g => g.experienceLevel === 'expert').length,
    master: guides.filter(g => g.experienceLevel === 'master').length
  };

  return {
    totalTourGuides: guides.length,
    activeTourGuides: guides.filter(g => g.status === 'active').length,
    pendingApproval: guides.filter(g => g.status === 'pending_approval').length,
    suspendedTourGuides: guides.filter(g => g.status === 'suspended').length,
    totalRevenueGenerated,
    totalToursCompleted,
    averageTourPrice: totalToursCompleted > 0 ? totalRevenueGenerated / totalToursCompleted : 0,
    averageRating: ratingCount > 0 ? totalRatings / ratingCount : 0,
    registrationsPerDay,
    topCountries,
    topPerformingTourGuides,
    verificationStats,
    experienceStats,
    topSpecialties
  };
}

// Generate mock data for fallback
function generateMockTourGuideData(): TourGuideRecord[] {
    const statuses: ('active' | 'inactive' | 'suspended' | 'pending_approval')[] = ['active', 'inactive', 'suspended', 'pending_approval'];
    const verificationStatuses: ('verified' | 'pending' | 'unverified')[] = ['verified', 'pending', 'unverified'];
    const experienceLevels: ('beginner' | 'intermediate' | 'expert' | 'master')[] = ['beginner', 'intermediate', 'expert', 'master'];
    const countries = ['USA', 'Italy', 'Spain', 'France', 'Japan', 'Australia', 'Brazil', 'South Africa'];
    const cities = ['New York', 'Rome', 'Barcelona', 'Paris', 'Tokyo', 'Sydney', 'Rio de Janeiro', 'Cape Town'];
    const specialties = ['History', 'Food', 'Adventure', 'Art', 'Nightlife', 'Nature', 'Architecture'];
    const names = ['Chris Evans', 'Marco Rossi', 'Sofia Garcia', 'Louis Martin', 'Yuki Tanaka', 'Olivia Smith', 'Carlos Silva', 'Lebo Mokoena'];

  return Array.from({ length: 60 }, (_, i) => {
    const totalTours = Math.floor(Math.random() * 150) + 5;
    const totalEarnings = Math.floor(Math.random() * 80000) + 2000;
    
    return {
      id: `GUIDE${String(i + 1).padStart(5, '0')}`,
      name: names[Math.floor(Math.random() * names.length)],
      email: `guide${i + 1}@example.com`,
      phone: `+1 555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      country: countries[Math.floor(Math.random() * countries.length)],
      city: cities[Math.floor(Math.random() * cities.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      verificationStatus: verificationStatuses[Math.floor(Math.random() * verificationStatuses.length)],
      totalTours,
      totalEarnings,
      averageTourValue: Math.round(totalEarnings / totalTours),
      lastTourAt: new Date(2025, Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1).toISOString(),
      specialties: specialties.slice(0, Math.floor(Math.random() * 3) + 1),
      languagesSpoken: ['English', 'Spanish'],
      rating: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10,
      reviewsReceived: Math.floor(Math.random() * 200) + 10,
      joinedAt: new Date(2025, Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1).toISOString(),
      lastActiveAt: new Date(2025, Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1).toISOString(),
      profileCompleteness: Math.floor(Math.random() * 40) + 60,
      experienceLevel: experienceLevels[Math.floor(Math.random() * experienceLevels.length)]
    };
  });
}

// Fetch function for API
async function fetchTourGuideAnalytics(start?: string, end?: string, limit = 500): Promise<TourGuideAnalyticsData> {
  try {
    const params = new URLSearchParams();
    if (start) params.append('start_date', start);
    if (end) params.append('end_date', end);
    params.append('limit', limit.toString());
    
    // IMPORTANT: Changed API endpoint to /tour-guides/analytics
    const response = await api.get<TourGuideRecord[]>(`/tour-guides/analytics?${params}`);
    
    if (response.success && response.data) {
      const stats = processTourGuideData(response.data);
      const recentTourGuides = response.data.slice(0, 10);
      return { stats, recentTourGuides };
    } else {
      console.error('Failed to fetch tour guide analytics:', response.error);
      throw new Error('API request failed');
    }
  } catch (error) {
    console.error('Error fetching tour guide analytics:', error);
    const mockGuides = generateMockTourGuideData();
    const stats = processTourGuideData(mockGuides);
    const recentTourGuides = mockGuides.slice(0, 10);
    return { stats, recentTourGuides };
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

export default function TourGuideAnalytics(): JSX.Element {
  const [analytics, setAnalytics] = useState<TourGuideAnalyticsData | null>(null);
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

      const result = await fetchTourGuideAnalytics(start, end);
      
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
      setError('Failed to load tour guide analytics data');
      console.error('Tour guide analytics loading error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(dateRange);
  }, [dateRange, customStart, customEnd]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto text-center py-8 text-white/70">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400"></div>
          <p className="mt-2">Loading tour guide analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto text-center py-8">
          <div className="text-red-400 mb-2">⚠️ {error || 'No data available'}</div>
          <button onClick={() => loadData(dateRange)} className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors">Retry</button>
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
  
  const dateRangeOptions: { value: DateRange; label: string }[] = [{ value: "today", label: "Today" }, { value: "week", label: "Week" }, { value: "month", label: "Month" }, { value: "custom", label: "Custom" }];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 text-white/40">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-white">Tour Guide Analytics</h1>
        </div>

        {/* Date Range & Stats Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
                <div className="bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 rounded-xl p-4 shadow-lg">
                    <div className="text-3xl font-bold text-pink-400">{analytics.stats.totalTourGuides}</div>
                    <div className="text-sm text-white/60">Total Tour Guides</div>
                </div>
                 <div className="bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 rounded-xl p-4 shadow-lg">
                    <div className="text-3xl font-bold text-green-400">{analytics.stats.activeTourGuides}</div>
                    <div className="text-sm text-white/60">Active Guides</div>
                </div>
                 <div className="bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 rounded-xl p-4 shadow-lg">
                    <div className="text-3xl font-bold text-blue-400">${analytics.stats.totalRevenueGenerated.toLocaleString()}</div>
                    <div className="text-sm text-white/60">Total Earnings</div>
                </div>
            </div>

            {/* Chart */}
            <div className="lg:col-span-2 bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 rounded-xl p-6 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-white">Guide Registrations</h3>
                    <div className="flex flex-wrap gap-1 items-center">
                        {dateRangeOptions.map((option) => (
                            <button key={option.value} onClick={() => setDateRange(option.value)} className={`px-2 py-1 rounded-md text-xs transition-all ${dateRange === option.value ? "bg-pink-500 text-white" : "bg-white/10 text-white/70 hover:bg-white/20"}`}>{option.label}</button>
                        ))}
                    </div>
                </div>
                {analytics.stats.registrationsPerDay.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                    <ChartComponent data={analytics.stats.registrationsPerDay}>
                        <XAxis dataKey="formattedDate" stroke="#e2e8f0" fontSize={12} interval={Math.floor(analytics.stats.registrationsPerDay.length / 7)} />
                        <YAxis stroke="#e2e8f0" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: '#0b1c36', border: '1px solid #1e3a8a20', borderRadius: '8px', fontSize: '12px', color: '#ffffff' }} />
                        {ChartElement}
                    </ChartComponent>
                    </ResponsiveContainer>
                ) : (
                    <div className="text-center h-[240px] flex items-center justify-center text-white/50">No registration data for this period</div>
                )}
            </div>
        </div>
        
        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-medium mb-4 text-white">Top Countries by Earnings</h3>
            <div className="space-y-2">{analytics.stats.topCountries.map((c, i) => (<div key={c.country} className="flex justify-between items-center text-sm"><span className="text-white/70">{i + 1}. {c.country}</span><span className="text-pink-400 font-medium">${c.earnings.toLocaleString()}</span></div>))}</div>
          </div>
          <div className="bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-medium mb-4 text-white">Experience Levels</h3>
            <div className="space-y-2">{Object.entries(analytics.stats.experienceStats).map(([level, count]) => (<div key={level} className="flex justify-between items-center text-sm"><span className="text-white/70 capitalize">{level}</span><span className="font-medium text-white">{count}</span></div>))}</div>
          </div>
           <div className="bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-medium mb-4 text-white">Top Specialties</h3>
            <div className="space-y-2">{analytics.stats.topSpecialties.map((s, i) => (<div key={s.specialty} className="flex justify-between items-center text-sm"><span className="text-white/70">{i + 1}. {s.specialty}</span><span className="font-medium text-white">{s.count} guides</span></div>))}</div>
          </div>
        </div>

        {/* Top Performing & Recent Guides */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-medium mb-4 text-white">Top Earning Guides</h3>
            <div className="space-y-3">{analytics.stats.topPerformingTourGuides.map((guide) => (<div key={guide.guideId} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0"><div className="flex-1"><div className="font-medium text-sm text-white">{guide.guideName}</div><div className="text-xs text-white/50">{guide.tours} tours</div></div><div className="text-right"><div className="text-sm text-pink-400 font-medium">${guide.totalEarnings.toLocaleString()}</div><div className={`text-xs capitalize`}>{guide.experienceLevel}</div></div></div>))}</div>
          </div>

          <div className="bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-medium mb-4 text-white">Recent Registrations</h3>
            <div className="space-y-3">{analytics.recentTourGuides.map((guide: TourGuideRecord) => (<div key={guide.id} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0"><div className="flex-1"><div className="font-medium text-sm text-white">{guide.name}</div><div className="text-xs text-white/50">{guide.city}, {guide.country}</div></div><div className="text-right"><div className="text-xs text-white/60">{new Date(guide.joinedAt).toLocaleDateString()}</div><div className={`text-xs capitalize px-2 py-1 rounded-full ${guide.status === 'active' ? 'bg-green-400/20 text-green-400' : 'bg-yellow-400/20 text-yellow-400'}`}>{guide.status.replace('_', ' ')}</div></div></div>))}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

