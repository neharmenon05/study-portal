// lib/auth.ts - Authentication utilities
import { NextRequest } from 'next/server';
import { verify, sign } from 'jsonwebtoken';
import { prisma } from '@/lib/db';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export async function getUserFromRequest(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return null;
    }

    const decoded = verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret') as JWTPayload;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        bio: true,
        isActive: true,
        lastLogin: true,
        createdAt: true
      }
    });

    return user;
  } catch (error) {
    return null;
  }
}

export function createAuthToken(userId: string, email: string, role: string) {
  return sign(
    { userId, email, role },
    process.env.NEXTAUTH_SECRET || 'fallback-secret',
    { expiresIn: '7d' }
  );
}

export async function validateAuth(request: NextRequest) {
  const user = await getUserFromRequest(request);
  
  if (!user || !user.isActive) {
    return { user: null, error: 'Unauthorized' };
  }
  
  return { user, error: null };
}