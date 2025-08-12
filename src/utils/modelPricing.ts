// 模型费用计算工具函数

interface UsageData {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens?: number;
}

interface ModelPricing {
  inputPrice: number; // 输入价格（元/百万tokens）
  outputPrice: number; // 输出价格（元/百万tokens）
}

// 获取模型定价信息
function getModelPricing(modelName: string, promptTokens: number = 0, completionTokens: number = 0): ModelPricing {
  const modelLower = modelName.toLowerCase();
  
  // GLM系列模型
  if (modelLower.includes('glm-4.5-flash')) {
    return { inputPrice: 0, outputPrice: 0 }; // 免费
  }
  
  if (modelLower.includes('glm-4.5-air')) {
    const promptK = promptTokens / 1000;
    const completionK = completionTokens / 1000;
    
    if (promptK <= 32 && completionK <= 0.2) {
      return { inputPrice: 0.8, outputPrice: 2 };
    } else if (promptK <= 32 && completionK > 0.2) {
      return { inputPrice: 0.8, outputPrice: 6 };
    } else if (promptK > 32 && promptK <= 128) {
      return { inputPrice: 1.2, outputPrice: 8 };
    }
    return { inputPrice: 1.2, outputPrice: 8 };
  }
  if (modelLower.includes('glm-4.5-v')) {
    const promptK = promptTokens / 1000;
    const completionK = completionTokens / 1000;
    
    if (promptK <= 32 && completionK <= 0.2) {
      return { inputPrice: 0.8, outputPrice: 2 };
    } else if (promptK <= 32 && completionK > 0.2) {
      return { inputPrice: 0.8, outputPrice: 6 };
    } else if (promptK > 32 && promptK <= 128) {
      return { inputPrice: 1.2, outputPrice: 8 };
    }
    return { inputPrice: 1.2, outputPrice: 8 };
  }
  if (modelLower.includes('glm-4.5-airx')) {
    const promptK = promptTokens / 1000;
    const completionK = completionTokens / 1000;
    
    if (promptK <= 32 && completionK <= 0.2) {
      return { inputPrice: 4, outputPrice: 12 };
    } else if (promptK <= 32 && completionK > 0.2) {
      return { inputPrice: 4, outputPrice: 16 };
    } else if (promptK > 32 && promptK <= 128) {
      return { inputPrice: 8, outputPrice: 32 };
    }
    return { inputPrice: 8, outputPrice: 32 };
  }
  
  if (modelLower.includes('glm-4.5-x')) {
    const promptK = promptTokens / 1000;
    const completionK = completionTokens / 1000;
    
    if (promptK <= 32 && completionK <= 0.2) {
      return { inputPrice: 8, outputPrice: 16 };
    } else if (promptK <= 32 && completionK > 0.2) {
      return { inputPrice: 12, outputPrice: 32 };
    } else if (promptK > 32 && promptK <= 128) {
      return { inputPrice: 16, outputPrice: 64 };
    }
    return { inputPrice: 16, outputPrice: 64 };
  }
  
  if (modelLower.includes('glm-4.5')) {
    const promptK = promptTokens / 1000;
    const completionK = completionTokens / 1000;
    
    if (promptK <= 32 && completionK <= 0.2) {
      return { inputPrice: 2, outputPrice: 8 };
    } else if (promptK <= 32 && completionK > 0.2) {
      return { inputPrice: 3, outputPrice: 14 };
    } else if (promptK > 32 && promptK <= 128) {
      return { inputPrice: 4, outputPrice: 16 };
    }
    return { inputPrice: 4, outputPrice: 16 };
  }
  
  // 火山引擎doubao系列
  if (modelLower.includes('doubao-seed-1.6-thinking')) {
    const promptK = promptTokens / 1000;
    
    if (promptK <= 32) {
      return { inputPrice: 0.8, outputPrice: 8 };
    } else if (promptK <= 128) {
      return { inputPrice: 1.2, outputPrice: 16 };
    } else if (promptK <= 256) {
      return { inputPrice: 2.4, outputPrice: 24 };
    }
    return { inputPrice: 2.4, outputPrice: 24 };
  }
  
  if (modelLower.includes('doubao-seed-1.6-flash')) {
    const promptK = promptTokens / 1000;
    
    if (promptK <= 32) {
      return { inputPrice: 0.15, outputPrice: 1.5 };
    } else if (promptK <= 128) {
      return { inputPrice: 0.3, outputPrice: 3 };
    } else if (promptK <= 256) {
      return { inputPrice: 0.6, outputPrice: 6 };
    }
    return { inputPrice: 0.6, outputPrice: 6 };
  }
  
  if (modelLower.includes('doubao-seed-1.6')) {
    const promptK = promptTokens / 1000;
    const completionK = completionTokens / 1000;
    
    if (promptK <= 32 && completionK <= 0.2) {
      return { inputPrice: 0.8, outputPrice: 2 };
    } else if (promptK <= 32 && completionK > 0.2) {
      return { inputPrice: 0.8, outputPrice: 8 };
    } else if (promptK <= 128) {
      return { inputPrice: 1.2, outputPrice: 16 };
    } else if (promptK <= 256) {
      return { inputPrice: 2.4, outputPrice: 24 };
    }
    return { inputPrice: 2.4, outputPrice: 24 };
  }
  
  if (modelLower.includes('doubao-1.5-pro-32k') || modelLower.includes('doubao-pro-32k')) {
    return { inputPrice: 0.8, outputPrice: 2 };
  }
  
  if (modelLower.includes('doubao-1.5-pro-256k') || modelLower.includes('doubao-pro-256k')) {
    return { inputPrice: 5, outputPrice: 9 };
  }
  
  if (modelLower.includes('doubao-1.5-lite-32k')) {
    return { inputPrice: 0.3, outputPrice: 0.6 };
  }
  
  // 通义千问系列
  if (modelLower.includes('qwen3-235b-a22b-thinking-2507')) {
    return { inputPrice: 2, outputPrice: 20 }; // 转换为百万token单位
  }
  
  if (modelLower.includes('qwen3-235b-a22b-instruct-2507')) {
    return { inputPrice: 2, outputPrice: 8 }; // 转换为百万token单位
  }
  
  if (modelLower.includes('qwen3-30b-a3b-thinking-2507')) {
    return { inputPrice: 0.75, outputPrice: 7.5 }; // 转换为百万token单位
  }
  
  if (modelLower.includes('qwen3-30b-a3b-instruct-2507')) {
    return { inputPrice: 0.75, outputPrice: 3 }; // 转换为百万token单位
  }
  
  if (modelLower.includes('qwen') && modelLower.includes('max')) {
    return { inputPrice: 2.4, outputPrice: 9.6 }; // 转换为百万token单位
  }
  
  if (modelLower.includes('qwen') && modelLower.includes('plus')) {
    return { inputPrice: 0.8, outputPrice: 2 }; // 转换为百万token单位
  }
  
  if (modelLower.includes('qwen') && modelLower.includes('flash')) {
    return { inputPrice: 0.15, outputPrice: 1.5 }; // 转换为百万token单位
  }
  
  if (modelLower.includes('qwen') && modelLower.includes('coder')) {
    return { inputPrice: 1, outputPrice: 4 }; // 转换为百万token单位
  }
  
  // moonshot系列
  if (modelLower.includes('moonshot-v1-8k')) {
    return { inputPrice: 2, outputPrice: 10 };
  }
  
  if (modelLower.includes('moonshot-v1-32k')) {
    return { inputPrice: 5, outputPrice: 20 };
  }
  
  if (modelLower.includes('moonshot-v1-128k')) {
    return { inputPrice: 10, outputPrice: 30 };
  }
  
  if (modelLower.includes('kimi-k2-0711-preview')) {
    return { inputPrice: 4, outputPrice: 16 }; // 使用缓存未命中价格
  }
  
  if (modelLower.includes('kimi-k2-turbo-preview')) {
    return { inputPrice: 16, outputPrice: 64 }; // 使用缓存未命中价格
  }
  
  // Deepseek系列
  if (modelLower.includes('deepseek-chat')) {
    return { inputPrice: 2, outputPrice: 8 }; // 使用缓存未命中价格
  }
  
  if (modelLower.includes('deepseek-reasoner')) {
    return { inputPrice: 4, outputPrice: 16 }; // 使用缓存未命中价格
  }
  
  // Claude系列
  if (modelLower.includes('claude-opus-4-20250805')) {
    return { inputPrice: 115.5, outputPrice: 577.5 }; // 最新Claude4-Opus，上下文长度200000 tokens
  }
  
  if (modelLower.includes('claude-sonnet-4-20250514')) {
    return { inputPrice: 23.1, outputPrice: 115.5 }; // 最新Claude4，上下文长度200000 tokens
  }
  
  if (modelLower.includes('claude-opus-4-20250514')) {
    return { inputPrice: 115.5, outputPrice: 577.5 }; // 最新Claude4，上下文长度200000 tokens
  }
  
  if (modelLower.includes('claude-3-7-sonnet-20250219')) {
    return { inputPrice: 21, outputPrice: 105 }; // 最新Claude3.7，上下文长度200000 tokens
  }
  
  // Gemini系列
  if (modelLower.includes('gemini-2.5-flash-preview-05-20')) {
    return { inputPrice: 1.05, outputPrice: 24.5 }; // Gemini 2.5 Flash，上下文长度1000000 tokens
  }
  
  if (modelLower.includes('gemini-2.5-pro-preview-06-05')) {
    return { inputPrice: 8.75, outputPrice: 70 }; // <=200k tokens时的价格，上下文长度1000000 tokens
  }
  
  // GPT系列
  if (modelLower.includes('o3')) {
    return { inputPrice: 14, outputPrice: 56 }; // 最新o3，上下文长度200000 tokens
  }
  
  if (modelLower.includes('chatgpt-4o-latest')) {
    return { inputPrice: 35, outputPrice: 105 }; // 最新OpenAI模型，上下文长度128000 tokens
  }
  
  if (modelLower.includes('gpt-4o-search-preview')) {
    return { inputPrice: 17.5, outputPrice: 70 }; // 4o搜索版，上下文长度128000 tokens
  }
  
  if (modelLower.includes('gpt-4o-mini-search-preview')) {
    return { inputPrice: 1.05, outputPrice: 4.2 }; // 4o mini搜索版，上下文长度128000 tokens
  }
  
  if (modelLower.includes('gpt-4.1-mini')) {
    return { inputPrice: 2.8, outputPrice: 11.2 }; // 最新GPT 4.1 mini，上下文长度1000000 tokens
  }
  
  if (modelLower.includes('gpt-4.1')) {
    return { inputPrice: 14, outputPrice: 56 }; // 最新GPT 4.1，上下文长度1000000 tokens
  }
  
  if (modelLower.includes('gpt-4o')) {
    return { inputPrice: 17.5, outputPrice: 70 }; // 多模态GPT4.0，上下文长度128000 tokens
  }
  
  // 默认价格（如果模型不在上述列表中）
  return { inputPrice: 2, outputPrice: 8 };
}

// 计算模型使用费用
export function calculateModelCost(modelName: string, usage: UsageData): number {
  if (!usage || typeof usage.prompt_tokens !== 'number' || typeof usage.completion_tokens !== 'number') {
    return 0;
  }
  
  const pricing = getModelPricing(modelName, usage.prompt_tokens, usage.completion_tokens);
  
  // 费用计算公式：completion_tokens * 输出单价/1000000 + prompt_tokens * 输入单价/1000000
  const inputCost = (usage.prompt_tokens * pricing.inputPrice) / 1000000;
  const outputCost = (usage.completion_tokens * pricing.outputPrice) / 1000000;
  
  return inputCost + outputCost;
}

// 格式化Token和费用显示（带响应时间）
export function formatTokenAndCost(modelName: string, usage: UsageData | null | undefined, responseTime?: number): string {
  // 检查usage是否存在且有有效的total_tokens
  if (!usage || typeof usage.total_tokens !== 'number' || usage.total_tokens <= 0) {
    return '计算中...';
  }
  
  // 使用真实的total_tokens值
  const totalTokens = usage.total_tokens;
  
  // 如果prompt_tokens为0或无效，使用估算值（通常为completion_tokens的20-30%）
  const promptTokens = (usage.prompt_tokens && usage.prompt_tokens > 0) 
    ? usage.prompt_tokens 
    : Math.max(1, Math.round((usage.completion_tokens || 0) * 0.25));
  
  const completionTokens = usage.completion_tokens || 0;
  
  // 创建完整的usage对象用于费用计算
  const completeUsage = {
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: totalTokens
  };
  
  const cost = calculateModelCost(modelName, completeUsage);
  const formattedCost = `¥${cost.toFixed(5)}`;
  
  // 格式化响应时间
  const timeDisplay = responseTime && responseTime > 0 
    ? ` （${responseTime}ms） ` 
    : '';
  
  return `tokens:${totalTokens} | 预估费用:${formattedCost}${timeDisplay}`;
}