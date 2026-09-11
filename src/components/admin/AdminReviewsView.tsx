import React, { useState, useEffect } from 'react';
import {
  Star,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Filter,
  Check,
  RefreshCw,
  ThumbsUp,
  MessageSquare,
} from 'lucide-react';
import { adminApi, AdminReview } from '../../lib/adminApi';

export const AdminReviewsView: React.FC = () => {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  useEffect(() => {
    loadReviews();
  }, []);

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

  const filteredReviews = reviews.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const pendingCount = reviews.filter((r) => r.status === 'pending').length;

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
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Review Moderation Queue</h2>
          <p className="text-xs text-slate-500">
            Moderate customer product feedback, verify authentic purchases, and manage public star ratings.
          </p>
        </div>
        <button
          onClick={loadReviews}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit text-xs">
        <button
          onClick={() => setFilter('pending')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
            filter === 'pending'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Pending Review ({pendingCount})
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
            filter === 'approved'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
            filter === 'rejected'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Rejected
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All
        </button>
      </div>

      {/* Reviews Stream */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            Loading reviews queue...
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            No reviews in this queue.
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div
              key={review._id}
              className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col md:flex-row gap-5 items-start justify-between"
            >
              {/* Review Content & Product Reference */}
              <div className="flex gap-4 items-start flex-1">
                {review.productImage && (
                  <img
                    src={review.productImage}
                    alt={review.productTitle}
                    className="w-16 h-16 object-cover rounded-lg border border-slate-200 shrink-0 bg-slate-100"
                  />
                )}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {review.productTitle}
                    </span>
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
                            i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-bold text-xs text-slate-800">{review.title}</span>
                  </div>

                  {/* Review Text */}
                  <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                    "{review.comment}"
                  </p>

                  {/* Customer Meta */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                    <span className="font-medium text-slate-700">{review.userName}</span>
                    {review.userEmail && <span>• {review.userEmail}</span>}
                    {review.verifiedPurchase && (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verified HodaHub Buyer</span>
                      </span>
                    )}
                    <span>• {new Date(review.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                  </div>
                </div>
              </div>

              {/* Moderation Actions */}
              <div className="flex md:flex-col gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                <button
                  onClick={() => handleApprove(review._id)}
                  disabled={review.status === 'approved'}
                  className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve</span>
                </button>
                <button
                  onClick={() => handleReject(review._id)}
                  disabled={review.status === 'rejected'}
                  className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
