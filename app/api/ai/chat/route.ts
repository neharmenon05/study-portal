// app/api/ai/chat/route.ts - AI Chat API
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';

const chatSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  sessionId: z.string().optional(),
  documentId: z.string().optional(),
});

// Mock AI response - In production, integrate with OpenAI, Claude, etc.
async function generateAIResponse(message: string, context?: any): Promise<string> {
  // This is a mock implementation
  // In production, you would integrate with actual AI services
  
  if (message.toLowerCase().includes('summarize') && context?.document) {
    return `Here's a summary of "${context.document.title}":

This document appears to be about ${context.document.subject?.name || 'academic content'}. Based on the document type (${context.document.type}), I can help you understand the key concepts and create a study plan.

Key areas to focus on:
1. Main concepts and definitions
2. Important examples and applications
3. Practice problems and exercises

Would you like me to create a personalized learning plan for this material?`;
  }

  if (message.toLowerCase().includes('learning plan') || message.toLowerCase().includes('study plan')) {
    return `Here's a personalized learning plan:

**Week 1-2: Foundation**
- Review basic concepts
- Complete introductory exercises
- Take notes on key definitions

**Week 3-4: Application**
- Work through practice problems
- Apply concepts to real scenarios
- Create flashcards for memorization

**Week 5-6: Mastery**
- Complete advanced exercises
- Teach concepts to others
- Take practice tests

**Study Tips:**
- Study in 25-minute focused sessions
- Review material within 24 hours
- Practice active recall techniques

Would you like me to adjust this plan based on your specific needs?`;
  }

  // Default responses for common queries
  const responses = [
    "I can help you understand this material better. What specific topic would you like to explore?",
    "Based on your question, I recommend breaking this down into smaller concepts. Which part would you like to start with?",
    "That's a great question! Let me help you work through this step by step.",
    "I can provide more context on this topic. Would you like me to explain the fundamentals first?",
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, sessionId, documentId } = chatSchema.parse(body);

    let session;
    let context: any = {};

    // Get or create chat session
    if (sessionId) {
      session = await prisma.aIChatSession.findUnique({
        where: { id: sessionId, userId: user.id }
      });
      
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
    } else {
      // Create new session
      session = await prisma.aIChatSession.create({
        data: {
          userId: user.id,
          title: message.slice(0, 50) + (message.length > 50 ? '...' : '')
        }
      });
    }

    // Get document context if provided
    if (documentId) {
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
          subject: true,
          uploader: {
            select: { name: true }
          }
        }
      });

      if (document) {
        const canAccess = 
          document.uploaderId === user.id || 
          document.isShared || 
          user.role === 'TEACHER';

        if (canAccess) {
          context.document = document;
        }
      }
    }

    // Save user message
    await prisma.aIChatMessage.create({
      data: {
        sessionId: session.id,
        role: 'user',
        content: message
      }
    });

    // Generate AI response
    const aiResponse = await generateAIResponse(message, context);

    // Save AI response
    await prisma.aIChatMessage.create({
      data: {
        sessionId: session.id,
        role: 'assistant',
        content: aiResponse
      }
    });

    // Get recent messages for context
    const messages = await prisma.aIChatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
      take: 20 // Last 20 messages
    });

    return NextResponse.json({
      sessionId: session.id,
      response: aiResponse,
      messages
    });

  } catch (error) {
    console.error('Error in AI chat:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      // Get specific session messages
      const session = await prisma.aIChatSession.findUnique({
        where: { id: sessionId, userId: user.id },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      return NextResponse.json({ session });
    } else {
      // Get all user sessions
      const sessions = await prisma.aIChatSession.findMany({
        where: { userId: user.id },
        include: {
          _count: {
            select: { messages: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 20
      });

      return NextResponse.json({ sessions });
    }

  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat sessions' },
      { status: 500 }
    );
  }
}