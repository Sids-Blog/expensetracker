import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { createCategorySchema, validateRequest } from '@/lib/validation';

// GET /api/categories - Get user's categories
export const GET = requireAuth(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const { data, error } = await supabaseAdmin.rpc('get_user_categories', {
      p_user_id: user.id,
      p_type: type
    });

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

// POST /api/categories - Create or opt-in to category
export const POST = requireAuth(async (request, user) => {
  try {
    const body = await request.json();
    const validation = validateRequest(createCategorySchema, body);

    if (!validation.success) {
      return Response.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    console.log('Creating/opting into category:', {
      user_id: user.id,
      name: validation.data.name,
      type: validation.data.type
    });

    // Use the create_or_opt_in function
    const { data, error } = await supabaseAdmin.rpc('create_or_opt_in_category', {
      p_user_id: user.id,
      p_name: validation.data.name,
      p_type: validation.data.type,
      p_order: validation.data.order || 0
    });

    if (error) {
      console.error('Error creating/opting into category:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    console.log('Category result:', data);

    // data is an array, get first item
    const category = Array.isArray(data) ? data[0] : data;

    if (!category) {
      return Response.json({ 
        error: 'Failed to create or opt into category' 
      }, { status: 500 });
    }

    return Response.json({ 
      data: category, 
      success: true,
      message: category.is_new ? 'Category created' : 'Opted into existing category'
    }, { status: 201 });
  } catch (error) {
    console.error('Exception in POST /api/categories:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
});
