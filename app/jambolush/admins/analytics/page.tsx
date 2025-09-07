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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { api } from '../../../api/jambolush/api-conn';

// TypeScript interfaces for admin analytics

interface BookingRecord {
  id: string;
  propertyId: string;
  propertyName: string;
  guestName: string;
  checkInDate: string;
  checkOutDate: string;
  totalPrice: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  bookedAt: string;
}

interface PropertyRecord {
  id:string;
  name: string;
  location: string;
  hostName: string;
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  propertyType: 'Apartment' | 'House' | 'Villa' | 'Hotel';
  createdAt: string;
}

interface DayStats {
  date: string;
  bookings: number;
  revenue: number;
  formattedDate?: string;
  originalDate?: string;
}

interface AdminAnalyticsStats {
  totalRevenue: number;
  totalBookings: number;
  totalProperties: number;
  averageBookingValue: number;
  occupancyRate: number; // Example metric
  bookingsPerDay: DayStats[];
  topPerformingProperties: PropertyRecord[];
  bookingStatusDistribution: { name: string; value: number }[];
  propertyTypeDistribution: { name: string; value: number }[];
}

interface AdminAnalyticsData {
  stats: AdminAnalyticsStats;
  recentBookings: BookingRecord[];
}

type DateRange = "today" | "week" | "month" | "custom";
type ViewMode = "bar" | "line";

// Helper function to process raw data into analytics
function processAdminData(bookings: BookingRecord[], properties: PropertyRecord[]): AdminAnalyticsStats {
  const dailyStats = new Map<string, { bookings: number; revenue: number }>();
  let totalRevenue = 0;
  
  bookings.forEach(booking => {
    const date = new Date(booking.bookedAt).toISOString().split('T')[0];
    const existing = dailyStats.get(date) || { bookings: 0, revenue: 0 };
    dailyStats.set(date, {
      bookings: existing.bookings + 1,
      revenue: existing.revenue + booking.totalPrice,
    });
    totalRevenue += booking.totalPrice;
  });

  const bookingsPerDay = Array.from(dailyStats.entries())
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const topPerformingProperties = [...properties]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);
    
  const bookingStatusDistribution = [
      { name: 'Confirmed', value: bookings.filter(b => b.status === 'confirmed').length },
      { name: 'Pending', value: bookings.filter(b => b.status === 'pending').length },
      { name: 'Cancelled', value: bookings.filter(b => b.status === 'cancelled').length },
  ];

  const propertyTypeDistribution = properties.reduce((acc, property) => {
    const existingType = acc.find(p => p.name === property.propertyType);
    if(existingType) {
        existingType.value += 1;
    } else {
        acc.push({ name: property.propertyType, value: 1});
    }
    return acc;
  }, [] as {name: string, value: number}[]);


  return {
    totalRevenue,
    totalBookings: bookings.length,
    totalProperties: properties.length,
    averageBookingValue: bookings.length > 0 ? totalRevenue / bookings.length : 0,
    occupancyRate: 75.5, // Placeholder value
    bookingsPerDay,
    topPerformingProperties,
    bookingStatusDistribution,
    propertyTypeDistribution
  };
}

// Generate mock data for fallback
function generateMockBookings(count = 50): BookingRecord[] {
    const statuses: ('confirmed' | 'pending' | 'cancelled')[] = ['confirmed', 'pending', 'cancelled'];
    return Array.from({ length: count }, (_, i) => ({
        id: `BOOK${String(i + 1).padStart(5, '0')}`,
        propertyId: `PROP${String(Math.floor(Math.random() * 20) + 1).padStart(3, '0')}`,
        propertyName: `Sunset Villa ${i+1}`,
        guestName: 'John Doe',
        checkInDate: new Date(2025, Math.floor(Math.random() * 3), Math.floor(Math.random() * 14) + 1).toISOString(),
        checkOutDate: new Date(2025, Math.floor(Math.random() * 3), Math.floor(Math.random() * 14) + 15).toISOString(),
        totalPrice: Math.floor(Math.random() * 500) + 100,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        bookedAt: new Date(2025, Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1).toISOString(),
    }));
}

function generateMockProperties(count = 20): PropertyRecord[] {
    const propertyTypes: ('Apartment' | 'House' | 'Villa' | 'Hotel')[] = ['Apartment', 'House', 'Villa', 'Hotel'];
    return Array.from({ length: count }, (_, i) => ({
        id: `PROP${String(i + 1).padStart(3, '0')}`,
        name: `Luxury Stay ${i + 1}`,
        location: 'Los Angeles, USA',
        hostName: 'Jane Smith',
        totalBookings: Math.floor(Math.random() * 50) + 5,
        totalRevenue: Math.floor(Math.random() * 20000) + 5000,
        averageRating: Math.round((Math.random() * 1 + 4) * 10) / 10,
        propertyType: propertyTypes[Math.floor(Math.random() * propertyTypes.length)],
        createdAt: new Date(2024, Math.floor(Math.random() * 12), 1).toISOString(),
    }));
}


// Fetch function for API
async function fetchAdminAnalytics(start?: string, end?: string): Promise<AdminAnalyticsData> {
  try {
    const params: Record<string, string | number> = { limit: 1000 };
    if (start) params.start_date = start;
    if (end) params.end_date = end;
    
    // In a real scenario, you might have separate endpoints. Here we fetch all and process.
    const bookingsResponse = await api.get<BookingRecord[]>('/bookings', params);
    const propertiesResponse = await api.get<PropertyRecord[]>('/properties');

    if (bookingsResponse.success && propertiesResponse.success && bookingsResponse.data && propertiesResponse.data) {
      const stats = processAdminData(bookingsResponse.data, propertiesResponse.data);
      const recentBookings = bookingsResponse.data
        .sort((a,b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime())
        .slice(0, 5);
      
      return { stats, recentBookings };
    } else {
      console.error('Failed to fetch admin analytics:', bookingsResponse.error || propertiesResponse.error);
      throw new Error('API request failed');
    }
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    
    // Return mock data structure on error
    const mockBookings = generateMockBookings();
    const mockProperties = generateMockProperties();
    const stats = processAdminData(mockBookings, mockProperties);
    const recentBookings = mockBookings
        .sort((a,b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime())
        .slice(0, 5);
    
    return { stats, recentBookings };
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

export default function AdminAnalytics(): JSX.Element {
  const [analytics, setAnalytics] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>("month");
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

      const result = await fetchAdminAnalytics(start, end);
      
      const processedData = result.stats.bookingsPerDay.map((item: DayStats) => ({
        ...item,
        formattedDate: formatDateLabel(item.date),
        originalDate: item.date
      }));
      
      setAnalytics({
        ...result,
        stats: {
          ...result.stats,
          bookingsPerDay: processedData
        }
      });
    } catch (err) {
      setError('Failed to load admin analytics data');
      console.error('Admin analytics loading error:', err);
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
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto text-center py-8 text-white/70">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400"></div>
            <p className="mt-2">Loading Admin Analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto text-center py-8">
            <div className="text-red-400 mb-2">⚠️ {error || 'No data available'}</div>
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

  const ChartComponent = viewMode === "line" ? LineChart : BarChart;
  const ChartElement = viewMode === "line" ? 
    <Line type="monotone" dataKey="revenue" stroke="#ec4899" strokeWidth={2} dot={{ fill: "#ec4899", r: 3 }} name="Revenue"/> :
    <Bar dataKey="revenue" fill="#ec4899" radius={[2, 2, 0, 0]} name="Revenue"/>;

  const PIE_COLORS = ['#ec4899', '#8b5cf6', '#f59e0b', '#10b981'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 text-white/40">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-white">Admin Dashboard</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode(viewMode === "bar" ? "line" : "bar")}
              className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 rounded-md transition-colors text-white/70 hover:text-white"
            >
              {viewMode === "bar" ? "Line View" : "Bar View"}
            </button>
            <button
              onClick={() => loadData(dateRange)}
              className="px-3 py-1 text-xs bg-pink-500/20 hover:bg-pink-500/30 rounded-md transition-colors text-pink-300 hover:text-pink-200"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Date Range Controls */}
        <div className="flex flex-wrap gap-2 items-center">
            {["today", "week", "month", "custom"].map((range) => (
                <button
                    key={range}
                    onClick={() => handleDateRangeChange(range as DateRange)}
                    className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                    dateRange === range
                        ? "bg-pink-500 text-white shadow-sm"
                        : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                    }`}
                >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
            ))}
             {dateRange === "custom" && (
                <div className="flex gap-2 ml-3 items-center text-sm">
                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="px-2 py-1 border border-white/20 bg-white/10 text-white rounded text-xs"/>
                <span className="text-white/50">to</span>
                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="px-2 py-1 border border-white/20 bg-white/10 text-white rounded text-xs"/>
                </div>
            )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total Revenue" value={`$${analytics.stats.totalRevenue.toLocaleString()}`} />
            <StatCard title="Total Bookings" value={analytics.stats.totalBookings.toString()} />
            <StatCard title="Total Properties" value={analytics.stats.totalProperties.toString()} />
            <StatCard title="Avg. Booking Value" value={`$${analytics.stats.averageBookingValue.toFixed(2)}`} />
        </div>

        {/* Main Chart */}
        <div className="bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-medium mb-4 text-white">Revenue Over Time</h3>
            {analytics.stats.bookingsPerDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <ChartComponent data={analytics.stats.bookingsPerDay}>
                <XAxis dataKey="formattedDate" stroke="#e2e8f0" fontSize={12} angle={-45} textAnchor="end" height={60} />
                <YAxis stroke="#e2e8f0" fontSize={12} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#0b1c36', border: '1px solid #1e3a8a20', borderRadius: '8px', color: '#ffffff' }}
                    labelFormatter={(label, payload) => payload?.[0]?.payload.originalDate || label}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                />
                {ChartElement}
              </ChartComponent>
            </ResponsiveContainer>
             ) : (
                <div className="text-center py-12 text-white/50">No revenue data for selected period</div>
            )}
        </div>
        
        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <TopProperties properties={analytics.stats.topPerformingProperties} />
            </div>
            <div>
                 <DistributionChart title="Booking Status" data={analytics.stats.bookingStatusDistribution} />
            </div>
        </div>
        
        {/* Recent Bookings */}
        <div className="bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-medium mb-4 text-white">Recent Bookings</h3>
          <div className="space-y-3">
            {analytics.recentBookings.length > 0 ? 
              analytics.recentBookings.map((booking) => <BookingRow key={booking.id} booking={booking} />) : 
              <div className="text-white/50 text-sm text-center py-4">No recent bookings</div>
            }
          </div>
        </div>

      </div>
    </div>
  );
}

// Sub-components for cleaner structure
const StatCard = ({ title, value }: { title: string; value: string }) => (
    <div className="bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 rounded-xl p-4 shadow-lg">
        <div className="text-sm text-white/60">{title}</div>
        <div className="text-2xl font-bold text-pink-400">{value}</div>
    </div>
);

const TopProperties = ({ properties }: { properties: PropertyRecord[] }) => (
    <div className="bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 rounded-xl p-6 shadow-lg h-full">
      <h3 className="text-lg font-medium mb-4 text-white">Top Performing Properties</h3>
      <div className="space-y-3">
        {properties.length > 0 ? properties.map((prop, index) => (
          <div key={prop.id} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
            <div>
              <div className="font-medium text-sm text-white">{index + 1}. {prop.name}</div>
              <div className="text-xs text-white/50">{prop.location}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-pink-400 font-medium">${prop.totalRevenue.toLocaleString()}</div>
              <div className="text-xs text-white/60">{prop.totalBookings} bookings</div>
            </div>
          </div>
        )) : <div className="text-white/50 text-sm text-center py-4">No property data</div>}
      </div>
    </div>
);

const DistributionChart = ({ title, data }: { title: string; data: { name: string; value: number }[] }) => {
    const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];
    return (
    <div className="bg-gradient-to-b from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 rounded-xl p-6 shadow-lg h-full">
        <h3 className="text-lg font-medium mb-4 text-white">{title}</h3>
        <ResponsiveContainer width="100%" height={150}>
            <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} fill="#8884d8">
                    {data.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0b1c36', border: '1px solid #1e3a8a20' }}/>
            </PieChart>
        </ResponsiveContainer>
        <div className="text-xs mt-4 space-y-1">
            {data.map((entry, index) => (
                <div key={entry.name} className="flex justify-between items-center">
                    <span className="flex items-center">
                        <span className="w-2 h-2 rounded-full mr-2" style={{backgroundColor: PIE_COLORS[index % PIE_COLORS.length]}}></span>
                        {entry.name}
                    </span>
                    <span>{entry.value}</span>
                </div>
            ))}
        </div>
    </div>
)};

const BookingRow = ({ booking }: { booking: BookingRecord }) => {
    const statusClasses = {
        confirmed: 'bg-green-400/20 text-green-400',
        pending: 'bg-yellow-400/20 text-yellow-400',
        cancelled: 'bg-red-400/20 text-red-400',
    };
    return (
    <div className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
      <div className="flex-1">
        <div className="font-medium text-sm text-white">{booking.propertyName}</div>
        <div className="text-xs text-white/50">Guest: {booking.guestName}</div>
      </div>
      <div className="flex-1 px-4 text-center">
        <div className="text-sm font-medium text-pink-400">${booking.totalPrice.toLocaleString()}</div>
      </div>
      <div className="text-right">
        <div className="text-xs text-white/60">
            {new Date(booking.bookedAt).toLocaleDateString()}
        </div>
        <div className={`text-xs capitalize px-2 py-1 rounded-full ${statusClasses[booking.status]}`}>
            {booking.status}
        </div>
      </div>
    </div>
)};


