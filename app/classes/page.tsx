'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpenIcon,
  UsersIcon,
  DocumentTextIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface Class {
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
  teacher?: {
    name: string;
    email: string;
  };
  _count: {
    enrollments: number;
    assignments: number;
  };
}

export default function ClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes);
      } else {
        throw new Error('Failed to fetch classes');
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
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
            {user?.role === 'TEACHER' ? 'My Classes' : 'Enrolled Classes'}
          </h1>
          <p className="text-gray-600">
            {user?.role === 'TEACHER' 
              ? 'Manage your classes and students' 
              : 'View your enrolled classes and assignments'
            }
          </p>
        </div>
        {user?.role === 'TEACHER' && (
          <Button asChild>
            <Link href="/classes/create">
              <PlusIcon className="w-4 h-4 mr-2" />
              Create Class
            </Link>
          </Button>
        )}
      </div>

      {/* Classes Grid */}
      {classes.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <BookOpenIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {user?.role === 'TEACHER' ? 'No classes created yet' : 'No enrolled classes'}
          </h3>
          <p className="text-gray-600 mb-4">
            {user?.role === 'TEACHER' 
              ? 'Create your first class to get started' 
              : 'Contact your teacher to get enrolled in classes'
            }
          </p>
          {user?.role === 'TEACHER' && (
            <Button asChild>
              <Link href="/classes/create">
                <PlusIcon className="w-4 h-4 mr-2" />
                Create Your First Class
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((classItem) => (
            <Card key={classItem.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge 
                        variant="secondary" 
                        style={{ backgroundColor: `${classItem.subject.color}20`, color: classItem.subject.color }}
                      >
                        {classItem.subject.code}
                      </Badge>
                      <Badge variant="outline">
                        {classItem.semester} {classItem.year}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg line-clamp-2 mb-2">
                      {classItem.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {classItem.subject.name}
                    </CardDescription>
                    {classItem.description && (
                      <CardDescription className="line-clamp-2 mt-1">
                        {classItem.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Teacher Info (for students) */}
                {user?.role === 'STUDENT' && classItem.teacher && (
                  <div className="text-sm text-gray-600">
                    <p><strong>Instructor:</strong> {classItem.teacher.name}</p>
                    <p className="text-xs text-gray-500">{classItem.teacher.email}</p>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <UsersIcon className="h-4 w-4 text-gray-400" />
                    <span>{classItem._count.enrollments} students</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                    <span>{classItem._count.assignments} assignments</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button asChild className="flex-1" variant="outline">
                    <Link href={`/classes/${classItem.id}`}>
                      <EyeIcon className="w-4 h-4 mr-2" />
                      View
                    </Link>
                  </Button>
                  {user?.role === 'TEACHER' && (
                    <>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/classes/${classItem.id}/edit`}>
                          <PencilIcon className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}