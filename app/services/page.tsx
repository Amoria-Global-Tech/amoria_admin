"use client";

import { useState, useEffect } from "react";
import ServiceCard from "../components/service/card";
import AddService from "../components/service/add";

interface Service {
  id: string;
  title: string;
  description: string;
  price: string;
  category: string;
  status: "active" | "inactive" | "pending";
  icon: string;
  createdAt: string;
}

interface ApiResponse {
  success: boolean;
  data: Service[];
  count: number;
  error?: string;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const categories = ["all", "Development", "Marketing", "Design"];

  // Fetch services from API
  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/blog/services/get');
      const result: ApiResponse = await response.json();
      
      if (result.success) {
        setServices(result.data);
      } else {
        setError(result.error || 'Failed to fetch services');
      }
    } catch (err) {
      setError('Network error: Unable to fetch services');
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load services on component mount
  useEffect(() => {
    fetchServices();
  }, []);

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || service.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const addService = async (newService: Omit<Service, "id" | "createdAt">) => {
    try {
      const response = await fetch('/api/blog/services/get', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newService),
      });

      const result = await response.json();
      
      if (result.success) {
        // Add the new service to the beginning of the list
        setServices(prev => [result.data, ...prev]);
        setIsAddServiceOpen(false);
      } else {
        console.error('Failed to add service:', result.error);
        // You might want to show a toast notification here
      }
    } catch (err) {
      console.error('Error adding service:', err);
      // Fallback to local state update if API fails
      const service: Service = {
        ...newService,
        id: Date.now().toString(),
        createdAt: new Date().toISOString().split('T')[0]
      };
      setServices(prev => [service, ...prev]);
      setIsAddServiceOpen(false);
    }
  };

  const updateService = (id: string, updatedService: Partial<Service>) => {
    setServices(prev => prev.map(service => 
      service.id === id ? { ...service, ...updatedService } : service
    ));
  };

  const deleteService = (id: string) => {
    setServices(prev => prev.filter(service => service.id !== id));
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-2xl rounded-2xl p-8 mb-8">
          <div className="animate-pulse">
            <div className="h-8 bg-white/20 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-white/10 rounded w-1/2"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-white/20 rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-white/10 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center py-12">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-pink-400 border-t-transparent rounded-full"></div>
          <p className="text-white/60 mt-4">Loading services...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-red-900/20 to-red-800/20 backdrop-blur-xl border border-red-500/20 shadow-2xl rounded-2xl p-8 text-center">
          <i className="bi bi-exclamation-triangle text-red-400 text-6xl mb-4"></i>
          <h2 className="text-white text-2xl font-bold mb-2">Error Loading Services</h2>
          <p className="text-white/70 mb-6">{error}</p>
          <button
            onClick={fetchServices}
            className="bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-2xl rounded-2xl p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Our Services
              </h1>
              <p className="text-white/70 text-lg">
                Manage and showcase your professional services
              </p>
            </div>
            
            <button
              onClick={() => setIsAddServiceOpen(true)}
              className="bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white px-4 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 self-start lg:self-center"
            >
              <i className="bi bi-plus-circle text-lg"></i>
              Add New Service
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Total Services</p>
                <p className="text-white text-2xl font-bold">{services.length}</p>
              </div>
              <div className="bg-pink-400/20 p-3 rounded-xl">
                <i className="bi bi-gear-wide-connected text-pink-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Active Services</p>
                <p className="text-white text-2xl font-bold">
                  {services.filter(s => s.status === "active").length}
                </p>
              </div>
              <div className="bg-green-400/20 p-3 rounded-xl">
                <i className="bi bi-check-circle text-green-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Pending</p>
                <p className="text-white text-2xl font-bold">
                  {services.filter(s => s.status === "pending").length}
                </p>
              </div>
              <div className="bg-yellow-400/20 p-3 rounded-xl">
                <i className="bi bi-clock text-yellow-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Categories</p>
                <p className="text-white text-2xl font-bold">{categories.length - 1}</p>
              </div>
              <div className="bg-blue-400/20 p-3 rounded-xl">
                <i className="bi bi-tags text-blue-400 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-2xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <i className="bi bi-search absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60"></i>
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/60 focus:outline-none focus:border-pink-400 transition-colors"
              />
            </div>
            
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-400 transition-colors"
            >
              {categories.map(category => (
                <option key={category} value={category} className="bg-[#0b1c36] text-white">
                  {category === "all" ? "All Categories" : category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onUpdate={updateService}
              onDelete={deleteService}
            />
          ))}
        </div>

        {filteredServices.length === 0 && !loading && (
          <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-2xl p-12 text-center">
            <i className="bi bi-search text-white/40 text-6xl mb-4"></i>
            <h3 className="text-white text-xl font-semibold mb-2">No services found</h3>
            <p className="text-white/60">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Add Service Modal */}
      {isAddServiceOpen && (
        <AddService
          onClose={() => setIsAddServiceOpen(false)}
          onAdd={addService}
        />
      )}
    </>
  );
}