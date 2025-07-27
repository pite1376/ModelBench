import { supabase } from '@/lib/supabaseClient';

export const signInAnonymously = async () => {
  // 匿名登录（Supabase 推荐用 signInWithPassword + guest 邮箱/密码策略，或直接用 magic link/自定义）
  // 这里只做占位，具体实现需结合业务
  throw new Error('Supabase 不直接支持匿名登录，请用 magic link 或自定义策略');
};

export const signUp = async (email: string, password: string) => {
  return supabase.auth.signUp({ email, password });
};

export const signIn = async (email: string, password: string) => {
  return supabase.auth.signInWithPassword({ email, password });
};

export const signOut = async () => {
  return supabase.auth.signOut();
};

export const getUser = async () => {
  return supabase.auth.getUser();
}; 