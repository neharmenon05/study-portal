// Updated app/api/materials/route.ts - with authentication
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/auth-utils';

const createMaterialSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  type: z.enum(['pdf', 'doc', 'video', 'audio', 'image', 'url', 'other']),
  url: z.string().url().optional().nullable(),
  category: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  color: z.string().optional().nullable(),
  folderId: z.string().optional().nullable(),
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
    
    const materials = await prisma.studyMaterial.findMany({
      where: {
        userId: user.id
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

    // Convert BigInt to string for JSON serialization
    const materialsWithStringFileSize = materials.map(material => ({
      ...material,
      fileSize: material.fileSize ? material.fileSize.toString() : null
    }));

    return NextResponse.json({ materials: materialsWithStringFileSize });
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
    const materialData = {
      ...body,
      userId: user.id
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

    return NextResponse.json({ 
      material: {
        ...material,
        fileSize: material.fileSize ? material.fileSize.toString() : null
      }
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