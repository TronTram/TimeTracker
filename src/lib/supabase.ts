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

// Helper functions for Supabase operations
export async function checkSupabaseConnection() {
  if (!supabase) {
    return { status: 'not_configured', timestamp: new Date().toISOString() };
  }
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "relation does not exist"
      throw error;
    }
    
    return { status: 'connected', timestamp: new Date().toISOString() };
  } catch (error) {
    console.error('Supabase connection check failed:', error);
    return {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

// File upload helpers (for future use with avatars, exports, etc.)
export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Buffer,
  options?: {
    cacheControl?: string;
    contentType?: string;
    upsert?: boolean;
  }
) {
  if (!supabaseAdmin) {
    throw new Error('Service role key required for file uploads');
  }

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: options?.cacheControl || '3600',
      contentType: options?.contentType,
      upsert: options?.upsert || false,
    });

  if (error) {
    console.error('File upload failed:', error);
    throw new Error(`File upload failed: ${error.message}`);
  }

  return data;
}

export async function deleteFile(bucket: string, paths: string[]) {
  if (!supabaseAdmin) {
    throw new Error('Service role key required for file deletion');
  }

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .remove(paths);

  if (error) {
    console.error('File deletion failed:', error);
    throw new Error(`File deletion failed: ${error.message}`);
  }

  return data;
}

export function getPublicUrl(bucket: string, path: string) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// Real-time subscription helpers
export function subscribeToTable<T = any>(
  table: string,
  callback: (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: T | null;
    old: T | null;
  }) => void,
  filter?: string
) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }
  
  const channel = supabase.channel(`${table}_changes`);
  
  const subscription = channel
    .on(
      'postgres_changes' as any,
      {
        event: '*',
        schema: 'public',
        table,
        filter,
      },
      (payload: any) => {
        callback({
          eventType: payload.eventType,
          new: payload.new,
          old: payload.old,
        });
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}

// Authentication helpers (for integration with Clerk)
export async function getSupabaseUser() {
  if (!supabase) {
    return null;
  }
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Failed to get Supabase user:', error);
    return null;
  }
  
  return user;
}

// Database health check using Supabase
export async function checkDatabaseHealth() {
  if (!supabase) {
    return { status: 'not_configured', timestamp: new Date().toISOString() };
  }
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

// Export types for use in other files
export type { User } from '@supabase/supabase-js';
