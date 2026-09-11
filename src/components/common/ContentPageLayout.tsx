import React from 'react';
import { Home } from 'lucide-react';
import { SEO } from './SEO';
import { generateBreadcrumbSchema } from '../../lib/jsonLd';

interface ContentPageLayoutProps {
  title: string;
  subtitle?: string;
  category?: string;
  children: React.ReactNode;
  onNavigate?: (page: string) => void;
  slug?: string;
}

export const ContentPageLayout: React.FC<ContentPageLayoutProps> = ({
  title,
  subtitle,
  category = 'HodaHub Support & Policies',
  children,
  onNavigate,
  slug,
}) => {
  const pageSlug = slug || (typeof window !== 'undefined' ? window.location.pathname.replace(/^\//, '') : '') || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const canonicalUrl = `https://hodahub.in/${pageSlug}`;

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: category, url: `/#${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` },
    { name: title, url: `/${pageSlug}` },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <SEO
        title={`${title} | HodaHub`}
        description={subtitle || `${title} - HodaHub official guidelines, customer policies, and corporate information.`}
        canonicalUrl={canonicalUrl}
        structuredData={generateBreadcrumbSchema(breadcrumbs)}
      />
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-slate-500">
          {onNavigate ? (
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-1 hover:text-primary-600 transition-colors font-medium"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
          ) : (
            <a
              href="/"
              className="flex items-center gap-1 hover:text-primary-600 transition-colors font-medium"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </a>
          )}
          <span>/</span>
          <span>{category}</span>
          <span>/</span>
          <span className="text-slate-900 font-bold">{title}</span>
        </nav>

        {/* Header Title Card */}
        <header className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm">
          <span className="text-[11px] font-bold text-primary-600 uppercase tracking-wider">
            {category}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 font-sans tracking-tight mt-1">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">{subtitle}</p>
          )}
        </header>

        {/* Content Container (Prose-friendly max-w-3xl) */}
        <main className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-10 shadow-sm text-slate-700 text-sm leading-relaxed space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};
