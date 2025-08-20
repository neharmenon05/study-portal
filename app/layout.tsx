import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppDataProvider } from '@/contexts/AppDataContext';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Study Portal - Organize Your Learning Journey",
  description: "A comprehensive study management platform to organize materials, create notes, manage flashcards, and track your learning progress.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 dark:bg-gray-900`}
      >
        <AuthProvider>
          <AppDataProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                className: 'text-sm',
                style: {
                  background: 'white',
                  color: '#1f2937',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                },
                success: {
                  iconTheme: {
                    primary: '#059669',
                    secondary: 'white',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#dc2626',
                    secondary: 'white',
                  },
                },
              }}
            />
          </AppDataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
