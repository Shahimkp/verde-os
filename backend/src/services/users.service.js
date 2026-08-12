const supabase = require('../config/supabase');

class UserService {
  async getMembers(organizationId) {
    // Join organization_members with users, roles, and user_permissions
    // Since Supabase service_role bypasses RLS, we just filter by orgId.
    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        *,
        users ( id, name, email, avatar_bg, initials, is_active, created_at ),
        roles ( id, name ),
        user_permissions ( permission_id, is_granted, permissions (name) )
      `)
      .eq('organization_id', organizationId);

    if (error) throw error;
    return data;
  }

  async getMember(organizationId, userId) {
    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        *,
        users ( id, name, email, avatar_bg, initials, is_active, created_at ),
        roles ( id, name ),
        user_permissions ( permission_id, is_granted, permissions (name) )
      `)
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }
}

module.exports = new UserService();
