import React from 'react';
import { ContentPageLayout } from '../../components/common/ContentPageLayout';
import { Briefcase, Heart, Rocket, Code2, Globe } from 'lucide-react';

export const CareersPage: React.FC<{ onNavigate?: (page: string) => void }> = ({ onNavigate }) => {
  const openPositions = [
    {
      title: 'Senior Frontend Engineer (React / Tailwind / Motion)',
      team: 'Experience Engineering',
      location: 'Bengaluru / Hybrid',
      type: 'Full-time',
    },
    {
      title: 'Staff Backend Architect (Node.js / Distributed Systems)',
      team: 'Core Platform & Orders',
      location: 'Bengaluru / Onsite',
      type: 'Full-time',
    },
    {
      title: 'Principal Product Designer (Design Systems)',
      team: 'Product Design',
      location: 'Bengaluru / Hybrid',
      type: 'Full-time',
    },
    {
      title: 'Lead Logistics Operations Manager',
      team: 'HodaExpress Supply Chain',
      location: 'Mumbai Fulfillment Center',
      type: 'Full-time',
    },
  ];

  return (
    <ContentPageLayout
      title="Careers at HodaHub"
      subtitle="Build technology that powers millions of daily transactions across India."
      category="About HodaHub"
      onNavigate={onNavigate}
    >
      <section className="space-y-4">
        <h2 className="text-xl font-black text-slate-900">Why Build With HodaHub?</h2>
        <p>
          At HodaHub, we believe in high agency, radical ownership, and engineering excellence. We are
          reinventing e-commerce from the ground up: from real-time dynamic pricing and predictive search
          to automated robotics in our regional sorting centers.
        </p>
      </section>

      {/* Perks Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <Rocket className="w-5 h-5 text-primary-600 mb-2" />
          <h4 className="font-bold text-slate-900 text-xs">High Impact</h4>
          <p className="text-xs text-slate-500 mt-1">Directly impact millions of daily shoppers and 200,000+ sellers.</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <Heart className="w-5 h-5 text-rose-600 mb-2" />
          <h4 className="font-bold text-slate-900 text-xs">Comprehensive Care</h4>
          <p className="text-xs text-slate-500 mt-1">Industry-leading health insurance, family support, and wellness stipends.</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <Globe className="w-5 h-5 text-emerald-600 mb-2" />
          <h4 className="font-bold text-slate-900 text-xs">Flexible Work</h4>
          <p className="text-xs text-slate-500 mt-1">Hybrid collaboration models designed around deep focus and teamwork.</p>
        </div>
      </div>

      {/* Open Roles */}
      <section className="space-y-4 pt-4 border-t border-slate-100">
        <h3 className="text-base font-extrabold text-slate-900">Current Open Opportunities</h3>
        <div className="space-y-3">
          {openPositions.map((pos, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200 hover:border-primary-500 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white"
            >
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{pos.title}</h4>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                  <span>{pos.team}</span>
                  <span>•</span>
                  <span>{pos.location}</span>
                  <span>•</span>
                  <span className="font-semibold text-primary-600">{pos.type}</span>
                </div>
              </div>
              <button
                onClick={() => alert(`Application submitted for: ${pos.title}. Send resume to careers@hodahub.com`)}
                className="self-start sm:self-auto px-4 py-2 bg-slate-900 hover:bg-primary-600 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                Apply Now
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="p-4 rounded-xl bg-primary-50 border border-primary-200 text-center text-xs text-primary-950 font-medium">
        Don't see an exact match? Send your portfolio or GitHub profile to{' '}
        <strong className="underline">careers@hodahub.com</strong>.
      </div>
    </ContentPageLayout>
  );
};
