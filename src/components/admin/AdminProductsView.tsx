import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Check,
  X,
  Edit3,
  Layers,
  Image as ImageIcon,
  UploadCloud,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { adminApi } from '../../lib/adminApi';
import { Product, BoxOption } from '../../types';
import { formatPrice } from '../../lib/utils';
import { CATEGORIES } from '../../data/categories';
import { getStoredBoxOptions } from '../../data/boxOptions';
import {
  uploadToCloudinary,
  extractCloudinaryPublicId,
  deleteCloudinaryImage,
  replaceCloudinaryImage,
} from '../../lib/cloudinary';
import { supabase } from '../../lib/supabase';
import { useCategoriesStore } from '../../store/useCategoriesStore';
import { useProductsStore } from '../../store/useProductsStore';

export const AdminProductsView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [submittingProduct, setSubmittingProduct] = useState(false);

  // Dynamic Categories from store
  const { categories, fetchCategories, createCategory } = useCategoriesStore();
  const { addProduct, updateProduct: updateStoreProduct, deleteProduct: deleteStoreProduct } = useProductsStore();

  // Quick Category creation state
  const [showQuickCategoryModal, setShowQuickCategoryModal] = useState(false);
  const [quickCatName, setQuickCatName] = useState('');
  const [savingQuickCat, setSavingQuickCat] = useState(false);

  // Form State for "Add / Edit Product"
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('HodaHub');
  const [category, setCategory] = useState('general');
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

  // Image Management Modal State
  const [selectedProductForImages, setSelectedProductForImages] = useState<Product | null>(null);
  const [activeReplaceIndex, setActiveReplaceIndex] = useState<number | null>(null);
  const [replacingImageIdx, setReplacingImageIdx] = useState<number | null>(null);
  const [deletingImageIdx, setDeletingImageIdx] = useState<number | null>(null);
  const [uploadingNewImage, setUploadingNewImage] = useState(false);
  const [uploadingInAddModal, setUploadingInAddModal] = useState(false);

  const replaceFileRef = useRef<HTMLInputElement | null>(null);
  const addModalFileRef = useRef<HTMLInputElement | null>(null);
  const newProductImageFileRef = useRef<HTMLInputElement | null>(null);

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
    fetchCategories();
  }, [fetchCategories]);

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
      deleteStoreProduct(id);
      showToast(`Product "${name}" deleted from HodaHub catalog.`);
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  // -------------------------------------------------------------
  // CLOUDINARY MEDIA ACTIONS (Edge Functions + DB Sync)
  // -------------------------------------------------------------
  const handleTriggerReplace = (index: number) => {
    setActiveReplaceIndex(index);
    replaceFileRef.current?.click();
  };

  const handleFileChangeForReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || activeReplaceIndex === null || !selectedProductForImages) return;

    const index = activeReplaceIndex;
    const oldUrl = selectedProductForImages.images[index];
    const publicId =
      extractCloudinaryPublicId(oldUrl) ||
      `hodahub_products/${(selectedProductForImages.sku || selectedProductForImages.id).toLowerCase()}_${index}`;

    setReplacingImageIdx(index);
    try {
      const result = await replaceCloudinaryImage({
        publicId,
        file,
        productId: selectedProductForImages.id,
        oldUrl,
      });

      const newUrl = result.secure_url || result.url;
      const updatedImages = [...selectedProductForImages.images];
      updatedImages[index] = newUrl;

      const updatedProduct = { ...selectedProductForImages, images: updatedImages };
      setSelectedProductForImages(updatedProduct);
      setProducts((prev) => prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)));
      showToast(`HodaHub Asset ${publicId} replaced in Cloudinary and DB synchronized.`);
    } catch (err: any) {
      alert(err.message || 'Failed to replace image');
    } finally {
      setReplacingImageIdx(null);
      setActiveReplaceIndex(null);
      e.target.value = '';
    }
  };

  const handleDeleteImageForProduct = async (imgUrl: string, index: number) => {
    if (!selectedProductForImages) return;
    if (!window.confirm('Are you sure you want to permanently destroy this image from Cloudinary and HodaHub?')) {
      return;
    }

    const publicId =
      extractCloudinaryPublicId(imgUrl) ||
      `hodahub_products/${(selectedProductForImages.sku || selectedProductForImages.id).toLowerCase()}_${index}`;

    setDeletingImageIdx(index);
    try {
      await deleteCloudinaryImage({
        publicId,
        productId: selectedProductForImages.id,
        imageUrl: imgUrl,
      });

      const updatedImages = selectedProductForImages.images.filter((_, i) => i !== index);
      const updatedProduct = { ...selectedProductForImages, images: updatedImages };
      setSelectedProductForImages(updatedProduct);
      setProducts((prev) => prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)));
      showToast(`HodaHub Asset ${publicId} deleted from Cloudinary & DB cleaned.`);
    } catch (err: any) {
      alert(err.message || 'Failed to delete image');
    } finally {
      setDeletingImageIdx(null);
    }
  };

  const handleAddNewImageToProduct = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProductForImages) return;

    setUploadingNewImage(true);
    try {
      const newUrl = await uploadToCloudinary(file, 'hodahub_products');

      // Insert into product_images table in Supabase
      try {
        await supabase.from('product_images').insert({
          product_id: selectedProductForImages.id,
          url: newUrl,
          sort_order: selectedProductForImages.images.length,
        });
      } catch (dbErr) {
        console.warn('HodaHub product_images DB insert warning:', dbErr);
      }

      const updatedImages = [...selectedProductForImages.images, newUrl];
      const updatedProduct = { ...selectedProductForImages, images: updatedImages };
      setSelectedProductForImages(updatedProduct);
      setProducts((prev) => prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)));
      showToast('New image uploaded to Cloudinary and attached to product.');
    } catch (err: any) {
      alert(err.message || 'Failed to upload new image');
    } finally {
      setUploadingNewImage(false);
      e.target.value = '';
    }
  };

  const handleFileUploadInAddModal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingInAddModal(true);
    try {
      const newUrl = await uploadToCloudinary(file, 'hodahub_products');
      setImageList((prev) => [...prev, newUrl]);
      showToast('Image uploaded to Cloudinary.');
    } catch (err: any) {
      alert(err.message || 'Failed to upload image');
    } finally {
      setUploadingInAddModal(false);
      e.target.value = '';
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

  const handleQuickCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCatName.trim()) return;
    setSavingQuickCat(true);
    try {
      const newCat = await createCategory({
        name: quickCatName.trim(),
      });
      setCategory(newCat.slug || newCat.id);
      setShowQuickCategoryModal(false);
      setQuickCatName('');
      showToast(`Category "${newCat.name}" created.`);
    } catch (err: any) {
      alert(err.message || 'Failed to create category');
    } finally {
      setSavingQuickCat(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setTitle('');
    setDescription('');
    setBrand('HodaHub');
    const defaultCat = categories.length > 0 ? (categories[0].slug || categories[0].id) : 'general';
    setCategory(defaultCat);
    setSku('');
    setPrice('');
    setMrp('');
    setStockCount('50');
    setImageList(['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80']);
    setHighlights(['100% Genuine HodaAssured Item', 'Official Brand Warranty with Fast Dispatch']);
    setSpecs([
      { key: 'Warranty', value: '1 Year Brand Warranty' },
      { key: 'Country of Origin', value: 'India' },
    ]);
    setColors([{ name: 'Space Black', hex: '#1e293b' }]);
    setSizes(['Standard']);
    setSelectedBoxOptionIds(['box-opt-simple', 'box-opt-premium']);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setTitle(product.title || '');
    setDescription(product.description || '');
    setBrand(product.brand || 'HodaHub');
    const fallbackCat = categories.length > 0 ? (categories[0].slug || categories[0].id) : 'general';
    setCategory(product.category || fallbackCat);
    setSku(product.sku || '');
    setPrice(String(product.price || ''));
    setMrp(String(product.originalPrice || ''));
    setStockCount(String(product.stockCount !== undefined ? product.stockCount : 50));
    setImageList(product.images && product.images.length > 0 ? [...product.images] : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80']);
    setHighlights(product.highlights && product.highlights.length > 0 ? [...product.highlights] : ['100% Genuine HodaAssured Item']);
    const loadedSpecs: { key: string; value: string }[] = [];
    if (product.specs && typeof product.specs === 'object') {
      for (const [sectionKey, sectionVal] of Object.entries(product.specs)) {
        if (typeof sectionVal === 'object' && sectionVal !== null) {
          for (const [subKey, subVal] of Object.entries(sectionVal)) {
            loadedSpecs.push({ key: `${sectionKey} - ${subKey}`, value: String(subVal) });
          }
        } else {
          loadedSpecs.push({ key: sectionKey, value: String(sectionVal) });
        }
      }
    }
    setSpecs(
      loadedSpecs.length > 0
        ? loadedSpecs
        : [
            { key: 'Warranty', value: '1 Year Brand Warranty' },
            { key: 'Country of Origin', value: 'India' },
          ]
    );
    setColors(product.colors && product.colors.length > 0 ? [...product.colors] : []);
    setSizes(product.sizes && product.sizes.length > 0 ? [...product.sizes] : ['Standard']);
    setSelectedBoxOptionIds(
      product.availableBoxOptionIds && product.availableBoxOptionIds.length > 0
        ? [...product.availableBoxOptionIds]
        : ['box-opt-simple', 'box-opt-premium']
    );
    setShowAddModal(true);
  };

  const handleProductFormSubmit = async (e: React.FormEvent) => {
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

    const payload: any = {
      title: title.trim(),
      description: description.trim() || undefined,
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

    if (submittingProduct) return;
    setSubmittingProduct(true);

    try {
      if (editingProduct) {
        // Edit Mode: Update existing product without creating duplicate
        const targetId = editingProduct.id || (editingProduct as any)._id;
        await adminApi.updateProduct(targetId, payload);

        setProducts((prev) =>
          prev.map((p) => {
            const pid = p.id || (p as any)._id;
            if (pid === targetId) {
              return { ...p, ...payload, id: pid };
            }
            return p;
          })
        );
        updateStoreProduct(targetId, payload);
        setShowAddModal(false);
        setEditingProduct(null);
        showToast(`Successfully updated "${payload.title}" in HodaHub catalog.`);
      } else {
        // Create Mode: Add new product with deduplication
        const created = await adminApi.createProduct(payload);
        setProducts((prev) => {
          const targetId = created.id || (created as any)._id;
          const filtered = prev.filter((p) => (p.id || (p as any)._id) !== targetId);
          return [created, ...filtered];
        });
        addProduct(created);
        setShowAddModal(false);
        showToast(`Successfully added "${created.title}" to HodaHub catalog.`);
      }

      // Reset form
      setTitle('');
      setDescription('');
      setPrice('');
      setMrp('');
      setSku('');
    } catch (err: any) {
      alert(err.message || 'Failed to save product');
    } finally {
      setSubmittingProduct(false);
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
          onClick={handleOpenAddModal}
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
            {categories.length > 0 ? (
              categories.map((cat) => (
                <option key={cat.id} value={cat.slug || cat.id}>
                  {cat.name}
                </option>
              ))
            ) : (
              CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))
            )}
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
                        <div
                          onClick={() => handleOpenEditModal(product)}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <img
                            src={firstImg}
                            alt={product.title}
                            className="w-10 h-10 object-cover rounded-md border border-slate-200 shrink-0 bg-slate-100 group-hover:border-primary-500 transition-colors"
                          />
                          <div className="max-w-xs">
                            <div className="font-bold text-slate-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
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
                            onClick={() => handleOpenEditModal(product)}
                            className="p-1.5 text-slate-700 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-semibold text-[11px] border border-slate-200 hover:border-primary-200"
                            title="Edit Product Details"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-primary-600" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => setSelectedProductForImages(product)}
                            className="p-1.5 text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-medium text-[11px] border border-slate-200"
                            title="Manage Cloudinary Images"
                          >
                            <ImageIcon className="w-3.5 h-3.5 text-primary-600" />
                            <span className="hidden md:inline font-mono">({product.images?.length || 0})</span>
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id, product.title)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
                <h3 className="font-bold text-sm">
                  {editingProduct ? `Edit Product: ${editingProduct.title}` : 'Add New Product to HodaHub Catalog'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingProduct(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProductFormSubmit} className="p-6 space-y-6 text-xs max-h-[80vh] overflow-y-auto">
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

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-semibold mb-1">Product Summary / Description</label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Detailed product overview, warranty notes, and key technical specifications..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:border-primary-500 focus:outline-none font-sans"
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-700 font-semibold">Category *</label>
                      <button
                        type="button"
                        onClick={() => setShowQuickCategoryModal(true)}
                        className="text-[11px] text-primary-600 hover:text-primary-700 font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Category</span>
                      </button>
                    </div>
                    {categories.length > 0 ? (
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:border-primary-500 focus:outline-none capitalize cursor-pointer"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.slug || c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          placeholder="e.g. Watches, Mobiles, Shoes..."
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs focus:border-primary-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowQuickCategoryModal(true)}
                          className="px-2.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer"
                        >
                          + New
                        </button>
                      </div>
                    )}
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

                <input
                  type="file"
                  ref={addModalFileRef}
                  accept="image/*"
                  onChange={handleFileUploadInAddModal}
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Enter image URL (Cloudinary or HTTPS)"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs focus:border-primary-500 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddImage}
                      className="px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                    >
                      Add URL
                    </button>
                    <button
                      type="button"
                      onClick={() => addModalFileRef.current?.click()}
                      disabled={uploadingInAddModal}
                      className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {uploadingInAddModal ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Upload File</span>
                        </>
                      )}
                    </button>
                  </div>
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
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProduct}
                  className="px-5 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg font-bold shadow-sm cursor-pointer"
                >
                  {submittingProduct
                    ? 'Publishing to HodaHub...'
                    : editingProduct
                    ? 'Save & Update Product'
                    : 'Publish Product to HodaHub'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HIDDEN FILE INPUTS FOR CLOUDINARY ACTIONS */}
      <input
        type="file"
        ref={replaceFileRef}
        accept="image/*"
        onChange={handleFileChangeForReplace}
        className="hidden"
      />
      <input
        type="file"
        ref={newProductImageFileRef}
        accept="image/*"
        onChange={handleAddNewImageToProduct}
        className="hidden"
      />

      {/* HODAHUB CLOUDINARY IMAGE MANAGEMENT MODAL */}
      {selectedProductForImages && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="h-16 px-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ImageIcon className="w-5 h-5 text-primary-400" />
                <div>
                  <h3 className="font-bold text-sm">HodaHub Media Manager (Cloudinary)</h3>
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    {selectedProductForImages.title} • SKU: {selectedProductForImages.sku || selectedProductForImages.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProductForImages(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <div className="font-bold text-xs text-slate-900">
                    Product Gallery ({selectedProductForImages.images.length} images)
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Replace or destroy media assets directly in Cloudinary. Changes automatically sync to the HodaHub catalog and Supabase database.
                  </p>
                </div>

                <button
                  onClick={() => newProductImageFileRef.current?.click()}
                  disabled={uploadingNewImage}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {uploadingNewImage ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading to Cloudinary...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload & Add Image</span>
                    </>
                  )}
                </button>
              </div>

              {selectedProductForImages.images.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs border-2 border-dashed border-slate-200 rounded-xl">
                  No images currently attached to this product. Click &quot;Upload & Add Image&quot; to upload one to Cloudinary.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedProductForImages.images.map((imgUrl, idx) => {
                    const publicId = extractCloudinaryPublicId(imgUrl) || `Asset #${idx + 1}`;
                    const isReplacing = replacingImageIdx === idx;
                    const isDeleting = deletingImageIdx === idx;

                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex gap-3">
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-white border border-slate-200 shrink-0 relative">
                            <img
                              src={imgUrl}
                              alt={`Product ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {idx === 0 && (
                              <span className="absolute top-1 left-1 bg-primary-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                                Primary
                              </span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-mono font-semibold text-slate-800 break-all line-clamp-2">
                              {publicId}
                            </div>
                            <a
                              href={imgUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-primary-600 hover:underline inline-flex items-center gap-1 mt-1 truncate max-w-full"
                            >
                              <span>Open Cloudinary CDN</span>
                            </a>
                          </div>
                        </div>

                        {/* Actions: Replace with overwrite & Delete with destroy */}
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80">
                          <button
                            type="button"
                            onClick={() => handleTriggerReplace(idx)}
                            disabled={isReplacing || isDeleting}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isReplacing ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-600" />
                                <span>Replacing in Cloudinary...</span>
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                                <span>Replace Image</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteImageForProduct(imgUrl, idx)}
                            disabled={isReplacing || isDeleting}
                            className="inline-flex items-center justify-center p-2 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            title="Destroy image from Cloudinary"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="h-14 px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedProductForImages(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADD CATEGORY MODAL */}
      {showQuickCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="h-14 px-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary-400" />
                <h3 className="font-bold text-sm">Quick Add Category</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickCategoryModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickCategorySubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 text-xs">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={quickCatName}
                  onChange={(e) => setQuickCatName(e.target.value)}
                  placeholder="e.g. Watches, Sneakers, Handbags..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQuickCategoryModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingQuickCat || !quickCatName.trim()}
                  className="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingQuickCat ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Create Category</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
