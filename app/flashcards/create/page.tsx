'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface FlashcardData {
  front: string;
  back: string;
  difficulty: 'easy' | 'normal' | 'hard';
}

const colorOptions = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#8b5cf6', // purple
  '#f97316', // orange
  '#06b6d4', // cyan
  '#84cc16', // lime
];

const difficultyOptions = [
  { value: 'easy', label: 'Easy', color: 'bg-green-100 text-green-800' },
  { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  { value: 'hard', label: 'Hard', color: 'bg-red-100 text-red-800' },
];

export default function CreateDeckPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deckName, setDeckName] = useState('');
  const [deckDescription, setDeckDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);
  const [flashcards, setFlashcards] = useState<FlashcardData[]>([
    { front: '', back: '', difficulty: 'normal' },
  ]);
  const [previewCard, setPreviewCard] = useState<number | null>(null);
  const [showBack, setShowBack] = useState(false);

  const addCard = () => {
    setFlashcards([...flashcards, { front: '', back: '', difficulty: 'normal' }]);
  };

  const removeCard = (index: number) => {
    if (flashcards.length > 1) {
      setFlashcards(flashcards.filter((_, i) => i !== index));
      if (previewCard === index) {
        setPreviewCard(null);
      }
    }
  };

  const updateCard = (index: number, field: keyof FlashcardData, value: string) => {
    const updated = [...flashcards];
    updated[index] = { ...updated[index], [field]: value };
    setFlashcards(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deckName.trim()) {
      toast.error('Please enter a deck name');
      return;
    }

    const validCards = flashcards.filter(card => 
      card.front.trim() && card.back.trim()
    );

    if (validCards.length === 0) {
      toast.error('Please add at least one complete flashcard');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: deckName.trim(),
          description: deckDescription.trim() || null,
          color: selectedColor,
          flashcards: validCards,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Deck created successfully!');
        router.push('/flashcards');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create deck');
      }
    } catch (error) {
      console.error('Error creating deck:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create deck');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/flashcards">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Flashcards
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Deck</h1>
          <p className="text-gray-600">Build a new flashcard deck for studying</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Deck Information */}
        <Card>
          <CardHeader>
            <CardTitle>Deck Information</CardTitle>
            <CardDescription>
              Basic information about your flashcard deck
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deckName">Deck Name *</Label>
              <Input
                id="deckName"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                placeholder="e.g., Spanish Vocabulary, Math Formulas"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deckDescription">Description</Label>
              <Textarea
                id="deckDescription"
                value={deckDescription}
                onChange={(e) => setDeckDescription(e.target.value)}
                placeholder="Brief description of what this deck covers..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Deck Color</Label>
              <div className="flex gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedColor === color
                        ? 'border-gray-400 scale-110'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Flashcards */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Flashcards</CardTitle>
                <CardDescription>
                  Add cards to your deck. You can preview them as you type.
                </CardDescription>
              </div>
              <Button type="button" onClick={addCard} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Card
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {flashcards.map((card, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700">
                    Card {index + 1}
                  </h4>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPreviewCard(previewCard === index ? null : index);
                        setShowBack(false);
                      }}
                    >
                      {previewCard === index ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    {flashcards.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeCard(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Front *</Label>
                    <Textarea
                      value={card.front}
                      onChange={(e) => updateCard(index, 'front', e.target.value)}
                      placeholder="Question or prompt..."
                      rows={3}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Back *</Label>
                    <Textarea
                      value={card.back}
                      onChange={(e) => updateCard(index, 'back', e.target.value)}
                      placeholder="Answer or explanation..."
                      rows={3}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <div className="flex gap-2">
                    {difficultyOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                          card.difficulty === option.value
                            ? option.color
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        onClick={() => updateCard(index, 'difficulty', option.value as FlashcardData['difficulty'])}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Card Preview */}
                {previewCard === index && (card.front || card.back) && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Preview</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowBack(!showBack)}
                      >
                        {showBack ? 'Show Front' : 'Show Back'}
                      </Button>
                    </div>
                    <div className="bg-white p-4 rounded border min-h-[100px] flex items-center justify-center">
                      <p className="text-center">
                        {showBack ? card.back || 'Back content...' : card.front || 'Front content...'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {flashcards.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No cards yet. Click "Add Card" to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" asChild>
            <Link href="/flashcards">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              'Creating...'
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Deck
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
