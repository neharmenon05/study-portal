'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxPoints: number;
  subject: {
    name: string;
    color: string;
  };
  class: {
    name: string;
  };
  teacher?: {
    name: string;
  };
  submissions?: Array<{
    id: string;
    status: string;
    submittedAt: string;
    grades: Array<{
      points: number;
      maxPoints: number;
    }>;
  }>;
  _count: {
    submissions?: number;
    documents?: number;
  };
}

export default function AssignmentsPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await fetch('/api/assignments', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setAssignments(data.assignments);
      } else {
        throw new Error('Failed to fetch assignments');
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (assignment: Assignment) => {
    if (user?.role === 'TEACHER') {
      const submissionCount = assignment._count.submissions || 0;
      return (
        <Badge variant="secondary">
          {submissionCount} submissions
        </Badge>
      );
    }

    // Student view
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

  const getStatusIcon = (assignment: Assignment) => {
    if (user?.role === 'TEACHER') {
      return <DocumentTextIcon className="h-5 w-5 text-blue-500" />;
    }

    const submission = assignment.submissions?.[0];
    const dueDate = new Date(assignment.dueDate);
    const now = new Date();
    const isOverdue = now > dueDate;

    if (!submission) {
      return isOverdue ? 
        <ExclamationTriangleIcon className="h-5 w-5 text-red-500" /> :
        <ClockIcon className="h-5 w-5 text-yellow-500" />;
    }

    if (submission.grades.length > 0) {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    }

    return <CheckCircleIcon className="h-5 w-5 text-blue-500" />;
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} days`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else {
      return `Due in ${diffDays} days`;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.role === 'TEACHER' ? 'My Assignments' : 'Assignments'}
          </h1>
          <p className="text-gray-600">
            {user?.role === 'TEACHER' 
              ? 'Manage assignments and track submissions' 
              : 'View and submit your assignments'
            }
          </p>
        </div>
        {user?.role === 'TEACHER' && (
          <Button asChild>
            <Link href="/assignments/create">
              <PlusIcon className="w-4 h-4 mr-2" />
              Create Assignment
            </Link>
          </Button>
        )}
      </div>

      {/* Assignments List */}
      {assignments.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <DocumentTextIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {user?.role === 'TEACHER' ? 'No assignments created yet' : 'No assignments found'}
          </h3>
          <p className="text-gray-600 mb-4">
            {user?.role === 'TEACHER' 
              ? 'Create your first assignment to get started' 
              : 'Check back later for new assignments'
            }
          </p>
          {user?.role === 'TEACHER' && (
            <Button asChild>
              <Link href="/assignments/create">
                <PlusIcon className="w-4 h-4 mr-2" />
                Create Your First Assignment
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <Card key={assignment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(assignment)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {assignment.title}
                        </h3>
                        {getStatusBadge(assignment)}
                      </div>
                      
                      <div className="flex items-center space-x-4 mb-3">
                        <Badge 
                          variant="secondary" 
                          style={{ backgroundColor: `${assignment.subject.color}20`, color: assignment.subject.color }}
                        >
                          {assignment.subject.name}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {assignment.class.name}
                        </span>
                        {assignment.teacher && (
                          <span className="text-sm text-gray-600">
                            by {assignment.teacher.name}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-700 line-clamp-2 mb-3">
                        {assignment.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span>Max Points: {assignment.maxPoints}</span>
                          <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                          <span className={`font-medium ${
                            new Date(assignment.dueDate) < new Date() ? 'text-red-600' : 'text-blue-600'
                          }`}>
                            {formatDueDate(assignment.dueDate)}
                          </span>
                        </div>
                        {assignment._count.documents && assignment._count.documents > 0 && (
                          <span>{assignment._count.documents} resources</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 ml-4">
                    <Button asChild variant="outline">
                      <Link href={`/assignments/${assignment.id}`}>
                        <EyeIcon className="w-4 h-4 mr-2" />
                        View
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}