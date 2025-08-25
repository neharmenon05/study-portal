'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ChatBubbleLeftIcon,
  PaperAirplaneIcon,
  DocumentTextIcon,
  SparklesIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
  _count: {
    messages: number;
  };
}

interface Document {
  id: string;
  title: string;
  subject: {
    name: string;
    color: string;
  };
}

export default function AIChatPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const documentId = searchParams.get('documentId');
  
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [document, setDocument] = useState<Document | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSessions();
    if (documentId) {
      fetchDocument();
    }
  }, [documentId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/ai/chat', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const fetchDocument = async () => {
    if (!documentId) return;

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setDocument(data.document);
      }
    } catch (error) {
      console.error('Error fetching document:', error);
    }
  };

  const loadSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/ai/chat?sessionId=${sessionId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.session.messages || []);
        setCurrentSession(sessionId);
      }
    } catch (error) {
      console.error('Error loading session:', error);
      toast.error('Failed to load chat session');
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setLoading(true);

    // Add user message to UI immediately
    const tempUserMessage: ChatMessage = {
      id: 'temp-user',
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: userMessage,
          sessionId: currentSession,
          documentId: documentId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      // Update with actual messages from server
      setMessages(data.messages || []);
      setCurrentSession(data.sessionId);
      
      // Refresh sessions list
      fetchSessions();

    } catch (error) {
      console.error('Chat error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
      
      // Remove the temporary message on error
      setMessages(prev => prev.filter(msg => msg.id !== 'temp-user'));
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setCurrentSession(null);
    setMessages([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedPrompts = [
    "Summarize this document for me",
    "Create a study plan based on this material",
    "What are the key concepts I should focus on?",
    "Generate practice questions from this content",
    "Explain the most difficult parts in simple terms"
  ];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)]">
        {/* Sidebar - Chat Sessions */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <ChatBubbleLeftIcon className="h-5 w-5 mr-2" />
                  Chat History
                </CardTitle>
                <Button onClick={startNewChat} size="sm">
                  New Chat
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {sessions.length > 0 ? (
                  <div className="space-y-1 p-4">
                    {sessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => loadSession(session.id)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          currentSession === session.id
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <h4 className="font-medium text-sm truncate">
                          {session.title}
                        </h4>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500">
                            {session._count.messages} messages
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(session.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    <ChatBubbleLeftIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No chat history yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Chat Area */}
        <div className="lg:col-span-3 flex flex-col">
          {/* Header */}
          <Card className="mb-4">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <SparklesIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>AI Study Assistant</CardTitle>
                    <CardDescription>
                      Get help with your studies, summaries, and learning plans
                    </CardDescription>
                  </div>
                </div>
                {document && (
                  <Badge 
                    variant="secondary" 
                    style={{ backgroundColor: `${document.subject.color}20`, color: document.subject.color }}
                  >
                    <DocumentTextIcon className="h-4 w-4 mr-1" />
                    {document.title}
                  </Badge>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Messages */}
          <Card className="flex-1 flex flex-col">
            <CardContent className="flex-1 flex flex-col p-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <SparklesIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Welcome to your AI Study Assistant!
                    </h3>
                    <p className="text-gray-600 mb-6">
                      I can help you understand documents, create study plans, and answer questions about your materials.
                    </p>
                    
                    {document && (
                      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800 mb-2">
                          I'm ready to help you with: <strong>{document.title}</strong>
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Try asking:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {suggestedPrompts.map((prompt, index) => (
                          <button
                            key={index}
                            onClick={() => setInputMessage(prompt)}
                            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-start space-x-3 max-w-3xl ${
                          message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                        }`}>
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            {message.role === 'user' ? (
                              <AvatarImage src={user?.avatar} />
                            ) : (
                              <div className="h-8 w-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                <SparklesIcon className="h-4 w-4 text-white" />
                              </div>
                            )}
                            <AvatarFallback>
                              {message.role === 'user' ? user?.name?.charAt(0) : 'AI'}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className={`rounded-lg px-4 py-2 ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            <div className="whitespace-pre-wrap">{message.content}</div>
                            <div className={`text-xs mt-1 ${
                              message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {new Date(message.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {loading && (
                      <div className="flex justify-start">
                        <div className="flex items-start space-x-3 max-w-3xl">
                          <Avatar className="h-8 w-8">
                            <div className="h-8 w-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                              <SparklesIcon className="h-4 w-4 text-white" />
                            </div>
                          </Avatar>
                          <div className="bg-gray-100 rounded-lg px-4 py-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about your studies..."
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={loading || !inputMessage.trim()}
                  >
                    <PaperAirplaneIcon className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}