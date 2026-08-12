const supabase = require('../config/supabase');

class ProjectService {
  async getProjects(organizationId, userRole, userId) {
    let query = supabase
      .from('projects')
      .select('*, project_members!inner(user_id, role)')
      .eq('organization_id', organizationId)
      .eq('is_deleted', false);
    
    // Members only see projects they are assigned to
    if (userRole !== 'Admin' && userRole !== 'SuperAdmin') {
      query = query.eq('project_members.user_id', userId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async getProject(organizationId, projectId, userRole, userId) {
    let query = supabase
      .from('projects')
      .select('*, project_members(user_id, role, users(name))')
      .eq('organization_id', organizationId)
      .eq('id', projectId)
      .eq('is_deleted', false);

    const { data, error } = await query.single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    if (userRole !== 'Admin' && userRole !== 'SuperAdmin') {
      const isMember = data.project_members.some(m => m.user_id === userId);
      if (!isMember) return null; // Act as if not found if not permitted
    }

    return data;
  }

  async createProject(organizationId, projectData) {
    const { data, error } = await supabase
      .from('projects')
      .insert([{ organization_id: organizationId, ...projectData }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateProject(organizationId, projectId, projectData) {
    const { data, error } = await supabase
      .from('projects')
      .update(projectData)
      .eq('organization_id', organizationId)
      .eq('id', projectId)
      .eq('is_deleted', false)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteProject(organizationId, projectId) {
    const { error } = await supabase
      .from('projects')
      .update({ is_deleted: true })
      .eq('organization_id', organizationId)
      .eq('id', projectId);

    if (error) throw error;
    return true;
  }

  async getProjectMembers(organizationId, projectId) {
    const { data, error } = await supabase
      .from('project_members')
      .select('*, users(name, email)')
      .eq('organization_id', organizationId)
      .eq('project_id', projectId);

    if (error) throw error;
    return data;
  }

  async addProjectMember(organizationId, projectId, memberData) {
    const { data, error } = await supabase
      .from('project_members')
      .insert([{ organization_id: organizationId, project_id: projectId, ...memberData }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async removeProjectMember(organizationId, projectId, userId) {
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('organization_id', organizationId)
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  }
}

module.exports = new ProjectService();
