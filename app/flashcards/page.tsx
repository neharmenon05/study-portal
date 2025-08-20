'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Play, Edit, Trash2, BarChart3, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface DeckStats {
  totalCards: number;
  newCards: number;
  learningCards: number;
  reviewCards: number;
  suspendedCards: number;
}

interface FlashcardDeck {
  id: string;
  name: string;
  description: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
  stats?: DeckStats;
  _count?: {
    flashcards: number;
  };
}

export default function FlashcardsPage() {
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDecks();
  }, []);

  const fetchDecks = async () => {
    try {
      const response = await fetch('/api/flashcards');
      if (response.ok) {
        const data = await response.json();
        setDecks(data.decks || []);
      } else {
        throw new Error('Failed to fetch decks');
      }
    } catch (error) {
      console.error('Error fetching decks:', error);
      toast.error('Failed to load flashcard decks');
    } finally {
      setLoading(false);
    }
  };

  const deleteDeck = async (deckId: string) => {
    if (!confirm('Are you sure you want to delete this deck? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/flashcards?deckId=${deckId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Deck deleted successfully');
        fetchDecks(); // Refresh the list
      } else {
        throw new Error('Failed to delete deck');
      }
    } catch (error) {
      console.error('Error deleting deck:', error);
      toast.error('Failed to delete deck');
    }
  };

  const filteredDecks = decks.filter(deck =>
    deck.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (deck.description && deck.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getDueCardsCount = (stats?: DeckStats) => {
    if (!stats) return 0;
    return stats.newCards + stats.learningCards + stats.reviewCards;
  };

  const getProgressPercentage = (stats?: DeckStats) => {
    if (!stats || stats.totalCards === 0) return 0;
    const masteredCards = stats.totalCards - stats.newCards - stats.learningCards;
    return Math.round((masteredCards / stats.totalCards) * 100);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
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
          <h1 className="text-3xl font-bold text-gray-900">Flashcards</h1>
          <p className="text-gray-600">Manage and study your flashcard decks</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/flashcards/create">
              <Plus className="w-4 h-4 mr-2" />
              Create Deck
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search decks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Decks Grid */}
      {filteredDecks.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Play className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No matching decks found' : 'No flashcard decks yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm 
              ? 'Try adjusting your search terms' 
              : 'Create your first flashcard deck to start studying'}
          </p>
          {!searchTerm && (
            <Button asChild>
              <Link href="/flashcards/create">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Deck
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDecks.map((deck) => {
            const dueCards = getDueCardsCount(deck.stats);
            const progress = getProgressPercentage(deck.stats);
            
            return (
              <Card key={deck.id} className="group hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: deck.color }}
                        />
                        <CardTitle className="text-lg line-clamp-1">{deck.name}</CardTitle>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {deck.description || 'No description'}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/flashcards/${deck.id}/edit`}>
                          <Edit className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteDeck(deck.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Total Cards</div>
                      <div className="font-semibold text-lg">
                        {deck.stats?.totalCards || deck._count?.flashcards || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Due Today</div>
                      <div className="font-semibold text-lg text-blue-600">
                        {dueCards}
                      </div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Card Status Badges */}
                  {deck.stats && (
                    <div className="flex flex-wrap gap-1">
                      {deck.stats.newCards > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {deck.stats.newCards} New
                        </Badge>
                      )}
                      {deck.stats.learningCards > 0 && (
                        <Badge variant="outline" className="text-xs text-orange-600">
                          {deck.stats.learningCards} Learning
                        </Badge>
                      )}
                      {deck.stats.reviewCards > 0 && (
                        <Badge variant="outline" className="text-xs text-green-600">
                          {deck.stats.reviewCards} Review
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button asChild className="flex-1" disabled={dueCards === 0}>
                      <Link href={`/flashcards/${deck.id}/study`}>
                        <Play className="w-4 h-4 mr-2" />
                        Study
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/flashcards/${deck.id}/stats`}>
                        <BarChart3 className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
