import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from './supabase';

export interface AuthUser {
  id: string;
  email: string;
  isAdmin: boolean;
  isActive: boolean;
}

export async function verifyAuth(request: NextRequest): Promise<AuthUser | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }

    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('is_admin, is_active')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.is_active) {
      return null;
    }

    return {
      id: user.id,
      email: user.email!,
      isAdmin: profile.is_admin,
      isActive: profile.is_active
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

export function requireAuth(handler: (request: NextRequest, user: AuthUser) => Promise<Response>) {
  return async (request: NextRequest) => {
    const user = await verifyAuth(request);
    
    if (!user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return handler(request, user);
  };
}

export function requireAdmin(handler: (request: NextRequest, user: AuthUser) => Promise<Response>) {
  return async (request: NextRequest) => {
    const user = await verifyAuth(request);
    
    if (!user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!user.isAdmin) {
      return Response.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    return handler(request, user);
  };
}
