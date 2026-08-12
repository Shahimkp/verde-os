const supabase = require('../config/supabase');

class ClientService {
  async getClients(organizationId) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_deleted', false);
    
    if (error) throw error;
    return data;
  }

  async getClient(organizationId, clientId) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', clientId)
      .eq('is_deleted', false)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async createClient(organizationId, clientData) {
    const { data, error } = await supabase
      .from('clients')
      .insert([{ organization_id: organizationId, ...clientData }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateClient(organizationId, clientId, clientData) {
    const { data, error } = await supabase
      .from('clients')
      .update(clientData)
      .eq('organization_id', organizationId)
      .eq('id', clientId)
      .eq('is_deleted', false)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteClient(organizationId, clientId) {
    // Soft delete
    const { error } = await supabase
      .from('clients')
      .update({ is_deleted: true })
      .eq('organization_id', organizationId)
      .eq('id', clientId);

    if (error) throw error;
    return true;
  }
}

module.exports = new ClientService();
