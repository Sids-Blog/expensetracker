import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { createTransactionSchema, validateRequest } from '@/lib/validation';

// GET /api/transactions - Get user's transactions
export const GET = requireAuth(async (request, user) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

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

// POST /api/transactions - Create transaction
export const POST = requireAuth(async (request, user) => {
  try {
    const body = await request.json();
    const validation = validateRequest(createTransactionSchema, body);

    if (!validation.success) {
      return Response.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('transactions')
      .insert([{
        ...validation.data,
        user_id: user.id
      }])
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ data, success: true }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
