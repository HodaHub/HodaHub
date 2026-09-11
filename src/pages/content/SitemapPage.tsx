import React from 'react';
import { ContentPageLayout } from '../../components/common/ContentPageLayout';
import { Link } from 'react-router-dom';

export const SitemapPage: React.FC<{ onNavigate?: (page: string, params?: Record<string, any>) => void }> = ({ onNavigate }) => {
  const sections = [
    {
      title: 'Shop & Categories',
      links: [
        { label: 'All Products (PLP)', page: 'plp', path: '/plp' },
        { label: 'Mobiles & Smartphones', page: 'plp', path: '/plp', params: { category: 'mobiles' } },
        { label: 'Electronics & Audio', page: 'plp', path: '/plp', params: { category: 'electronics' } },
        { label: 'TVs & Appliances', page: 'plp', path: '/plp', params: { category: 'appliances' } },
        { label: 'Fashion & Footwear', page: 'plp', path: '/plp', params: { category: 'fashion' } },
        { label: 'Home & Furniture', page: 'plp', path: '/plp', params: { category: 'home' } },
      ],
    },
    {
      title: 'Customer Portals',
      links: [
        { label: 'Shopping Cart', page: 'cart', path: '/cart' },
        { label: 'Order History & Tracking', page: 'orders', path: '/orders' },
        { label: 'Saved Wishlist', page: 'wishlist', path: '/wishlist' },
        { label: 'Checkout Flow', page: 'checkout', path: '/checkout' },
        { label: 'Admin Orders Control Panel', page: 'admin-orders', path: '/admin/orders' },
      ],
    },
    {
      title: 'About HodaHub',
      links: [
        { label: 'Contact Us', page: 'contact-us', path: '/contact-us' },
        { label: 'About Us', page: 'about-us', path: '/about-us' },
        { label: 'Careers', page: 'careers', path: '/careers' },
        { label: 'HodaHub Stories', page: 'hodahub-stories', path: '/hodahub-stories' },
        { label: 'Press & Media', page: 'press-media', path: '/press-media' },
        { label: 'Corporate Information', page: 'corporate-information', path: '/corporate-information' },
      ],
    },
    {
      title: 'Help & Customer Care',
      links: [
        { label: 'Payments & UPI Info', page: 'payments-info', path: '/payments-info' },
        { label: 'Shipping & Pincode Lookup', page: 'shipping-pincodes', path: '/shipping-pincodes' },
        { label: 'Cancellation & Returns', page: 'cancellation-returns', path: '/cancellation-returns' },
        { label: 'Frequently Asked Questions (FAQ)', page: 'faq', path: '/faq' },
        { label: 'Report Infringement', page: 'report-infringement', path: '/report-infringement' },
      ],
    },
    {
      title: 'Legal & Policies',
      links: [
        { label: 'Terms of Use', page: 'terms-of-use', path: '/terms-of-use' },
        { label: 'Security Standards', page: 'security', path: '/security' },
        { label: 'Privacy Policy', page: 'privacy-policy', path: '/privacy-policy' },
        { label: 'Grievance Redressal Mechanism', page: 'grievance-redressal', path: '/grievance-redressal' },
      ],
    },
  ];

  return (
    <ContentPageLayout
      title="HodaHub Site Directory & Sitemap"
      subtitle="Complete navigable directory of all categories, customer portals, policies, and corporate pages."
      category="Consumer Policy"
      onNavigate={onNavigate ? () => onNavigate('home') : undefined}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {sections.map((sec, idx) => (
          <div key={idx} className="space-y-3">
            <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-200 pb-2">
              {sec.title}
            </h3>
            <ul className="space-y-1.5 text-xs">
              {sec.links.map((link, lIdx) => (
                <li key={lIdx}>
                  {onNavigate ? (
                    <button
                      onClick={() => onNavigate(link.page, link.params)}
                      className="text-primary-600 hover:text-primary-800 hover:underline text-left"
                    >
                      {link.label}
                    </button>
                  ) : (
                    <Link
                      to={link.path}
                      className="text-primary-600 hover:text-primary-800 hover:underline"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </ContentPageLayout>
  );
};
