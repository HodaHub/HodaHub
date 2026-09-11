import React, { useState } from 'react';
import {
  MapPin,
  Plus,
  Trash2,
  Edit2,
  Check,
  Star,
  Home,
  Briefcase,
  AlertCircle,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { Address } from '../../types';

export const AddressesTab: React.FC = () => {
  const { user, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<Address, 'id'>>({
    name: user?.name || '',
    phone: user?.phone || '',
    pincode: '',
    locality: '',
    addressLine: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    type: 'HOME',
    isDefault: false,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const addresses: Address[] = user?.addresses && user.addresses.length > 0
    ? user.addresses
    : [
        {
          id: 'addr-default-1',
          name: user?.name || 'Anand Rao',
          phone: user?.phone || '+91 98765 43210',
          pincode: '560001',
          locality: 'Indiranagar 100ft Road',
          addressLine: 'Flat 402, Green Orchid Apartments, 12th Main',
          city: 'Bengaluru',
          state: 'Karnataka',
          type: 'HOME',
          isDefault: true,
        },
      ];

  const handleOpenAddModal = () => {
    setEditingAddressId(null);
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      pincode: '',
      locality: '',
      addressLine: '',
      city: 'Bengaluru',
      state: 'Karnataka',
      type: 'HOME',
      isDefault: addresses.length === 0,
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (addr: Address) => {
    setEditingAddressId(addr.id);
    setFormData({
      name: addr.name,
      phone: addr.phone,
      pincode: addr.pincode,
      locality: addr.locality,
      addressLine: addr.addressLine,
      city: addr.city,
      state: addr.state,
      type: addr.type,
      isDefault: addr.isDefault,
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove address "${name}"?`)) {
      return;
    }
    await deleteAddress(id);
    showToast('Shipping address removed from your HodaHub profile.');
  };

  const handleSetDefault = async (id: string) => {
    await setDefaultAddress(id);
    showToast('Default delivery address updated.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = formData.name.trim();
    const cleanPhone = formData.phone.trim();
    const cleanPincode = formData.pincode.trim();
    const cleanAddress = formData.addressLine.trim();

    if (!cleanName || cleanName.length < 2) {
      setFormError('Please enter a valid recipient name (minimum 2 characters).');
      return;
    }
    if (!cleanPhone || cleanPhone.replace(/\D/g, '').length < 10) {
      setFormError('Please enter a valid 10-digit delivery mobile number.');
      return;
    }
    if (!cleanPincode || cleanPincode.replace(/\D/g, '').length !== 6) {
      setFormError('Please enter a valid 6-digit Indian PIN code.');
      return;
    }
    if (!cleanAddress || cleanAddress.length < 5) {
      setFormError('Please enter your full street address/building details.');
      return;
    }

    if (editingAddressId) {
      await updateAddress(editingAddressId, formData);
      showToast('Shipping address updated successfully.');
    } else {
      await addAddress(formData);
      showToast('New shipping address saved to your HodaHub profile.');
    }

    setShowModal(false);
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

      {/* Header */}
      <div className="pb-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Saved Delivery Addresses</h2>
          <p className="text-xs text-slate-500">
            Manage multiple delivery destinations. Your default address will prefill at checkout.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Address</span>
        </button>
      </div>

      {/* Address Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className={`p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
              addr.isDefault
                ? 'bg-primary-50/20 border-primary-300 ring-1 ring-primary-200'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="space-y-3">
              {/* Type Badge & Default Status */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-slate-100 text-slate-700">
                  {addr.type === 'HOME' ? <Home className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                  <span>{addr.type}</span>
                </span>

                {addr.isDefault ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-mono">
                    <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                    <span>Default Delivery</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-[11px] font-bold text-primary-600 hover:text-primary-700 hover:underline cursor-pointer"
                  >
                    Set as Default
                  </button>
                )}
              </div>

              {/* Recipient Name & Phone */}
              <div>
                <div className="font-bold text-slate-900 text-sm">{addr.name}</div>
                <div className="font-mono text-slate-600 text-xs mt-0.5">{addr.phone}</div>
              </div>

              {/* Full Address */}
              <div className="text-xs text-slate-600 leading-relaxed">
                <div>{addr.addressLine}</div>
                {addr.locality && <div>{addr.locality}</div>}
                <div>
                  {addr.city}, {addr.state} -{' '}
                  <span className="font-mono font-bold text-slate-900">{addr.pincode}</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-end gap-3 text-xs">
              <button
                onClick={() => handleOpenEditModal(addr)}
                className="text-slate-600 hover:text-primary-600 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => handleDelete(addr.id, addr.name)}
                disabled={addresses.length === 1}
                className="text-slate-400 hover:text-rose-600 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                title={addresses.length === 1 ? 'Cannot delete your only address' : 'Delete address'}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ADD / EDIT ADDRESS MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="h-16 px-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-400" />
                <h3 className="font-bold text-sm">
                  {editingAddressId ? 'Edit Delivery Address' : 'Add New HodaHub Delivery Address'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Recipient Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Anand Rao"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-primary-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">10-Digit Mobile *</label>
                  <input
                    type="tel"
                    required
                    inputMode="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    inputMode="numeric"
                    value={formData.pincode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setFormData({ ...formData, pincode: val });
                    }}
                    placeholder="e.g. 560001"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold focus:border-primary-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-primary-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Flat, House No., Building, Company, Apartment *
                </label>
                <input
                  type="text"
                  required
                  value={formData.addressLine}
                  onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
                  placeholder="e.g. Flat 402, Green Orchid Apartments, 12th Main Road"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Area, Colony, Street, Sector, Village (Optional)
                </label>
                <input
                  type="text"
                  value={formData.locality}
                  onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                  placeholder="e.g. Indiranagar HAL 2nd Stage"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-primary-500 focus:outline-none"
                />
              </div>

              {/* Type Selection */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Address Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                    <input
                      type="radio"
                      name="addressType"
                      checked={formData.type === 'HOME'}
                      onChange={() => setFormData({ ...formData, type: 'HOME' })}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span>Home (All day delivery)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                    <input
                      type="radio"
                      name="addressType"
                      checked={formData.type === 'WORK'}
                      onChange={() => setFormData({ ...formData, type: 'WORK' })}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span>Work (10 AM - 6 PM delivery)</span>
                  </label>
                </div>
              </div>

              {/* Set as Default Checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span>Make this my default shipping address on HodaHub</span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-sm cursor-pointer"
                >
                  {editingAddressId ? 'Update Address' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
