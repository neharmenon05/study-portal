// app/flashcards/create/page.tsx - Flashcard creation with material display
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  BookOpen, 
  FileText,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Material {
  id: string;
  title: string;
  description?: string;
  type: string;
  url?: string;
  category?: string;
  tags: string[];
}

interface Flashcard {
  front: string;
  back: string;
  difficulty: 'easy' | 'normal' | 'hard';
}

export default function CreateFlashcardPage() {
  const router = useRouter();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [showMaterialContent, setShowMaterialContent] = useState(false);
  const [deckData, setDeckData] = useState({
    name: '',
    description: '',
    color: '#8b5cf6',
  });
  const [flashcards, setFlashcards] = useState<Flashcard[]>([
    { front: '', back: '', difficulty: 'normal' }
  ]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const response = await fetch('/api/materials', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setMaterials(data.materials || []);
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  };

  const addFlashcard = () => {
    setFlashcards([...flashcards, { front: '', back: '', difficulty: 'normal' }]);
  };

  const removeFlashcard = (index: number) => {
    if (flashcards.length > 1) {
      setFlashcards(flashcards.filter((_, i) => i !== index));
    }
  };

  const updateFlashcard = (index: number, field: keyof Flashcard, value: string) => {
    const updated = flashcards.map((card, i) => 
      i === index ? { ...card, [field]: value } : card
    );
    setFlashcards(updated);
  };

  const selectMaterial = (material: Material) => {
    setSelectedMaterial(material);
    setShowMaterialContent(true);
    
    // Auto-generate deck name from material if not set
    if (!deckData.name) {
      setDeckData(prev => ({
        ...prev,
        name: `${material.title} - Flashcards`
      }));
    }
  };

  const createDeck = async () => {
    if (!deckData.name.trim()) {
      toast.error('Please enter a deck name');
      return;
    }

    const validCards = flashcards.filter(card => 
      card.front.trim() && card.back.trim()
    );

    if (validCards.length === 0) {
      toast.error('Please add at least one flashcard with front and back content');
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...deckData,
          flashcards: validCards,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create deck');
      }

      toast.success('Flashcard deck created successfully!');
      router.push('/flashcards');

    } catch (error) {
      console.error('Create deck error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create deck');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">Create Flashcard Deck</h1>
        <p className="text-gray-600 mt-2">
          Create flashcards from your study materials or from scratch
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Materials */}
        <div className="space-y-6">
          {/* Materials Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Study Materials
              </CardTitle>
              <CardDescription>
                Select a material to base your flashcards on (optional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {materials.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {materials.map((material) => (
                    <div
                      key={material.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedMaterial?.id === material.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => selectMaterial(material)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{material.title}</h4>
                          {material.description && (
                            <p className="text-sm text-gray-500 mt-1">
                              {material.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {material.type.toUpperCase()}
                            </Badge>
                            {material.category && (
                              <Badge variant="outline" className="text-xs">
                                {material.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No study materials found. 
                  <br />
                  <Button
                    variant="link"
                    onClick={() => router.push('/materials/upload')}
                    className="p-0 h-auto"
                  >
                    Upload some materials first
                  </Button>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Selected Material Display */}
          {selectedMaterial && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Selected Material</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMaterialContent(!showMaterialContent)}
                  >
                    {showMaterialContent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">{selectedMaterial.title}</h4>
                    {selectedMaterial.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedMaterial.description}
                      </p>
                    )}
                  </div>
                  
                  {showMaterialContent && (
                    <div className="border-t pt-3">
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <p className="text-sm font-medium mb-2">Material Content Preview:</p>
                        <div className="text-sm text-gray-600">
                          {selectedMaterial.url ? (
                            <div>
                              <p>📄 File: {selectedMaterial.title}</p>
                              <p>📁 Type: {selectedMaterial.type.toUpperCase()}</p>
                              {selectedMaterial.category && (
                                <p>🏷️ Category: {selectedMaterial.category}</p>
                              )}
                              <p className="mt-2 text-xs text-gray-500">
                                💡 Tip: Open this material in another tab to reference while creating flashcards
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() => window.open(selectedMaterial.url, '_blank')}
                              >
                                Open Material
                              </Button>
                            </div>
                          ) : (
                            <p>No content preview available</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Deck Creation */}
        <div className="space-y-6">
          {/* Deck Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Deck Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="deckName">Deck Name *</Label>
                <Input
                  id="deckName"
                  value={deckData.name}
                  onChange={(e) => setDeckData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter deck name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="deckDescription">Description</Label>
                <Textarea
                  id="deckDescription"
                  value={deckData.description}
                  onChange={(e) => setDeckData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this deck covers..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="deckColor">Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="deckColor"
                    value={deckData.color}
                    onChange={(e) => setDeckData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-12 h-10 border rounded cursor-pointer"
                  />
                  <span className="text-sm text-gray-500">{deckData.color}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Flashcards */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Flashcards</span>
                <Button onClick={addFlashcard} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Card
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {flashcards.map((card, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Card {index + 1}</span>
                      {flashcards.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFlashcard(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div>
                      <Label>Front (Question/Prompt)</Label>
                      <Textarea
                        value={card.front}
                        onChange={(e) => updateFlashcard(index, 'front', e.target.value)}
                        placeholder="Enter the question or prompt..."
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label>Back (Answer)</Label>
                      <Textarea
                        value={card.back}
                        onChange={(e) => updateFlashcard(index, 'back', e.target.value)}
                        placeholder="Enter the answer or explanation..."
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label>Difficulty</Label>
                      <select
                        value={card.difficulty}
                        onChange={(e) => updateFlashcard(index, 'difficulty', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                      >
                        <option value="easy">Easy</option>
                        <option value="normal">Normal</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/flashcards')}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={createDeck}
              disabled={isCreating}
              className="flex-1"
            >
              {isCreating ? 'Creating...' : 'Create Deck'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}