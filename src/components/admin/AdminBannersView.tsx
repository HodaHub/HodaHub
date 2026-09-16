import React, { useState, useEffect, useRef } from 'react';
import {
  Sliders,
  Plus,
  Search,
  Edit2,
  Trash2,
  Upload,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  X,
  RefreshCw,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { useBannersStore } from '../../store/useBannersStore';
import { AdminBanner } from '../../lib/adminApi';
import { uploadToCloudinary } from '../../lib/cloudinary';

export const AdminBannersView: React.FC = () => {
  const {
    banners,
    loading,
    fetchBanners,
    createBanner,
    updateBanner,
    deleteBanner,
    toggleBannerActive,
  } = useBannersStore();

  const [filterTab, setFilterTab] = useState<'all' | 'live' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<AdminBanner | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(1);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenAddModal = () => {
    setEditingBanner(null);
    setTitle('');
    setImageUrl('https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=1200&q=80');
    setLinkUrl('/category/mobiles');
    setIsActive(true);
    setStartDate('');
    setEndDate('');
    setSortOrder(banners.length + 1);
    setShowModal(true);
  };

  const handleOpenEditModal = (banner: AdminBanner) => {
    setEditingBanner(banner);
    setTitle(banner.title);
    setImageUrl(banner.imageUrl);
    setLinkUrl(banner.linkUrl);
    setIsActive(banner.isActive);
    setStartDate(banner.startDate ? banner.startDate.substring(0, 16) : '');
    setEndDate(banner.endDate ? banner.endDate.substring(0, 16) : '');
    setSortOrder(banner.sortOrder ?? 1);
    setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const uploadedUrl = await uploadToCloudinary(file, 'hodahub_banners');
      setImageUrl(uploadedUrl);
      showToast('Banner image uploaded to Cloudinary successfully.');
    } catch (err: any) {
      alert('Upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) {
      alert('Banner title and image are required.');
      return;
    }

    try {
      const startIso = startDate ? new Date(startDate).toISOString() : null;
      const endIso = endDate ? new Date(endDate).toISOString() : null;

      if (editingBanner) {
        await updateBanner(editingBanner.id, {
          title: title.trim(),
          imageUrl: imageUrl.trim(),
          linkUrl: linkUrl.trim() || '/',
          isActive,
          startDate: startIso,
          endDate: endIso,
          sortOrder: Number(sortOrder) || 1,
        });
        showToast(`Banner "${title}" updated.`);
      } else {
        await createBanner({
          title: title.trim(),
          imageUrl: imageUrl.trim(),
          linkUrl: linkUrl.trim() || '/',
          isActive,
          startDate: startIso,
          endDate: endIso,
          sortOrder: Number(sortOrder) || banners.length + 1,
        });
        showToast(`Banner "${title}" published to HodaHub carousel.`);
      }
      setShowModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save banner');
    }
  };

  const handleDelete = async (banner: AdminBanner) => {
    if (!window.confirm(`Are you sure you want to remove banner "${banner.title}"?`)) {
      return;
    }
    await deleteBanner(banner.id);
    showToast(`Banner "${banner.title}" deleted.`);
  };

  const handleToggleActive = async (banner: AdminBanner) => {
    await toggleBannerActive(banner.id, !banner.isActive);
    showToast(`Banner status updated to ${!banner.isActive ? 'Active' : 'Inactive'}.`);
  };

  const handleMoveSort = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sortedBanners.length) return;

    const currentBanner = sortedBanners[index];
    const targetBanner = sortedBanners[targetIdx];

    await updateBanner(currentBanner.id, { sortOrder: targetBanner.sortOrder });
    await updateBanner(targetBanner.id, { sortOrder: currentBanner.sortOrder });
    await fetchBanners();
    showToast('Banner carousel sequence updated.');
  };

  // Helper to determine live status
  const getBannerScheduleStatus = (b: AdminBanner) => {
    if (!b.isActive) return { label: 'Inactive', color: 'bg-slate-100 text-slate-500 border-slate-200' };
    const now = new Date();
    if (b.startDate && new Date(b.startDate) > now) {
      return { label: 'Scheduled', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    if (b.endDate && new Date(b.endDate) < now) {
      return { label: 'Expired', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    return { label: 'Live Now', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  const sortedBanners = [...banners].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const filteredBanners = sortedBanners.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.linkUrl.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    const status = getBannerScheduleStatus(b);
    if (filterTab === 'live') return status.label === 'Live Now';
    if (filterTab === 'inactive') return status.label !== 'Live Now';
    return true;
  });

  const liveBannersCount = banners.filter((b) => getBannerScheduleStatus(b).label === 'Live Now').length;

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
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Banner Management</h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary-50 text-primary-700 border border-primary-200">
              {banners.length} Banners ({liveBannersCount} Live)
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Manage homepage hero carousel sliders, promotional banners, and scheduled marketing campaigns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchBanners()}
            disabled={loading}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600 disabled:opacity-50"
            title="Reload banners"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-primary-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Banner</span>
          </button>
        </div>
      </div>

      {/* Live Carousel Notice */}
      <div className="bg-gradient-to-r from-primary-50 via-indigo-50 to-purple-50 rounded-xl p-4 border border-primary-100 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-600 text-white flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              Dynamic Homepage Hero Carousel Integration
            </h4>
            <p className="text-[11px] text-slate-600">
              Active banners that satisfy scheduled date ranges appear immediately on the HodaHub homepage hero carousel. Inactive and expired banners are automatically hidden from shoppers.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1 w-full sm:w-auto">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterTab === 'all'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Banners ({banners.length})
          </button>
          <button
            onClick={() => setFilterTab('live')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterTab === 'live'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Live Now ({liveBannersCount})
          </button>
          <button
            onClick={() => setFilterTab('inactive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterTab === 'inactive'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Scheduled / Inactive ({banners.length - liveBannersCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search banners by title or link..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
        </div>
      </div>

      {/* Banners Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 w-16">Sort</th>
                <th className="py-3 px-4">Banner Preview</th>
                <th className="py-3 px-4">Internal Title / Reference</th>
                <th className="py-3 px-4">Link Destination</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Schedule (Start &rarr; End)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBanners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Sliders className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-sm text-slate-600">No banners found</p>
                    <p className="text-xs text-slate-400 mt-1">Create a banner to appear on the HodaHub homepage.</p>
                  </td>
                </tr>
              ) : (
                filteredBanners.map((banner, index) => {
                  const status = getBannerScheduleStatus(banner);
                  return (
                    <tr key={banner.id} className="hover:bg-slate-50/70 transition-colors">
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
                            disabled={index === filteredBanners.length - 1}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 hover:bg-slate-200 rounded transition-colors"
                            title="Move down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-mono text-[11px] font-bold text-slate-500 w-5 text-center">
                            {banner.sortOrder}
                          </span>
                        </div>
                      </td>

                      {/* Banner Image Preview */}
                      <td className="py-3 px-4">
                        <div className="w-32 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-900 shadow-xs flex-shrink-0 group relative">
                          <img
                            src={banner.imageUrl}
                            alt={banner.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      </td>

                      {/* Title */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs">
                          {banner.title}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ID: {banner.id.substring(0, 12)}...
                        </span>
                      </td>

                      {/* Link Destination */}
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80 inline-flex items-center gap-1">
                          <span>{banner.linkUrl}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleActive(banner)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${status.color}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              status.label === 'Live Now'
                                ? 'bg-emerald-500 animate-pulse'
                                : status.label === 'Scheduled'
                                ? 'bg-amber-500'
                                : 'bg-slate-400'
                            }`}
                          />
                          <span>{status.label}</span>
                        </button>
                      </td>

                      {/* Schedule Date Range */}
                      <td className="py-3 px-4">
                        {banner.startDate || banner.endDate ? (
                          <div className="space-y-0.5 text-[11px] text-slate-600">
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400 font-mono text-[10px]">Start:</span>
                              <span className="font-medium">
                                {banner.startDate ? new Date(banner.startDate).toLocaleDateString('en-IN') : 'Immediately'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400 font-mono text-[10px]">End:</span>
                              <span className="font-medium">
                                {banner.endDate ? new Date(banner.endDate).toLocaleDateString('en-IN') : 'No expiry'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Always active</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(banner)}
                            className="p-1.5 text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Banner"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(banner)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Banner"
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

      {/* ADD / EDIT BANNER MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                  <Sliders className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingBanner ? 'Edit Banner' : 'Add Hero Banner'}
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
              {/* Title / Label */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Banner Title (Internal Reference) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diwali Mega Sale 2026 - Flagship Phones"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Internal reference for admin tracking.
                </p>
              </div>

              {/* Banner Image Upload & Preview */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Banner Creative Image <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  <div className="w-full h-32 rounded-xl border border-slate-200 overflow-hidden bg-slate-900 flex items-center justify-center relative">
                    {imageUrl ? (
                      <img src={imageUrl} alt="Banner preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-500" />
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      required
                      placeholder="https://images.unsplash.com/..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-mono text-[10px]"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-md transition-colors text-[11px] flex-shrink-0"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingImage ? 'Uploading...' : 'Upload Cloudinary'}</span>
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    💡 <strong>Recommended creative dimensions:</strong> 1920x500px or 1200x400px (16:4 or 21:9 wide aspect ratio). High-resolution graphics with key visuals aligned towards the right side display optimally on HodaHub desktop & mobile displays.
                  </p>
                </div>
              </div>

              {/* Destination Link */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Click Destination (URL or Storefront Route) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. /category/mobiles or /product/sony-wh-1000xm5"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-mono text-xs"
                />
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400">Quick presets:</span>
                  {['/category/mobiles', '/category/electronics', '/category/appliances', '/category/fashion'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setLinkUrl(preset)}
                      className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-mono"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Schedule Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Start Date & Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Leave empty to go live immediately.</p>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    End Date & Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Leave empty for no expiration.</p>
                </div>
              </div>

              {/* Sort Order & Active Toggle */}
              <div className="grid grid-cols-2 gap-3 items-center pt-1">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Carousel Order (Rank)</label>
                  <input
                    type="number"
                    min="1"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>

                <div className="pt-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                    />
                    <span className="font-bold text-slate-800 text-xs">
                      Banner is Active
                    </span>
                  </label>
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
                  className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg transition-all shadow-sm"
                >
                  {editingBanner ? 'Save & Update Banner' : 'Publish Banner to Carousel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
