'use client';

import { useState, useEffect } from 'react';
import ProductCard from '../components/products/card';
import AddProductModal from '../components/products/add';
import EditProductModal from '../components/products/edit';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  isAvailable: boolean;
  createdAt: string;
  updated_at: string;
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
      
      const params = new URLSearchParams();
      const response = await fetch(`/api/blog/products/get?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.products && Array.isArray(data.products)) {
        setProducts(data.products);
      } else {
        console.error('Invalid response format:', data);
        setProducts([]);
        setError('Invalid data format received from server');
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
      const response = await fetch('/api/blog/products/add', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: productId.toString()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete product');
      }

      // Remove product from state
      setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
      
      // Show success message (you can replace with toast)
      alert('Product deleted successfully');
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
      // Update the products list optimistically
      setProducts(prevProducts => 
        prevProducts.map(p => p.id === updatedProduct.id ? updatedProduct : p)
      );
      setIsEditModalOpen(false);
      setEditingProduct(null);
      
      // You might want to refresh to ensure data consistency
      // await fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      // Revert on error
      await fetchProducts();
    }
  };

  const handleToggleAvailability = async (productId: number) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const formData = new FormData();
      formData.append('id', productId.toString());
      formData.append('is_available', String(!product.isAvailable));

      const response = await fetch('/api/blog/products/add', {
        method: 'PATCH',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to toggle availability');
      }

      // Update the product in state
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p.id === productId 
            ? { ...p, isAvailable: !p.isAvailable, updated_at: new Date().toISOString() }
            : p
        )
      );

      // Show success message
      alert(`Product ${!product.isAvailable ? 'enabled' : 'disabled'} successfully`);
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

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-2xl rounded-2xl p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Our Apps
              </h1>
              <p className="text-white/70 text-lg">
                Manage and showcase your mobile applications
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={refreshProducts}
                className="bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white px-4 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
              >
                <i className="bi bi-arrow-clockwise text-lg"></i>
                Refresh
              </button>
              
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white px-4 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
              >
                <i className="bi bi-plus-circle text-lg text-nowrap"></i>
                Add New App
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <i className="bi bi-exclamation-triangle text-red-400 text-xl"></i>
              <div>
                <h3 className="text-red-400 font-semibold">Error</h3>
                <p className="text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Total Apps</p>
                <p className="text-white text-2xl font-bold">{products.length}</p>
              </div>
              <div className="bg-pink-400/20 p-3 rounded-xl">
                <i className="bi bi-box-seam text-pink-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Available Apps</p>
                <p className="text-white text-2xl font-bold">
                  {products.filter(p => p.isAvailable).length}
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
                <p className="text-white/60 text-sm">Unavailable</p>
                <p className="text-white text-2xl font-bold">
                  {products.filter(p => !p.isAvailable).length}
                </p>
              </div>
              <div className="bg-yellow-400/20 p-3 rounded-xl">
                <i className="bi bi-exclamation-circle text-yellow-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0b1c36] to-[#13294b] bg-opacity-80 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Categories</p>
                <p className="text-white text-2xl font-bold">{Math.max(0, categories.length - 1)}</p>
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
                placeholder="Search apps..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/60 focus:outline-none focus:border-pink-400 transition-colors"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-400 transition-colors"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg h-80 border border-blue-900/20"></div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
                onToggleAvailability={handleToggleAvailability}
              />
            ))}
          </div>
        ) : (
          <div className="bg-gradient-to-r from-[#0b1c36] to-[#13294b] bg-opacity-90 backdrop-blur-xl border border-blue-900/20 shadow-xl rounded-2xl p-12 text-center">
            <i className="bi bi-search text-white/40 text-6xl mb-4"></i>
            <h3 className="text-white text-xl font-semibold mb-2">
              {error ? 'Failed to load apps' : 'No apps found'}
            </h3>
            <p className="text-white/60">
              {error ? 'Please try refreshing the page' : 'Try adjusting your search or filter criteria'}
            </p>
            {error && (
              <button
                onClick={refreshProducts}
                className="mt-4 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300"
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