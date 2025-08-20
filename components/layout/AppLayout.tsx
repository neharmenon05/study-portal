'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthPage from '@/components/auth/AuthPage';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading Study Portal...</p>
        </div>
      </div>
    );
  }

  // Show auth page if no user
  if (!user) {
    return <AuthPage />;
  }

  // Show main app with sidebar
  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        {/* Main content */}
        <main className="flex-1 overflow-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
