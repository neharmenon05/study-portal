'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  BookOpenIcon,
  UsersIcon,
  DocumentTextIcon,
  PlusIcon,
  UserPlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface ClassDetails {
  id: string;
  name: string;
  description?: string;
  semester: string;
  year: number;
  subject: {
    name: string;
    code: string;
    color: string;
  };
  teacher: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  enrollments: Array<{
    id: string;
    student: {
      id: string;
      name: string;
      email: string;
      avatar?: string;
    };
    enrolledAt: string;
  }>;
  assignments: Array<{
    id: string;
    title: string;
    dueDate: string;
    maxPoints: number;
    _count: {
      submissions: number;
    };
  }>;
  _count: {
    enrollments: number;
    assignments: number;
  };
}

export default function ClassDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrollingStudents, setEnrollingStudents] = useState(false);
  const [studentEmails, setStudentEmails] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchClassDetails();
    }
  }, [params.id]);

  const fetchClassDetails = async () => {
    try {
      const response = await fetch(`/api/classes/${params.id}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setClassDetails(data.class);
      } else {
        throw new Error('Failed to fetch class details');
      }
    } catch (error) {
      console.error('Error fetching class details:', error);
      toast.error('Failed to load class details');
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollStudents = async () => {
    if (!studentEmails.trim()) {
      toast.error('Please enter at least one email address');
      return;
    }

    setEnrollingStudents(true);

    try {
      const emails = studentEmails.split(',').map(email => email.trim()).filter(Boolean);
      
      const response = await fetch(`/api/classes/${params.id}/enrollments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ studentEmails: emails }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enroll students');
      }

      toast.success(`Enrolled ${data.enrollments.length} students successfully!`);
      if (data.errors.length > 0) {
        toast.error(`Some enrollments failed: ${data.errors.join(', ')}`);
      }
      
      setStudentEmails('');
      fetchClassDetails(); // Refresh the class details

    } catch (error) {
      console.error('Enrollment error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to enroll students');
    } finally {
      setEnrollingStudents(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!classDetails) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Class not found</h3>
          <p className="text-gray-600 mb-4">The class you're looking for doesn't exist or you don't have access to it.</p>
          <Button asChild>
            <Link href="/classes">← Back to Classes</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isTeacher = user?.role === 'TEACHER' && classDetails.teacher.id === user.id;

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-4">
            <Badge 
              variant="secondary" 
              style={{ backgroundColor: `${classDetails.subject.color}20`, color: classDetails.subject.color }}
            >
              {classDetails.subject.code}
            </Badge>
            <Badge variant="outline">
              {classDetails.semester} {classDetails.year}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{classDetails.name}</h1>
          {classDetails.description && (
            <p className="text-gray-600 text-lg">{classDetails.description}</p>
          )}
          <div className="flex items-center space-x-4 mt-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <UsersIcon className="h-4 w-4" />
              <span>{classDetails._count.enrollments} students</span>
            </div>
            <div className="flex items-center space-x-1">
              <DocumentTextIcon className="h-4 w-4" />
              <span>{classDetails._count.assignments} assignments</span>
            </div>
          </div>
        </div>
        {isTeacher && (
          <div className="flex gap-3">
            <Button asChild>
              <Link href={`/assignments/create?classId=${classDetails.id}`}>
                <PlusIcon className="w-4 h-4 mr-2" />
                New Assignment
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/classes/${classDetails.id}/edit`}>
                <PencilIcon className="w-4 h-4 mr-2" />
                Edit Class
              </Link>
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assignments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Assignments</CardTitle>
                {isTeacher && (
                  <Button size="sm" asChild>
                    <Link href={`/assignments/create?classId=${classDetails.id}`}>
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Create Assignment
                    </Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {classDetails.assignments.length > 0 ? (
                <div className="space-y-4">
                  {classDetails.assignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {assignment.title}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                          <span>Max Points: {assignment.maxPoints}</span>
                          {isTeacher && (
                            <span>{assignment._count.submissions} submissions</span>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/assignments/${assignment.id}`}>
                          <EyeIcon className="w-4 h-4 mr-2" />
                          View
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No assignments yet</p>
                  {isTeacher && (
                    <Button className="mt-4" asChild>
                      <Link href={`/assignments/create?classId=${classDetails.id}`}>
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Create First Assignment
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Teacher Info */}
          <Card>
            <CardHeader>
              <CardTitle>Instructor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={classDetails.teacher.avatar} />
                  <AvatarFallback>
                    {classDetails.teacher.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium text-gray-900">{classDetails.teacher.name}</h4>
                  <p className="text-sm text-gray-600">{classDetails.teacher.email}</p>
                  <Badge variant="default">Teacher</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Class Info */}
          <Card>
            <CardHeader>
              <CardTitle>Class Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subject</span>
                <span className="font-medium">{classDetails.subject.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Code</span>
                <span className="font-medium">{classDetails.subject.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Semester</span>
                <span className="font-medium">{classDetails.semester} {classDetails.year}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Students</span>
                <span className="font-medium">{classDetails._count.enrollments}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Assignments</span>
                <span className="font-medium">{classDetails._count.assignments}</span>
              </div>
            </CardContent>
          </Card>

          {/* Students */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Students ({classDetails._count.enrollments})</CardTitle>
                {isTeacher && (
                  <Button size="sm" variant="outline">
                    <UserPlusIcon className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Enroll Students Form (Teacher Only) */}
              {isTeacher && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Enroll Students</h4>
                  <div className="space-y-2">
                    <Input
                      placeholder="Enter student emails (comma-separated)"
                      value={studentEmails}
                      onChange={(e) => setStudentEmails(e.target.value)}
                    />
                    <Button 
                      size="sm" 
                      onClick={handleEnrollStudents}
                      disabled={enrollingStudents}
                      className="w-full"
                    >
                      {enrollingStudents ? 'Enrolling...' : 'Enroll Students'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Students List */}
              {classDetails.enrollments.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {classDetails.enrollments.map((enrollment) => (
                    <div key={enrollment.id} className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={enrollment.student.avatar} />
                        <AvatarFallback>
                          {enrollment.student.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {enrollment.student.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {enrollment.student.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <UsersIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No students enrolled</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}