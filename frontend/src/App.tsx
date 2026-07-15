import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { DashboardPage } from '@/pages/Dashboard';
import { LogInteractionScreen } from '@/pages/LogInteraction';
import { HCPListPage, HCPProfilePage } from '@/pages/HCP';
import { InteractionsListPage } from '@/pages/Interactions';
import { AssistantPage } from '@/pages/Assistant';
import { AnalyticsPage } from '@/pages/Analytics';
import { SettingsPage } from '@/pages/Settings';

export const App: React.FC = () => {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/log-interaction" element={<LogInteractionScreen />} />
          <Route path="/hcps" element={<HCPListPage />} />
          <Route path="/hcps/:id" element={<HCPProfilePage />} />
          <Route path="/interactions" element={<InteractionsListPage />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </Router>
  );
};
