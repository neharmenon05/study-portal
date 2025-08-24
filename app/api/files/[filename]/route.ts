import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../lib/auth-utils';
import path from 'path';
import { UPLOAD_DIR } from '../../../config';
import { existsSync } from 'fs';

// app/api/files/[filename]/route.ts - Serve uploaded files
export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { filename } = params;
    const filePath = path.join(UPLOAD_DIR, filename);
    // Check if file exists and user has access
    const prismaModule = await import('../../../lib/prisma');
    const prisma = prismaModule.prisma || prismaModule.default || prismaModule;
    const material = await prisma.studyMaterial.findFirst({
      where: {
        filePath: filename,
        userId: user.id,
      }
    });

    if (!material || !existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Read and serve file
    const { readFile } = await import('fs/promises');
    const buffer = await readFile(filePath);

    // Convert Node Buffer to ArrayBuffer to satisfy BodyInit type
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    );

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': material.mimeType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${material.fileName}"`,
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