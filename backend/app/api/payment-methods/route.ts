import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { createPaymentMethodSchema, validateRequest } from '@/lib/validation';

// GET /api/payment-methods - Get user's payment methods
export const GET = requireAuth(async (request, user) => {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_user_payment_methods', {
      p_user_id: user.id
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

// POST /api/payment-methods - Create or opt-in to payment method
export const POST = requireAuth(async (request, user) => {
  try {
    const body = await request.json();
    const validation = validateRequest(createPaymentMethodSchema, body);

    if (!validation.success) {
      return Response.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    console.log('Creating/opting into payment method:', {
      user_id: user.id,
      name: validation.data.name
    });

    // Use the create_or_opt_in function
    const { data, error } = await supabaseAdmin.rpc('create_or_opt_in_payment_method', {
      p_user_id: user.id,
      p_name: validation.data.name,
      p_order: validation.data.order || 0
    });

    if (error) {
      console.error('Error creating/opting into payment method:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    console.log('Payment method result:', data);

    // data is an array, get first item
    const paymentMethod = Array.isArray(data) ? data[0] : data;

    if (!paymentMethod) {
      return Response.json({ 
        error: 'Failed to create or opt into payment method' 
      }, { status: 500 });
    }

    return Response.json({ 
      data: paymentMethod, 
      success: true,
      message: paymentMethod.is_new ? 'Payment method created' : 'Opted into existing payment method'
    }, { status: 201 });
  } catch (error) {
    console.error('Exception in POST /api/payment-methods:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
});
