// app/api/documents/[id]/versions/route.ts - Document version control API
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { saveFile } from '@/lib/file-storage';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify document exists and user has access
    const document = await prisma.document.findUnique({
      where: { id: params.id }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const canAccess = 
      document.uploaderId === user.id || 
      document.isShared || 
      user.role === 'TEACHER';

    if (!canAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get all versions
    const versions = await prisma.documentVersion.findMany({
      where: { documentId: params.id },
      orderBy: { version: 'desc' }
    });

    return NextResponse.json({
      versions: versions.map(v => ({
        ...v,
        fileSize: v.fileSize.toString()
      }))
    });

  } catch (error) {
    console.error('Error fetching document versions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document versions' },
      { status: 500 }
    );
  }
}

export async function POST(
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
      where: { id: params.id },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1
        }
      }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.uploaderId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const changes = formData.get('changes') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Save new file version
    const { fileName, filePath, fileSize } = await saveFile(file, 'documents');

    // Get next version number
    const latestVersion = document.versions[0];
    const nextVersion = latestVersion ? latestVersion.version + 1 : 1;

    // Create new version record
    const newVersion = await prisma.documentVersion.create({
      data: {
        documentId: params.id,
        version: nextVersion,
        fileName: file.name,
        filePath,
        fileSize: BigInt(fileSize),
        changes: changes || `Version ${nextVersion}`
      }
    });

    // Update main document with latest version info
    await prisma.document.update({
      where: { id: params.id },
      data: {
        fileName: file.name,
        filePath,
        fileSize: BigInt(fileSize),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      message: 'New version uploaded successfully',
      version: {
        ...newVersion,
        fileSize: newVersion.fileSize.toString()
      }
    });

  } catch (error) {
    console.error('Error creating document version:', error);
    return NextResponse.json(
      { error: 'Failed to create document version' },
      { status: 500 }
    );
  }
}