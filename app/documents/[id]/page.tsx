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
  DownloadIcon,
  StarIcon,
  ChatBubbleLeftIcon,
  ClockIcon,
  UserIcon,
  TagIcon,
  EyeIcon
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
    id: string;
    name: string;
    role: string;
    avatar?: string;
  };
  tags: Array<{
    tag: { name: string; color: string };
  }>;
  feedback: Array<{
    id: string;
    rating: number;
    comment?: string;
    type: string;
    createdAt: string;
    author: {
      id: string;
      name: string;
      role: string;
      avatar?: string;
    };
  }>;
  versions: Array<{
    id: string;
    version: number;
    fileName: string;
    fileSize: string;
    changes?: string;
    createdAt: string;
  }>;
}

export default function DocumentDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchDocument();
    }
  }, [params.id]);

  const fetchDocument = async () => {
    try {
      const response = await fetch(`/api/documents/${params.id}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setDocument(data.document);
      } else {
        throw new Error('Failed to fetch document');
      }
    } catch (error) {
      console.error('Error fetching document:', error);
      toast.error('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async () => {
    if (!feedbackRating) {
      toast.error('Please select a rating');
      return;
    }

    setSubmittingFeedback(true);

    try {
      const response = await fetch(`/api/documents/${params.id}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          rating: feedbackRating,
          comment: feedbackComment,
        }),
      });

      if (response.ok) {
        toast.success('Feedback submitted successfully');
        setFeedbackRating(0);
        setFeedbackComment('');
        fetchDocument(); // Refresh to show new feedback
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
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

  const renderStarRating = (rating: number, interactive = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && onRate && onRate(star)}
            disabled={!interactive}
            className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}
          >
            {star <= rating ? (
              <StarIconSolid className="h-5 w-5 text-yellow-400" />
            ) : (
              <StarIcon className="h-5 w-5 text-gray-300" />
            )}
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Document not found</h3>
          <p className="text-gray-600 mb-4">The document you're looking for doesn't exist or you don't have access to it.</p>
          <Button asChild>
            <Link href="/documents">← Back to Documents</Link>
          </Button>
        </div>
      </div>
    );
  }

  const userFeedback = document.feedback.find(f => f.author.id === user?.id);
  const canGiveFeedback = user && document.uploader.id !== user.id && !userFeedback;

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-4">
            <Badge 
              variant="secondary" 
              style={{ backgroundColor: `${document.subject.color}20`, color: document.subject.color }}
            >
              {document.subject.name}
            </Badge>
            <Badge variant="outline">
              {document.type.toUpperCase()}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{document.title}</h1>
          {document.description && (
            <p className="text-gray-600 text-lg">{document.description}</p>
          )}
        </div>
        <div className="flex gap-3">
          <Button>
            <DownloadIcon className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/ai-chat?documentId=${document.id}`}>
              <ChatBubbleLeftIcon className="w-4 h-4 mr-2" />
              Ask AI
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Document Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Document Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  {document.fileName}
                </p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(document.fileSize)} • {document.downloadCount} downloads
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Feedback Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Feedback & Reviews</span>
                <div className="flex items-center space-x-2">
                  {renderStarRating(document.averageRating)}
                  <span className="text-sm text-gray-600">
                    ({document.totalRatings} reviews)
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add Feedback Form */}
              {canGiveFeedback && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium mb-3">Leave your feedback</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rating
                      </label>
                      {renderStarRating(feedbackRating, true, setFeedbackRating)}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Comment (optional)
                      </label>
                      <Textarea
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        placeholder="Share your thoughts about this document..."
                        rows={3}
                      />
                    </div>
                    <Button 
                      onClick={submitFeedback} 
                      disabled={submittingFeedback || !feedbackRating}
                    >
                      {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Existing Feedback */}
              <div className="space-y-4">
                {document.feedback.length > 0 ? (
                  document.feedback.map((feedback) => (
                    <div key={feedback.id} className="border rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={feedback.author.avatar} />
                          <AvatarFallback>
                            {feedback.author.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{feedback.author.name}</span>
                              <Badge variant={feedback.author.role === 'TEACHER' ? 'default' : 'secondary'}>
                                {feedback.author.role}
                              </Badge>
                              {feedback.type === 'TEACHER' && (
                                <Badge variant="outline">Teacher Review</Badge>
                              )}
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(feedback.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="mb-2">
                            {renderStarRating(feedback.rating)}
                          </div>
                          {feedback.comment && (
                            <p className="text-gray-700">{feedback.comment}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <ChatBubbleLeftIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No feedback yet</p>
                    <p className="text-sm text-gray-500">Be the first to review this document</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Document Info */}
          <Card>
            <CardHeader>
              <CardTitle>Document Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={document.uploader.avatar} />
                  <AvatarFallback>
                    {document.uploader.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{document.uploader.name}</p>
                  <Badge variant={document.uploader.role === 'TEACHER' ? 'default' : 'secondary'}>
                    {document.uploader.role}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Uploaded</span>
                  <span>{new Date(document.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">File size</span>
                  <span>{formatFileSize(document.fileSize)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Downloads</span>
                  <span>{document.downloadCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Reviews</span>
                  <span>{document.totalRatings}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {document.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TagIcon className="h-5 w-5 mr-2" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {document.tags.map((tagItem, index) => (
                    <Badge key={index} variant="outline">
                      {tagItem.tag.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Version History */}
          {document.versions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2" />
                  Version History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {document.versions.map((version) => (
                    <div key={version.id} className="flex items-center justify-between p-2 rounded border">
                      <div>
                        <p className="font-medium text-sm">v{version.version}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(version.createdAt).toLocaleDateString()}
                        </p>
                        {version.changes && (
                          <p className="text-xs text-gray-600 mt-1">{version.changes}</p>
                        )}
                      </div>
                      <Button variant="ghost" size="sm">
                        <DownloadIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}