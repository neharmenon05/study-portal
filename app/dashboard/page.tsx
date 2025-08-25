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

interface RecentSubmission {
  id: string;
  status: string;
  submittedAt: string;
  fileSize?: string;
  student: {
    name: string;
    email: string;
  };
  assignment: {
    title: string;
    subject: { name: string };
  };
}
export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({});
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [recentGrades, setRecentGrades] = useState<RecentGrade[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
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
        setRecentSubmissions(data.recentSubmissions || []);
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

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {activity.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {activity.subject.name} • {activity.type.toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </p>
                      {activity.feedback.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">
                            Latest feedback: {renderStarRating(activity.feedback[0].rating)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Grades or Submissions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {user?.role === 'STUDENT' ? 'Recent Grades' : 'Recent Submissions'}
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/assignments">View All →</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {user?.role === 'STUDENT' ? (
              recentGrades.length > 0 ? (
                <div className="space-y-4">
                  {recentGrades.map((grade, index) => (
                    <div key={index} className="p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">
                          {grade.submission.assignment.title}
                        </h3>
                        <Badge variant="default">
                          {grade.points}/{grade.maxPoints}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {grade.submission.assignment.subject.name}
                      </p>
                      {grade.feedback && (
                        <p className="text-sm text-gray-700 mt-2">
                          {grade.feedback}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Graded: {new Date(grade.gradedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrophyIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No grades yet</p>
                </div>
              )
            ) : (
              recentSubmissions.length > 0 ? (
                <div className="space-y-4">
                  {recentSubmissions.map((submission) => (
                    <div key={submission.id} className="p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">
                          {submission.assignment.title}
                        </h3>
                        <Badge variant={submission.status === 'SUBMITTED' ? 'default' : 'secondary'}>
                          {submission.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        By {submission.student.name} • {submission.assignment.subject.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No recent submissions</p>
                </div>
              )
            )}
          </CardContent>
        </Card>
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
              <CardHeader className="flex flex-row items-center justify-between space-y-0