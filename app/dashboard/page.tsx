'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  BookOpenIcon,
  DocumentTextIcon,
  StarIcon,
  UsersIcon,
  ClockIcon,
  TrophyIcon,
  ChatBubbleLeftIcon,
  PlusIcon,
  EyeIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface DashboardStats {
  totalDocuments?: number;
  totalFeedbackGiven?: number;
  totalFeedbackReceived?: number;
  averageRating?: number;
  enrolledClasses?: number;
  pendingAssignments?: number;
  totalClasses?: number;
  totalStudents?: number;
  totalAssignments?: number;
  pendingGrading?: number;
}

interface RecentActivity {
  id: string;
  title: string;
  type: string;
  subject: { name: string };
  createdAt: string;
  feedback: Array<{
    author: { name: string; role: string };
    rating: number;
    createdAt: string;
  }>;
}

interface RecentGrade {
  points: number;
  maxPoints: number;
  feedback?: string;
  gradedAt: string;
  submission: {
    assignment: {
      title: string;
      subject: { name: string };
    };
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({});
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [recentGrades, setRecentGrades] = useState<RecentGrade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard/stats', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setRecentActivity(data.recentActivity || []);
        setRecentGrades(data.recentGrades || []);
      } else {
        throw new Error('Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <div key={star}>
            {star <= rating ? (
              <StarIconSolid className="h-4 w-4 text-yellow-400" />
            ) : (
              <StarIcon className="h-4 w-4 text-gray-300" />
            )}
          </div>
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating.toFixed(1)})</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            {user?.role === 'STUDENT' ? 'Ready to continue learning?' : 'Manage your classes and students'}
          </p>
        </div>
        <div className="flex gap-3">
          {user?.role === 'STUDENT' ? (
            <>
              <Button asChild>
                <Link href="/documents/upload">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Upload Document
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/ai-chat">
                  <ChatBubbleLeftIcon className="w-4 h-4 mr-2" />
                  AI Assistant
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild>
                <Link href="/classes/create">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create Class
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/assignments/create">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  New Assignment
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {user?.role === 'STUDENT' ? (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Documents Uploaded</CardTitle>
                <DocumentTextIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalDocuments || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Shared resources
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                <StarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.averageRating ? stats.averageRating.toFixed(1) : '0.0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  From peer feedback
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Enrolled Classes</CardTitle>
                <BookOpenIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.enrolledClasses || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Active enrollments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Assignments</CardTitle>
                <ClockIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingAssignments || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Due soon
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                <BookOpenIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalClasses || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Active classes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalStudents || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Across all classes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assignments Created</CardTitle>
                <DocumentTextIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalAssignments || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Total assignments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Grading</CardTitle>
                <TrophyIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingGrading || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Submissions to grade
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/documents">View All →</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((item) => (
                  <div key={item.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {item.title}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {item.subject.name}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {item.type.toUpperCase()}
                        </Badge>
                      </div>
                      {item.feedback.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">
                            Latest feedback from {item.feedback[0].author.name}
                          </p>
                          {renderStarRating(item.feedback[0].rating)}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/documents/${item.id}`}>
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No recent activity</p>
                <Button asChild>
                  <Link href="/documents/upload">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Upload Your First Document
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Grades (Students) or Quick Actions (Teachers) */}
        {user?.role === 'STUDENT' ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Grades</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/grades">View All →</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentGrades.length > 0 ? (
                <div className="space-y-4">
                  {recentGrades.map((grade, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">
                          {grade.submission.assignment.title}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {grade.submission.assignment.subject.name}
                        </p>
                        {grade.feedback && (
                          <p className="text-xs text-gray-600 mt-1">
                            {grade.feedback}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {grade.points}/{grade.maxPoints}
                        </div>
                        <div className="text-xs text-gray-500">
                          {Math.round((grade.points / grade.maxPoints) * 100)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrophyIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No grades yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button asChild className="h-20 flex-col">
                  <Link href="/classes">
                    <BookOpenIcon className="h-6 w-6 mb-2" />
                    Manage Classes
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20 flex-col">
                  <Link href="/assignments">
                    <DocumentTextIcon className="h-6 w-6 mb-2" />
                    View Assignments
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20 flex-col">
                  <Link href="/grading">
                    <TrophyIcon className="h-6 w-6 mb-2" />
                    Grade Submissions
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20 flex-col">
                  <Link href="/documents/upload">
                    <PlusIcon className="h-6 w-6 mb-2" />
                    Share Resource
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/documents" className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <DocumentTextIcon className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">Browse Documents</span>
            </Link>
            <Link href="/subjects" className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <BookOpenIcon className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Subjects</span>
            </Link>
            <Link href="/ai-chat" className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <ChatBubbleLeftIcon className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium">AI Assistant</span>
            </Link>
            <Link href="/profile" className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <UsersIcon className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium">Profile</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}