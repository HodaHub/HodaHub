import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  IndianRupee,
} from 'lucide-react';
import { BoxOption } from '../../types';
import { getStoredBoxOptions, saveStoredBoxOptions } from '../../data/boxOptions';
import { formatPrice } from '../../lib/utils';

export const AdminBoxOptionsView: React.FC = () => {
  const [boxOptions, setBoxOptions] = useState<BoxOption[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('299');
  const [image, setImage] = useState('/images/premium-box-upgrade.jpg');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadOptions = () => {
    const list = getStoredBoxOptions();
    setBoxOptions(list);
  };

  useEffect(() => {
    loadOptions();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setPrice('299');
    setImage('/images/premium-box-upgrade.jpg');
    setDescription('Authentic rigid matte black magnetic box, official tags, warranty card & manual booklet.');
    setIsActive(true);
    setShowModal(true);
  };

  const handleOpenEdit = (opt: BoxOption) => {
    setEditingId(opt.id);
    setName(opt.name);
    setPrice(String(opt.price));
    setImage(opt.image);
    setDescription(opt.description || '');
    setIsActive(opt.isActive);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please provide a name for this box option.');
      return;
    }

    const priceNum = Math.max(0, parseInt(price, 10) || 0);

    if (editingId) {
      // Update existing
      const updated = boxOptions.map((b) =>
        b.id === editingId
          ? {
              ...b,
              name: name.trim(),
              price: priceNum,
              image: image.trim() || '/images/premium-box-upgrade.jpg',
              description: description.trim(),
              isActive,
            }
          : b
      );
      setBoxOptions(updated);
      saveStoredBoxOptions(updated);
      showToast(`Box option "${name}" updated successfully.`);
    } else {
      // Create new
      const newOption: BoxOption = {
        id: `box-opt-${Date.now()}`,
        name: name.trim(),
        price: priceNum,
        image: image.trim() || '/images/premium-box-upgrade.jpg',
        description: description.trim(),
        isActive,
      };
      const updated = [...boxOptions, newOption];
      setBoxOptions(updated);
      saveStoredBoxOptions(updated);
      showToast(`New box option "${name}" created.`);
    }

    setShowModal(false);
  };

  const handleDelete = (id: string, boxName: string) => {
    if (!window.confirm(`Are you sure you want to delete box option "${boxName}"?`)) {
      return;
    }
    const updated = boxOptions.filter((b) => b.id !== id);
    setBoxOptions(updated);
    saveStoredBoxOptions(updated);
    showToast(`Box option "${boxName}" removed.`);
  };

  const handleToggleStatus = (id: string) => {
    const updated = boxOptions.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b));
    setBoxOptions(updated);
    saveStoredBoxOptions(updated);
    showToast('Box option status updated.');
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-3">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-950 font-sans tracking-tight">
              Packaging & Box Options
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure available gift & upgrade boxes, prices, and packshot images for HodaHub products.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Box Option</span>
        </button>
      </div>

      {/* Box Options Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {boxOptions.map((opt) => (
          <div
            key={opt.id}
            className={`bg-white rounded-2xl border transition-all overflow-hidden shadow-xs hover:shadow-md flex flex-col justify-between ${
              opt.isActive ? 'border-slate-200/90' : 'border-slate-200/50 opacity-60 bg-slate-50/50'
            }`}
          >
            <div>
              {/* Image Preview with Badges */}
              <div className="relative aspect-[16/10] bg-slate-900 overflow-hidden border-b border-slate-100">
                <img
                  src={opt.image}
                  alt={opt.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      opt.isActive
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {opt.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-xs text-white px-2.5 py-1 rounded-lg font-mono font-black text-xs">
                  +{formatPrice(opt.price)}
                </div>
              </div>

              {/* Body */}
              <div className="p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 text-sm">{opt.name}</h3>
                  <span className="font-mono text-[10px] text-slate-400">{opt.id}</span>
                </div>
                {opt.description && (
                  <p className="text-slate-600 text-xs leading-relaxed">{opt.description}</p>
                )}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                onClick={() => handleToggleStatus(opt.id)}
                className="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 cursor-pointer"
              >
                {opt.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{opt.isActive ? 'Deactivate' : 'Activate'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(opt)}
                  className="p-1.5 text-slate-600 hover:text-primary-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                  title="Edit box option"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(opt.id, opt.name)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                  title="Delete box option"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Add / Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">
                {editingId ? 'Edit Box Option' : 'Create New Box Option'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Box Option Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Simple Box, Premium Box, Collector's Wooden Box"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary-500 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Upgrade Price (INR) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      required
                      min={0}
                      placeholder="e.g. 299"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-primary-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Status
                  </label>
                  <label className="flex items-center gap-2 h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded text-primary-600 accent-primary-600"
                    />
                    <span className="font-semibold text-slate-800">
                      {isActive ? 'Active (Live)' : 'Inactive'}
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Packshot Image URL *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. /images/premium-box-upgrade.jpg"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-primary-500 bg-white"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Uses the studio packshot image of the box packaging itself.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Short Description of What's Included
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Authentic branded rigid box, official tags, warranty card, manual booklet..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary-500 bg-white"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  {editingId ? 'Save Changes' : 'Create Option'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
