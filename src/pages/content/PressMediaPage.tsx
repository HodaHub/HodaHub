import React from 'react';
import { ContentPageLayout } from '../../components/common/ContentPageLayout';
import { Newspaper, Download, ExternalLink } from 'lucide-react';

export const PressMediaPage: React.FC<{ onNavigate?: (page: string) => void }> = ({ onNavigate }) => {
  const pressReleases = [
    {
      title: 'HodaHub Announces Pan-India Same-Day Delivery Across 25 Major Indian Cities',
      date: '28 August 2026',
      source: 'HodaHub Corporate Communications',
      summary:
        'Expansion of regional automated sorting centers enables lightning-fast delivery for over 2 million high-demand electronics and FMCG essentials.',
    },
    {
      title: 'HodaHub Closes 2026 Festive Season with Record 40 Million Shoppers',
      date: '15 July 2026',
      source: 'HodaHub Newsroom',
      summary:
        'Driven by regional language accessibility and flexible payment models, Tier 2 and Tier 3 cities drove 68% of total gross merchandise value.',
    },
    {
      title: 'HodaAssured Quality Guarantee Extended to 100% of Catalog Listings',
      date: '02 June 2026',
      source: 'Product Trust & Safety Team',
      summary:
        'Enhanced seller compliance mandates and serialized barcode verification prevent gray-market goods from entering customer shipments.',
    },
  ];

  return (
    <ContentPageLayout
      title="Press & Media Center"
      subtitle="Official news, press releases, corporate announcements, and media assets."
      category="About HodaHub"
      onNavigate={onNavigate}
    >
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Media Kit & Brand Assets</h3>
          <p className="text-xs text-slate-500">Download high-resolution logos, brand guidelines, and executive headshots.</p>
        </div>
        <button
          onClick={() => alert('HodaHub Media Kit zip archive downloaded.')}
          className="self-start sm:self-auto px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Brand Kit (ZIP)</span>
        </button>
      </div>

      <section className="space-y-4 pt-4">
        <h3 className="text-base font-extrabold text-slate-900">Latest Press Releases</h3>
        <div className="space-y-3">
          {pressReleases.map((pr, idx) => (
            <div key={idx} className="p-5 rounded-xl border border-slate-200/90 hover:border-primary-400 transition-all space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-primary-600">{pr.source}</span>
                <span>{pr.date}</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm leading-snug">{pr.title}</h4>
              <p className="text-xs text-slate-600">{pr.summary}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
        For media inquiries or interview requests, please contact our PR team at{' '}
        <strong className="text-slate-900">press@hodahub.com</strong>.
      </div>
    </ContentPageLayout>
  );
};
