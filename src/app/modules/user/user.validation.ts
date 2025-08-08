import { z } from 'zod';

const createUserValidationSchema = z.object({
  body: z.object({
    username: z
      .string({
        required_error: 'Username is required',
      })
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username cannot exceed 30 characters'),
    password: z
      .string({
        required_error: 'Password is required',
      })
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/,
        'Password must contain at least one number and one special character'
      ),
    shops: z
      .array(z.string().min(1, 'Shop name cannot be empty'))
      .min(3, 'You must provide at least 3 shop names')
      .max(4, 'You cannot provide more than 4 shop names')
      .refine((shops) => {
        const uniqueShops = new Set(
          shops.map((shop) => shop.toLowerCase().trim())
        );
        return uniqueShops.size === shops.length;
      }, 'Shop names must be unique'),
  }),
});

const loginUserValidationSchema = z.object({
  body: z.object({
    username: z.string({
      required_error: 'Username is required',
    }),
    password: z.string({
      required_error: 'Password is required',
    }),
    rememberMe: z.boolean().optional(),
  }),
});

export const UserValidation = {
  createUserValidationSchema,
  loginUserValidationSchema,
};
