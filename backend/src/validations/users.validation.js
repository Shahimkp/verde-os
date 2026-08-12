const { z } = require('zod');

const userSchema = {
  getMember: z.object({
    params: z.object({
      id: z.string().uuid('Invalid user ID')
    })
  })
};

module.exports = {
  userSchema
};
