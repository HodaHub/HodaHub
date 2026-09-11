import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Check,
  X,
  Layers,
} from 'lucide-react';
import { adminApi } from '../../lib/adminApi';
import { Product, BoxOption } from '../../types';
import { formatPrice } from '../../lib/utils';
import { CATEGORIES } from '../../data/categories';
import { getStoredBoxOptions } from '../../data/boxOptions';

export const AdminProductsView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State for "Add Product"
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('HodaHub');
  const [category, setCategory] = useState('electronics');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [stockCount, setStockCount] = useState('50');
  const [imageUrl, setImageUrl] = useState('');
  const [imageList, setImageList] = useState<string[]>([
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
  ]);

  // Box options assignment state
  const [availableBoxOptionsList, setAvailableBoxOptionsList] = useState<BoxOption[]>([]);
  const [selectedBoxOptionIds, setSelectedBoxOptionIds] = useState<string[]>([
    'box-opt-simple',
    'box-opt-premium',
  ]);

  // Dynamic Builders
  const [highlights, setHighlights] = useState<string[]>([
    '100% Genuine HodaAssured Item',
    'Official Brand Warranty with Fast Dispatch',
  ]);
  const [newHighlight, setNewHighlight] = useState('');

  const [specs, setSpecs] = useState<Array<{ key: string; value: string }>>([
    { key: 'Warranty', value: '1 Year Brand Warranty' },
    { key: 'Country of Origin', value: 'India' },
  ]);
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecVal, setNewSpecVal] = useState('');

  const [colors, setColors] = useState<Array<{ name: string; hex: string }>>([
    { name: 'Space Black', hex: '#1e293b' },
  ]);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#4f46e5');

  const [sizes, setSizes] = useState<string[]>(['Standard']);
  const [newSize, setNewSize] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const list = await adminApi.getProducts({
        search: searchQuery,
        category: selectedCategory,
      });
      setProducts(list);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    setAvailableBoxOptionsList(getStoredBoxOptions());
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducts();
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from HodaHub catalog?`)) {
      return;
    }
    try {
      await adminApi.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id && (p as any)._id !== id));
      showToast(`Product "${name}" deleted from HodaHub catalog.`);
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  const handleAddImage = () => {
    if (imageUrl.trim()) {
      setImageList((prev) => [...prev, imageUrl.trim()]);
      setImageUrl('');
    }
  };

  const handleRemoveImage = (idx: number) => {
    setImageList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddHighlight = () => {
    if (newHighlight.trim()) {
      setHighlights((prev) => [...prev, newHighlight.trim()]);
      setNewHighlight('');
    }
  };

  const handleAddSpec = () => {
    if (newSpecKey.trim() && newSpecVal.trim()) {
      setSpecs((prev) => [...prev, { key: newSpecKey.trim(), value: newSpecVal.trim() }]);
      setNewSpecKey('');
      setNewSpecVal('');
    }
  };

  const handleAddColor = () => {
    if (newColorName.trim()) {
      setColors((prev) => [...prev, { name: newColorName.trim(), hex: newColorHex }]);
      setNewColorName('');
    }
  };

  const handleAddSize = () => {
    if (newSize.trim()) {
      setSizes((prev) => [...prev, newSize.trim()]);
      setNewSize('');
    }
  };

  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price) {
      alert('Product title and price are required.');
      return;
    }

    const numPrice = Number(price);
    const numMrp = mrp ? Number(mrp) : Math.round(numPrice * 1.25);
    const generatedSku = sku.trim() || `HODA-${brand.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const specsRecord: Record<string, string> = {};
    specs.forEach((s) => {
      specsRecord[s.key] = s.value;
    });

    const payload = {
      title: title.trim(),
      brand: brand.trim() || 'HodaHub',
      category,
      sku: generatedSku,
      price: numPrice,
      originalPrice: numMrp,
      discountPercent: Math.round(((numMrp - numPrice) / numMrp) * 100),
      stockCount: Number(stockCount) || 50,
      inStock: Number(stockCount) > 0,
      images: imageList.length > 0 ? imageList : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'],
      highlights,
      specs: specsRecord,
      colors: colors.length > 0 ? colors : undefined,
      sizes: sizes.length > 0 ? sizes : undefined,
      availableBoxOptionIds: selectedBoxOptionIds,
      isAssured: true,
      deliveryDays: 2,
    };

    try {
      const created = await adminApi.createProduct(payload);
      setProducts((prev) => [created, ...prev]);
      setShowAddModal(false);
      showToast(`Successfully added "${created.title}" to HodaHub catalog.`);

      // Reset form
      setTitle('');
      setPrice('');
      setMrp('');
      setSku('');
    } catch (err: any) {
      alert(err.message || 'Failed to create product');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Products Management</h2>
          <p className="text-xs text-slate-500">
            Maintain HodaHub product catalog, warehouse inventory, pricing, and variants.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Title, SKU, or Brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-primary-500 font-sans"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none font-medium cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Selling Price</th>
                <th className="py-3 px-3">MRP</th>
                <th className="py-3 px-3">Stock Units</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading HodaHub catalog...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No products found matching criteria.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const stock = product.stockCount ?? 15;
                  const isLowStock = stock < 10;
                  const firstImg = product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';

                  return (
                    <tr key={product.id || (product as any)._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Item Thumbnail & Title */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={firstImg}
                            alt={product.title}
                            className="w-10 h-10 object-cover rounded-md border border-slate-200 shrink-0 bg-slate-100"
                          />
                          <div className="max-w-xs">
                            <div className="font-bold text-slate-900 line-clamp-1">
                              {product.title}
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium">
                              Brand: <span className="font-semibold text-slate-700">{product.brand}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                        {product.sku || 'N/A'}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 capitalize text-slate-700">
                        {product.category}
                      </td>

                      {/* Price */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {formatPrice(product.price)}
                      </td>

                      {/* MRP */}
                      <td className="py-3 px-3 font-mono text-slate-400 line-through">
                        {formatPrice(product.originalPrice)}
                      </td>

                      {/* Stock Units */}
                      <td className="py-3 px-3 font-mono">
                        <span
                          className={`font-bold ${
                            stock === 0
                              ? 'text-rose-600'
                              : isLowStock
                              ? 'text-amber-600'
                              : 'text-slate-800'
                          }`}
                        >
                          {stock}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                            stock === 0
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : isLowStock
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {stock === 0 ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'Active'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleDeleteProduct(product.id, product.title)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* "ADD PRODUCT" MODAL / BUILDER */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="h-16 px-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary-400" />
                <h3 className="font-bold text-sm">Add New Product to HodaHub Catalog</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProductSubmit} className="p-6 space-y-6 text-xs max-h-[80vh] overflow-y-auto">
              {/* Section 1: Basic Details */}
              <div className="space-y-3">
                <div className="font-bold text-slate-900 uppercase font-mono text-[11px] pb-1 border-b border-slate-100">
                  1. Basic Information
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-semibold mb-1">Product Title *</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Apple MacBook Air M3 (13.6-inch, 16GB, 512GB SSD)"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:border-primary-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Brand</label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="HodaHub or Manufacturer Name"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:border-primary-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:border-primary-500 focus:outline-none capitalize cursor-pointer"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">SKU (Stock Keeping Unit)</label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="Auto-generated if left blank"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:border-primary-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Initial Stock Count</label>
                    <input
                      type="number"
                      min="0"
                      value={stockCount}
                      onChange={(e) => setStockCount(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Pricing */}
              <div className="space-y-3">
                <div className="font-bold text-slate-900 uppercase font-mono text-[11px] pb-1 border-b border-slate-100">
                  2. Pricing & MRP (INR ₹)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Selling Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="e.g. 49999"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:border-primary-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Maximum Retail Price (MRP ₹)</label>
                    <input
                      type="number"
                      min="1"
                      value={mrp}
                      onChange={(e) => setMrp(e.target.value)}
                      placeholder="e.g. 59999"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Media / Images */}
              <div className="space-y-3">
                <div className="font-bold text-slate-900 uppercase font-mono text-[11px] pb-1 border-b border-slate-100">
                  3. Product Images (Cloudinary CDN / URLs)
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Enter image URL (Cloudinary or HTTPS)"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs focus:border-primary-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                  >
                    Add Image
                  </button>
                </div>

                {/* Previews */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {imageList.map((img, idx) => (
                    <div key={idx} className="relative group w-16 h-16 rounded-lg border border-slate-200 overflow-hidden bg-slate-100">
                      <img src={img} alt="preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute inset-0 bg-slate-950/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 text-rose-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Variants Builder (Colors & Sizes) */}
              <div className="space-y-3">
                <div className="font-bold text-slate-900 uppercase font-mono text-[11px] pb-1 border-b border-slate-100">
                  4. Variants Builder (Colors & Sizes)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Colors */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <label className="block text-slate-700 font-semibold">Color Options</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Color Name (e.g. Midnight)"
                        value={newColorName}
                        onChange={(e) => setNewColorName(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs"
                      />
                      <input
                        type="color"
                        value={newColorHex}
                        onChange={(e) => setNewColorHex(e.target.value)}
                        className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5"
                      />
                      <button
                        type="button"
                        onClick={handleAddColor}
                        className="px-2.5 py-1.5 bg-slate-900 text-white rounded-md text-xs font-semibold cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {colors.map((c, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-md text-[11px]">
                          <span className="w-2.5 h-2.5 rounded-full border border-slate-400" style={{ backgroundColor: c.hex }} />
                          <span>{c.name}</span>
                          <X
                            className="w-3 h-3 text-slate-400 hover:text-rose-500 cursor-pointer"
                            onClick={() => setColors((prev) => prev.filter((_, idx) => idx !== i))}
                          />
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Sizes */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <label className="block text-slate-700 font-semibold">Sizes / Storage</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="e.g. 256GB / XL / 42mm"
                        value={newSize}
                        onChange={(e) => setNewSize(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddSize}
                        className="px-2.5 py-1.5 bg-slate-900 text-white rounded-md text-xs font-semibold cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {sizes.map((s, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded-md text-[11px] font-mono">
                          <span>{s}</span>
                          <X
                            className="w-3 h-3 text-slate-400 hover:text-rose-500 cursor-pointer"
                            onClick={() => setSizes((prev) => prev.filter((_, idx) => idx !== i))}
                          />
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 5: Highlights & Specs */}
              <div className="space-y-3">
                <div className="font-bold text-slate-900 uppercase font-mono text-[11px] pb-1 border-b border-slate-100">
                  5. Specifications & Highlights
                </div>

                <div className="space-y-2">
                  <label className="block text-slate-700 font-semibold">Key Highlights (Bullet Points)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add key selling point..."
                      value={newHighlight}
                      onChange={(e) => setNewHighlight(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddHighlight}
                      className="px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    {highlights.map((h, i) => (
                      <li key={i} className="text-[11px]">
                        {h}{' '}
                        <button
                          type="button"
                          onClick={() => setHighlights((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-rose-500 hover:underline ml-1"
                        >
                          [remove]
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="block text-slate-700 font-semibold">Technical Specifications (Key - Value)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Spec Key (e.g. Battery)"
                      value={newSpecKey}
                      onChange={(e) => setNewSpecKey(e.target.value)}
                      className="w-1/3 px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Spec Value (e.g. 5000 mAh)"
                      value={newSpecVal}
                      onChange={(e) => setNewSpecVal(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddSpec}
                      className="px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {specs.map((s, i) => (
                      <div key={i} className="flex justify-between p-2 bg-slate-50 rounded border border-slate-200 text-[11px]">
                        <span className="font-semibold text-slate-700">{s.key}:</span>
                        <span className="text-slate-600 font-mono">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Available BoxOptions assignment */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-slate-700 font-semibold">
                    Available Box / Packaging Options for this Product
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Select which box options are offered to customers on this product's PDP popup.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {availableBoxOptionsList.map((box) => (
                      <label
                        key={box.id}
                        className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:border-amber-400 bg-slate-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedBoxOptionIds.includes(box.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBoxOptionIds([...selectedBoxOptionIds, box.id]);
                            } else {
                              setSelectedBoxOptionIds(
                                selectedBoxOptionIds.filter((id) => id !== box.id)
                              );
                            }
                          }}
                          className="rounded text-amber-600 accent-amber-600"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-slate-800 text-xs block truncate">
                            {box.name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            +{formatPrice(box.price)}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold shadow-sm cursor-pointer"
                >
                  Publish Product to HodaHub
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
