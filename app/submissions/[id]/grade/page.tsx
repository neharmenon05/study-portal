'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DocumentTextIcon,
  StarIcon,
  CheckCircleIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface Submission {
  id: string;
  status: string;
  submittedAt: string;
  fileName?: string;
  fileSize?: string;
  content?: string;
  student: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  assignment: {
    id: string;
    title: string;
    maxPoints: number;
    subject: {
      name: string;
      color: string;
    };
    class: {
      name: string;
    };
  };
  grades: Array<{
    id: string;
    points: number;
    maxPoints: number;
    feedback?: string;
    gradedAt: string;
  }>;
}

export default function GradeSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);
  const [gradeData, setGradeData] = useState({
    points: 0,
    maxPoints: 100,
    feedback: '',
  });

  useEffect(() => {
    if (user?.role !== 'TEACHER') {
      router.push('/dashboard');
      return;
    }
    if (params.id) {
      fetchSubmission();
    }
  }, [params.id, user, router]);

  const fetchSubmission = async () => {
    try {
      const response = await fetch(`/api/submissions/${params.id}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setSubmission(data.submission);
        setGradeData(prev => ({
          ...prev,
          maxPoints: data.submission.assignment.maxPoints,
          points: data.submission.grades[0]?.points || 0,
          feedback: data.submission.grades[0]?.feedback || '',
        }));
      } else {
        throw new Error('Failed to fetch submission');
      }
    } catch (error) {
      console.error('Error fetching submission:', error);
      toast.error('Failed to load submission');
    } finally {
      setLoading(false);
    }
  };

  const handleGrade = async () => {
    if (gradeData.points < 0 || gradeData.points > gradeData.maxPoints) {
      toast.error(`Points must be between 0 and ${gradeData.maxPoints}`);
      return;
    }

    setGrading(true);

    try {
      const response = await fetch(`/api/submissions/${params.id}/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(gradeData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to grade submission');
      }

      toast.success('Grade saved successfully!');
      router.push(`/assignments/${submission?.assignment.id}`);

    } catch (error) {
      console.error('Grading error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to grade submission');
    } finally {
      setGrading(false);
    }
  };

  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes);
    if (size === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  if (!submission) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Submission not found</h3>
          <p className="text-gray-600 mb-4">The submission you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => router.back()}>← Go Back</Button>
        </div>
      </div>
    );
  }

  const existingGrade = submission.grades[0];
  const percentage = gradeData.maxPoints > 0 ? Math.round((gradeData.points / gradeData.maxPoints) * 100) : 0;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="mx-auto h-16 w-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
          <StarIcon className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Grade Submission</h1>
        <p className="text-gray-600 mt-2">
          {existingGrade ? 'Update grade for this submission' : 'Assign a grade to this submission'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Submission Details */}
        <div className="space-y-6">
          {/* Assignment Info */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{submission.assignment.title}</h3>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge 
                    variant="secondary" 
                    style={{ backgroundColor: `${submission.assignment.subject.color}20`, color: submission.assignment.subject.color }}
                  >
                    {submission.assignment.subject.name}
                  </Badge>
                  <Badge variant="outline">
                    {submission.assignment.class.name}
                  </Badge>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                <p><strong>Max Points:</strong> {submission.assignment.maxPoints}</p>
              </div>
            </CardContent>
          </Card>

          {/* Student Info */}
          <Card>
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={submission.student.avatar} />
                  <AvatarFallback>
                    {submission.student.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium text-lg">{submission.student.name}</h4>
                  <p className="text-sm text-gray-600">{submission.student.email}</p>
                  <Badge variant="secondary">Student</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submission Content */}
          <Card>
            <CardHeader>
              <CardTitle>Submission Content</CardTitle>
              <CardDescription>
                Submitted on {new Date(submission.submittedAt).toLocaleDateString()} at {new Date(submission.submittedAt).toLocaleTimeString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {submission.fileName && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <DocumentTextIcon className="h-6 w-6 text-blue-500" />
                    <div>
                      <p className="font-medium">{submission.fileName}</p>
                      {submission.fileSize && (
                        <p className="text-sm text-gray-500">
                          {formatFileSize(submission.fileSize)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {submission.content && (
                <div>
                  <h4 className="font-medium mb-2">Written Response:</h4>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="whitespace-pre-wrap text-sm">{submission.content}</p>
                  </div>
                </div>
              )}

              {!submission.content && !submission.fileName && (
                <div className="text-center py-8">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No content submitted</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Grading Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <StarIcon className="h-5 w-5 mr-2" />
                {existingGrade ? 'Update Grade' : 'Assign Grade'}
              </CardTitle>
              {existingGrade && (
                <CardDescription>
                  Previously graded on {new Date(existingGrade.gradedAt).toLocaleDateString()}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="points">Points Earned *</Label>
                  <Input
                    id="points"
                    type="number"
                    value={gradeData.points}
                    onChange={(e) => setGradeData(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                    min="0"
                    max={gradeData.maxPoints}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="maxPoints">Max Points</Label>
                  <Input
                    id="maxPoints"
                    type="number"
                    value={gradeData.maxPoints}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>

              {/* Grade Preview */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-semibold text-blue-800">
                    Grade: {gradeData.points}/{gradeData.maxPoints}
                  </span>
                  <span className={`text-lg font-bold ${
                    percentage >= 90 ? 'text-green-600' :
                    percentage >= 80 ? 'text-blue-600' :
                    percentage >= 70 ? 'text-yellow-600' :
                    percentage >= 60 ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {percentage}%
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      percentage >= 90 ? 'bg-green-500' :
                      percentage >= 80 ? 'bg-blue-500' :
                      percentage >= 70 ? 'bg-yellow-500' :
                      percentage >= 60 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="feedback">Feedback (optional)</Label>
                <Textarea
                  id="feedback"
                  value={gradeData.feedback}
                  onChange={(e) => setGradeData(prev => ({ ...prev, feedback: e.target.value }))}
                  placeholder="Provide feedback to help the student improve..."
                  rows={6}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGrade}
                  disabled={grading}
                  className="flex-1"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  {grading ? 'Saving...' : existingGrade ? 'Update Grade' : 'Save Grade'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Grading Rubric */}
          <Card>
            <CardHeader>
              <CardTitle>Grading Scale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span>A (90-100%)</span>
                  <span className="text-green-600 font-medium">Excellent</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>B (80-89%)</span>
                  <span className="text-blue-600 font-medium">Good</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>C (70-79%)</span>
                  <span className="text-yellow-600 font-medium">Satisfactory</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>D (60-69%)</span>
                  <span className="text-orange-600 font-medium">Needs Improvement</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>F (0-59%)</span>
                  <span className="text-red-600 font-medium">Unsatisfactory</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}