'use client';

import { useState, useEffect } from 'react';
import api from "@/app/api/conn";
import ProductCard from '../components/products/card';
import AddProductModal from '../components/products/add';
import EditProductModal from '../components/products/edit';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  siteUrl: string;
  category: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
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
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      
      const response: any = await api.get(`/admin/content/products?${params.toString()}`);
      
      if (response.data.success) {
        const result = await response.data;
        if (result.success && result.data) {
          setProducts(result.data);
        } else {
          console.error('Invalid response format:', result);
          setProducts([]);
          setError('Invalid data format received from server');
        }
      } else {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
      
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this product?');
    if (!confirmDelete) return;

    setIsDeleting(productId);
    try {
      const response = await api.delete(`/admin/content/products/${productId}`);

      if (response.ok) {
        const result = await response.data;
        if (result.success) {
          setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
          alert('Product deleted successfully');
        } else {
          throw new Error(result.error || 'Failed to delete product');
        }
      } else {
        throw new Error('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete product');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    try {
      setProducts(prevProducts => 
        prevProducts.map(p => p.id === updatedProduct.id ? updatedProduct : p)
      );
      setIsEditModalOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error updating product:', error);
      await fetchProducts();
    }
  };

  const handleToggleAvailability = async (productId: number) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const response = await api.put(`/admin/content/products/${productId}`, {
        isAvailable: !product.isAvailable
      });

      if (response.ok) {
        const result = await response.data;
        if (result.success) {
          setProducts(prevProducts => 
            prevProducts.map(p => 
              p.id === productId 
                ? { ...p, isAvailable: !p.isAvailable, updatedAt: new Date().toISOString() }
                : p
            )
          );
          alert(`Product ${!product.isAvailable ? 'enabled' : 'disabled'} successfully`);
        } else {
          throw new Error(result.error || 'Failed to toggle availability');
        }
      } else {
        throw new Error('Failed to update availability');
      }
    } catch (error) {
      console.error('Error toggling availability:', error);
      alert('Failed to update availability');
    }
  };

  const handleAddProduct = async (newProduct: Product) => {
    setProducts(prevProducts => [newProduct, ...prevProducts]);
    setIsAddModalOpen(false);
  };

  const refreshProducts = async () => {
    await fetchProducts();
  };

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filteredProducts = products.filter((product: any) => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <div className="max-w-6xl mx-auto px-2 sm:px-4">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-2xl rounded-xl p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
                Our Apps
              </h1>
              <p className="text-white/70 text-sm sm:text-base">
                Manage and showcase your mobile applications
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={refreshProducts}
                className="bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white px-3 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm"
              >
                <i className="bi bi-arrow-clockwise"></i>
                Refresh
              </button>
              
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white px-3 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm"
              >
                <i className="bi bi-plus-circle"></i>
                <span className="whitespace-nowrap">Add New App</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <i className="bi bi-exclamation-triangle text-red-400 text-lg"></i>
              <div>
                <h3 className="text-red-400 font-medium text-sm">Error</h3>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-xs sm:text-sm">Total Apps</p>
                <p className="text-white text-lg sm:text-xl font-bold">{products.length}</p>
              </div>
              <div className="bg-pink-400/20 p-2 rounded-lg">
                <i className="bi bi-box-seam text-pink-400 text-sm sm:text-base"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-xs sm:text-sm">Available</p>
                <p className="text-white text-lg sm:text-xl font-bold">
                  {products.filter(p => p.isAvailable).length}
                </p>
              </div>
              <div className="bg-green-400/20 p-2 rounded-lg">
                <i className="bi bi-check-circle text-green-400 text-sm sm:text-base"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-xs sm:text-sm">Unavailable</p>
                <p className="text-white text-lg sm:text-xl font-bold">
                  {products.filter(p => !p.isAvailable).length}
                </p>
              </div>
              <div className="bg-yellow-400/20 p-2 rounded-lg">
                <i className="bi bi-exclamation-circle text-yellow-400 text-sm sm:text-base"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-xs sm:text-sm">Categories</p>
                <p className="text-white text-lg sm:text-xl font-bold">{Math.max(0, categories.length - 1)}</p>
              </div>
              <div className="bg-blue-400/20 p-2 rounded-lg">
                <i className="bi bi-tags text-blue-400 text-sm sm:text-base"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-4 sm:p-5 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <i className="bi bi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 text-sm"></i>
              <input
                type="text"
                placeholder="Search apps..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg pl-10 pr-3 py-2.5 text-white placeholder-white/60 focus:outline-none focus:border-pink-400 transition-colors text-sm"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-pink-400 transition-colors text-sm min-w-0 sm:min-w-[140px]"
            >
              {categories.map(category => (
                <option key={category} value={category} className="bg-[#0b1c36] text-white">
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg h-64 border border-blue-900/20"></div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
                onToggleAvailability={handleToggleAvailability}
                isDeleting={isDeleting === product.id}
              />
            ))}
          </div>
        ) : (
          <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-6 sm:p-8 text-center">
            <i className="bi bi-search text-white/40 text-4xl sm:text-5xl mb-3"></i>
            <h3 className="text-white text-lg sm:text-xl font-semibold mb-2">
              {error ? 'Failed to load apps' : 'No apps found'}
            </h3>
            <p className="text-white/60 text-sm sm:text-base">
              {error ? 'Please try refreshing the page' : 'Try adjusting your search or filter criteria'}
            </p>
            {error && (
              <button
                onClick={refreshProducts}
                className="mt-3 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 text-sm"
              >
                Try Again
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddProduct={handleAddProduct}
      />

      {/* Edit Product Modal */}
      {editingProduct && (
        <EditProductModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingProduct(null);
          }}
          product={editingProduct}
          onUpdateProduct={handleUpdateProduct}
        />
      )}
    </>
  );
}