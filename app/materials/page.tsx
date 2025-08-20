'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  FolderIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  SpeakerWaveIcon,
  LinkIcon,
  EyeIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface Material {
  id: string;
  title: string;
  description?: string;
  type: string;
  url?: string;
  category?: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  folder?: {
    id: string;
    name: string;
    color: string;
  };
  _count: {
    noteLinks: number;
    sessionLinks: number;
  };
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'pdf':
    case 'doc':
      return DocumentIcon;
    case 'image':
      return PhotoIcon;
    case 'video':
      return VideoCameraIcon;
    case 'audio':
      return SpeakerWaveIcon;
    case 'url':
      return LinkIcon;
    default:
      return FolderIcon;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'pdf':
      return 'bg-red-500';
    case 'doc':
      return 'bg-blue-500';
    case 'video':
      return 'bg-purple-500';
    case 'audio':
      return 'bg-green-500';
    case 'image':
      return 'bg-yellow-500';
    case 'url':
      return 'bg-indigo-500';
    default:
      return 'bg-gray-500';
  }
};

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const response = await fetch('/api/materials?userId=demo-user');
      if (!response.ok) {
        throw new Error('Failed to fetch materials');
      }
      const data = await response.json();
      setMaterials(data.materials || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast.error('Failed to load materials');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         material.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         material.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !selectedCategory || material.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(materials.map(m => m.category).filter(Boolean)));

  const openMaterial = (material: Material) => {
    if (material.url) {
      window.open(material.url, '_blank');
    } else {
      toast.info('File preview will be available in the next update');
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Study Materials
            </h1>
            <Button asChild>
              <Link href="/materials/upload">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Material
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Study Materials
            </h1>
            <p className="text-muted-foreground">
              {materials.length} materials organized and ready for study
            </p>
          </div>
          <Button asChild>
            <Link href="/materials/upload">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Material
            </Link>
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {categories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Materials Grid */}
        {filteredMaterials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaterials.map((material, index) => {
              const TypeIcon = getTypeIcon(material.type);
              const typeColor = getTypeColor(material.type);
              
              return (
                <motion.div
                  key={material.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => openMaterial(material)}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`${typeColor} p-3 rounded-lg`}>
                          <TypeIcon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex items-center gap-2">
                          {material.isFavorite && (
                            <StarIconSolid className="h-4 w-4 text-yellow-500" />
                          )}
                          <EyeIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                        </div>
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {material.title}
                      </h3>
                      
                      {material.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {material.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {material.category && (
                          <Badge variant="secondary" className="text-xs">
                            {material.category}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {material.type.toUpperCase()}
                        </Badge>
                      </div>
                      
                      {material.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {material.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {material.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{material.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {new Date(material.createdAt).toLocaleDateString()}
                        </span>
                        <div className="flex gap-3">
                          {material._count.noteLinks > 0 && (
                            <span>{material._count.noteLinks} notes</span>
                          )}
                          {material._count.sessionLinks > 0 && (
                            <span>{material._count.sessionLinks} sessions</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <FolderIcon className="h-24 w-24 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {materials.length === 0 ? 'No materials yet' : 'No materials match your search'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {materials.length === 0 
                  ? 'Start building your study library by adding your first material'
                  : 'Try adjusting your search or filters'}
              </p>
              {materials.length === 0 && (
                <Button asChild>
                  <Link href="/materials/upload">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Your First Material
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
