const { z } = require('zod');

const clientSchema = {
  get: z.object({
    params: z.object({
      id: z.string().uuid('Invalid client ID')
    })
  }),
  create: z.object({
    body: z.object({
      company: z.string().min(1, 'Company name is required'),
      contact_person: z.string().optional(),
      email: z.string().email('Invalid email').optional().or(z.literal('')),
      phone: z.string().optional(),
      industry: z.string().optional(),
      status: z.enum(['Active', 'Inactive']).optional(),
      revenue: z.number().nonnegative().optional()
    })
  }),
  update: z.object({
    params: z.object({
      id: z.string().uuid('Invalid client ID')
    }),
    body: z.object({
      company: z.string().min(1).optional(),
      contact_person: z.string().optional(),
      email: z.string().email().optional().or(z.literal('')),
      phone: z.string().optional(),
      industry: z.string().optional(),
      status: z.enum(['Active', 'Inactive']).optional(),
      revenue: z.number().nonnegative().optional()
    })
  })
};

module.exports = {
  clientSchema
};
