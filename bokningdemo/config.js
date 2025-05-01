const getEnvVariable = (key) => {
    // For demo purposes, we'll use window.__env if available (can be set by hosting platform)
    if (typeof window !== 'undefined' && window.__env && window.__env[key]) {
        return window.__env[key];
    }
    
    // If running in Node.js environment
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
        return process.env[key];
    }
    
    console.warn(`Environment variable ${key} not found. Please check your .env file.`);
    return '';
};

const config = {
    supabaseUrl: getEnvVariable('SUPABASE_URL'),
    supabaseKey: getEnvVariable('SUPABASE_KEY')
};

export default config; 