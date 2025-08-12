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
        error.code === 'PGRST116' ||
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('NetworkError')) {
      console.warn('⚠️  数据库连接失败或users表不存在，请检查Supabase配置');
      console.warn('💡 解决方案：');
      console.warn('1. 检查 .env.local 文件中的 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY');
      console.warn('2. 在Supabase控制台执行 fixed-supabase-schema.sql 脚本');
      console.warn('3. 在浏览器控制台运行 testSupabaseConnection() 测试连接');
      return null;
    }
    throw new Error(`[Supabase][getUserByAnonymousId] ${error.message || error}`);
  }
};

export const createUser = async (user: Partial<User>): Promise<User> => {
  // 确保包含必要的时间戳字段
  const userWithTimestamps = {
    ...user,
    created_at: user.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_active: user.last_active || new Date().toISOString()
  };
  const { data, error } = await supabase.from('users').insert([userWithTimestamps]).select().single();
  handleError(error, 'createUser');
  return data;
};

export const updateUser = async (id: string, updates: Partial<User>): Promise<User> => {
  try {
    // 移除 updated_at 字段，因为它由数据库触发器自动更新
    const { updated_at, ...cleanUpdates } = updates;
    
    // 确保至少有一个字段要更新
    if (Object.keys(cleanUpdates).length === 0) {
      throw new Error('No fields to update');
    }
    
    const { data, error } = await supabase.from('users').update(cleanUpdates).eq('id', id).select().single();
    
    if (error) {
      // 特殊处理触发器相关错误
      if (error.message?.includes('updated_at') || error.message?.includes('trigger')) {
        console.warn('⚠️  数据库触发器错误，尝试不使用触发器直接更新');
        // 尝试手动添加 updated_at 字段
        const manualUpdates = {
          ...cleanUpdates,
          updated_at: new Date().toISOString()
        };
        const { data: retryData, error: retryError } = await supabase
          .from('users')
          .update(manualUpdates)
          .eq('id', id)
          .select()
          .single();
        
        if (retryError) {
          throw retryError;
        }
        return retryData;
      }
      throw error;
    }
    
    return data;
  } catch (error: any) {
    handleError(error, 'updateUser');
    throw error; // 这行不会执行，因为 handleError 会抛出异常
  }
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