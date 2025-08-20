'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserPreferences } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  studyGoal: 120, // 2 hours per day
  notifications: true,
  defaultView: 'grid',
  autoSave: true,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing user session in localStorage
    const savedUser = localStorage.getItem('studyPortalUser');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser({
          ...userData,
          createdAt: new Date(userData.createdAt),
        });
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('studyPortalUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulate API call - in production, this would be a real authentication API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // For demo purposes, accept any email/password combination
      const userData: User = {
        id: `user_${Date.now()}`,
        email,
        name: email.split('@')[0],
        createdAt: new Date(),
        preferences: defaultPreferences,
      };
      
      setUser(userData);
      localStorage.setItem('studyPortalUser', JSON.stringify(userData));
    } catch (error) {
      throw new Error('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const userData: User = {
        id: `user_${Date.now()}`,
        email,
        name,
        createdAt: new Date(),
        preferences: defaultPreferences,
      };
      
      setUser(userData);
      localStorage.setItem('studyPortalUser', JSON.stringify(userData));
    } catch (error) {
      throw new Error('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('studyPortalUser');
    // Clear all app data on logout
    localStorage.removeItem('studyPortalData');
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) throw new Error('No user logged in');
    
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('studyPortalUser', JSON.stringify(updatedUser));
  };

  const updatePreferences = async (preferences: Partial<UserPreferences>) => {
    if (!user) throw new Error('No user logged in');
    
    const updatedUser = {
      ...user,
      preferences: { ...user.preferences, ...preferences },
    };
    setUser(updatedUser);
    localStorage.setItem('studyPortalUser', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    updatePreferences,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
