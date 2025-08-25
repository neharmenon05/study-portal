'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  DocumentTextIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  EyeIcon,
  StarIcon,
  DownloadIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface Document {
  id: string;
  title: string;
  description?: string;
  type: string;
  fileName: string;
  fileSize: string;
  averageRating: number;
  totalRatings: number;
  downloadCount: number;
  createdAt: string;
  subject: {
    name: string;
    color: string;
  };
  uploader: {
    name: string;
    role: string;
  };
  tags: Array<{
    tag: { name: string; color: string };
  }>;
  _count: {
    feedback: number;
  };
}

interface Subject {
  id: string;
  name: string;
  code: string;
  color: string;
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [showSharedOnly, setShowSharedOnly] = useState(false);

  useEffect(() => {
    fetchSubjects();
    fetchDocuments();
  }, [selectedType, selectedSubject, showSharedOnly]);

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

  const fetchDocuments = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedType) params.append('type', selectedType);
      if (selectedSubject) params.append('subject', selectedSubject);
      if (showSharedOnly) params.append('shared', 'true');
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/documents?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents);
      } else {
        throw new Error('Failed to fetch documents');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setLoading(true);
    fetchDocuments();
  };

  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes);
    if (size === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderStarRating = (rating: number, count: number) => {
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
        <span className="text-sm text-gray-600 ml-1">
          ({rating.toFixed(1)}) {count} reviews
        </span>
      </div>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'notes':
        return '📝';
      case 'code':
        return '💻';
      case 'video':
        return '🎥';
      default:
        return '📄';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Academic Resources</h1>
          <p className="text-gray-600">Discover and share learning materials</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/documents/upload">
              <PlusIcon className="w-4 h-4 mr-2" />
              Upload Document
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="NOTES">Notes</option>
              <option value="CODE">Code</option>
              <option value="VIDEO">Video</option>
              <option value="OTHER">Other</option>
            </select>

            {/* Subject Filter */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>

            {/* Shared Only Toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="sharedOnly"
                checked={showSharedOnly}
                onChange={(e) => setShowSharedOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="sharedOnly" className="text-sm font-medium text-gray-700">
                Shared only
              </label>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={handleSearch}>
              <FunnelIcon className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents Grid */}
      {documents.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <DocumentTextIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No documents found
          </h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search terms or filters
          </p>
          <Button asChild>
            <Link href="/documents/upload">
              <PlusIcon className="w-4 h-4 mr-2" />
              Upload Your First Document
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((document) => (
            <Card key={document.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-2xl">{getTypeIcon(document.type)}</span>
                      <Badge 
                        variant="secondary" 
                        style={{ backgroundColor: `${document.subject.color}20`, color: document.subject.color }}
                      >
                        {document.subject.name}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg line-clamp-2 mb-2">
                      {document.title}
                    </CardTitle>
                    {document.description && (
                      <CardDescription className="line-clamp-2">
                        {document.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Rating */}
                {document.totalRatings > 0 && (
                  <div>
                    {renderStarRating(document.averageRating, document.totalRatings)}
                  </div>
                )}

                {/* Tags */}
                {document.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {document.tags.slice(0, 3).map((tagItem, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tagItem.tag.name}
                      </Badge>
                    ))}
                    {document.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{document.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                {/* Metadata */}
                <div className="text-sm text-gray-500 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>By {document.uploader.name}</span>
                    <Badge variant={document.uploader.role === 'TEACHER' ? 'default' : 'secondary'}>
                      {document.uploader.role}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{formatFileSize(document.fileSize)}</span>
                    <span>{document.downloadCount} downloads</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{new Date(document.createdAt).toLocaleDateString()}</span>
                    <span>{document._count.feedback} feedback</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button asChild className="flex-1" variant="outline">
                    <Link href={`/documents/${document.id}`}>
                      <EyeIcon className="w-4 h-4 mr-2" />
                      View
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm">
                    <DownloadIcon className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <ShareIcon className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}