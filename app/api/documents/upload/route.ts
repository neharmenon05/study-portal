// app/api/documents/upload/route.ts - Document upload API
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { saveFile, validateFileType, ALLOWED_FILE_TYPES } from '@/lib/file-storage';
import { z } from 'zod';

const uploadSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['NOTES', 'CODE', 'VIDEO', 'OTHER']).default('OTHER'),
  subjectId: z.string().min(1, 'Subject is required'),
  isShared: z.string().transform(val => val === 'true').default(false),
  allowPeerFeedback: z.string().transform(val => val === 'true').default(true),
  tags: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate form data
    const data = uploadSchema.parse({
      title: formData.get('title'),
      description: formData.get('description'),
      type: formData.get('type'),
      subjectId: formData.get('subjectId'),
      isShared: formData.get('isShared'),
      allowPeerFeedback: formData.get('allowPeerFeedback'),
      tags: formData.get('tags'),
    });

    // Validate file type
    const allAllowedTypes = [
      ...ALLOWED_FILE_TYPES.documents,
      ...ALLOWED_FILE_TYPES.images,
      ...ALLOWED_FILE_TYPES.videos,
      ...ALLOWED_FILE_TYPES.code,
    ];

    if (!validateFileType(file.type, allAllowedTypes)) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      );
    }

    // Verify subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: data.subjectId }
    });

    if (!subject) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }

    // Save file
    const { fileName, filePath, fileSize } = await saveFile(file, 'documents');

    // Create document record
    const document = await prisma.document.create({
      data: {
        title: data.title,
        description: data.description,
        fileName: file.name,
        filePath,
        fileSize: BigInt(fileSize),
        mimeType: file.type,
        type: data.type,
        subjectId: data.subjectId,
        uploaderId: user.id,
        isShared: data.isShared,
        allowPeerFeedback: data.allowPeerFeedback,
      },
      include: {
        subject: true,
        uploader: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    // Create initial version
    await prisma.documentVersion.create({
      data: {
        documentId: document.id,
        version: 1,
        fileName: file.name,
        filePath,
        fileSize: BigInt(fileSize),
        changes: 'Initial upload'
      }
    });

    // Process tags if provided
    if (data.tags) {
      const tagNames = data.tags.split(',').map(tag => tag.trim()).filter(Boolean);
      
      for (const tagName of tagNames) {
        // Create tag if it doesn't exist
        const tag = await prisma.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName }
        });

        // Link tag to document
        await prisma.documentTag.create({
          data: {
            documentId: document.id,
            tagId: tag.id
          }
        });
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'DOCUMENT_UPLOAD',
        resource: 'Document',
        details: {
          documentId: document.id,
          title: document.title,
          type: document.type
        }
      }
    });

    return NextResponse.json({
      message: 'Document uploaded successfully',
      document: {
        ...document,
        fileSize: document.fileSize.toString()
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Upload error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}