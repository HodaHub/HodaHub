import React from 'react';
import { ContentPageLayout } from '../../components/common/ContentPageLayout';
import { Sparkles, Quote } from 'lucide-react';

export const HodaHubStoriesPage: React.FC<{ onNavigate?: (page: string) => void }> = ({ onNavigate }) => {
  const stories = [
    {
      title: 'How a Surat Textile Weaver Scaled to ₹1.2 Cr Annual Revenue on HodaHub',
      category: 'Seller Spotlight',
      snippet:
        'Mahesh Patel transitioned his family-owned sari craft business online through HodaSeller onboarding, reaching customers across 28 Indian states.',
      author: 'Mahesh Patel, Surat Textiles',
      date: 'Aug 2026',
    },
    {
      title: 'Delivering to Ladakh in 48 Hours: The HodaExpress Frontier Story',
      category: 'Logistics Innovation',
      snippet:
        'A behind-the-scenes look at how HodaHub’s high-altitude micro-fulfillment hub in Leh connects remote Himalayan communities with genuine consumer tech.',
      author: 'HodaExpress Logistics Dispatch',
      date: 'Jul 2026',
    },
    {
      title: 'From Student to Tech Entrepreneur: The HodaCoins Ecosystem in Action',
      category: 'Community & Rewards',
      snippet:
        'How college student Sneha Roy utilized HodaHub student offers and reward coins to kit out her robotics laboratory on a tight budget.',
      author: 'Sneha Roy, IIT Madras',
      date: 'Jun 2026',
    },
  ];

  return (
    <ContentPageLayout
      title="HodaHub Stories"
      subtitle="Real narratives of empowerment, entrepreneurship, and digital transformation across Bharat."
      category="About HodaHub"
      onNavigate={onNavigate}
    >
      <div className="space-y-6">
        {stories.map((story, idx) => (
          <article
            key={idx}
            className="p-5 sm:p-6 rounded-2xl border border-slate-200/90 hover:border-primary-400 bg-white hover:shadow-md transition-all space-y-3"
          >
            <div className="flex items-center justify-between text-xs text-primary-600 font-bold uppercase tracking-wider">
              <span>{story.category}</span>
              <span className="text-slate-400 font-normal">{story.date}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 leading-snug">{story.title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{story.snippet}</p>
            <div className="pt-2 flex items-center gap-2 text-xs text-slate-500 font-medium border-t border-slate-100">
              <Quote className="w-3.5 h-3.5 text-primary-500" />
              <span>{story.author}</span>
            </div>
          </article>
        ))}
      </div>
    </ContentPageLayout>
  );
};
