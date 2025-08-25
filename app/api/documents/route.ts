// app/api/documents/route.ts - Document management API
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';

const documentQuerySchema = z.object({
  type: z.enum(['NOTES', 'CODE', 'VIDEO', 'OTHER']).optional(),
  subject: z.string().optional(),
  shared: z.string().transform(val => val === 'true').optional(),
  search: z.string().optional(),
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => Math.min(parseInt(val) || 20, 100)).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = documentQuerySchema.parse(Object.fromEntries(searchParams));

    const where: any = {};

    // Filter by type
    if (query.type) {
      where.type = query.type;
    }

    // Filter by subject
    if (query.subject) {
      where.subjectId = query.subject;
    }

    // Filter by shared status
    if (query.shared !== undefined) {
      where.isShared = query.shared;
    }

    // Search functionality
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Role-based filtering
    if (user.role === 'STUDENT') {
      where.OR = [
        { uploaderId: user.id }, // Own documents
        { isShared: true }, // Shared documents
      ];
    }

    const skip = ((query.page || 1) - 1) * (query.limit || 20);

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          subject: true,
          uploader: {
            select: { id: true, name: true, role: true }
          },
          tags: {
            include: { tag: true }
          },
          _count: {
            select: { feedback: true, versions: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit || 20,
      }),
      prisma.document.count({ where })
    ]);

    // Convert BigInt to string for JSON serialization
    const documentsWithStringFileSize = documents.map(doc => ({
      ...doc,
      fileSize: doc.fileSize.toString()
    }));

    return NextResponse.json({
      documents: documentsWithStringFileSize,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 20,
        total,
        pages: Math.ceil(total / (query.limit || 20))
      }
    });

  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}