'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DocumentTextIcon, CalendarIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface Subject {
  id: string;
  name: string;
  code: string;
  color: string;
}

interface Class {
  id: string;
  name: string;
  subject: {
    name: string;
    code: string;
  };
}

interface Document {
  id: string;
  title: string;
  type: string;
  subject: {
    name: string;
  };
}

export default function CreateAssignmentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectId: '',
    classId: '',
    dueDate: '',
    maxPoints: 100,
  });

  useEffect(() => {
    if (user?.role !== 'TEACHER') {
      router.push('/dashboard');
      return;
    }
    fetchSubjects();
    fetchClasses();
    fetchDocuments();
  }, [user, router]);

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/subjects', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setSubjects(data.subjects);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents?shared=true', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.subjectId || !formData.classId || !formData.dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          documentIds: selectedDocuments,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create assignment');
      }

      toast.success('Assignment created successfully!');
      router.push('/assignments');

    } catch (error) {
      console.error('Create assignment error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleDocument = (documentId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId) 
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  const filteredDocuments = documents.filter(doc => 
    !formData.subjectId || doc.subject.name === subjects.find(s => s.id === formData.subjectId)?.name
  );

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="text-center mb-8">
        <div className="mx-auto h-16 w-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
          <DocumentTextIcon className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Create New Assignment</h1>
        <p className="text-gray-600 mt-2">
          Create an assignment for your students
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assignment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment Details</CardTitle>
              <CardDescription>
                Enter the basic information for your assignment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Assignment Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Data Structures Project"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Detailed description of the assignment..."
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="subjectId">Subject *</Label>
                <select
                  id="subjectId"
                  value={formData.subjectId}
                  onChange={(e) => handleInputChange('subjectId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                  required
                >
                  <option value="">Select a subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.code} - {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="classId">Class *</Label>
                <select
                  id="classId"
                  value={formData.classId}
                  onChange={(e) => handleInputChange('classId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                  required
                >
                  <option value="">Select a class</option>
                  {classes.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.name} ({classItem.subject.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="maxPoints">Max Points</Label>
                  <Input
                    id="maxPoints"
                    type="number"
                    value={formData.maxPoints}
                    onChange={(e) => handleInputChange('maxPoints', parseInt(e.target.value))}
                    min="1"
                    max="1000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resource Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Reference Materials</CardTitle>
              <CardDescription>
                Select documents to attach to this assignment (optional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredDocuments.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredDocuments.map((document) => (
                    <div
                      key={document.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedDocuments.includes(document.id)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleDocument(document.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{document.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {document.type.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {document.subject.name}
                            </span>
                          </div>
                        </div>
                        {selectedDocuments.includes(document.id) && (
                          <div className="ml-2">
                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No documents available</p>
                  <p className="text-sm text-gray-500">
                    {formData.subjectId ? 'No documents found for selected subject' : 'Select a subject to see available documents'}
                  </p>
                </div>
              )}

              {selectedDocuments.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium mb-2">Selected Documents ({selectedDocuments.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedDocuments.map((docId) => {
                      const doc = documents.find(d => d.id === docId);
                      return doc ? (
                        <Badge key={docId} variant="secondary" className="flex items-center gap-1">
                          {doc.title}
                          <button
                            type="button"
                            onClick={() => toggleDocument(docId)}
                            className="ml-1 hover:text-red-600"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/assignments')}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Creating...' : 'Create Assignment'}
          </Button>
        </div>
      </form>
    </div>
  );
}