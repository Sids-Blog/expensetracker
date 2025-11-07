import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { updateTransactionSchema, validateRequest } from '@/lib/validation';

// GET /api/transactions/[id] - Get single transaction
export const GET = requireAuth(async (request, user) => {
  try {
    const id = request.url.split('/').pop();

    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      return Response.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return Response.json({ data, success: true });
  } catch (error) {
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// PATCH /api/transactions/[id] - Update transaction
export const PATCH = requireAuth(async (request, user) => {
  try {
    const id = request.url.split('/').pop();
    const body = await request.json();
    
    const validation = validateRequest(updateTransactionSchema, body);
    if (!validation.success) {
      return Response.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from('transactions')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return Response.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from('transactions')
      .update(validation.data)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

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

// DELETE /api/transactions/[id] - Delete transaction
export const DELETE = requireAuth(async (request, user) => {
  try {
    const id = request.url.split('/').pop();

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from('transactions')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return Response.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

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
