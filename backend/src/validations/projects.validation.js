const { z } = require('zod');

const projectSchema = {
  get: z.object({
    params: z.object({
      id: z.string().uuid('Invalid project ID')
    })
  }),
  create: z.object({
    body: z.object({
      name: z.string().min(1, 'Project name is required'),
      client_id: z.string().uuid().optional(),
      category: z.string().optional(),
      priority: z.enum(['Low', 'Medium', 'High']).optional(),
      status: z.enum(['Active', 'Completed', 'On Hold']).optional(),
      start_date: z.string(),
      due_date: z.string().optional(),
      budget: z.number().nonnegative().optional(),
      progress: z.number().min(0).max(100).optional(),
      deliverables: z.string().optional(),
      notes: z.string().optional(),
      is_draft: z.boolean().optional()
    })
  }),
  update: z.object({
    params: z.object({
      id: z.string().uuid('Invalid project ID')
    }),
    body: z.object({
      name: z.string().min(1).optional(),
      client_id: z.string().uuid().optional().nullable(),
      category: z.string().optional(),
      priority: z.enum(['Low', 'Medium', 'High']).optional(),
      status: z.enum(['Active', 'Completed', 'On Hold']).optional(),
      start_date: z.string().optional(),
      due_date: z.string().optional().nullable(),
      budget: z.number().nonnegative().optional(),
      progress: z.number().min(0).max(100).optional(),
      deliverables: z.string().optional(),
      notes: z.string().optional(),
      is_archived: z.boolean().optional()
    })
  }),
  addMember: z.object({
    params: z.object({
      id: z.string().uuid('Invalid project ID')
    }),
    body: z.object({
      user_id: z.string().uuid('Invalid user ID'),
      role: z.string().optional(),
      workload: z.string().optional()
    })
  }),
  removeMember: z.object({
    params: z.object({
      id: z.string().uuid('Invalid project ID'),
      userId: z.string().uuid('Invalid user ID')
    })
  })
};

module.exports = {
  projectSchema
};
