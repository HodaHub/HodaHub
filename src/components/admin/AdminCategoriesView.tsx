import React, { useState, useEffect, useRef } from 'react';
import {
  FolderTree,
  Plus,
  Search,
  Edit2,
  Trash2,
  Upload,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  CheckCircle2,
  Layers,
  X,
  RefreshCw,
  Folder,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';
import { useCategoriesStore } from '../../store/useCategoriesStore';
import { AdminCategory } from '../../lib/adminApi';
import { uploadToCloudinary } from '../../lib/cloudinary';

export const AdminCategoriesView: React.FC = () => {
  const {
    categories,
    loading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
  } = useCategoriesStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [parentCategoryId, setParentCategoryId] = useState<string>('');
  const [imageUrl, setImageUrl] = useState('');
  const [badge, setBadge] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(1);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Deletion warning modal
  const [deleteWarning, setDeleteWarning] = useState<{
    category: AdminCategory;
    productCount: number;
    message: string;
  } | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!slugManuallyEdited && !editingCategory) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generated);
    }
  };

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setSlugManuallyEdited(false);
    setParentCategoryId('');
    setImageUrl('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80');
    setBadge('');
    setSortOrder(categories.length + 1);
    setShowModal(true);
  };

  const handleOpenEditModal = (cat: AdminCategory) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setSlugManuallyEdited(true);
    setParentCategoryId(cat.parentCategoryId || '');
    setImageUrl(cat.imageUrl || '');
    setBadge(cat.badge || '');
    setSortOrder(cat.sortOrder ?? 1);
    setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const uploadedUrl = await uploadToCloudinary(file, 'hodahub_categories');
      setImageUrl(uploadedUrl);
      showToast('Category image uploaded to Cloudinary successfully.');
    } catch (err: any) {
      alert('Image upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!name.trim()) {
      alert('Category name is required.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: name.trim(),
          slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          parentCategoryId: parentCategoryId ? parentCategoryId : null,
          imageUrl: imageUrl.trim(),
          badge: badge.trim() || undefined,
          sortOrder: Number(sortOrder) || 1,
        });
        showToast(`Category "${name}" updated successfully.`);
      } else {
        await createCategory({
          name: name.trim(),
          slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          parentCategoryId: parentCategoryId ? parentCategoryId : null,
          imageUrl: imageUrl.trim(),
          badge: badge.trim() || undefined,
          sortOrder: Number(sortOrder) || categories.length + 1,
        });
        showToast(`Category "${name}" published to HodaHub.`);
      }
      setShowModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = async (cat: AdminCategory) => {
    // If category has products assigned, trigger strict safety warning
    if (cat.productCount > 0) {
      setDeleteWarning({
        category: cat,
        productCount: cat.productCount,
        message: `${cat.productCount} product${
          cat.productCount === 1 ? '' : 's'
        } are currently in "${cat.name}". Reassign or delete them first before deleting this category.`,
      });
      return;
    }

    if (!window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      return;
    }

    const res = await deleteCategory(cat.id);
    if (res.success) {
      showToast(`Category "${cat.name}" deleted.`);
    } else {
      setDeleteWarning({
        category: cat,
        productCount: res.productCount || 1,
        message:
          res.message ||
          `Cannot delete "${cat.name}" because products are still assigned to it.`,
      });
    }
  };

  const handleMoveSort = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sortedCategories.length) return;

    const copy = [...sortedCategories];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;

    await reorderCategories(copy.map((c) => c.id));
    showToast('Storefront category display order updated.');
  };

  // Filtered & sorted categories with ID deduplication
  const uniqueCategories = Array.from(new Map(categories.map((c) => [c.id, c])).values());
  const sortedCategories = uniqueCategories.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const filteredCategories = sortedCategories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalProducts = categories.reduce((sum, c) => sum + (c.productCount || 0), 0);
  const rootCategories = categories.filter((c) => !c.parentCategoryId);
  const nestedCategories = categories.filter((c) => !!c.parentCategoryId);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Category Management</h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary-50 text-primary-700 border border-primary-200">
              {categories.length} Categories
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Control HodaHub product taxonomy, mega-menu order, and storefront navigation bubbles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchCategories()}
            disabled={loading}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600 disabled:opacity-50"
            title="Reload categories"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-primary-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Categories</div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">{categories.length}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Root Nav Items</div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">{rootCategories.length}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Subcategories</div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">{nestedCategories.length}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Products</div>
          <div className="text-2xl font-black text-primary-600 font-mono mt-1">{totalProducts}</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by category name or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 w-16">Sort</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Slug / Path</th>
                <th className="py-3 px-4">Hierarchy</th>
                <th className="py-3 px-4 text-center">Catalog</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <FolderTree className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-sm text-slate-600">No categories found</p>
                    <p className="text-xs text-slate-400 mt-1">Try another search or add a new category.</p>
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat, index) => {
                  const parent = categories.find((c) => c.id === cat.parentCategoryId);
                  return (
                    <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Sort Controls */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleMoveSort(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 hover:bg-slate-200 rounded transition-colors"
                            title="Move up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveSort(index, 'down')}
                            disabled={index === filteredCategories.length - 1}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 hover:bg-slate-200 rounded transition-colors"
                            title="Move down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-mono text-[11px] font-bold text-slate-500 w-5 text-center">
                            {cat.sortOrder}
                          </span>
                        </div>
                      </td>

                      {/* Name & Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0">
                            <img
                              src={cat.imageUrl}
                              alt={cat.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span>{cat.name}</span>
                              {cat.badge && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200">
                                  {cat.badge}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">ID: {cat.id.substring(0, 12)}...</span>
                          </div>
                        </div>
                      </td>

                      {/* Slug */}
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80">
                          /category/{cat.slug}
                        </span>
                      </td>

                      {/* Hierarchy */}
                      <td className="py-3 px-4">
                        {parent ? (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Layers className="w-3.5 h-3.5 text-primary-500" />
                            <span className="font-medium text-[11px]">
                              {parent.name} &rarr; <strong className="text-slate-800">{cat.name}</strong>
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Root Nav Item
                          </span>
                        )}
                      </td>

                      {/* Product Count */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                            cat.productCount > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {cat.productCount} {cat.productCount === 1 ? 'Product' : 'Products'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(cat)}
                            className="p-1.5 text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Category"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(cat)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Category"
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

      {/* Hidden Cloudinary File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* ADD / EDIT CATEGORY MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                  <Folder className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smartphones & Tablets"
                  value={name}
                  onChange={handleNameChange}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  URL Slug <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center">
                  <span className="bg-slate-100 border border-r-0 border-slate-300 px-2.5 py-2 text-slate-500 rounded-l-lg font-mono text-[11px]">
                    /category/
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="smartphones"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setSlugManuallyEdited(true);
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-r-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Parent Category (Nesting) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Parent Category (Optional Nesting)
                </label>
                <select
                  value={parentCategoryId}
                  onChange={(e) => setParentCategoryId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
                >
                  <option value="">None (Top Level Root Category)</option>
                  {categories
                    .filter((c) => !editingCategory || c.id !== editingCategory.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Subcategories nest inside parent dropdowns in the HodaHub mega-menu.
                </p>
              </div>

              {/* Image with Cloudinary uploader */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Category Thumbnail (Cloudinary CDN / URL)
                </label>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-14 h-14 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center flex-shrink-0">
                    {imageUrl ? (
                      <img src={imageUrl} alt="Category preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-mono text-[10px]"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-md transition-colors text-[11px]"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingImage ? 'Uploading to Cloudinary...' : 'Upload Image to Cloudinary'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Badge & Sort Order */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Promo Badge (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Extra ₹3000 Off"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sort Order (Rank)</label>
                  <input
                    type="number"
                    min="1"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold rounded-lg transition-all shadow-sm cursor-pointer"
                >
                  {submitting
                    ? 'Saving...'
                    : editingCategory
                    ? 'Save & Update Category'
                    : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY DELETION WARNING MODAL */}
      {deleteWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-300 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-black text-slate-900 text-base">
                Cannot Delete Category
              </h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {deleteWarning.message}
              </p>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 text-left space-y-1">
                <p className="font-bold">Why is deletion blocked?</p>
                <p className="text-slate-600">
                  Deleting a category that still contains active items orphans products and breaks storefront customer navigation. Please reassign products to a different category in the <strong>Products</strong> tab first.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center pt-2">
              <button
                onClick={() => setDeleteWarning(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors text-xs"
              >
                Understood, Return to Categories
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
