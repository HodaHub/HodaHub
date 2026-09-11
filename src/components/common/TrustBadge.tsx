import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TrustBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TrustBadge: React.FC<TrustBadgeProps> = ({ size = 'sm', className }) => {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 font-semibold rounded tracking-wide select-none',
        size === 'sm' && 'text-[11px] px-1.5 py-0.5 bg-primary-50 text-primary-700 border border-primary-200/70',
        size === 'md' && 'text-xs px-2 py-0.5 bg-primary-50 text-primary-700 border border-primary-200',
        size === 'lg' && 'text-sm px-2.5 py-1 bg-primary-100 text-primary-800 border border-primary-300',
        className
      )}
      title="HodaAssured: 100% Genuine, Verified Quality & Hassle-free Returns"
    >
      <ShieldCheck className={size === 'lg' ? 'w-4 h-4 text-primary-600' : 'w-3 h-3 text-primary-600'} strokeWidth={2} />
      <span>Hoda<span className="text-primary-900 font-extrabold">Assured</span></span>
    </div>
  );
};
