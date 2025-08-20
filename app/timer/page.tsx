import AppLayout from '@/components/layout/AppLayout';

export default function TimerPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Study Timer
          </h1>
          <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
            Start Session
          </button>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
          <div className="max-w-md mx-auto">
            <svg className="h-24 w-24 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Study Timer & Sessions
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Use the Pomodoro technique or custom timers to track your study sessions and breaks.
            </p>
            <div className="space-y-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">Coming soon:</p>
              <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                <li>• Pomodoro timer (25/5 minutes)</li>
                <li>• Custom study session lengths</li>
                <li>• Break reminders</li>
                <li>• Session tracking and statistics</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
