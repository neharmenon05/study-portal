'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChartBarIcon,
  TrophyIcon,
  DocumentTextIcon,
  UsersIcon,
  StarIcon,
  CalendarIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface AnalyticsData {
  documentTrends?: any[];
  feedbackTrends?: any[];
  gradeDistribution?: Record<string, number>;
  recentActivity?: any[];
  enrollmentTrends?: any[];
  assignmentTrends?: any[];
  submissionStats?: any[];
  classPerformance?: Array<{
    id: string;
    name: string;
    subject: string;
    students: number;
    assignments: number;
    averageGrade: number;
  }>;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData>({});
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics?period=${period}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      } else {
        throw new Error('Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-green-600 bg-green-100';
    if (grade >= 80) return 'text-blue-600 bg-blue-100';
    if (grade >= 70) return 'text-yellow-600 bg-yellow-100';
    if (grade >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">
            {user?.role === 'TEACHER' 
              ? 'Track class performance and student progress' 
              : 'Monitor your academic progress and achievements'
            }
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
            <option value="365">Last year</option>
          </select>
          <Button variant="outline">
            Export Report
          </Button>
        </div>
      </div>

      {user?.role === 'STUDENT' ? (
        <>
          {/* Student Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Documents Uploaded</CardTitle>
                <DocumentTextIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.documentTrends?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  In the last {period} days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Feedback Received</CardTitle>
                <StarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.feedbackTrends?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Reviews on your work
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                <TrophyIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.feedbackTrends?.length > 0 
                    ? (data.feedbackTrends.reduce((sum, f) => sum + (f._avg?.rating || 0), 0) / data.feedbackTrends.length).toFixed(1)
                    : '0.0'
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  Out of 5.0 stars
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.recentActivity?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Actions this period
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Grade Distribution */}
          {data.gradeDistribution && Object.keys(data.gradeDistribution).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Grade Distribution</CardTitle>
                <CardDescription>
                  Your performance across all assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-4">
                  {Object.entries(data.gradeDistribution).map(([grade, count]) => (
                    <div key={grade} className="text-center">
                      <div className={`text-2xl font-bold p-4 rounded-lg ${
                        grade === 'A' ? 'text-green-600 bg-green-100' :
                        grade === 'B' ? 'text-blue-600 bg-blue-100' :
                        grade === 'C' ? 'text-yellow-600 bg-yellow-100' :
                        grade === 'D' ? 'text-orange-600 bg-orange-100' :
                        'text-red-600 bg-red-100'
                      }`}>
                        {grade}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{count} assignments</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <>
          {/* Teacher Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Enrollments</CardTitle>
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.enrollmentTrends?.reduce((sum, e) => sum + e._count.id, 0) || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  In the last {period} days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assignments Created</CardTitle>
                <DocumentTextIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.assignmentTrends?.reduce((sum, a) => sum + a._count.id, 0) || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  New assignments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Submissions</CardTitle>
                <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.submissionStats?.reduce((sum, s) => sum + s._count.id, 0) || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Student submissions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Feedback Given</CardTitle>
                <StarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.feedbackTrends?.reduce((sum, f) => sum + f._count.id, 0) || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Reviews provided
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Class Performance */}
          {data.classPerformance && data.classPerformance.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Class Performance Overview</CardTitle>
                <CardDescription>
                  Average grades and activity across your classes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.classPerformance.map((cls) => (
                    <div key={cls.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{cls.name}</h4>
                        <p className="text-sm text-gray-600">{cls.subject}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>{cls.students} students</span>
                          <span>{cls.assignments} assignments</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold px-3 py-1 rounded-full ${getGradeColor(cls.averageGrade)}`}>
                          {cls.averageGrade}%
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Class Average</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submission Status Distribution */}
          {data.submissionStats && data.submissionStats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Submission Status</CardTitle>
                <CardDescription>
                  Current status of student submissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {data.submissionStats.map((stat) => (
                    <div key={stat.status} className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {stat._count.id}
                      </div>
                      <p className="text-sm text-gray-600 capitalize">
                        {stat.status.toLowerCase()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Recent Activity Timeline */}
      {data.recentActivity && data.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest actions and achievements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {data.recentActivity.slice(0, 10).map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.action.replace('_', ' ').toLowerCase()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                    {activity.details && (
                      <p className="text-xs text-gray-600 mt-1">
                        {activity.resource}: {activity.details.title || activity.details.name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}