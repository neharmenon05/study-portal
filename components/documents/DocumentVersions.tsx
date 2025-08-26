// components/documents/DocumentVersions.tsx - Document version history component
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  ClockIcon,
  DownloadIcon,
  PlusIcon,
  DocumentTextIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface DocumentVersion {
  id: string;
  version: number;
  fileName: string;
  filePath: string;
  fileSize: string;
  changes?: string;
  createdAt: string;
}

interface DocumentVersionsProps {
  documentId: string;
  canUpload: boolean;
}

export default function DocumentVersions({ documentId, canUpload }: DocumentVersionsProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [changes, setChanges] = useState('');

  useEffect(() => {
    fetchVersions();
  }, [documentId]);

  const fetchVersions = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}/versions`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions);
      }
    } catch (error) {
      console.error('Error fetching versions:', error);
      toast.error('Failed to load document versions');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadVersion = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('changes', changes);

      const response = await fetch(`/api/documents/${documentId}/versions`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload version');
      }

      toast.success('New version uploaded successfully!');
      setSelectedFile(null);
      setChanges('');
      setShowUploadForm(false);
      fetchVersions();

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload version');
    } finally {
      setUploading(false);
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

  const handleDownload = (version: DocumentVersion) => {
    // Create download link
    const link = document.createElement('a');
    link.href = `/api/files/${version.filePath}`;
    link.download = version.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Version History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <ClockIcon className="h-5 w-5 mr-2" />
              Version History
            </CardTitle>
            <CardDescription>
              Track changes and download previous versions
            </CardDescription>
          </div>
          {canUpload && (
            <Button 
              onClick={() => setShowUploadForm(!showUploadForm)}
              size="sm"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Version
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Form */}
        {showUploadForm && canUpload && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Upload New Version</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUploadForm(false)}
              >
                <XMarkIcon className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="versionFile">File</Label>
                <Input
                  id="versionFile"
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx,.txt,.md"
                />
              </div>
              
              <div>
                <Label htmlFor="changes">Changes Description</Label>
                <Textarea
                  id="changes"
                  value={changes}
                  onChange={(e) => setChanges(e.target.value)}
                  placeholder="Describe what changed in this version..."
                  rows={3}
                />
              </div>
              
              <Button 
                onClick={handleUploadVersion}
                disabled={uploading || !selectedFile}
                className="w-full"
              >
                {uploading ? 'Uploading...' : 'Upload Version'}
              </Button>
            </div>
          </div>
        )}

        {/* Versions List */}
        {versions.length > 0 ? (
          <div className="space-y-3">
            {versions.map((version, index) => (
              <div key={version.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <DocumentTextIcon className="h-8 w-8 text-blue-500" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium">Version {version.version}</h4>
                      {index === 0 && (
                        <Badge variant="default">Current</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {version.fileName} • {formatFileSize(version.fileSize)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(version.createdAt).toLocaleString()}
                    </p>
                    {version.changes && (
                      <p className="text-sm text-gray-700 mt-2 italic">
                        "{version.changes}"
                      </p>
                    )}
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(version)}
                >
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No version history available</p>
            <p className="text-sm text-gray-500">
              Upload a new version to start tracking changes
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}