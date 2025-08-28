import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';

const createMaterialSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  type: z.enum(['pdf', 'doc', 'video', 'audio', 'image', 'url', 'other']),
  url: z.string().url().optional().nullable(),
  category: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  color: z.string().optional().nullable(),
  folderId: z.string().optional().nullable()
});

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // For now, return empty array since we don't have studyMaterial table
    // This will be replaced when we implement the full schema
    const materials: any[] = [];
    
    /*
    const materials = await prisma.document.findMany({
      where: {
        uploaderId: user.id
      },
      include: {
        subject: true,
        uploader: {
          select: { id: true, name: true, role: true }
        },
        _count: {
          select: { feedback: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    */

    return NextResponse.json({ materials });
  } catch (error) {
    console.error('Error fetching materials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch materials' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    const validatedData = createMaterialSchema.parse(body);
    
    // For now, return a mock response
    // This will be replaced when we implement the full schema
    const material = {
      id: 'temp-id',
      ...validatedData,
      userId: user.id,
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({ 
      material
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating material:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create material' },
      { status: 500 }
    );
  }
}