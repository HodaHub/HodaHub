import React, { useState, useEffect } from 'react';
import { Package, AlertCircle, Check, CheckCircle2, ShieldCheck, Sparkles, X } from 'lucide-react';
import { BaseModal } from '../common/BaseModal';
import { useCartStore } from '../../store/useCartStore';
import { Product, BoxOption } from '../../types';
import { getStoredBoxOptions } from '../../data/boxOptions';
import { formatPrice } from '../../lib/utils';

interface BoxUpgradeModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onSelectBox?: (box: BoxOption | null) => void;
  currentSelectedBox?: BoxOption | null;
}

export const BoxUpgradeModal: React.FC<BoxUpgradeModalProps> = ({
  product,
  isOpen,
  onClose,
  onSelectBox,
  currentSelectedBox,
}) => {
  const { items, addItem, updateItemBox } = useCartStore();
  
  // Find if this product is already in the cart
  const cartItem = items.find((i) => i.product.id === product.id);
  const activeBoxInCart = cartItem?.selectedBox || currentSelectedBox || null;

  // Load box options assigned by admin to this specific product
  const allStoredBoxes = getStoredBoxOptions();
  const assignedBoxes: BoxOption[] = React.useMemo(() => {
    if (product.availableBoxOptionIds && product.availableBoxOptionIds.length > 0) {
      const filtered = allStoredBoxes.filter(
        (b) => product.availableBoxOptionIds!.includes(b.id) && b.isActive
      );
      if (filtered.length > 0) return filtered;
    }
    // Default available options if none explicitly specified
    return allStoredBoxes.filter((b) => b.isActive);
  }, [product.availableBoxOptionIds, allStoredBoxes]);

  // Selected box in modal state (null = Standard Free Packaging)
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(() => {
    return activeBoxInCart ? activeBoxInCart.id : assignedBoxes[0]?.id || null;
  });

  useEffect(() => {
    if (activeBoxInCart) {
      setSelectedBoxId(activeBoxInCart.id);
    }
  }, [activeBoxInCart, isOpen]);

  const selectedBox = assignedBoxes.find((b) => b.id === selectedBoxId) || null;
  const boxPrice = selectedBox?.price || 0;
  const combinedTotal = product.price + boxPrice;

  const handleApplyToOrder = () => {
    const selectedBox = assignedBoxes.find((b) => b.id === selectedBoxId) || null;

    useCartStore.getState().setSelectedBoxForProduct(product.id, selectedBox);

    if (onSelectBox) {
      onSelectBox(selectedBox);
    }

    if (cartItem) {
      // Update existing cart item with the chosen box
      updateItemBox(product.id, selectedBox);
    } else {
      // Add product to cart with the chosen box option
      addItem(product, 1, undefined, undefined, undefined, selectedBox);
    }

    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-xl"
      icon={<Package className="w-5 h-5 text-amber-600" />}
      title="Packaging & Box Upgrade"
    >
      <div className="space-y-4 text-xs">
        {/* Note Bar */}
        <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200/90 flex items-center gap-2 text-amber-900 font-semibold">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>⚠️ Extra charges apply • Added as a single combined order</span>
        </div>

        {/* Dynamic Box Options assigned to this product */}
        <div className="space-y-3">
          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-800">
            Available Packaging Options for {product.title}
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {assignedBoxes.map((box) => {
              const isSelected = selectedBoxId === box.id;
              return (
                <div
                  key={box.id}
                  onClick={() => setSelectedBoxId(box.id)}
                  className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/40 shadow-sm ring-1 ring-amber-400'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="relative rounded-lg overflow-hidden border border-slate-200 aspect-[16/10] bg-slate-100">
                    <img
                      src={box.image}
                      alt={box.name}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-slate-900/80 text-white font-mono font-bold text-[10px]">
                      +{formatPrice(box.price)}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-slate-900 text-xs">{box.name}</h4>
                      <input
                        type="radio"
                        name="box-selection"
                        checked={isSelected}
                        onChange={() => setSelectedBoxId(box.id)}
                        className="accent-amber-600 w-4 h-4"
                      />
                    </div>
                    {box.description && (
                      <p className="text-slate-600 text-[11px] mt-1 leading-snug line-clamp-2">
                        {box.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Standard Packaging (Free) Option */}
            <div
              onClick={() => setSelectedBoxId(null)}
              className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                selectedBoxId === null
                  ? 'border-primary-500 bg-primary-50/30 shadow-sm ring-1 ring-primary-300'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="rounded-lg border border-slate-200 aspect-[16/10] bg-slate-50 flex flex-col items-center justify-center text-slate-400 p-3 text-center">
                <Package className="w-8 h-8 text-slate-400 mb-1" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Standard Packaging
                </span>
                <span className="text-[10px] text-emerald-600 font-bold">Included Free (₹0)</span>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-xs">Standard Box</h4>
                  <input
                    type="radio"
                    name="box-selection"
                    checked={selectedBoxId === null}
                    onChange={() => setSelectedBoxId(null)}
                    className="accent-primary-600 w-4 h-4"
                  />
                </div>
                <p className="text-slate-500 text-[11px] mt-1 leading-snug">
                  Default protective transit box with standard HodaHub tape & bubble wrap.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Single Unified Order Total Calculation Preview */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 font-mono">
          <div className="flex justify-between text-slate-600 font-sans">
            <span>Main Product ({product.title.slice(0, 24)}...):</span>
            <span className="font-bold font-mono">{formatPrice(product.price)}</span>
          </div>
          <div className="flex justify-between text-slate-600 font-sans">
            <span>Selected Box ({selectedBox ? selectedBox.name : 'Standard Free'}):</span>
            <span className="font-bold font-mono text-amber-700">
              {selectedBox ? `+${formatPrice(selectedBox.price)}` : '₹0 (Free)'}
            </span>
          </div>
          <div className="pt-1.5 border-t border-slate-200 flex justify-between text-slate-950 font-sans text-xs">
            <span className="font-extrabold">Combined Single Item Total:</span>
            <span className="font-black text-sm font-mono text-emerald-700">
              {formatPrice(combinedTotal)}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-sans pt-0.5">
            ✓ 1 Unified Order • 1 AWB Shipment • 1 Payment
          </p>
        </div>

        {/* CTA Button: Add to Order */}
        <button
          type="button"
          onClick={handleApplyToOrder}
          className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4 text-amber-400" />
          <span>
            {selectedBox
              ? `Add ${selectedBox.name} to Order (+${formatPrice(selectedBox.price)})`
              : 'Use Standard Free Packaging'}
          </span>
        </button>
      </div>
    </BaseModal>
  );
};
