import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { saveFile, validateFileType, ALLOWED_FILE_TYPES } from '@/lib/file-storage';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const tags = formData.get('tags') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allAllowedTypes = [
      ...ALLOWED_FILE_TYPES.documents,
      ...ALLOWED_FILE_TYPES.images,
      ...ALLOWED_FILE_TYPES.videos,
    ];

    if (!validateFileType(file.type, allAllowedTypes)) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      );
    }

    // Save file
    const { fileName, filePath, fileSize } = await saveFile(file, 'materials');

    // For now, return mock response since we don't have the full schema yet
    const material = {
      id: 'temp-material-id',
      title: title || file.name,
      description: description || null,
      fileName: file.name,
      filePath,
      fileSize: fileSize.toString(),
      mimeType: file.type,
      category: category || null,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      userId: user.id,
      url: `/api/files/${filePath}`,
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({
      message: 'File uploaded successfully',
      material
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}