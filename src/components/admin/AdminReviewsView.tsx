import React, { useState, useEffect, useMemo } from 'react';
import {
  Star,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Filter,
  Check,
  RefreshCw,
  Plus,
  Search,
  Trash2,
  X,
  AlertCircle,
  ShoppingBag,
  Eye,
  Sparkles,
  MapPin,
  Calendar,
} from 'lucide-react';
import { adminApi, AdminReview } from '../../lib/adminApi';
import { Product } from '../../types';
import { formatPrice } from '../../lib/utils';

export const AdminReviewsView: React.FC = () => {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Custom Review Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form Fields
  const [formReviewerName, setFormReviewerName] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formRating, setFormRating] = useState(5);
  const [formHoverRating, setFormHoverRating] = useState(0);
  const [formTitle, setFormTitle] = useState('');
  const [formComment, setFormComment] = useState('');
  const [formVerified, setFormVerified] = useState(true);
  const [formStatus, setFormStatus] = useState<'approved' | 'pending'>('approved');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getReviews();
      setReviews(data);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadProductsForModal = async () => {
    if (availableProducts.length > 0) return;
    setLoadingProducts(true);
    try {
      const prods = await adminApi.getProducts();
      setAvailableProducts(prods);
    } catch (err) {
      console.error('Failed to load products for review modal:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setFormError(null);
    loadProductsForModal();
  };

  const handleCloseModal = () => {
    if (submittingReview) return;
    setIsModalOpen(false);
    setSelectedProduct(null);
    setProductSearchQuery('');
    setFormReviewerName('');
    setFormLocation('');
    setFormRating(5);
    setFormTitle('');
    setFormComment('');
    setFormVerified(true);
    setFormStatus('approved');
    setFormError(null);
  };

  const handleApprove = async (id: string) => {
    try {
      await adminApi.approveReview(id);
      setReviews((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: 'approved' } : r))
      );
      showToast('Review approved and published to product page.');
    } catch (err: any) {
      alert(err.message || 'Failed to approve review');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await adminApi.rejectReview(id);
      setReviews((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: 'rejected' } : r))
      );
      showToast('Review rejected.');
    } catch (err: any) {
      alert(err.message || 'Failed to reject review');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this review?')) return;
    try {
      await adminApi.deleteReview(id);
      setReviews((prev) => prev.filter((r) => r._id !== id));
      showToast('Review deleted permanently.');
    } catch (err: any) {
      alert(err.message || 'Failed to delete review');
    }
  };

  const handlePublishCustomReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedProduct) {
      setFormError('Please search and select a product to review.');
      return;
    }
    if (!formReviewerName.trim()) {
      setFormError('Please provide a reviewer name.');
      return;
    }
    if (!formComment.trim()) {
      setFormError('Please write review feedback / comments.');
      return;
    }

    setSubmittingReview(true);
    try {
      const newReview = await adminApi.createReview({
        productId: selectedProduct.id,
        reviewerName: formReviewerName.trim(),
        rating: formRating,
        title: formTitle.trim() || 'Verified Customer Review',
        comment: formComment.trim(),
        verifiedPurchase: formVerified,
        status: formStatus,
        location: formLocation.trim() || 'Verified Buyer, India',
        createdAt: new Date().toISOString(),
      });

      setReviews((prev) => [newReview, ...prev]);
      showToast(
        formStatus === 'approved'
          ? 'Custom review published live to product page!'
          : 'Review saved in pending queue for moderation.'
      );
      handleCloseModal();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save review to database.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Filtered Products for Live Search Dropdown in Modal
  const matchingProducts = useMemo(() => {
    if (!productSearchQuery.trim()) {
      return availableProducts.slice(0, 6);
    }
    const q = productSearchQuery.toLowerCase();
    return availableProducts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q))
    ).slice(0, 10);
  }, [availableProducts, productSearchQuery]);

  // Filtered Reviews in moderation queue
  const filteredReviews = reviews.filter((r) => {
    const matchesFilter = filter === 'all' ? true : r.status === filter;
    if (!matchesFilter) return false;

    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (r.productTitle && r.productTitle.toLowerCase().includes(q)) ||
      (r.userName && r.userName.toLowerCase().includes(q)) ||
      (r.comment && r.comment.toLowerCase().includes(q)) ||
      (r.title && r.title.toLowerCase().includes(q))
    );
  });

  const pendingCount = reviews.filter((r) => r.status === 'pending').length;
  const approvedCount = reviews.filter((r) => r.status === 'approved').length;
  const rejectedCount = reviews.filter((r) => r.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Product Ratings & Reviews</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {reviews.length} total
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Search products, write verified admin reviews, or moderate customer ratings live on HodaHub store.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadReviews}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          
          {/* Main Action: Add Custom Review Button */}
          <button
            onClick={handleOpenModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Write Custom Review</span>
          </button>
        </div>
      </div>

      {/* Controls Bar: Search + Filter Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Reviews Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search reviews by product, customer, or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit text-xs self-start md:self-auto overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({reviews.length})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              filter === 'approved'
                ? 'bg-white text-emerald-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Approved ({approvedCount})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              filter === 'pending'
                ? 'bg-white text-amber-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              filter === 'rejected'
                ? 'bg-white text-rose-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rejected ({rejectedCount})
          </button>
        </div>
      </div>

      {/* Reviews List Stream */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary-500 mb-2" />
            <span>Loading reviews from Supabase...</span>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 space-y-3">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="font-semibold text-sm text-slate-700">No reviews found</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchTerm
                ? 'No reviews match your search query. Clear search to see all reviews.'
                : 'No reviews match this filter. Click "Write Custom Review" above to post a review for any product.'}
            </p>
            <button
              onClick={handleOpenModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Write First Review</span>
            </button>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div
              key={review._id}
              className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-colors flex flex-col md:flex-row gap-5 items-start justify-between"
            >
              {/* Review Content & Product Reference */}
              <div className="flex gap-4 items-start flex-1 min-w-0">
                {review.productImage && (
                  <img
                    src={review.productImage}
                    alt={review.productTitle || 'Product thumbnail'}
                    className="w-16 h-16 object-cover rounded-lg border border-slate-200 shrink-0 bg-slate-100"
                  />
                )}
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {review.productTitle}
                    </span>
                    {review.product?.sku && (
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {review.product.sku}
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                        review.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : review.status === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {review.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Stars & Title */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-bold text-xs text-slate-800">{review.title}</span>
                  </div>

                  {/* Review Text */}
                  <p className="text-xs text-slate-600 leading-relaxed max-w-3xl whitespace-pre-line">
                    "{review.comment}"
                  </p>

                  {/* Customer Meta */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                    <span className="font-medium text-slate-700">{review.userName}</span>
                    {review.userEmail && <span>• {review.userEmail}</span>}
                    {review.verifiedPurchase && (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verified Buyer</span>
                      </span>
                    )}
                    <span>
                      • {new Date(review.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Moderation Actions & Delete */}
              <div className="flex items-center md:flex-col gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                {review.status !== 'approved' && (
                  <button
                    onClick={() => handleApprove(review._id)}
                    className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                )}

                {review.status !== 'rejected' && (
                  <button
                    onClick={() => handleReject(review._id)}
                    className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                )}

                <button
                  onClick={() => handleDelete(review._id)}
                  className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Delete review permanently"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ========================================================================= */}
      {/* WRITE CUSTOM REVIEW MODAL WITH LIVE PRODUCT SEARCH */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Custom Product Review</h3>
                  <p className="text-[11px] text-slate-500">
                    Search any catalog SKU and create an authentic customer testimonial.
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                disabled={submittingReview}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handlePublishCustomReview} className="flex-1 overflow-y-auto p-6 space-y-5">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* STEP 1: PRODUCT SELECTION & SEARCH */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  1. Select Product <span className="text-rose-500">*</span>
                </label>

                {!selectedProduct ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Type product title, brand or SKU to search catalog..."
                        value={productSearchQuery}
                        onChange={(e) => setProductSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:bg-white transition-all"
                        autoFocus
                      />
                    </div>

                    {/* Matching Products Dropdown List */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-slate-100 bg-white">
                      {loadingProducts ? (
                        <div className="p-4 text-center text-xs text-slate-400">
                          Loading products from catalog...
                        </div>
                      ) : matchingProducts.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">
                          No products found matching "{productSearchQuery}"
                        </div>
                      ) : (
                        matchingProducts.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setSelectedProduct(p);
                              setFormError(null);
                            }}
                            className="p-2.5 flex items-center justify-between hover:bg-primary-50/40 transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80'}
                                alt={p.title}
                                className="w-10 h-10 object-cover rounded-lg border border-slate-200 bg-slate-50 shrink-0"
                              />
                              <div>
                                <div className="text-xs font-bold text-slate-900 group-hover:text-primary-600">
                                  {p.title}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  SKU: {p.sku || p.id.slice(0, 8)} • {formatPrice(p.price)}
                                </div>
                              </div>
                            </div>
                            <span className="text-[11px] font-bold text-primary-600 px-2 py-1 bg-primary-50 rounded-lg group-hover:bg-primary-600 group-hover:text-white transition-colors">
                              Select
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  /* Selected Product Card */
                  <div className="p-3 bg-primary-50/50 border border-primary-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedProduct.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80'}
                        alt={selectedProduct.title}
                        className="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0 bg-white"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900">{selectedProduct.title}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          SKU: {selectedProduct.sku} • {formatPrice(selectedProduct.price)}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(null)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1 bg-white border border-slate-200 rounded-lg cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              {/* STEP 2: REVIEWER IDENTITY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Reviewer Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Sharma"
                    value={formReviewerName}
                    onChange={(e) => setFormReviewerName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-primary-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Location / City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai, Maharashtra"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-primary-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* STEP 3: RATING (1-5 STARS) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Star Rating ({formRating} / 5)
                </label>
                <div className="flex items-center gap-1.5 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onMouseEnter={() => setFormHoverRating(star)}
                      onMouseLeave={() => setFormHoverRating(0)}
                      onClick={() => setFormRating(star)}
                      className="p-1 text-slate-300 hover:text-amber-400 focus:outline-none cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= (formHoverRating || formRating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-3 text-xs font-bold font-mono text-amber-600">
                    {formRating === 5
                      ? '5 Stars (Outstanding)'
                      : formRating === 4
                      ? '4 Stars (Very Good)'
                      : formRating === 3
                      ? '3 Stars (Average)'
                      : formRating === 2
                      ? '2 Stars (Disappointed)'
                      : '1 Star (Poor)'}
                  </span>
                </div>
              </div>

              {/* STEP 4: REVIEW HEADLINE & COMMENT */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Review Headline / Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pristine build quality & lightning delivery"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-primary-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Detailed Review Feedback <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Write detailed customer feedback regarding packaging, sound, performance, or overall satisfaction..."
                    value={formComment}
                    onChange={(e) => setFormComment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-primary-500 focus:bg-white resize-none"
                  />
                </div>
              </div>

              {/* STEP 5: BADGES & PUBLICATION STATUS */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formVerified}
                    onChange={(e) => setFormVerified(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Display "Verified Buyer" badge</span>
                  </span>
                </label>

                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-600">Publish Status:</span>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'approved' | 'pending')}
                    className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="approved">Approved (Live on Product Page)</option>
                    <option value="pending">Pending Moderation</option>
                  </select>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submittingReview}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-2"
                >
                  {submittingReview ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to Supabase...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Publish Review</span>
                    </>
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
