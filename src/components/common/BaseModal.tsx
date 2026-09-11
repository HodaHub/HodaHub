import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
  showCloseButton?: boolean;
}

export const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  children,
  maxWidth = 'max-w-lg',
  showCloseButton = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press & body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Modal Container: Mobile Bottom-Sheet, Desktop Centered Box */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className={`relative z-10 w-full ${maxWidth} bg-white rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden border border-slate-200/80 max-h-[90vh] md:max-h-[85vh] flex flex-col`}
          >
            {/* Mobile Drag Indicator Bar */}
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1.5 rounded-full bg-slate-300" />
            </div>

            {/* Header */}
            {(title || showCloseButton) && (
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  {icon && <div className="text-primary-600 shrink-0">{icon}</div>}
                  {typeof title === 'string' ? (
                    <h3 className="font-extrabold text-slate-900 text-sm sm:text-base line-clamp-1">
                      {title}
                    </h3>
                  ) : (
                    title
                  )}
                </div>

                {showCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 -mr-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                    aria-label="Close modal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Content Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
