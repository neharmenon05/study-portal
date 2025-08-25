// lib/file-storage.ts - File storage utilities
import { writeFile, mkdir, readFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '52428800'); // 50MB default

export async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9]/g, '_');
  return `${timestamp}_${random}_${baseName}${ext}`;
}

export async function saveFile(file: File, subFolder?: string): Promise<{
  fileName: string;
  filePath: string;
  fileSize: number;
}> {
  await ensureUploadDir();
  
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  const fileName = generateFileName(file.name);
  const uploadPath = subFolder ? path.join(UPLOAD_DIR, subFolder) : UPLOAD_DIR;
  
  if (!existsSync(uploadPath)) {
    await mkdir(uploadPath, { recursive: true });
  }
  
  const filePath = path.join(uploadPath, fileName);
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  await writeFile(filePath, buffer);
  
  return {
    fileName,
    filePath: subFolder ? path.join(subFolder, fileName) : fileName,
    fileSize: file.size
  };
}

export async function deleteFile(filePath: string): Promise<void> {
  const fullPath = path.join(UPLOAD_DIR, filePath);
  if (existsSync(fullPath)) {
    await unlink(fullPath);
  }
}

export async function getFile(filePath: string): Promise<Buffer | null> {
  try {
    const fullPath = path.join(UPLOAD_DIR, filePath);
    if (!existsSync(fullPath)) {
      return null;
    }
    return await readFile(fullPath);
  } catch (error) {
    return null;
  }
}

export function getFileUrl(filePath: string): string {
  return `/api/files/${encodeURIComponent(filePath)}`;
}

export function validateFileType(mimeType: string, allowedTypes: string[]): boolean {
  return allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      return mimeType.startsWith(type.slice(0, -1));
    }
    return mimeType === type;
  });
}

export const ALLOWED_FILE_TYPES = {
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown'
  ],
  images: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ],
  videos: [
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/wmv'
  ],
  code: [
    'text/plain',
    'application/javascript',
    'text/html',
    'text/css',
    'application/json'
  ]
};