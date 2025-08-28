'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  DocumentTextIcon as DocumentIcon,
  DocumentTextIcon,
  BookOpenIcon,
  ClockIcon,
  CalendarIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  PlusIcon,
  AcademicCapIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  DocumentTextIcon as DocumentIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  BookOpenIcon as BookOpenIconSolid,
  ClockIcon as ClockIconSolid,
  CalendarIcon as CalendarIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  Cog6ToothIcon as CogIconSolid,
} from '@heroicons/react/24/solid';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  iconSolid: React.ElementType;
  badge?: string | number;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth();
  const pathname = usePathname();

  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, iconSolid: HomeIconSolid },
    { name: 'Documents', href: '/documents', icon: DocumentIcon, iconSolid: DocumentIconSolid },
    { name: 'Notes', href: '/notes', icon: DocumentTextIcon, iconSolid: DocumentTextIconSolid },
    ...(user?.role === 'TEACHER' ? [
      { name: 'Classes', href: '/classes', icon: AcademicCapIcon, iconSolid: AcademicCapIcon },
    ] : []),
    { name: 'Assignments', href: '/assignments', icon: BookOpenIcon, iconSolid: BookOpenIconSolid },
    { name: 'AI Chat', href: '/ai-chat', icon: ChatBubbleLeftIcon, iconSolid: ChatBubbleLeftIcon },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon, iconSolid: ChartBarIconSolid },
    { name: 'Calendar', href: '/calendar', icon: CalendarIcon, iconSolid: CalendarIconSolid },
    { name: 'Timer', href: '/timer', icon: ClockIcon, iconSolid: ClockIconSolid },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, iconSolid: CogIconSolid },
  ];

  const quickActions = user?.role === 'TEACHER' ? [
    { name: 'Create Class', href: '/classes/create', color: 'bg-blue-500' },
    { name: 'New Assignment', href: '/assignments/create', color: 'bg-green-500' },
    { name: 'Upload Resource', href: '/documents/upload', color: 'bg-purple-500' },
    { name: 'View Analytics', href: '/analytics', color: 'bg-orange-500' },
  ] : [
    { name: 'Upload Document', href: '/documents/upload', color: 'bg-blue-500' },
    { name: 'Create Note', href: '/notes/create', color: 'bg-green-500' },
    { name: 'New Flashcards', href: '/flashcards/create', color: 'bg-purple-500' },
    { name: 'Study Session', href: '/timer', color: 'bg-orange-500' },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <motion.div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 shadow-xl lg:static lg:inset-0 lg:z-auto lg:shadow-none border-r border-gray-200 dark:border-gray-700 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        initial={false}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 bg-gradient-to-r from-blue-500 to-indigo-600">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center">
                <svg
                  className="h-5 w-5 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <span className="text-white font-bold text-lg">Study Portal</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/');
                const Icon = isActive ? item.iconSolid : item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon
                      className={`mr-3 h-5 w-5 transition-colors ${
                        isActive
                          ? 'text-blue-500 dark:text-blue-400'
                          : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                      }`}
                    />
                    {item.name}
                    {item.badge && (
                      <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-blue-600 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-300">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Quick Actions */}
            <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Quick Actions
              </h3>
              <div className="space-y-2">
                {quickActions.map((action) => (
                  <Link
                    key={action.name}
                    href={action.href}
                    onClick={onClose}
                    className="group flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all duration-200"
                  >
                    <div className={`mr-3 h-2 w-2 rounded-full ${action.color}`} />
                    {action.name}
                    <PlusIcon className="ml-auto h-4 w-4 text-gray-400 group-hover:text-gray-500" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}