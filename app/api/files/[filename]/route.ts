// app/api/files/[filename]/route.ts - Secure file serving
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getFile } from '@/lib/file-storage';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { filename } = params;
    
    // Find document by file path
    const document = await prisma.document.findFirst({
      where: {
        OR: [
          { filePath: filename },
          { filePath: { endsWith: filename } }
        ]
      },
      include: {
        uploader: true
      }
    });

    if (!document) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check access permissions
    const canAccess = 
      document.uploaderId === user.id || // Owner
      document.isShared || // Shared document
      user.role === 'TEACHER'; // Teachers can access all

    if (!canAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get file from storage
    const fileBuffer = await getFile(document.filePath);
    if (!fileBuffer) {
      return NextResponse.json({ error: 'File not found in storage' }, { status: 404 });
    }

    // Increment download count if not the owner
    if (document.uploaderId !== user.id) {
      await prisma.document.update({
        where: { id: document.id },
        data: { downloadCount: { increment: 1 } }
      });
    }

    // Log access
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'FILE_DOWNLOAD',
        resource: 'Document',
        details: {
          documentId: document.id,
          fileName: document.fileName
        }
      }
    });

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': document.mimeType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${document.fileName}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });

  } catch (error) {
    console.error('File serve error:', error);
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    );
  }
}