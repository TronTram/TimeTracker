import { createClient } from '@supabase/supabase-js';

// Supabase configuration - Optional for enhanced features
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey);
};

// Only create clients if Supabase is configured
let supabaseClient: ReturnType<typeof createClient> | null = null;
let supabaseAdminClient: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseAnonKey) {
  // Client-side Supabase client (for browser usage)
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  // Server-side Supabase client with service role key (for server-side operations)
  if (supabaseServiceRoleKey) {
    supabaseAdminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
      },
    });
  }
}

export const supabase = supabaseClient;
export const supabaseAdmin = supabaseAdminClient;

// File upload function (requires Supabase)
export async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<{ url?: string; error?: string }> {
  if (!supabase) {
    return { error: 'Supabase not configured. File upload requires Supabase.' };
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return { url: urlData.publicUrl };
  } catch (error) {
    console.error('File upload error:', error);
    return { error: error instanceof Error ? error.message : 'Upload failed' };
  }
}

// Delete file function (requires Supabase)
export async function deleteFile(
  bucket: string,
  path: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('File deletion error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Deletion failed' 
    };
  }
}

// Get file URL function (requires Supabase)
export function getFileUrl(bucket: string, path: string): string | null {
  if (!supabase) return null;
  
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// Real-time subscription helper (requires Supabase)
export function subscribeToTable<T = any>(
  table: string,
  callback: (payload: any) => void,
  filter?: string
) {
  if (!supabase) {
    console.warn('Supabase not configured. Real-time subscriptions unavailable.');
    return null;
  }

  const channel = supabase.channel(`${table}_changes`);
  
  if (filter) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table, filter },
      callback
    );
  } else {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      callback
    );
  }

  channel.subscribe();
  
  return channel;
}

// Health check function (requires Supabase)
export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  error?: string;
}> {
  if (!supabase) {
    return { connected: false, error: 'Supabase not configured' };
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error && error.message !== 'JWT expired') throw error;
    return { connected: true };
  } catch (error) {
    console.error('Supabase connection error:', error);
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

// Get database health (requires Supabase)
export async function getDatabaseHealth(): Promise<{
  healthy: boolean;
  latency?: number;
  error?: string;
}> {
  if (!supabase) {
    return { healthy: false, error: 'Supabase not configured' };
  }

  try {
    const start = Date.now();
    const { data, error } = await supabase
      .from('User')
      .select('id')
      .limit(1);
    
    if (error) throw error;
    
    const latency = Date.now() - start;
    return { healthy: true, latency };
  } catch (error) {
    console.error('Database health check error:', error);
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Health check failed',
    };
  }
}
