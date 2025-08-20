import AppLayout from '@/components/layout/AppLayout';

export default function CalendarPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Study Calendar
          </h1>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            Add Event
          </button>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
          <div className="max-w-md mx-auto">
            <svg className="h-24 w-24 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Study Schedule
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Plan your study sessions, set deadlines, and track your progress with a visual calendar.
            </p>
            <div className="space-y-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">Coming soon:</p>
              <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                <li>• Monthly, weekly, and daily views</li>
                <li>• Schedule study sessions</li>
                <li>• Set exam dates and deadlines</li>
                <li>• Recurring study events</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
