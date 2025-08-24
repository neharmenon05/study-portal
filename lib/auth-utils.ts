// lib/auth.ts - Authentication utilities
import { NextRequest } from 'next/server';
import { verify } from 'jsonwebtoken';
import { prisma } from '@/lib/db';

interface JWTPayload {
  userId: string;
  email: string;
}

export async function getUserFromRequest(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    const decoded = verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret') as JWTPayload;
    if (!token) {
      return null;
    }

    const decoded = verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret') as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        preferences: true
      }
    });

    return user;
  } catch (error) {
    return null;
  }
}

export function createAuthToken(userId: string, email: string) {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId, email },
    process.env.NEXTAUTH_SECRET || 'fallback-secret',
    { expiresIn: '7d' }
  );
}