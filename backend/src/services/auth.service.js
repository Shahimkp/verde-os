const supabase = require('../config/supabase');

class AuthService {
  async login(email, password) {
    // We use the service_role client. Wait, the service_role client bypasses RLS, but for Auth operations
    // signInWithPassword acts as a client.
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) throw authError;

    const session = authData.session;
    const user = authData.user;

    const identity = await this.resolveIdentity(user.id);
    if (!identity) {
      throw { code: 'FORBIDDEN', message: 'User does not belong to any organization.' };
    }

    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      ...identity
    };
  }

  async logout(token) {
    // Logout is primarily completed client-side by discarding the session.
    // Access tokens remain governed by Supabase's expiration and revocation semantics.
    // The current service-role client does not perform stateful JWT blacklisting.
    return { success: true, message: 'Logged out successfully' };
  }

  async resolveIdentity(userId) {
    // 1. Load public.users record
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      throw { code: 'DATABASE_ERROR', message: 'Failed to load user record' };
    }

    // 2. Load organization_members to resolve org, role, and department
    const { data: orgMembers, error: orgError } = await supabase
      .from('organization_members')
      .select('organization_id, role_id, department, roles(name), organizations(name, id)')
      .eq('user_id', userId)
      .eq('status', 'Active');

    if (orgError) throw orgError;
    if (!orgMembers || orgMembers.length === 0) return null;

    // We select the first active organization for now
    const activeMembership = orgMembers[0];
    const organization = activeMembership.organizations;
    const role = activeMembership.roles.name;

    // 3. Resolve permissions
    // role_permissions
    const { data: rolePerms } = await supabase
      .from('role_permissions')
      .select('permissions(name)')
      .eq('role_id', activeMembership.role_id);
    
    // user_permissions
    const { data: userPerms } = await supabase
      .from('user_permissions')
      .select('permissions(name), is_granted')
      .eq('user_id', userId)
      .eq('organization_id', organization.id);

    const permissionSet = new Set();
    
    if (rolePerms) {
      rolePerms.forEach(rp => {
        if (rp.permissions) permissionSet.add(rp.permissions.name);
      });
    }

    if (userPerms) {
      userPerms.forEach(up => {
        if (up.permissions) {
          if (up.is_granted) {
            permissionSet.add(up.permissions.name);
          } else {
            permissionSet.delete(up.permissions.name);
          }
        }
      });
    }

    return {
      user: {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        initials: userRecord.initials,
        avatar_bg: userRecord.avatar_bg
      },
      organization: {
        id: organization.id,
        name: organization.name
      },
      role,
      permissions: Array.from(permissionSet)
    };
  }
}

module.exports = new AuthService();
