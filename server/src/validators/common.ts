import { z } from 'zod';

// UUID validation
export const uuidSchema = z.string().uuid('Invalid UUID format');

// Pagination schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Date range schema with validation
export const dateRangeSchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine(data => data.endDate >= data.startDate, {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  });

// Standard API error response
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z
      .array(
        z.object({
          field: z.string(),
          message: z.string(),
        })
      )
      .optional(),
  }),
});

// Helper to format Zod errors for API responses
export function formatZodError(error: z.ZodError): {
  code: string;
  message: string;
  details: Array<{ field: string; message: string }>;
} {
  return {
    code: 'VALIDATION_ERROR',
    message: 'Invalid request parameters',
    details: error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
    })),
  };
}
