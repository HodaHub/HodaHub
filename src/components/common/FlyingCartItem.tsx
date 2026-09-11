import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../../store/useCartStore';

export const FlyingCartItem: React.FC = () => {
  const flyingItem = useCartStore((state) => state.flyingItem);
  const clearFlyingItem = useCartStore((state) => state.clearFlyingItem);

  useEffect(() => {
    if (flyingItem) {
      const timer = setTimeout(() => {
        clearFlyingItem();
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [flyingItem, clearFlyingItem]);

  return (
    <AnimatePresence>
      {flyingItem && (
        <motion.div
          key="flying-cart-item"
          initial={{
            left: flyingItem.x,
            top: flyingItem.y,
            scale: 1,
            opacity: 1,
            zIndex: 9999,
          }}
          animate={{
            left: typeof window !== 'undefined' ? window.innerWidth - 120 : 800,
            top: 24,
            scale: 0.15,
            opacity: 0.8,
            transition: {
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1], // fluid bezier curve
            },
          }}
          exit={{
            opacity: 0,
            scale: 0,
            transition: { duration: 0.15 },
          }}
          className="fixed pointer-events-none w-16 h-16 rounded-full border-2 border-primary-500 bg-white shadow-2xl overflow-hidden flex items-center justify-center p-1"
          style={{ transform: 'translate(-50%, -50%)' }}
        >
          <img
            src={flyingItem.image}
            alt="HodaHub product"
            className="w-full h-full object-contain"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
