import { createClient } from '@supabase/supabase-js';

// Vite 环境变量声明
declare global {
  interface ImportMeta {
    readonly env: {
      readonly VITE_SUPABASE_URL?: string;
      readonly VITE_SUPABASE_ANON_KEY?: string;
    }
  }
}

// 使用 Vite 环境变量方式
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://phnribkdbrmhqvcnxzvy.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobnJpYmtkYnJtaHF2Y254enZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5ODA1MjksImV4cCI6MjA2NTU1NjUyOX0.O5JYwdZMHXc_Iln7vD9fqLedX5ZnBjIz2P8pbk-W2Gg';

if (!supabaseUrl) {
  throw new Error('Supabase URL is required');
}

if (!supabaseAnonKey) {
  console.warn('⚠️  Supabase Anon Key not configured. Please set VITE_SUPABASE_ANON_KEY in your environment variables.');
  console.warn('🔧 Database features will be limited without proper configuration.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 