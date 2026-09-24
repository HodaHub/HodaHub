import React from 'react';
import { AdminScraper } from '../AdminScraper';
import { AdminTab } from './AdminLayout';

interface AdminScraperViewProps {
  onNavigateTab?: (tab: AdminTab) => void;
}

export const AdminScraperView: React.FC<AdminScraperViewProps> = ({ onNavigateTab }) => {
  return (
    <div className="py-2">
      <AdminScraper
        onNavigateToProducts={() => {
          if (onNavigateTab) {
            onNavigateTab('products');
          }
        }}
      />
    </div>
  );
};

export default AdminScraperView;
