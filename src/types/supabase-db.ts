// 用户表
export interface User {
  id: string;
  anonymous_id: string;
  auth_user_id?: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
  user_type: 'anonymous' | 'registered';
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  last_active: string;
  total_sessions: number;
  total_messages: number;
  preferences: Record<string, any>;
}

// 会话表
export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  system_prompt: string;
  selected_models: string[];
  created_at: string;
  updated_at: string;
  message_count: number;
  is_deleted: boolean;
}

// 消息表
export interface Message {
  id: string;
  session_id: string;
  user_id: string;
  content: string;
  role: 'user' | 'assistant';
  model_name?: string;
  tokens_used?: number;
  response_time_ms?: number;
  cost_usd?: number;
  attachments: any[];
  created_at: string;
  error_info?: string;
}

// 用户配置表
export interface UserSettings {
  id: string;
  user_id: string;
  theme: string;
  language: string;
  default_models: string[];
  api_keys: Record<string, string>;
  notification_preferences: Record<string, any>;
  data_retention_days: number;
  created_at: string;
  updated_at: string;
}

// 模型使用统计表
export interface ModelUsageStats {
  id: string;
  user_id: string;
  model_name: string;
  date: string;
  usage_count: number;
  total_tokens: number;
  total_cost: number;
  avg_response_time: number;
  success_rate: number;
}

// 系统统计表
export interface SystemStats {
  id: string;
  date: string;
  total_users: number;
  active_users: number;
  total_sessions: number;
  total_messages: number;
  popular_models: any[];
  created_at: string;
}

// 用户订阅表
export interface UserSubscription {
  id: string;
  user_id: string;
  plan_type: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired';
  started_at: string;
  expires_at?: string;
  monthly_message_limit: number;
  monthly_message_used: number;
  features: any[];
  created_at: string;
}