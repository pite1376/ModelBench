import { supabase } from '@/lib/supabaseClient';
import type {
  User, ChatSession, Message, UserSettings, ModelUsageStats, SystemStats, UserSubscription
} from '@/types/supabase-db';

// 通用错误处理
function handleError(error: any, context: string) {
  if (error) {
    throw new Error(`[Supabase][${context}] ${error.message || error}`);
  }
}

// 用户表 CRUD
export const getUserById = async (id: string): Promise<User | null> => {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
  handleError(error, 'getUserById');
  return data;
};

export const getUserByAnonymousId = async (anonymous_id: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('anonymous_id', anonymous_id)
      .maybeSingle(); // 使用 maybeSingle() 替代 single()，允许返回0或1条记录
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error: any) {
    // 如果是表不存在的错误，返回null而不是抛出异常
    if (error.message?.includes('relation "users" does not exist') || 
        error.message?.includes('406') ||
        error.code === 'PGRST116') {
      console.warn('⚠️  users表不存在，请先在Supabase中执行数据库架构SQL');
      return null;
    }
    throw new Error(`[Supabase][getUserByAnonymousId] ${error.message || error}`);
  }
};

export const createUser = async (user: Partial<User>): Promise<User> => {
  const { data, error } = await supabase.from('users').insert([user]).select().single();
  handleError(error, 'createUser');
  return data;
};

export const updateUser = async (id: string, updates: Partial<User>): Promise<User> => {
  const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().single();
  handleError(error, 'updateUser');
  return data;
};

export const deleteUser = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from('users').delete().eq('id', id);
  handleError(error, 'deleteUser');
  return true;
};

export const batchGetUsers = async (ids: string[]): Promise<User[]> => {
  const { data, error } = await supabase.from('users').select('*').in('id', ids);
  handleError(error, 'batchGetUsers');
  return data || [];
};

// 会话表 CRUD
export const getSessionById = async (id: string): Promise<ChatSession | null> => {
  const { data, error } = await supabase.from('chat_sessions').select('*').eq('id', id).single();
  handleError(error, 'getSessionById');
  return data;
};

export const getSessionsByUserId = async (user_id: string): Promise<ChatSession[]> => {
  const { data, error } = await supabase.from('chat_sessions').select('*').eq('user_id', user_id).order('created_at', { ascending: false });
  handleError(error, 'getSessionsByUserId');
  return data || [];
};

export const createSession = async (session: Partial<ChatSession>): Promise<ChatSession> => {
  const { data, error } = await supabase.from('chat_sessions').insert([session]).select().single();
  handleError(error, 'createSession');
  return data;
};

export const updateSession = async (id: string, updates: Partial<ChatSession>): Promise<ChatSession> => {
  const { data, error } = await supabase.from('chat_sessions').update(updates).eq('id', id).select().single();
  handleError(error, 'updateSession');
  return data;
};

export const deleteSession = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from('chat_sessions').delete().eq('id', id);
  handleError(error, 'deleteSession');
  return true;
};

export const batchGetSessions = async (ids: string[]): Promise<ChatSession[]> => {
  const { data, error } = await supabase.from('chat_sessions').select('*').in('id', ids);
  handleError(error, 'batchGetSessions');
  return data || [];
};

// 消息表 CRUD
export const getMessageById = async (id: string): Promise<Message | null> => {
  const { data, error } = await supabase.from('messages').select('*').eq('id', id).single();
  handleError(error, 'getMessageById');
  return data;
};

export const getMessagesBySessionId = async (session_id: string): Promise<Message[]> => {
  const { data, error } = await supabase.from('messages').select('*').eq('session_id', session_id).order('created_at', { ascending: true });
  handleError(error, 'getMessagesBySessionId');
  return data || [];
};

export const createMessage = async (message: Partial<Message>): Promise<Message> => {
  const { data, error } = await supabase.from('messages').insert([message]).select().single();
  handleError(error, 'createMessage');
  return data;
};

export const batchCreateMessages = async (messages: Partial<Message>[]): Promise<Message[]> => {
  const { data, error } = await supabase.from('messages').insert(messages).select();
  handleError(error, 'batchCreateMessages');
  return data || [];
};

export const updateMessage = async (id: string, updates: Partial<Message>): Promise<Message> => {
  const { data, error } = await supabase.from('messages').update(updates).eq('id', id).select().single();
  handleError(error, 'updateMessage');
  return data;
};

export const deleteMessage = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from('messages').delete().eq('id', id);
  handleError(error, 'deleteMessage');
  return true;
};

export const batchGetMessages = async (ids: string[]): Promise<Message[]> => {
  const { data, error } = await supabase.from('messages').select('*').in('id', ids);
  handleError(error, 'batchGetMessages');
  return data || [];
};

// 用户配置表 CRUD
export const getUserSettings = async (user_id: string): Promise<UserSettings | null> => {
  const { data, error } = await supabase.from('user_settings').select('*').eq('user_id', user_id).single();
  handleError(error, 'getUserSettings');
  return data;
};

export const updateUserSettings = async (user_id: string, updates: Partial<UserSettings>): Promise<UserSettings> => {
  const { data, error } = await supabase.from('user_settings').update(updates).eq('user_id', user_id).select().single();
  handleError(error, 'updateUserSettings');
  return data;
};

// 模型使用统计表 CRUD
export const getModelUsageStats = async (user_id: string, model_name: string, date: string): Promise<ModelUsageStats | null> => {
  const { data, error } = await supabase.from('model_usage_stats').select('*').eq('user_id', user_id).eq('model_name', model_name).eq('date', date).single();
  handleError(error, 'getModelUsageStats');
  return data;
};

export const upsertModelUsageStats = async (stats: Partial<ModelUsageStats>): Promise<ModelUsageStats> => {
  const { data, error } = await supabase.from('model_usage_stats').upsert([stats], { onConflict: 'user_id,model_name,date' }).select().single();
  handleError(error, 'upsertModelUsageStats');
  return data;
};

// 系统统计表 CRUD
export const getSystemStatsByDate = async (date: string): Promise<SystemStats | null> => {
  const { data, error } = await supabase.from('system_stats').select('*').eq('date', date).single();
  handleError(error, 'getSystemStatsByDate');
  return data;
};

// 用户订阅表 CRUD
export const getUserSubscription = async (user_id: string): Promise<UserSubscription | null> => {
  const { data, error } = await supabase.from('user_subscriptions').select('*').eq('user_id', user_id).single();
  handleError(error, 'getUserSubscription');
  return data;
};

export const updateUserSubscription = async (user_id: string, updates: Partial<UserSubscription>): Promise<UserSubscription> => {
  const { data, error } = await supabase.from('user_subscriptions').update(updates).eq('user_id', user_id).select().single();
  handleError(error, 'updateUserSubscription');
  return data;
}; 