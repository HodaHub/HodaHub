import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GuestAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface GuestState {
  name: string;
  phone: string;
  address: GuestAddress;
  setGuestInfo: (info: {
    name: string;
    phone: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      pincode: string;
    };
  }) => void;
  clearGuestInfo: () => void;
  hasValidGuestInfo: () => boolean;
}

export const useGuestStore = create<GuestState>()(
  persist(
    (set, get) => ({
      name: '',
      phone: '',
      address: {
        line1: '',
        line2: '',
        city: '',
        state: '',
        pincode: '',
      },

      setGuestInfo: (info) =>
        set({
          name: info.name.trim(),
          phone: info.phone.replace(/\D/g, '').slice(-10),
          address: {
            line1: info.address.line1.trim(),
            line2: (info.address.line2 || '').trim(),
            city: info.address.city.trim(),
            state: info.address.state.trim(),
            pincode: info.address.pincode.trim(),
          },
        }),

      clearGuestInfo: () =>
        set({
          name: '',
          phone: '',
          address: {
            line1: '',
            line2: '',
            city: '',
            state: '',
            pincode: '',
          },
        }),

      hasValidGuestInfo: () => {
        const state = get();
        const cleanPhone = (state.phone || '').replace(/\D/g, '').slice(-10);
        const cleanPincode = (state.address?.pincode || '').trim();
        return (
          Boolean(state.name?.trim()) &&
          cleanPhone.length === 10 &&
          Boolean(state.address?.line1?.trim()) &&
          Boolean(state.address?.city?.trim()) &&
          cleanPincode.length === 6 &&
          /^\d{6}$/.test(cleanPincode)
        );
      },
    }),
    {
      name: 'hodahub_guest_info',
    }
  )
);
