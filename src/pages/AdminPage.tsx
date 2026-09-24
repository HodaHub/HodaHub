import React from 'react';
import AdminScraper from '../components/AdminScraper';
import { SEO } from '../components/common/SEO';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <SEO
        title="Admin Product Scraper | HodaHub"
        description="Automated product extraction, Cloudinary image upload, and Supabase catalog synchronization."
        noindex={true}
      />
      <div className="max-w-7xl mx-auto">
        {/* Aapka Admin Panel */}
        <AdminScraper />
      </div>
    </div>
  );
}

export { AdminPage };
