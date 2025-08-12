import { ModelConfig, AIProvider } from '@/types';

// 支持的所有AI模型配置
export const AVAILABLE_MODELS: ModelConfig[] = [
  // DeepSeek 模型
  {
    id: 'deepseek-chat',
    name: 'DeepSeek V3 0324',
    provider: 'deepseek',
    modelId: 'deepseek-chat',
    maxTokens: 64000,
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.0000014, // 1.4美元/1M tokens
    description: 'DeepSeek V3-250325 是通用型 MoE 模型的标杆，通过后训练优化实现多领域能力跃升，尤其适合开发者与普通用户的高效需求。追求广度与效率平衡，适合日常高并发场景。发布日期：2025 年 3 月 24 日。API 提供 64K 上下文',
  },
  {
    id: 'deepseek-reasoner',
    name: 'DeepSeek R1 0528',
    provider: 'deepseek',
    modelId: 'deepseek-reasoner',
    maxTokens: 32000,
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.000055, // 55美元/1M tokens
    isReasoner: true,
    description: 'DeepSeek R1-250528 代表推理专用模型的演进，依托强化学习突破复杂任务瓶颈，为科研、金融等专业领域提供核心支持。R1 专注深度与精确性，为专业分析场景而生。发布日期：2025 年 5 月 28 日。max_tokens用于限制模型单次输出的总长度（包括思考过程），默认为 32K，最大为 64K',
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
    description: '通义千问超大规模语言模型的增强版，支持中文英文等不同语言输入。主干模型、latest和快照04-28已升级Qwen3系列，实现思考模式和非思考模式的有效融合，可在对话中切换模式。',
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
    description: '通义千问2.5系列千亿级别超大规模语言模型，支持中文、英文等不同语言输入。随着模型的升级，qwen-max将滚动更新升级。如果希望使用固定版本，请使用历史快照版本。',
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
    description: '通义千问超大规模语言模型，支持中文英文等不同语言输入。主干模型、latest和快照04-28已升级Qwen3系列，实现思考模式和非思考模式的有效融合，可在对话中切换模式。',
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
    description: '通义千问2.5系列千亿级别超大规模语言模型，支持中文、英文等不同语言输入。随着模型的升级，qwen-max将滚动更新升级。如果希望使用固定版本，请使用历史快照版本。',
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
    description: '通义千问超大规模语言模型的增强版，支持中文英文等不同语言输入。主干模型、latest和快照04-28已升级Qwen3系列，实现思考模式和非思考模式的有效融合，可在对话中切换模式。',
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
    description: '通义千问超大规模语言模型，支持中文英文等不同语言输入。主干模型、latest和快照04-28已升级Qwen3系列，实现思考模式和非思考模式的有效融合，可在对话中切换模式。',
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
    description: 'Qwen3全系列模型，实现思考模式和非思考模式的有效融合，可在对话中切换模式。',
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
    description: 'Qwen3全系列模型，实现思考模式和非思考模式的有效融合，可在对话中切换模式。',
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
    description: 'Qwen3全系列模型，实现思考模式和非思考模式的有效融合，可在对话中切换模式。',
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
    description: 'Doubao-Seed-1.6-thinking 模型思考能力大幅强化， 对比 Doubao-1.5-thinking-pro，在 Coding、Math、 逻辑推理等基础能力上进一步提升， 支持视觉理解。 支持 256k 上下文窗口，0715版本最大输出长度64k tokens。',
  },{
    id: 'doubao-seed-1-6-250615',
    name: '豆包 seed 1.6',
    provider: 'volcengine',
    modelId: 'ep-m-20250619112921-z7mnc',
    maxTokens: 160000, // 修正为实际限制
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.0000005, // 估计价格
    description: 'Doubao-Seed-1.6全新多模态深度思考模型，同时支持auto/thinking/non-thinking三种思考模式。 non-thinking模式下，模型效果对比Doubao-1.5-pro/250115大幅提升。支持 256k 上下文窗口，输出长度支持最大 16k tokens。',
  },  {
    id: 'doubao-pro-32k-241215',
    name: '豆包 Pro 32K',
    provider: 'volcengine',
    modelId: 'ep-m-20250412122201-8w479',
    maxTokens: 4096, // 修正为实际限制
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.0000005, // 估计价格
    description: 'Doubao-pro，我们效果最好的主力模型，适合处理复杂任务，在参考问答、总结摘要、创作、文本分类、角色扮演等场景都有很好的效果。支持32k上下文窗口的推理和精调。',
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
    description: 'Doubao-1.5-pro 全新一代主力模型，性能全面升级，在知识、代码、推理等方面表现卓越。支持 32k 上下文窗口，输出长度支持最大 12k tokens。',
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
    description: 'Doubao-vision 模型是豆包推出的多模态大模型，具备强大的图片理解与推理能力，以及精准的指令理解能力。模型在图像文本信息抽取、基于图像的推理任务上有展现出了强大的性能，能够应用于更复杂、更广泛的视觉问答任务。',
  },

  // Kimi (Moonshot) 模型
  {
    id: 'kimi-k2',
    name: 'Kimi K2',
    provider: 'kimi',
    modelId: 'kimi-k2',
    maxTokens: 16384, // 128k上下文，保守设置输出长度
    temperature: 0.3,
    supportVision: false,
    costPerToken: 0.00008, // 80美元/1M tokens
    description: '上下文长度 128k，具备超强代码和 Agent 能力的 MoE 架构基础模型，总参数 1T，激活参数 32B。在通用知识推理、编程、数学、Agent 等主要类别的基准性能测试中，K2 模型的性能超过其他主流开源模型。',
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
    description: '上下文长度 128k，具备超强代码和 Agent 能力的 MoE 架构基础模型，总参数 1T，激活参数 32B。在通用知识推理、编程、数学、Agent 等主要类别的基准性能测试中，K2 模型的性能超过其他主流开源模型。',
  },
  {
    id: 'kimi-k2-turbo-preview',
    name: 'Kimi K2 Turbo Preview',
    provider: 'kimi',
    modelId: 'kimi-k2-turbo-preview',
    maxTokens: 16384, // 128k上下文，保守设置输出长度
    temperature: 0.3,
    supportVision: false,
    costPerToken: 0.00008, // 80美元/1M tokens
    description: 'kimi-k2 的高速版，模型参数与 kimi-k2 一致，但输出速度由每秒 10 Tokens 提升至每秒 40 Tokens。',
  },
  {
    id: 'moonshot-v1-8k',
    name: 'Moonshot V1 8K',
    provider: 'kimi',
    modelId: 'moonshot-v1-8k',
    maxTokens: 2048, // 保守设置，避免超过上下文限制
    temperature: 0.3,
    supportVision: false,
    costPerToken: 0.000012, // 12美元/1M tokens
    description: '长度为 8k 的模型，适用于生成短文本。',
  },
  {
    id: 'moonshot-v1-32k',
    name: 'Moonshot V1 32K',
    provider: 'kimi',
    modelId: 'moonshot-v1-32k',
    maxTokens: 8192, // 保守设置，为输入留出更多空间
    temperature: 0.3,
    supportVision: false,
    costPerToken: 0.000024, // 24美元/1M tokens
    description: '长度为 32k 的模型，适用于生成长文本。',
  },
  {
    id: 'moonshot-v1-128k',
    name: 'Moonshot V1 128K',
    provider: 'kimi',
    modelId: 'moonshot-v1-128k',
    maxTokens: 16384, // 保守设置，为长上下文留出空间
    temperature: 0.3,
    supportVision: false,
    costPerToken: 0.00006, // 60美元/1M tokens
    description: '长度为 128k 的模型，适用于生成超长文本。',
  },
  {
    id: 'moonshot-v1-8k-vision-preview',
    name: 'Moonshot V1 8K Vision Preview',
    provider: 'kimi',
    modelId: 'moonshot-v1-8k-vision-preview',
    maxTokens: 2048,
    temperature: 0.3,
    supportVision: true,
    costPerToken: 0.000015, // Vision模型价格稍高
    description: '长度为 8k 的 Vision 视觉模型，能够理解图片内容，输出文本。',
  },
  {
    id: 'moonshot-v1-32k-vision-preview',
    name: 'Moonshot V1 32K Vision Preview',
    provider: 'kimi',
    modelId: 'moonshot-v1-32k-vision-preview',
    maxTokens: 8192,
    temperature: 0.3,
    supportVision: true,
    costPerToken: 0.00003, // Vision模型价格稍高
    description: '长度为 32k 的 Vision 视觉模型，能够理解图片内容，输出文本。',
  },
  {
    id: 'moonshot-v1-128k-vision-preview',
    name: 'Moonshot V1 128K Vision Preview',
    provider: 'kimi',
    modelId: 'moonshot-v1-128k-vision-preview',
    maxTokens: 16384,
    temperature: 0.3,
    supportVision: true,
    costPerToken: 0.00008, // Vision模型价格稍高
    description: '长度为 128k 的 Vision 视觉模型，能够理解图片内容，输出文本。',
  },
  {
    id: 'kimi-latest',
    name: 'Kimi Latest',
    provider: 'kimi',
    modelId: 'kimi-latest',
    maxTokens: 16384,
    temperature: 0.3,
    supportVision: true,
    costPerToken: 0.00008,
    description: '最长支持 128k 上下文的视觉模型，支持图片理解。总是使用 Kimi 智能助手产品使用最新的 Kimi 大模型版本，可能包含尚未稳定的特性。',
  },
  {
    id: 'kimi-thinking-preview',
    name: 'Kimi Thinking Preview',
    provider: 'kimi',
    modelId: 'kimi-thinking-preview',
    maxTokens: 16384,
    temperature: 0.3,
    supportVision: true,
    costPerToken: 0.0001,
    isReasoner: true,
    description: '月之暗面提供的具有多模态推理能力和通用推理能力的多模态思考模型，最长支持 128k 上下文，擅长深度推理，帮助解决更多更难的事情。',
  },
  {
    id: 'claude-opus-4-1-20250805',
    name: 'Claude Sonnet 4.1',
    provider: 'claude',
    modelId: 'claude-opus-4-1-20250805',
    maxTokens: 4096,
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.000003, // Placeholder cost, please verify from 302.AI pricing
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
    id: 'claude-opus-4-20250514',
    name: 'Claude Opus 4',
    provider: 'claude',
    modelId: 'claude-opus-4-20250514',
    maxTokens: 4096,
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.000003,
  },
  {
    id: 'claude-3-7-sonnet-20250219',
    name: 'Claude Sonnet 3.7',
    provider: 'claude',
    modelId: 'claude-3-7-sonnet-20250219',
    maxTokens: 4096,
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.000003, // Placeholder cost, please verify from 302.AI pricing
  },
  {
    id: 'chatgpt-4o-latest',
    name: 'GPT-4o-latest',
    provider: 'claude',
    modelId: 'chatgpt-4o-latest',
    maxTokens: 4096,
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.000003, // Placeholder cost, please verify from 302.AI pricing
  },
  {
    id: 'o4-mini-deep-research',
    name: 'O4 Mini Deep Research',
    provider: 'claude',
    modelId: 'o4-mini-deep-research',
    maxTokens: 4096,
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.000003,
  },
  {
    id: 'o3-deep-research',
    name: 'GPT O3 Deep Research',
    provider: 'claude',
    modelId: 'o3-deep-research',
    maxTokens: 4096,
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.000003,
  },
  {
    id: 'gpt-4-plus',
    name: 'GPT-4 Plus',
    provider: 'claude',
    modelId: 'gpt-4-plus',
    maxTokens: 4096,
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.000003,
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'claude',
    modelId: 'gemini-2.5-pro',
    maxTokens: 4096,
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.000003,
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'claude',
    modelId: 'gemini-2.5-flash',
    maxTokens: 4096,
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.000003,
  },

  // 智谱AI GLM-4.5系列模型
  {
    id: 'glm-4.5v',
    name: 'glm-4.5v',
    provider: 'bigmodel',
    modelId: 'glm-4.5v',
    maxTokens: 128000,
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.00001, // 估计价格，请根据实际定价调整
    description: 'GLM-4.5V 是智谱最强大的视觉推理模型，全球同级别开源模型 SOTA，覆盖图像、视频、文档理解及 GUI等核心任务。',
  },{
    id: 'glm-4.5',
    name: 'GLM-4.5',
    provider: 'bigmodel',
    modelId: 'glm-4.5',
    maxTokens: 128000,
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.00001, // 估计价格，请根据实际定价调整
    description: 'GLM-4.5 是智谱最新旗舰模型，推理、代码、智能体综合能力达到开源模型的 SOTA 水平，模型上下文长度可达128k。',
  },
  {
    id: 'glm-4.5-x',
    name: 'GLM-4.5-X',
    provider: 'bigmodel',
    modelId: 'glm-4.5-x',
    maxTokens: 128000,
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.000015, // 极速版价格稍高
    description: 'GLM-4.5-X 为 GLM-4.5 的极速版，在性能强劲的同时，生成速度可达 100 tokens/秒。',
  },
  {
    id: 'glm-4.5-air',
    name: 'GLM-4.5-Air',
    provider: 'bigmodel',
    modelId: 'glm-4.5-air',
    maxTokens: 128000,
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.000005, // 轻量版价格更低
    description: 'GLM-4.5-Air 为 GLM-4.5 的轻量版，兼顾性能与性价比，可灵活切换混合思考模型。',
  },
  {
    id: 'glm-4.5-airx',
    name: 'GLM-4.5-AirX',
    provider: 'bigmodel',
    modelId: 'glm-4.5-airx',
    maxTokens: 128000,
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0.000008, // Air极速版价格
    description: 'GLM-4.5-AirX 为 GLM-4.5-Air 的极速版，响应速度更快，专为大规模高速度需求打造。',
  },
  {
    id: 'glm-4.5-flash',
    name: 'GLM-4.5-Flash',
    provider: 'bigmodel',
    modelId: 'glm-4.5-flash',
    maxTokens: 128000,
    temperature: 0.7,
    supportVision: false,
    costPerToken: 0, // 免费版本
    description: 'GLM-4.5-Flash为GLM-4.5 的免费版本，推理、代码、智能体等任务表现出色。',
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
    logo: '/LLMBench/src/lib/model-logo/deepseek-logo.png',
    supportStream: true,  
  },
  aliyun: {
    id: 'aliyun',
    name: '阿里云百练',
    apiUrl: 'https://dashscope.aliyuncs.com/api/v1',
    icon: '☁️',
    color: '#FF6600',
    logo: '/LLMBench/src/lib/model-logo/qwen-logo.png',
    supportStream: true,
  },
  volcengine: {
    id: 'volcengine',
    name: '火山引擎',
    apiUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    icon: '🌋',
    color: '#1890FF',
    logo: '/LLMBench/src/lib/model-logo/doubao_logo.png',
    supportStream: true,
  },
  kimi: {
    id: 'kimi',
    name: 'Moonshot',
    apiUrl: 'https://api.moonshot.cn',
    icon: '🌙',
    color: '#6366F1',
    logo: '/LLMBench/src/lib/model-logo/kimi-logo.png',
    supportStream: true,
  },
  claude: {
    id: 'claude',
    name: '国外模型',
    apiUrl: 'https://api.302ai.cn/v1',
    icon: '✨',
    color: '#6A0DAD',
    logo: '/LLMBench/src/lib/model-logo/claude-logo.png',
    supportStream: true,
  },
  bigmodel: {
    id: 'bigmodel',
    name: '智谱AI',
    apiUrl: 'https://open.bigmodel.cn/api/paas/v4',
    icon: '🧠',
    color: '#1E88E5',
    logo: '/LLMBench/assets/bigmodel.png',
    supportStream: true,
  },
};