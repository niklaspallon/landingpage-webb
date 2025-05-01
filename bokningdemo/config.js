// Load environment variables
const config = {
    supabaseUrl: process.env.SUPABASE_URL || 'https://yqnrorotoloichbdebfa.supabase.co',
    supabaseKey: process.env.SUPABASE_KEY || 'your-fallback-key-for-development'
};

export default config; 