const { z } = require('zod');

const organizationSchema = {
  getOrg: z.object({
    params: z.object({
      id: z.string().uuid('Invalid organization ID')
    })
  })
};

module.exports = {
  organizationSchema
};
