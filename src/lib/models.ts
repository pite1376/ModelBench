import { ModelConfig, AIProvider } from '@/types';

// 支持的所有AI模型配置
export const AVAILABLE_MODELS: ModelConfig[] = [
  // DeepSeek 模型
  {
    id: 'deepseek-chat',
    name: 'DeepSeek V3 0324',
    provider: 'deepseek',
    modelId: 'deepseek-chat',
    maxTokens: 4096,
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.0000014, // 1.4美元/1M tokens
  },
  {
    id: 'deepseek-reasoner',
    name: 'DeepSeek R1 0528',
    provider: 'deepseek',
    modelId: 'deepseek-reasoner',
    maxTokens: 4096,
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.000055, // 55美元/1M tokens
    isReasoner: true,
  },

  // 阿里云通义千问模型
  {
    id: 'qwen-plus-latest',
    name: '通义千问 Plus 最新版',
    provider: 'aliyun',
    modelId: 'qwen-plus-latest',
    maxTokens: 2000,
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.000004,
  },
  {
    id: 'qwen-max-latest',
    name: '通义千问 Max 最新版',
    provider: 'aliyun',
    modelId: 'qwen-max-latest',
    maxTokens: 2000,
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.00002,
  },
  {
    id: 'qwen-turbo-latest',
    name: '通义千问 Turbo 最新版',
    provider: 'aliyun',
    modelId: 'qwen-turbo-latest',
    maxTokens: 1500,
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.0000008,
  },
  {
    id: 'qwen-long-latest',
    name: '通义千问 Long 最新版',
    provider: 'aliyun',
    modelId: 'qwen-long-latest',
    maxTokens: 128000,
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.00001,
  },
  {
    id: 'qwen-long-2025-01-25',
    name: '通义千问 Long 2025-01-25',
    provider: 'aliyun',
    modelId: 'qwen-long-2025-01-25',
    maxTokens: 128000,
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.00001,
  },
  {
    id: 'qwen-max-2025-01-25',
    name: '通义千问 Max 2025-01-25',
    provider: 'aliyun',
    modelId: 'qwen-max-2025-01-25',
    maxTokens: 2000,
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.00002,
  },
  {
    id: 'qwen-plus-2025-04-28',
    name: '通义千问 Plus 2025-04-28',
    provider: 'aliyun',
    modelId: 'qwen-plus-2025-04-28',
    maxTokens: 2000,
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.000004,
  },
  {
    id: 'qwen-turbo-2025-04-28',
    name: '通义千问 Turbo 2025-04-28',
    provider: 'aliyun',
    modelId: 'qwen-turbo-2025-04-28',
    maxTokens: 1500,
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.0000008,
  },
  {
    id: 'qwen2-57b-instruct',
    name: '通义千问2-57B',
    provider: 'aliyun',
    modelId: 'qwen2-57b-a14b-instruct',
    maxTokens: 2000,
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.000001,
  },
  {
    id: 'qwen3-235b-a22b',
    name: '通义千问3-235B-A22B',
    provider: 'aliyun',
    modelId: 'qwen3-235b-a22b',
    maxTokens: 8192,
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.0001, // 示例价格
    isReasoner: true,
  },
  {
    id: 'qwen3-32b',
    name: '通义千问3-32B',
    provider: 'aliyun',
    modelId: 'qwen3-32b',
    maxTokens: 8192,
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.00005, // 示例价格
    isReasoner: true,
  },
  {
    id: 'qwen3-30b-a3b',
    name: '通义千问3-30B-A3B',
    provider: 'aliyun',
    modelId: 'qwen3-30b-a3b',
    maxTokens: 8192,
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.00003, // 示例价格
  },
  {
    id: 'qwq-32b',
    name: 'QwQ-32B（开源）',
    provider: 'aliyun',
    modelId: 'qwq-32b',
    maxTokens: 8192,
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.00001, // 示例价格
  },

  // 火山引擎豆包模型
  {
    id: 'doubao-seed-1-6-thinking-250615',
    name: '豆包 seed 1.6 thinking',
    provider: 'volcengine',
    modelId: 'ep-m-20250611161312-c67kg',
    maxTokens: 160000, // 修正为实际限制
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.0000005, // 估计价格
    isReasoner: true,
  },{
    id: 'doubao-seed-1-6-250615',
    name: '豆包 seed 1.6',
    provider: 'volcengine',
    modelId: 'ep-m-20250619112921-z7mnc',
    maxTokens: 160000, // 修正为实际限制
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.0000005, // 估计价格
  },  {
    id: 'doubao-pro-32k-241215',
    name: '豆包 Pro 32K',
    provider: 'volcengine',
    modelId: 'ep-m-20250412122201-8w479',
    maxTokens: 4096, // 修正为实际限制
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.0000005, // 估计价格
  },
  {
    id: 'doubao-15-pro-32k-250606',
    name: '豆包 1.5 pro 32k',
    provider: 'volcengine',
    modelId: 'ep-m-20250606195125-v2pp2',
    maxTokens: 4096, // 修正为实际限制
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.0000005, // 估计价格
  },
  {
    id: 'doubao-pro-256k-241115',
    name: '豆包 Pro 256K',
    provider: 'volcengine',
    modelId: 'ep-m-20250606100553-dxl69',
    maxTokens: 4096, // 修正为安全值
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.000001, // 估计价格
  },
  {
    id: 'doubao-1.5-vision-pro-250328',
    name: '豆包 Vision Pro',
    provider: 'volcengine',
    modelId: 'ep-m-20250528131624-5cfmz',
    maxTokens: 4096, // 修正为安全值
    temperature: 0.7,
    supportVision: true,
    costPerToken: 0.000002, // 估计价格
  },

  // Kimi (Moonshot) 模型
  {
    id: 'moonshot-v1-8k',
    name: 'Kimi V1 8K',
    provider: 'kimi',
    modelId: 'moonshot-v1-8k',
    maxTokens: 2048, // 保守设置，避免超过上下文限制
    temperature: 0.3,
    supportVision: false,
    costPerToken: 0.000012, // 12美元/1M tokens
  },
  {
    id: 'moonshot-v1-32k',
    name: 'Kimi V1 32K',
    provider: 'kimi',
    modelId: 'moonshot-v1-32k',
    maxTokens: 8192, // 保守设置，为输入留出更多空间
    temperature: 0.3,
    supportVision: false,
    costPerToken: 0.000024, // 24美元/1M tokens
  },
  {
    id: 'moonshot-v1-128k',
    name: 'Kimi V1 128K',
    provider: 'kimi',
    modelId: 'moonshot-v1-128k',
    maxTokens: 16384, // 保守设置，为长上下文留出空间
    temperature: 0.3,
    supportVision: false,
    costPerToken: 0.00006, // 60美元/1M tokens
  },
  {
    id: 'kimi-k2-0711-preview',
    name: 'Kimi K2 0711 Preview',
    provider: 'kimi',
    modelId: 'kimi-k2-0711-preview',
    maxTokens: 16384, // 128k上下文，保守设置输出长度
    temperature: 0.3,
    supportVision: false,
    costPerToken: 0.00008, // 80美元/1M tokens
    description: 'MoE架构基础模型，总参数1T，激活参数32B，具备超强代码和Agent能力',
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    provider: 'claude',
    modelId: 'claude-sonnet-4-20250514',
    maxTokens: 4096,
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.000003, // Placeholder cost, please verify from 302.AI pricing
  },
  {
    id: 'claude-3-7-sonnet-20250219',
    name: 'Claude Sonnet 3-7',
    provider: 'claude',
    modelId: 'claude-3-7-sonnet-20250219',
    maxTokens: 4096,
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.000003, // Placeholder cost, please verify from 302.AI pricing
  },
  {
    id: 'chatgpt-4o-latest',
    name: 'chatgpt-4o-latest',
    provider: 'claude',
    modelId: 'chatgpt-4o-latest',
    maxTokens: 4096,
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.000003, // Placeholder cost, please verify from 302.AI pricing
  },
];

// 根据提供商获取模型
export const getModelsByProvider = (provider: string) => {
  return AVAILABLE_MODELS.filter(model => model.provider === provider);
};

// 根据ID获取模型
export const getModelById = (id: string) => {
  return AVAILABLE_MODELS.find(model => model.id === id);
};

// 获取支持视觉的模型
export const getVisionModels = () => {
  return AVAILABLE_MODELS.filter(model => model.supportVision);
};

// 按提供商分组获取模型
export const getModelsByProviderGrouped = () => {
  const groups: Array<{
    id: string;
    name: string;
    models: ModelConfig[];
  }> = [];

  // 遍历所有提供商
  Object.values(PROVIDERS).forEach(provider => {
    const models = getModelsByProvider(provider.id);
    if (models.length > 0) {
      groups.push({
        id: provider.id,
        name: provider.name,
        models: models
      });
    }
  });

  return groups;
};

// 提供商信息
export const PROVIDERS: Record<AIProvider, { id: AIProvider; name: string; apiUrl: string; icon: string; color: string; logo: string; supportStream?: boolean }> = {
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    apiUrl: 'https://api.deepseek.com',
    icon: '🐟',
    color: '#1E40AF',
    logo: '/src/lib/model-logo/deepseek-logo.png',
    supportStream: true,  
  },
  aliyun: {
    id: 'aliyun',
    name: '阿里云百练',
    apiUrl: 'https://dashscope.aliyuncs.com/api/v1',
    icon: '☁️',
    color: '#FF6600',
    logo: '/src/lib/model-logo/qwen-logo.png',
    supportStream: true,
  },
  volcengine: {
    id: 'volcengine',
    name: '火山引擎',
    apiUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    icon: '🌋',
    color: '#1890FF',
    logo: '/src/lib/model-logo/doubao_logo.png',
    supportStream: true,
  },
  kimi: {
    id: 'kimi',
    name: 'Moonshot',
    apiUrl: 'https://api.moonshot.cn',
    icon: '🌙',
    color: '#6366F1',
    logo: '/kimi-logo.png',
    supportStream: true,
  },
  claude: {
    id: 'claude',
    name: 'Claude',
    apiUrl: 'https://api.302ai.cn/v1',
    icon: '✨',
    color: '#6A0DAD',
    logo: '/claude-logo.png',
    supportStream: true,
  },
}; 