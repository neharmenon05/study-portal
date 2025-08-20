'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  CloudArrowUpIcon, 
  DocumentIcon, 
  PhotoIcon, 
  VideoCameraIcon,
  SpeakerWaveIcon,
  LinkIcon,
  FolderIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const materialTypes = [
  { value: 'pdf', label: 'PDF Document', icon: DocumentIcon, color: 'bg-red-500' },
  { value: 'doc', label: 'Document', icon: DocumentIcon, color: 'bg-blue-500' },
  { value: 'video', label: 'Video', icon: VideoCameraIcon, color: 'bg-purple-500' },
  { value: 'audio', label: 'Audio', icon: SpeakerWaveIcon, color: 'bg-green-500' },
  { value: 'image', label: 'Image', icon: PhotoIcon, color: 'bg-yellow-500' },
  { value: 'url', label: 'Web Link', icon: LinkIcon, color: 'bg-indigo-500' },
  { value: 'other', label: 'Other', icon: FolderIcon, color: 'bg-gray-500' }
];

const categories = [
  'Mathematics', 'Science', 'Computer Science', 'Literature', 'History', 
  'Languages', 'Art', 'Music', 'Business', 'Medicine', 'Engineering', 'Other'
];

export default function UploadMaterialPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    url: '',
    category: '',
    tags: [] as string[],
    color: '#3b82f6'
  });
  const [tagInput, setTagInput] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    
    if (!selectedType) {
      toast.error('Please select a material type');
      return;
    }

    if (selectedType === 'url' && !formData.url.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          type: selectedType,
          userId: 'demo-user' // Will be replaced with real user ID from session
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create material');
      }

      const result = await response.json();
      toast.success('Material added successfully!');
      router.push('/materials');
      
    } catch (error) {
      console.error('Error creating material:', error);
      toast.error('Failed to add material. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Add Study Material
            </h1>
            <p className="text-muted-foreground mt-2">
              Upload files, add links, or create references to organize your study materials
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push('/materials')}>
            Cancel
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Material Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Material Type</CardTitle>
              <CardDescription>
                Choose the type of material you want to add
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {materialTypes.map((type) => (
                  <motion.div
                    key={type.value}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedType(type.value);
                        handleInputChange('type', type.value);
                      }}
                      className={`w-full p-4 rounded-lg border-2 transition-all ${
                        selectedType === type.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className={`${type.color} p-3 rounded-lg mb-2 mx-auto w-fit`}>
                        <type.icon className="h-6 w-6 text-white" />
                      </div>
                      <span className="text-sm font-medium">{type.label}</span>
                    </button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Provide details about your study material
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter a descriptive title"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Add a description (optional)"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white min-h-[100px] resize-vertical"
                />
              </div>

              {selectedType === 'url' && (
                <div>
                  <Label htmlFor="url">URL *</Label>
                  <Input
                    id="url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => handleInputChange('url', e.target.value)}
                    placeholder="https://example.com"
                    className="mt-1"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>
                Add tags to help organize and find your materials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Enter a tag"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" onClick={addTag} variant="outline">
                  Add Tag
                </Button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:bg-red-500 hover:text-white rounded-full p-1"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* File Upload (for non-URL types) */}
          {selectedType && selectedType !== 'url' && (
            <Card>
              <CardHeader>
                <CardTitle>File Upload</CardTitle>
                <CardDescription>
                  Upload your file (Coming soon - for now, you can add materials by URL or reference)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                  <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    File upload functionality will be added in the next update
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    For now, you can add web links and references to organize your materials
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/materials')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Adding...
                </div>
              ) : (
                'Add Material'
              )}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
