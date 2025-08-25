// app/api/documents/[id]/route.ts - Individual document API
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const document = await prisma.document.findUnique({
      where: { id: params.id },
      include: {
        subject: true,
        uploader: {
          select: { id: true, name: true, role: true, avatar: true }
        },
        tags: {
          include: { tag: true }
        },
        versions: {
          orderBy: { version: 'desc' },
          take: 5
        },
        feedback: {
          include: {
            author: {
              select: { id: true, name: true, role: true, avatar: true }
            },
            teacher: {
              select: { id: true, name: true, avatar: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { feedback: true, versions: true }
        }
      }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check access permissions
    const canAccess = 
      document.uploaderId === user.id || // Owner
      document.isShared || // Shared document
      user.role === 'TEACHER'; // Teachers can access all

    if (!canAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Increment download count if not the owner
    if (document.uploaderId !== user.id) {
      await prisma.document.update({
        where: { id: params.id },
        data: { downloadCount: { increment: 1 } }
      });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'DOCUMENT_VIEW',
        resource: 'Document',
        details: {
          documentId: document.id,
          title: document.title
        }
      }
    });

    return NextResponse.json({
      document: {
        ...document,
        fileSize: document.fileSize.toString(),
        versions: document.versions.map(v => ({
          ...v,
          fileSize: v.fileSize.toString()
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, isShared, allowPeerFeedback } = body;

    // Check if user owns the document
    const document = await prisma.document.findUnique({
      where: { id: params.id }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.uploaderId !== user.id && user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update document
    const updatedDocument = await prisma.document.update({
      where: { id: params.id },
      data: {
        title,
        description,
        isShared,
        allowPeerFeedback,
        updatedAt: new Date()
      },
      include: {
        subject: true,
        uploader: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    return NextResponse.json({
      message: 'Document updated successfully',
      document: {
        ...updatedDocument,
        fileSize: updatedDocument.fileSize.toString()
      }
    });

  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user owns the document
    const document = await prisma.document.findUnique({
      where: { id: params.id }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.uploaderId !== user.id && user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete document and related records (cascade will handle most)
    await prisma.document.delete({
      where: { id: params.id }
    });

    // TODO: Delete actual file from storage
    // await deleteFile(document.filePath);

    return NextResponse.json({
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}