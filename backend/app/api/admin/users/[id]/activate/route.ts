import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// POST /api/admin/users/[id]/activate - Activate user (admin only)
export const POST = requireAdmin(async (request, user) => {
  try {
    const id = request.url.split('/').slice(-2)[0];

    // Prevent self-deactivation
    if (id === user.id) {
      return Response.json(
        { error: 'Cannot modify your own account' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.rpc('activate_user', {
      target_user_id: id
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
