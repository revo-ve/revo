// ============================================
// REVO — Validation Schemas (Zod)
// Shared between frontend forms and backend validation
// ============================================

import { z } from 'zod';

// ---- Auth ----

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

export const registerTenantSchema = z.object({
  tenantName: z.string().min(2, 'Nombre del negocio requerido').max(100),
  ownerName: z.string().min(2, 'Tu nombre es requerido').max(100),
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe tener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe tener al menos un número'),
  phone: z.string().optional(),
});

// ---- Menu ----

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const createProductSchema = z.object({
  categoryId: z.string().cuid('Categoría inválida'),
  name: z.string().min(1, 'Nombre requerido').max(200),
  description: z.string().max(1000).optional(),
  price: z.number().positive('El precio debe ser mayor a 0'),
  priceUsd: z.number().positive().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateProductSchema = createProductSchema.partial().extend({
  isAvailable: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// ---- Tables ----

export const createZoneSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(50),
  sortOrder: z.number().int().min(0).optional(),
});

export const createTableSchema = z.object({
  zoneId: z.string().cuid().optional(),
  number: z.string().min(1, 'Número de mesa requerido').max(10),
  capacity: z.number().int().min(1).max(50).optional(),
});

// ---- Orders ----

export const createOrderItemSchema = z.object({
  productId: z.string().cuid('Producto inválido'),
  quantity: z.number().int().min(1, 'Mínimo 1 unidad'),
  modifiers: z
    .array(z.object({ modifierId: z.string().cuid() }))
    .optional(),
  notes: z.string().max(200).optional(),
});

export const createOrderSchema = z.object({
  tableId: z.string().cuid().optional(),
  type: z.enum(['DINE_IN', 'TAKEOUT', 'DELIVERY']),
  notes: z.string().max(500).optional(),
  items: z.array(createOrderItemSchema).min(1, 'Agrega al menos un producto'),
});

export const payOrderSchema = z.object({
  paymentMethod: z.enum([
    'CASH_VES',
    'CASH_USD',
    'PAGO_MOVIL',
    'ZELLE',
    'TRANSFER',
    'POINT_OF_SALE',
    'MIXED',
  ]),
  payments: z
    .array(
      z.object({
        method: z.enum([
          'CASH_VES',
          'CASH_USD',
          'PAGO_MOVIL',
          'ZELLE',
          'TRANSFER',
          'POINT_OF_SALE',
        ]),
        amount: z.number().positive(),
      }),
    )
    .optional(),
});

// ---- Type inference helpers ----

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterTenantInput = z.infer<typeof registerTenantSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateZoneInput = z.infer<typeof createZoneSchema>;
export type CreateTableInput = z.infer<typeof createTableSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CreateOrderItemInput = z.infer<typeof createOrderItemSchema>;
export type PayOrderInput = z.infer<typeof payOrderSchema>;
