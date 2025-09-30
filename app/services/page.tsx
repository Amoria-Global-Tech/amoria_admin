"use client";

import { useState, useEffect } from "react";
import api from "@/app/api/conn";
import ServiceCard from "../components/service/card";
import AddService from "../components/service/add";

interface Service {
  id: string;
  name: string;
  description: string;
  features: string;
  price: string;
  category: string;
  isActive: boolean;
  status: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  success: boolean;
  data: Service[];
  pagination?: any;
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

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: '1',
        limit: '100',
        sort: 'createdAt',
        order: 'desc'
      });

      if (searchTerm) params.append('search', searchTerm);
      if (filterCategory !== 'all') params.append('category', filterCategory);
      
      const response = await api.get(`/admin/content/services?${params.toString()}`);
      
      if (response.ok) {
        const result: ApiResponse = await response.data;
        if (result.success && Array.isArray(result.data)) {
          setServices(result.data);
        } else {
          setError(result.error || 'Failed to fetch services');
        }
      } else {
        setError('Network error: Unable to fetch services');
      }
    } catch (err) {
      setError('Network error: Unable to fetch services');
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || service.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const updateService = (id: string, updatedService: Partial<Service>) => {
    setServices(prev => prev.map(service => 
      service.id === id ? { ...service, ...updatedService } : service
    ));
  };

  const deleteService = (id: string) => {
    setServices(prev => prev.filter(service => service.id !== id));
  };

  const addService = (newService: Service) => {
    setServices(prev => [newService, ...prev]);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-2xl rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="animate-pulse">
            <div className="h-6 bg-white/20 rounded w-full sm:w-1/3 mb-3"></div>
            <div className="h-3 bg-white/10 rounded w-full sm:w-1/2"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-lg p-3 sm:p-4">
              <div className="animate-pulse">
                <div className="h-3 bg-white/20 rounded w-1/2 mb-2"></div>
                <div className="h-4 sm:h-5 bg-white/10 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center py-8 sm:py-9">
          <div className="animate-spin inline-block w-6 h-6 border-3 border-pink-400 border-t-transparent rounded-full"></div>
          <p className="text-white/60 mt-3 text-sm">Loading services...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="bg-gradient-to-r from-red-900/20 to-red-800/20 backdrop-blur-xl border border-red-500/20 shadow-2xl rounded-xl p-4 sm:p-6 text-center">
          <i className="bi bi-exclamation-triangle text-red-400 text-4xl sm:text-5xl mb-3"></i>
          <h2 className="text-white text-lg sm:text-xl font-bold mb-2">Error Loading Services</h2>
          <p className="text-white/70 mb-4 text-sm sm:text-base">{error}</p>
          <button
            onClick={fetchServices}
            className="bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white px-4 sm:px-5 py-2 sm:py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-2xl rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
            <div className="text-center sm:text-left">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2">
                Our Services
              </h1>
              <p className="text-white/70 text-sm sm:text-base lg:text-lg">
                Manage and showcase your professional services
              </p>
            </div>
            
            <button
              onClick={() => setIsAddServiceOpen(true)}
              className="bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base w-full sm:w-auto lg:w-auto"
            >
              <i className="bi bi-plus-circle text-sm sm:text-base"></i>
              <span className="whitespace-nowrap">Add New Service</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-xs sm:text-sm">Total Services</p>
                <p className="text-white text-lg sm:text-xl lg:text-2xl font-bold">{services.length}</p>
              </div>
              <div className="bg-pink-400/20 p-2 rounded-lg">
                <i className="bi bi-gear-wide-connected text-pink-400 text-sm sm:text-base lg:text-lg"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-xs sm:text-sm">Active Services</p>
                <p className="text-white text-lg sm:text-xl lg:text-2xl font-bold">
                  {services.filter(s => s.isActive).length}
                </p>
              </div>
              <div className="bg-green-400/20 p-2 rounded-lg">
                <i className="bi bi-check-circle text-green-400 text-sm sm:text-base lg:text-lg"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-xs sm:text-sm">Inactive</p>
                <p className="text-white text-lg sm:text-xl lg:text-2xl font-bold">
                  {services.filter(s => !s.isActive).length}
                </p>
              </div>
              <div className="bg-yellow-400/20 p-2 rounded-lg">
                <i className="bi bi-clock text-yellow-400 text-sm sm:text-base lg:text-lg"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-xs sm:text-sm">Categories</p>
                <p className="text-white text-lg sm:text-xl lg:text-2xl font-bold">{categories.length - 1}</p>
              </div>
              <div className="bg-blue-400/20 p-2 rounded-lg">
                <i className="bi bi-tags text-blue-400 text-sm sm:text-base lg:text-lg"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-4 sm:p-5 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-col lg:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <i className="bi bi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 text-sm"></i>
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg pl-9 sm:pl-10 pr-3 py-2 sm:py-3 text-white placeholder-white/60 focus:outline-none focus:border-pink-400 transition-colors text-sm sm:text-base"
              />
            </div>
            
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 sm:py-3 text-white focus:outline-none focus:border-pink-400 transition-colors text-sm sm:text-base w-full lg:w-auto"
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
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
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
          <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-6 sm:p-8 lg:p-9 text-center">
            <i className="bi bi-search text-white/40 text-4xl sm:text-5xl mb-3"></i>
            <h3 className="text-white text-lg sm:text-xl font-semibold mb-2">No services found</h3>
            <p className="text-white/60 text-sm sm:text-base">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Add Service Modal */}
      {isAddServiceOpen && (
        <AddService
          onClose={() => setIsAddServiceOpen(false)}
          onAddService={addService}
        />
      )}
    </>
  );
}