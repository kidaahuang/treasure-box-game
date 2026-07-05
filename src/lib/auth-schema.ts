import { z } from 'zod';

export const credentialsSchema = z.object({
  username: z
    .string()
    .min(3, 'At least 3 characters')
    .max(20, 'At most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores'),
  password: z.string().min(8, 'At least 8 characters').max(72, 'At most 72 characters'),
});

export type CredentialsInput = z.infer<typeof credentialsSchema>;
