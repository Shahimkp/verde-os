const { z } = require('zod');

const taskSchema = {
  get: z.object({
    params: z.object({
      id: z.string().uuid('Invalid task ID')
    })
  }),
  create: z.object({
    body: z.object({
      title: z.string().min(1, 'Task title is required'),
      description: z.string().optional(),
      project_id: z.string().uuid().optional().nullable(),
      assignee_id: z.string().uuid().optional().nullable(),
      status: z.string().optional(), // 'To Do', 'In Progress', 'Completed'
      priority: z.string().optional(), // 'Low', 'Medium', 'High'
      due_date: z.string().optional().nullable(),
      estimated_hours: z.number().min(0).optional(),
      recurrence: z.string().optional(),
      reminder: z.string().optional()
    })
  }),
  update: z.object({
    params: z.object({
      id: z.string().uuid('Invalid task ID')
    }),
    body: z.object({
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      project_id: z.string().uuid().optional().nullable(),
      assignee_id: z.string().uuid().optional().nullable(),
      status: z.string().optional(),
      priority: z.string().optional(),
      due_date: z.string().optional().nullable(),
      estimated_hours: z.number().min(0).optional(),
      recurrence: z.string().optional(),
      reminder: z.string().optional()
    })
  })
};

module.exports = {
  taskSchema
};
