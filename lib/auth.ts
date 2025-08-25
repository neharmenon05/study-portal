// lib/auth.ts - Authentication utilities
import { NextRequest } from 'next/server';
import { verify } from 'jsonwebtoken';
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
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId, email, role },
    process.env.NEXTAUTH_SECRET || 'fallback-secret',
    { expiresIn: '7d' }
  );
}

export function requireAuth(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    const user = await getUserFromRequest(request);
    
    if (!user || !user.isActive) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return handler(request, { user }, ...args);
  };
}

export function requireRole(roles: string[]) {
  return (handler: Function) => {
    return async (request: NextRequest, context: any, ...args: any[]) => {
      const user = await getUserFromRequest(request);
      
      if (!user || !user.isActive) {
        return Response.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      if (!roles.includes(user.role)) {
        return Response.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }

      return handler(request, { user }, ...args);
    };
  };
}