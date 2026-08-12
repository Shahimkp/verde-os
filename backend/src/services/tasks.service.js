const supabase = require('../config/supabase');

class TaskService {
  async getTasks(organizationId, userRole, userId) {
    let query = supabase
      .from('tasks')
      .select('*, assignee:organization_members!tasks_assignee_id_fkey(user_id, users(name))')
      .eq('organization_id', organizationId)
      .eq('is_deleted', false);
    
    // Members only see their assigned tasks
    if (userRole !== 'Admin' && userRole !== 'SuperAdmin') {
      query = query.eq('assignee_id', userId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async getTask(organizationId, taskId, userRole, userId) {
    let query = supabase
      .from('tasks')
      .select('*, assignee:organization_members!tasks_assignee_id_fkey(user_id, users(name))')
      .eq('organization_id', organizationId)
      .eq('id', taskId)
      .eq('is_deleted', false);

    const { data, error } = await query.single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    // Member assignment check
    if (userRole !== 'Admin' && userRole !== 'SuperAdmin') {
      if (data.assignee_id !== userId) return null; // Hide tasks not assigned to them
    }

    return data;
  }

  async createTask(organizationId, taskData) {
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ organization_id: organizationId, ...taskData }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTask(organizationId, taskId, taskData) {
    const { data, error } = await supabase
      .from('tasks')
      .update(taskData)
      .eq('organization_id', organizationId)
      .eq('id', taskId)
      .eq('is_deleted', false)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTask(organizationId, taskId) {
    const { error } = await supabase
      .from('tasks')
      .update({ is_deleted: true })
      .eq('organization_id', organizationId)
      .eq('id', taskId);

    if (error) throw error;
    return true;
  }
}

module.exports = new TaskService();
