const supabase = require('../config/supabase');

class OrganizationService {
  /**
   * Get all organizations the user has access to.
   * Right now, the app assumes a single organization, but we'll scope it just in case.
   */
  async getOrganization(id) {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  }
}

module.exports = new OrganizationService();
