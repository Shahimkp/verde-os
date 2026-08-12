const supabase = require('../config/supabase');

const checkHealth = (req, res) => {
  res.status(200).json({
    success: true,
    service: "Verde OS API",
    status: "healthy"
  });
};

const checkDbHealth = async (req, res, next) => {
  try {
    // Verify connection by making a harmless request using the service role client
    // We limit it to 1 just to test connectivity without pulling excessive data
    const { data, error } = await supabase.from('_non_existent_table_').select('*').limit(1);
    
    // We expect a PGRST205 (or 42P01) undefined_table error if connection is successful
    if (error && error.code !== 'PGRST205' && error.code !== '42P01') {
      throw error;
    }

    res.status(200).json({
      success: true,
      service: "Verde OS API",
      database: "connected"
    });
  } catch (err) {
    // Return a safe generic error response
    res.status(500).json({
      success: false,
      service: "Verde OS API",
      database: "disconnected",
      message: process.env.NODE_ENV === 'production' ? 'Database connection failed' : err.message
    });
  }
};

module.exports = {
  checkHealth,
  checkDbHealth
};
