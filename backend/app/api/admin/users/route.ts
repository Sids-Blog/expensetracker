import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/admin/users - Get all users (admin only)
export const GET = requireAdmin(async (request, user) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('admin_user_list')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ data, success: true });
  } catch (error) {
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
