// AI模型提供商
export type AIProvider = 'deepseek' | 'aliyun' | 'volcengine' | 'kimi' | 'claude' | 'bigmodel';

// 模型配置
export interface ModelConfig {
  id: string;
  name: string;
  provider: AIProvider;
  modelId: string;
  maxTokens?: number;
  temperature?: number;
  top_p?: number;
  supportVision?: boolean;
  costPerToken?: number;
  isReasoner?: boolean; // 是否为深度思考模型
  description?: string; // 模型介绍
}

// 自定义模型
export interface CustomModel {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  description: string;
}

// API密钥配置
export interface ApiKeyConfig {
  provider: AIProvider;
  apiKey: string;
  isValid?: boolean;
}

// 消息类型
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  images?: string[]; // base64格式的图片
}

// Token使用统计
export interface UsageData {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

// 模型响应
export interface ModelResponse {
  modelId?: string; // 可选
  content: string;
  reasoning_content?: string; // 思考过程内容（用于reasoning模型）
  loading?: boolean; // 可选，兼容旧版本
  isComplete?: boolean; // 添加新的完成状态标识
  error?: string;
  responseTime?: number; // 兼容旧版本，总响应时间
  // 新增响应时间监控字段
  startTime?: number; // 开始请求时间戳（毫秒）
  firstResponseTime?: number; // 首次响应时间戳（毫秒）
  endTime?: number; // 响应完成时间戳（毫秒）
  totalResponseTime?: number; // 总响应时间（毫秒）
  firstByteLatency?: number; // 首字节延迟（毫秒）
  tokens?: number;
  tokenCount?: number; // 兼容新的token计数
  cost?: number;
  usage?: UsageData; // 真实的Token使用数据
  timestamp: Date;
}

// 对话会话
export interface ChatSession {
  id: string;
  title?: string;
  systemPrompt: string;
  selectedModels: string[];
  messages: Message[];
  responses: Record<string, Record<string, ModelResponse>>; // modelId -> messageId -> response
  createdAt: Date;
  updatedAt: Date;
  model: string;
  provider: AIProvider;
  tokenCount: number;
  cost: number;
  temperature: number;
  maxTokens: number;
}

// 页面模式类型
export type PageMode = 'landing' | 'simple' | 'advanced';

// 语言类型
export type Language = 'zh' | 'en';

// 用户信息
export interface User {
  id: string;
  phone: string;
  isVerified: boolean;
  registeredAt: Date;
}

// 注册统计
export interface RegistrationStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
}

// 系统提示词版本
export interface SystemPromptVersion {
  id: string;
  name: string; // 版本名称，如"版本一"、"版本二"
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// 系统提示词主题（包含多个版本）
export interface SystemPromptTheme {
  id: string;
  name: string; // 主题名称，如"翻译助手"、"代码审查"
  description?: string; // 主题描述
  versions: SystemPromptVersion[]; // 该主题下的所有版本
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 系统提示词项（保持向后兼容）
export interface SystemPromptItem {
  id: string;
  name: string;
  content: string;
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 应用状态
export interface AppState {
  // 页面模式
  pageMode: PageMode;
  
  // 语言设置
  language: Language;
  
  // 用户状态
  currentUser: User | null;
  isAuthenticated: boolean;
  
  // 系统提示词管理（新的主题化结构）
  systemPromptThemes: SystemPromptTheme[];
  selectedSystemPromptThemes: string[]; // 选中的主题ID（最多3个）
  
  // 系统提示词管理（向后兼容）
  systemPrompts: SystemPromptItem[];
  selectedSystemPrompts: string[]; // 选中的系统提示词ID（最多3个）
  
  // API配置
  apiKeys: Record<AIProvider, string>;
  
  // 模型配置
  availableModels: ModelConfig[];
  selectedModels: string[];
  customModels: CustomModel[];
  
  // 当前会话
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  
  // UI状态
  isLoading: boolean;
  systemPrompt: string;
  
  // 统计信息
  totalTokens: number;
  totalCost: number;
}

// API请求参数
export interface ChatRequest {
  messages: Message[];
  model: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  stream?: boolean; // 添加流式请求选项
}

// API响应
export interface ChatResponse {
  content: string;
  tokens?: number; // 可选
  tokenCount?: number; // 添加tokenCount属性
  cost?: number;
  responseTime?: number; // 可选
  usage?: UsageData; // 添加usage字段
}

// 流式响应块
export interface StreamChunk {
  content: string;
  reasoning_content?: string; // 思考过程内容（用于reasoning模型）
  finished: boolean;
  tokens?: number;
  cost?: number;
  usage?: UsageData; // 添加usage字段以支持阿里云等提供商的token统计
  // 响应时间监控字段
  responseTime?: number; // 总响应时间（毫秒）
  firstResponseTime?: number; // 首次响应延迟（毫秒）
}

// 流式响应回调
export type StreamCallback = (chunk: StreamChunk) => void;