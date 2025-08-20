import AppLayout from '@/components/layout/AppLayout';

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
          <div className="max-w-md mx-auto">
            <svg className="h-24 w-24 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              App Preferences
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Customize your Study Portal experience with themes, notifications, and study preferences.
            </p>
            <div className="space-y-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">Coming soon:</p>
              <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                <li>• Dark/light theme toggle</li>
                <li>• Notification preferences</li>
                <li>• Study goal settings</li>
                <li>• Data export and import</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
