// app/api/subjects/route.ts - Subject management API
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';

const subjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required'),
  code: z.string().min(1, 'Subject code is required'),
  description: z.string().optional(),
  color: z.string().default('#3b82f6'),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subjects = await prisma.subject.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            documents: true,
            classes: true,
            assignments: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ subjects });

  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subjects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = subjectSchema.parse(body);

    // Check if subject code already exists
    const existingSubject = await prisma.subject.findUnique({
      where: { code: data.code }
    });

    if (existingSubject) {
      return NextResponse.json(
        { error: 'Subject code already exists' },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.create({
      data,
      include: {
        _count: {
          select: {
            documents: true,
            classes: true,
            assignments: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Subject created successfully',
      subject
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating subject:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create subject' },
      { status: 500 }
    );
  }
}