'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DocumentTextIcon,
  ClockIcon,
  StarIcon,
  TrophyIcon,
  BookOpenIcon,
  UsersIcon,
  ChartBarIcon,
  PlusIcon,
  EyeIcon,
  CalendarIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface DashboardStats {
  totalDocuments: number;
  totalFeedbackGiven: number;
  totalFeedbackReceived: number;
  averageRating: number;
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
  subject: {
    name: string;
    color: string;
  };
  createdAt: string;
  feedback?: Array<{
    author: {
      name: string;
      role: string;
    };
    rating: number;
    createdAt: string;
  }>;
}

interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  maxPoints: number;
  subject: {
    name: string;
    color: string;
  };
  class: {
    name: string;
  };
  submissions?: Array<{
    status: string;
    submittedAt: string;
    grades: Array<{
      points: number;
      maxPoints: number;
    }>;
  }>;
  _count?: {
    submissions: number;
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, assignmentsResponse] = await Promise.all([
        fetch('/api/dashboard/stats', { credentials: 'include' }),
        fetch('/api/assignments', { credentials: 'include' })
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
        setRecentActivity(statsData.recentActivity || []);
      }

      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json();
        setAssignments(assignmentsData.assignments.slice(0, 5)); // Show only 5 recent
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
      </div>
    );
  };

  const getAssignmentStatus = (assignment: Assignment) => {
    if (user?.role === 'TEACHER') {
      const submissionCount = assignment._count?.submissions || 0;
      return (
        <Badge variant="secondary">
          {submissionCount} submissions
        </Badge>
      );
    }

    const submission = assignment.submissions?.[0];
    const dueDate = new Date(assignment.dueDate);
    const now = new Date();
    const isOverdue = now > dueDate;

    if (!submission) {
      return (
        <Badge variant={isOverdue ? "destructive" : "outline"}>
          {isOverdue ? 'Overdue' : 'Not Submitted'}
        </Badge>
      );
    }

    if (submission.grades.length > 0) {
      const grade = submission.grades[0];
      const percentage = Math.round((grade.points / grade.maxPoints) * 100);
      return (
        <Badge variant="default">
          Graded: {grade.points}/{grade.maxPoints} ({percentage}%)
        </Badge>
      );
    }

    return (
      <Badge variant="secondary">
        {submission.status === 'SUBMITTED' ? 'Submitted' : 'Draft'}
      </Badge>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
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
            {user?.role === 'TEACHER' 
              ? 'Manage your classes and track student progress' 
              : 'Continue your learning journey'
            }
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/ai-chat">
              <ChatBubbleLeftIcon className="w-4 h-4 mr-2" />
              AI Assistant
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={user?.role === 'TEACHER' ? '/classes/create' : '/documents/upload'}>
              <PlusIcon className="w-4 h-4 mr-2" />
              {user?.role === 'TEACHER' ? 'Create Class' : 'Upload Document'}
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {user?.role === 'STUDENT' ? (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Documents Uploaded</CardTitle>
                  <DocumentTextIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalDocuments}</div>
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
                  <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
                  <div className="flex items-center mt-1">
                    {renderStarRating(Math.round(stats.averageRating))}
                  </div>
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
                  <ClockIcon className="h-4 w-4 text-muted-foreground" />
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
      )}

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
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {activity.title}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge 
                          variant="secondary" 
                          style={{ backgroundColor: `${activity.subject.color}20`, color: activity.subject.color }}
                        >
                          {activity.subject.name}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(activity.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {activity.feedback && activity.feedback.length > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center space-x-2">
                            {renderStarRating(activity.feedback[0].rating)}
                            <span className="text-sm text-gray-600">
                              by {activity.feedback[0].author.name}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/documents/${activity.id}`}>
                        <EyeIcon className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No recent activity</p>
                <p className="text-sm text-gray-500 mt-1">
                  {user?.role === 'TEACHER' 
                    ? 'Upload resources or create assignments to get started'
                    : 'Upload documents or join classes to see activity'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assignments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {user?.role === 'TEACHER' ? 'Recent Assignments' : 'Upcoming Assignments'}
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/assignments">View All →</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {assignments.length > 0 ? (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-start justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">
                        {assignment.title}
                      </h4>
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge 
                          variant="secondary" 
                          style={{ backgroundColor: `${assignment.subject.color}20`, color: assignment.subject.color }}
                        >
                          {assignment.subject.name}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {assignment.class.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        </span>
                        {getAssignmentStatus(assignment)}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/assignments/${assignment.id}`}>
                        <EyeIcon className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No assignments</p>
                <p className="text-sm text-gray-500 mt-1">
                  {user?.role === 'TEACHER' 
                    ? 'Create assignments for your classes'
                    : 'Join classes to see assignments'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {user?.role === 'TEACHER' ? (
              <>
                <Button asChild className="h-20 flex-col">
                  <Link href="/classes/create">
                    <BookOpenIcon className="h-6 w-6 mb-2" />
                    Create Class
                  </Link>
                </Button>
                <Button asChild className="h-20 flex-col" variant="outline">
                  <Link href="/assignments/create">
                    <DocumentTextIcon className="h-6 w-6 mb-2" />
                    New Assignment
                  </Link>
                </Button>
                <Button asChild className="h-20 flex-col" variant="outline">
                  <Link href="/documents/upload">
                    <PlusIcon className="h-6 w-6 mb-2" />
                    Upload Resource
                  </Link>
                </Button>
                <Button asChild className="h-20 flex-col" variant="outline">
                  <Link href="/analytics">
                    <ChartBarIcon className="h-6 w-6 mb-2" />
                    View Analytics
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild className="h-20 flex-col">
                  <Link href="/documents/upload">
                    <PlusIcon className="h-6 w-6 mb-2" />
                    Upload Document
                  </Link>
                </Button>
                <Button asChild className="h-20 flex-col" variant="outline">
                  <Link href="/documents">
                    <DocumentTextIcon className="h-6 w-6 mb-2" />
                    Browse Resources
                  </Link>
                </Button>
                <Button asChild className="h-20 flex-col" variant="outline">
                  <Link href="/assignments">
                    <CalendarIcon className="h-6 w-6 mb-2" />
                    View Assignments
                  </Link>
                </Button>
                <Button asChild className="h-20 flex-col" variant="outline">
                  <Link href="/ai-chat">
                    <ChatBubbleLeftIcon className="h-6 w-6 mb-2" />
                    AI Assistant
                  </Link>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}