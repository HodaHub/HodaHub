import React from 'react';
import { ShieldCheck, HelpCircle, RotateCcw, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FooterProps {
  onNavigate?: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const renderLink = (to: string, pageKey: string, label: string) => {
    if (onNavigate) {
      return (
        <button
          onClick={() => onNavigate(pageKey)}
          className="hover:text-white transition-colors text-left"
        >
          {label}
        </button>
      );
    }
    return (
      <Link to={to} className="hover:text-white transition-colors">
        {label}
      </Link>
    );
  };

  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-800 pt-8 sm:pt-10 pb-8 mt-12 w-full max-w-full overflow-hidden">
      {/* 3 Trust Value Badges Strip - 1 Line on Small Devices */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pb-6 sm:pb-8 border-b border-slate-800">
        <div className="grid grid-cols-3 gap-2 sm:gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-1.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary-950 border border-primary-800/50 flex items-center justify-center text-primary-400 shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-[11px] sm:text-sm leading-tight">100% Genuine</p>
              <p className="text-slate-400 text-[10px] sm:text-xs mt-0.5 leading-tight hidden xs:block sm:block">
                Brand warranty
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-1.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary-950 border border-primary-800/50 flex items-center justify-center text-primary-400 shrink-0">
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-[11px] sm:text-sm leading-tight">7-Day Returns</p>
              <p className="text-slate-400 text-[10px] sm:text-xs mt-0.5 leading-tight hidden xs:block sm:block">
                Easy pickup
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-1.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary-950 border border-primary-800/50 flex items-center justify-center text-primary-400 shrink-0">
              <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-[11px] sm:text-sm leading-tight">Express Delivery</p>
              <p className="text-slate-400 text-[10px] sm:text-xs mt-0.5 leading-tight hidden xs:block sm:block">
                Across India
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Column 1: About HodaHub */}
          <div>
            <p className="text-slate-200 uppercase font-bold tracking-wider text-xs mb-3">ABOUT HODAHUB</p>
            <ul className="space-y-2">
              <li>{renderLink('/contact-us', 'contact-us', 'Contact Us')}</li>
              <li>{renderLink('/about-us', 'about-us', 'About Us')}</li>
              <li>{renderLink('/hodahub-stories', 'hodahub-stories', 'HodaHub Stories')}</li>
            </ul>
          </div>

          {/* Column 2: Help */}
          <div>
            <p className="text-slate-200 uppercase font-bold tracking-wider text-xs mb-3">HELP</p>
            <ul className="space-y-2">
              <li>{renderLink('/track-order', 'track-order', 'Track Your Order')}</li>
              <li>{renderLink('/payments-info', 'payments-info', 'Payments')}</li>
              <li>{renderLink('/cancellation-returns', 'cancellation-returns', 'Cancellation & Returns')}</li>
              <li>{renderLink('/faq', 'faq', 'FAQ')}</li>
              <li>{renderLink('/report-infringement', 'report-infringement', 'Report Infringement')}</li>
            </ul>
          </div>

          {/* Column 3: Consumer Policy */}
          <div>
            <p className="text-slate-200 uppercase font-bold tracking-wider text-xs mb-3">CONSUMER POLICY</p>
            <ul className="space-y-2">
              <li>{renderLink('/cancellation-returns', 'cancellation-returns', 'Cancellation & Returns')}</li>
              <li>{renderLink('/terms-of-use', 'terms-of-use', 'Terms of Use')}</li>
              <li>{renderLink('/security', 'security', 'Security')}</li>
              <li>{renderLink('/privacy-policy', 'privacy-policy', 'Privacy Policy')}</li>
              <li>{renderLink('/sitemap', 'sitemap', 'Sitemap')}</li>
              <li>{renderLink('/grievance-redressal', 'grievance-redressal', 'Grievance Redressal')}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-xs">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            {renderLink('/faq', 'faq', 'Help Center')}
          </span>
        </div>

        <div className="text-center sm:text-right font-medium">
          © 2026 HodaHub.com. All rights reserved. Built with precision for Indian shoppers.
        </div>
      </div>
    </footer>
  );
};
