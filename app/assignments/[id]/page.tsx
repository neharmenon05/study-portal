'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DocumentTextIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  DownloadIcon
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
  teacher: {
    id: string;
    name: string;
    avatar?: string;
  };
  documents: Array<{
    document: {
      id: string;
      title: string;
      type: string;
      fileName: string;
    };
  }>;
  submissions?: Array<{
    id: string;
    status: string;
    submittedAt: string;
    fileName?: string;
    content?: string;
    grades: Array<{
      points: number;
      maxPoints: number;
      feedback?: string;
      gradedAt: string;
    }>;
  }>;
}

interface Submission {
  id: string;
  status: string;
  submittedAt: string;
  fileName?: string;
  content?: string;
  student: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  grades: Array<{
    points: number;
    maxPoints: number;
    feedback?: string;
    gradedAt: string;
  }>;
}

export default function AssignmentDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissionContent, setSubmissionContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchAssignment();
      fetchSubmissions();
    }
  }, [params.id]);

  const fetchAssignment = async () => {
    try {
      const response = await fetch(`/api/assignments/${params.id}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setAssignment(data.assignment);
      } else {
        throw new Error('Failed to fetch assignment');
      }
    } catch (error) {
      console.error('Error fetching assignment:', error);
      toast.error('Failed to load assignment');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await fetch(`/api/assignments/${params.id}/submissions`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions || []);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const handleSubmit = async () => {
    if (!submissionContent.trim() && !selectedFile) {
      toast.error('Please provide either content or upload a file');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      formData.append('content', submissionContent);

      const response = await fetch(`/api/assignments/${params.id}/submissions`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit assignment');
      }

      toast.success('Assignment submitted successfully!');
      setSubmissionContent('');
      setSelectedFile(null);
      fetchSubmissions();

    } catch (error) {
      console.error('Submission error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `Overdue by ${Math.abs(diffDays)} days`, color: 'text-red-600', icon: ExclamationTriangleIcon };
    } else if (diffDays === 0) {
      return { text: 'Due today', color: 'text-orange-600', icon: ClockIcon };
    } else if (diffDays <= 3) {
      return { text: `Due in ${diffDays} days`, color: 'text-yellow-600', icon: ClockIcon };
    } else {
      return { text: `Due in ${diffDays} days`, color: 'text-green-600', icon: CheckCircleIcon };
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Assignment not found</h3>
          <p className="text-gray-600 mb-4">The assignment you're looking for doesn't exist or you don't have access to it.</p>
          <Button asChild>
            <Link href="/assignments">← Back to Assignments</Link>
          </Button>
        </div>
      </div>
    );
  }

  const userSubmission = user?.role === 'STUDENT' ? assignment.submissions?.[0] : null;
  const dueInfo = formatDueDate(assignment.dueDate);
  const isOverdue = new Date(assignment.dueDate) < new Date();
  const canSubmit = user?.role === 'STUDENT' && !isOverdue && (!userSubmission || userSubmission.status !== 'SUBMITTED');

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-4">
            <Badge 
              variant="secondary" 
              style={{ backgroundColor: `${assignment.subject.color}20`, color: assignment.subject.color }}
            >
              {assignment.subject.name}
            </Badge>
            <Badge variant="outline">
              {assignment.class.name}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{assignment.title}</h1>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <UserIcon className="h-4 w-4" />
              <span>by {assignment.teacher.name}</span>
            </div>
            <div className="flex items-center space-x-1">
              <CalendarIcon className="h-4 w-4" />
              <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
            </div>
            <div className={`flex items-center space-x-1 ${dueInfo.color}`}>
              <dueInfo.icon className="h-4 w-4" />
              <span className="font-medium">{dueInfo.text}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{assignment.maxPoints}</div>
          <div className="text-sm text-gray-500">points</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assignment Description */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{assignment.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Reference Materials */}
          {assignment.documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Reference Materials</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assignment.documents.map((docItem) => (
                    <div key={docItem.document.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                        <div>
                          <h4 className="font-medium">{docItem.document.title}</h4>
                          <p className="text-sm text-gray-500">
                            {docItem.document.type.toUpperCase()} • {docItem.document.fileName}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/documents/${docItem.document.id}`}>
                          <DownloadIcon className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Student Submission Form */}
          {user?.role === 'STUDENT' && (
            <Card>
              <CardHeader>
                <CardTitle>Your Submission</CardTitle>
                <CardDescription>
                  {userSubmission 
                    ? `Submitted on ${new Date(userSubmission.submittedAt).toLocaleDateString()}`
                    : canSubmit 
                      ? 'Submit your work for this assignment'
                      : isOverdue 
                        ? 'This assignment is overdue'
                        : 'Assignment already submitted'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userSubmission ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={userSubmission.status === 'GRADED' ? 'default' : 'secondary'}>
                          {userSubmission.status}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(userSubmission.submittedAt).toLocaleString()}
                        </span>
                      </div>
                      {userSubmission.fileName && (
                        <p className="text-sm text-gray-600 mb-2">
                          File: {userSubmission.fileName}
                        </p>
                      )}
                      {userSubmission.content && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700 mb-1">Content:</p>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">
                            {userSubmission.content}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Grade Display */}
                    {userSubmission.grades.length > 0 && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-medium text-green-800 mb-2">Grade</h4>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl font-bold text-green-700">
                            {userSubmission.grades[0].points}/{userSubmission.grades[0].maxPoints}
                          </span>
                          <span className="text-sm text-green-600">
                            {Math.round((userSubmission.grades[0].points / userSubmission.grades[0].maxPoints) * 100)}%
                          </span>
                        </div>
                        {userSubmission.grades[0].feedback && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-green-800 mb-1">Feedback:</p>
                            <p className="text-sm text-green-700">
                              {userSubmission.grades[0].feedback}
                            </p>
                          </div>
                        )}
                        <p className="text-xs text-green-600 mt-2">
                          Graded on {new Date(userSubmission.grades[0].gradedAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                ) : canSubmit ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Written Response
                      </label>
                      <Textarea
                        value={submissionContent}
                        onChange={(e) => setSubmissionContent(e.target.value)}
                        placeholder="Enter your response here..."
                        rows={6}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        File Upload (optional)
                      </label>
                      <input
                        type="file"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>

                    <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                      <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                      {submitting ? 'Submitting...' : 'Submit Assignment'}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">
                      {isOverdue ? 'This assignment is overdue' : 'Assignment already submitted'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Teacher View - All Submissions */}
          {user?.role === 'TEACHER' && (
            <Card>
              <CardHeader>
                <CardTitle>Student Submissions ({submissions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {submissions.length > 0 ? (
                  <div className="space-y-4">
                    {submissions.map((submission) => (
                      <div key={submission.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={submission.student.avatar} />
                              <AvatarFallback>
                                {submission.student.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium">{submission.student.name}</h4>
                              <p className="text-sm text-gray-500">{submission.student.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={submission.status === 'GRADED' ? 'default' : 'secondary'}>
                              {submission.status}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(submission.submittedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {submission.content && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-1">Response:</p>
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                              {submission.content}
                            </p>
                          </div>
                        )}

                        {submission.fileName && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-1">File:</p>
                            <p className="text-sm text-gray-600">{submission.fileName}</p>
                          </div>
                        )}

                        {submission.grades.length > 0 ? (
                          <div className="bg-green-50 p-3 rounded">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-green-800">
                                Grade: {submission.grades[0].points}/{submission.grades[0].maxPoints}
                              </span>
                              <span className="text-sm text-green-600">
                                {Math.round((submission.grades[0].points / submission.grades[0].maxPoints) * 100)}%
                              </span>
                            </div>
                            {submission.grades[0].feedback && (
                              <p className="text-sm text-green-700 mt-2">
                                {submission.grades[0].feedback}
                              </p>
                            )}
                          </div>
                        ) : (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/submissions/${submission.id}/grade`}>
                              Grade Submission
                            </Link>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No submissions yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assignment Info */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={assignment.teacher.avatar} />
                  <AvatarFallback>
                    {assignment.teacher.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{assignment.teacher.name}</p>
                  <Badge variant="default">Teacher</Badge>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Subject</span>
                  <span>{assignment.subject.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Class</span>
                  <span>{assignment.class.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Due Date</span>
                  <span>{new Date(assignment.dueDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Max Points</span>
                  <span>{assignment.maxPoints}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className={dueInfo.color}>{dueInfo.text}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/ai-chat">
                  <ChatBubbleLeftIcon className="h-4 w-4 mr-2" />
                  Ask AI for Help
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/assignments">
                  ← Back to Assignments
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}