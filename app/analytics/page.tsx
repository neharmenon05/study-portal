import AppLayout from '@/components/layout/AppLayout';

export default function AnalyticsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Study Analytics
          </h1>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Export Report
          </button>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
          <div className="max-w-md mx-auto">
            <svg className="h-24 w-24 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Study Progress & Insights
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Track your study habits, analyze your progress, and get insights to improve your learning efficiency.
            </p>
            <div className="space-y-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">Coming soon:</p>
              <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                <li>• Study time charts and graphs</li>
                <li>• Progress tracking by subject</li>
                <li>• Goal completion analytics</li>
                <li>• Performance insights and trends</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
