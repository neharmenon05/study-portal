import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Validation schema for creating a material
const createMaterialSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['pdf', 'doc', 'video', 'audio', 'image', 'url', 'other']),
  url: z.string().url().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  color: z.string().optional(),
  folderId: z.string().optional(),
  userId: z.string() // We'll get this from session later
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo-user'; // Temporary until we implement auth
    
    const materials = await prisma.studyMaterial.findMany({
      where: {
        userId: userId
      },
      include: {
        folder: true,
        noteLinks: true,
        _count: {
          select: {
            noteLinks: true,
            sessionLinks: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

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
    const body = await request.json();
    
    // Add demo user ID for now
    const materialData = {
      ...body,
      userId: body.userId || 'demo-user'
    };
    
    const validatedData = createMaterialSchema.parse(materialData);
    
    const material = await prisma.studyMaterial.create({
      data: {
        ...validatedData,
        tags: validatedData.tags || []
      },
      include: {
        folder: true
      }
    });

    return NextResponse.json({ material }, { status: 201 });
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
