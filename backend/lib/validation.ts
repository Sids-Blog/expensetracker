import { z } from 'zod';

// Transaction schemas
export const createTransactionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(['expense', 'income']),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  category: z.string().min(1),
  description: z.string().optional(),
  payment_method: z.string().optional(),
  fully_settled: z.boolean().default(true)
});

export const updateTransactionSchema = createTransactionSchema.partial();

// Category schemas
export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['expense', 'income']),
  order: z.number().int().min(0).default(0)
});

// Payment method schemas
export const createPaymentMethodSchema = z.object({
  name: z.string().min(1).max(100),
  order: z.number().int().min(0).default(0)
});

// User profile schemas
export const updateProfileSchema = z.object({
  full_name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional()
});

// Validation helper
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      };
    }
    return { success: false, error: 'Validation failed' };
  }
}
