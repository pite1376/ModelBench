import axios, { AxiosInstance } from 'axios';
import { ChatRequest, ChatResponse, Message, AIProvider, StreamCallback } from '@/types';
// Removed old web search import - using new webSearchService instead

// AI服务基类
export abstract class AIService {
  protected client: AxiosInstance;
  protected apiKey: string;
  protected baseURL: string;

  constructor(apiKey: string, baseURL: string) {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  abstract sendMessage(request: ChatRequest): Promise<ChatResponse>;
  abstract sendMessageStream(request: ChatRequest, onChunk: StreamCallback): Promise<ChatResponse>;
  abstract formatMessages(messages: Message[], systemPrompt?: string): any[];
  abstract calculateCost(tokens: number, model: string): number;
}

// DeepSeek AI服务
export class DeepSeekService extends AIService {
  constructor(apiKey: string) {
    super(apiKey, 'https://api.deepseek.com');
    this.client.defaults.headers['Authorization'] = `Bearer ${apiKey}`;
  }

  formatMessages(messages: Message[], systemPrompt?: string) {
    const formattedMessages = [];
    
    if (systemPrompt) {
      formattedMessages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    return formattedMessages.concat(
      messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }))
    );
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();
    
    try {
      const requestBody = {
        model: request.model,
        messages: this.formatMessages(request.messages, request.systemPrompt),
        temperature: request.temperature || 0.7,
        max_tokens: Math.min(request.maxTokens || 4096, 4096), // 确保不超过4096
        stream: false,
      };

      const response = await this.client.post('/v1/chat/completions', requestBody);

      const responseTime = Date.now() - startTime;
      const content = response.data.choices[0]?.message?.content || '';
      const usage = response.data.usage;
      
      // 如果usage为null或undefined，估算token数量
      let tokens = 0;
      let promptTokens = 0;
      let completionTokens = 0;
      
      if (usage && usage.total_tokens) {
        tokens = usage.total_tokens;
        promptTokens = usage.prompt_tokens || 0;
        completionTokens = usage.completion_tokens || 0;
      } else {
        // 估算token数量（基于字符数）
        const inputText = request.messages.map(m => m.content).join('');
        promptTokens = Math.ceil(inputText.length / 4); // 大约4个字符=1个token
        completionTokens = Math.ceil(content.length / 4);
        tokens = promptTokens + completionTokens;
        console.warn('火山引擎API未返回usage数据，使用估算值');
      }
      
      const cost = this.calculateCost(tokens, request.model);

      return {
        content,
        tokens,
        cost,
        responseTime,
        usage: {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: tokens
        }
      };
    } catch (error: any) {
      console.error('DeepSeek API Error:', error);
      const errorMessage = error.response?.data?.error?.message || 
                          error.response?.data?.message ||
                          error.message || 
                          '请求失败';
      throw new Error(`DeepSeek API错误: ${errorMessage}`);
    }
  }

  async sendMessageStream(request: ChatRequest, onChunk: StreamCallback): Promise<ChatResponse> {
    const startTime = Date.now();
    let firstResponseTime: number | undefined;
    
    try {
      let messages = this.formatMessages(request.messages, request.systemPrompt);
      
      const requestBody = {
        model: request.model,
        messages,
        temperature: request.temperature || 0.7,
        max_tokens: Math.min(request.maxTokens || 4096, 4096),
        stream: true,
      };

      const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DeepSeek Stream Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取流响应');
      }

      let content = '';
      let tokens = 0;
      const decoder = new TextDecoder();
      let chunkCount = 0;
      let isFirstChunk = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              const endTime = Date.now();
              onChunk({ 
                content: '', 
                finished: true, 
                tokens,
                responseTime: endTime - startTime,
                firstResponseTime: firstResponseTime ? firstResponseTime - startTime : undefined
              });
              break;
            }

            if (data) {
              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content || '';
                
                // 记录首次响应时间
                if (isFirstChunk && (delta || parsed.choices?.[0]?.delta?.reasoning_content)) {
                  firstResponseTime = Date.now();
                  isFirstChunk = false;
                }
                
                // 检查是否有reasoning_content字段（真实API返回）
                if (parsed.choices?.[0]?.delta?.reasoning_content) {
                  const reasoningDelta = parsed.choices?.[0]?.delta?.reasoning_content;
                  onChunk({ content: '', reasoning_content: reasoningDelta, finished: false });
                }
                
                if (delta) {
                  chunkCount++;
                  content += delta;
                  
                  // 立即调用回调函数
                  onChunk({ content: delta, finished: false });
                }
                // 检查usage数据 - moonshot在choices[0]中返回usage
                if (parsed.choices?.[0]?.usage?.total_tokens) {
                  tokens = parsed.choices[0].usage.total_tokens;
                } else if (parsed.usage?.total_tokens) {
                  tokens = parsed.usage.total_tokens;
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        }
      }

      const endTime = Date.now();
      const responseTime = endTime - startTime;
      const cost = this.calculateCost(tokens, request.model);
      
      // 估算prompt_tokens（通常为total_tokens的20-30%）
      const estimatedPromptTokens = Math.max(1, Math.round(tokens * 0.25));
      const estimatedCompletionTokens = Math.max(1, tokens - estimatedPromptTokens);
      
      return {
        content,
        tokens,
        cost,
        responseTime,
        usage: {
          prompt_tokens: estimatedPromptTokens,
          completion_tokens: estimatedCompletionTokens,
          total_tokens: tokens
        }
      };
    } catch (error: any) {
      console.error('❌ DeepSeek Stream API Error:', error);
      const errorMessage = error.message || '流式请求失败';
      throw new Error(`DeepSeek Stream API错误: ${errorMessage}`);
    }
  }

  calculateCost(tokens: number, model: string): number {
    // DeepSeek的价格（美元/1M tokens）
    const prices: Record<string, number> = {
      'deepseek-chat': 0.14,
      'deepseek-coder': 0.14,
      'deepseek-reasoner': 55,
    };
    
    const pricePerMillion = prices[model] || 0.14;
    return (tokens / 1000000) * pricePerMillion;
  }
}

// 阿里云百练服务 - 兼容模式 (OpenAI风格)
export class AliyunService extends AIService {
  constructor(apiKey: string) {
    super(apiKey, 'https://dashscope.aliyuncs.com/compatible-mode/v1');
    this.client.defaults.headers['Authorization'] = `Bearer ${apiKey}`;
    this.client.defaults.headers['Content-Type'] = 'application/json';
    this.client.defaults.headers['Accept'] = 'application/json';
    // 兼容模式不需要 X-DashScope-SSE 头部
  }

  // 估算token数量：中文随机1-1.8个token，英文随机1-1.5个token
  private estimateTokens(text: string): number {
    if (!text) return 0;
    
    let tokens = 0;
    for (const char of text) {
      // 检查是否为中文字符（包括中文标点）
      if (/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3000-\u303f\uff00-\uffef]/.test(char)) {
        // 中文字符随机1-1.8个token
        tokens += 1 + Math.random() * 0.8;
      } else {
        // 英文字符随机1-1.5个token
        tokens += 1 + Math.random() * 0.5;
      }
    }
    
    return Math.ceil(tokens);
  }

  formatMessages(messages: Message[], systemPrompt?: string) {
    const formattedMessages = [];
    
    if (systemPrompt) {
      formattedMessages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    return formattedMessages.concat(
      messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }))
    );
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();
    
    try {
      // 兼容模式 - OpenAI风格请求体
      const requestBody = {
        model: request.model,
        messages: this.formatMessages(request.messages, request.systemPrompt),
        temperature: request.temperature || 0.85,
        max_tokens: Math.min(request.maxTokens || 2000, 2000),
        top_p: 0.8,
        stream: false,
        include_usage: true  // 阿里云需要设置此参数才能返回usage信息
      };

      // 兼容模式端点
      const response = await this.client.post('/chat/completions', requestBody);

      const responseTime = Date.now() - startTime;
      
      // OpenAI风格响应解析
      const content = response.data.choices?.[0]?.message?.content || '';
      const usage = response.data.usage;
      
      // 如果usage为null或undefined，估算token数量
      let tokens = 0;
      let promptTokens = 0;
      let completionTokens = 0;
      
      if (usage && usage.total_tokens) {
        tokens = usage.total_tokens;
        promptTokens = usage.prompt_tokens || 0;
        completionTokens = usage.completion_tokens || 0;
      } else {
        // 估算token数量（中文随机1-1.8个token，英文随机1-1.5个token）
        const inputText = request.messages.map(m => m.content).join('');
        promptTokens = this.estimateTokens(inputText);
        completionTokens = this.estimateTokens(content);
        tokens = promptTokens + completionTokens;
        console.warn('阿里云API未返回usage数据，使用估算值:', { promptTokens, completionTokens, tokens });
      }
      
      const cost = this.calculateCost(tokens, request.model);

      return {
        content,
        tokens,
        cost,
        responseTime,
        usage: {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: tokens
        }
      };
    } catch (error: any) {
      console.error('Aliyun Compatible Mode API Error:', error);
      console.error('完整错误响应:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        headers: error.response?.headers,
        data: error.response?.data
      });
      
      let errorMessage = '请求失败';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        errorMessage = errorData.error?.message ||
                      errorData.message || 
                      errorData.code ||
                      `HTTP ${error.response.status}: ${JSON.stringify(errorData)}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(`阿里云API错误 (兼容模式): ${errorMessage}`);
    }
  }

  async sendMessageStream(request: ChatRequest, onChunk: StreamCallback): Promise<ChatResponse> {
    const startTime = Date.now();
    let firstResponseTime: number | undefined;
    
    try {
      // 阿里云兼容模式支持真正的流式输出
      const requestBody = {
        model: request.model,
        messages: this.formatMessages(request.messages, request.systemPrompt),
        temperature: request.temperature || 0.85,
        max_tokens: Math.min(request.maxTokens || 2000, 2000),
        top_p: 0.8,
        stream: true,
        include_usage: true  // 阿里云需要设置此参数才能在最后一个chunk返回usage信息
      };

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Aliyun Stream API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取流响应');
      }

      let content = '';
      let tokens = 0;
      let promptTokens = 0;
      let completionTokens = 0;
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              onChunk({ content: '', finished: true, tokens });
              break;
            }

            if (data) {
              try {
                const parsed = JSON.parse(data);
                console.log('阿里云流式响应chunk:', parsed);
                
                // 记录首次响应时间
                if (!firstResponseTime && (parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.delta?.reasoning_content)) {
                  firstResponseTime = Date.now();
                }
                
                // 检查是否有reasoning_content字段（真实API返回）
                if (parsed.choices?.[0]?.delta?.reasoning_content) {
                  const reasoningDelta = parsed.choices?.[0]?.delta?.reasoning_content;
                  onChunk({ content: '', reasoning_content: reasoningDelta, finished: false });
                }
                
                // 根据阿里云官方文档，检查是否为最后一个包含usage的chunk
                // 最后一个chunk的choices数组为空或不存在，但包含usage信息
                if (parsed.usage && parsed.usage.total_tokens) {
                  tokens = parsed.usage.total_tokens;
                  promptTokens = parsed.usage.prompt_tokens || 0;
                  completionTokens = parsed.usage.completion_tokens || 0;
                  console.log('✅ 阿里云获取到usage数据:', { tokens, promptTokens, completionTokens });
                  console.log('✅ 阿里云最后一个chunk，choices长度:', parsed.choices?.length || 0);
                  
                  const endTime = Date.now();
                  const responseTime = endTime - startTime;
                  // 重要：通过onChunk传递usage信息到前端
                  onChunk({ 
                    content: '', 
                    finished: true, 
                    tokens,
                    usage: {
                      prompt_tokens: promptTokens,
                      completion_tokens: completionTokens,
                      total_tokens: tokens
                    },
                    responseTime: responseTime,
                    firstResponseTime: firstResponseTime
                  });
                } else {
                  // 处理普通的内容chunk
                  const delta = parsed.choices?.[0]?.delta?.content || '';
                  if (delta) {
                    content += delta;
                    onChunk({ content: delta, finished: false });
                  }
                }
              } catch (e) {
                console.warn('解析阿里云流式响应失败:', e);
              }
            }
          }
        }
      }

      const responseTime = Date.now() - startTime;
      const cost = this.calculateCost(tokens, request.model);

      // 如果没有获取到tokens，估算token数量
      let finalTokens = tokens;
      
      if (finalTokens <= 0) {
        // 基于内容估算（中文随机1-1.8个token，英文随机1-1.5个token）
        const inputText = request.messages.map(m => m.content).join('');
        promptTokens = this.estimateTokens(inputText);
        completionTokens = this.estimateTokens(content);
        finalTokens = promptTokens + completionTokens;
        console.warn('阿里云流式API未返回usage数据，使用估算值:', { promptTokens, completionTokens, finalTokens });
        
        // 重要：通过onChunk传递估算的usage信息到前端
        onChunk({ 
          content: '', 
          finished: true, 
          tokens: finalTokens,
          usage: {
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            total_tokens: finalTokens
          }
        });
      } else {
        // 使用真实的usage数据
        console.log('阿里云使用真实usage数据:', { promptTokens, completionTokens, finalTokens });
      }
      
      return {
        content,
        tokens: finalTokens,
        cost,
        responseTime,
        usage: {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: finalTokens
        }
      };
    } catch (error: any) {
      console.error('Aliyun Stream API Error:', error);
      throw error; // 重新抛出原始错误
    }
  }

  calculateCost(tokens: number, model: string): number {
    // 阿里云的价格（美元/1M tokens）
    const prices: Record<string, number> = {
      'qwen-turbo': 0.8,
      'qwen-plus': 4,
      'qwen-max': 20,
      'qwen2-57b-a14b-instruct': 2,
    };
    
    const pricePerMillion = prices[model] || 1;
    return (tokens / 1000000) * pricePerMillion;
  }
}

// 火山引擎服务
export class VolcengineService extends AIService {
  constructor(apiKey: string) {
    super(apiKey, 'https://ark.cn-beijing.volces.com/api/v3');
    this.client.defaults.headers['Authorization'] = `Bearer ${apiKey}`;
  }

  formatMessages(messages: Message[], systemPrompt?: string): any[] {
    const formattedMessages: any[] = [];
    
    if (systemPrompt) {
      formattedMessages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    const messageList = messages.map(msg => {
      if (msg.images && msg.images.length > 0) {
        // 支持视觉模型
        return {
          role: msg.role,
          content: [
            { type: 'text', text: msg.content },
            ...msg.images.map(image => ({
              type: 'image_url',
              image_url: { url: image }, // 图片已经是data URL格式
            })),
          ],
        };
      }
      return {
        role: msg.role,
        content: msg.content,
      };
    });

    return [...formattedMessages, ...messageList];
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();
    
    try {
      const response = await this.client.post('/chat/completions', {
        model: request.model,
        messages: this.formatMessages(request.messages, request.systemPrompt),
        temperature: request.temperature || 0.7,
        max_tokens: Math.min(request.maxTokens || 4096, 4096), // 火山引擎严格限制为4096
        stream: false,
      });

      const responseTime = Date.now() - startTime;
      const content = response.data.choices[0]?.message?.content || '';
      const usage = response.data.usage;
      
      // 如果usage为null或undefined，估算token数量
      let tokens = 0;
      let promptTokens = 0;
      let completionTokens = 0;
      
      if (usage && usage.total_tokens) {
        tokens = usage.total_tokens;
        promptTokens = usage.prompt_tokens || 0;
        completionTokens = usage.completion_tokens || 0;
      } else {
        // 估算token数量（基于字符数）
        const inputText = request.messages.map(m => m.content).join('');
        promptTokens = Math.ceil(inputText.length / 4); // 大约4个字符=1个token
        completionTokens = Math.ceil(content.length / 4);
        tokens = promptTokens + completionTokens;
        console.warn('Moonshot API未返回usage数据，使用估算值');
      }
      
      const cost = this.calculateCost(tokens, request.model);

      return {
        content,
        tokens,
        cost,
        responseTime,
        usage: {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: tokens
        }
      };
    } catch (error: any) {
      console.error('Volcengine API Error:', error);
      const errorMessage = error.response?.data?.error?.message || 
                          error.response?.data?.message ||
                          error.message || 
                          '请求失败';
      throw new Error(`火山引擎API错误: ${errorMessage}`);
    }
  }

  async sendMessageStream(request: ChatRequest, onChunk: StreamCallback): Promise<ChatResponse> {
    const startTime = Date.now();
    let firstResponseTime: number | undefined;
    
    try {
      // 火山引擎支持真正的流式输出
      const requestBody = {
        model: request.model,
        messages: this.formatMessages(request.messages, request.systemPrompt),
        temperature: request.temperature || 0.7,
        max_tokens: Math.min(request.maxTokens || 4096, 4096),
        stream: true,
      };

      // Volcengine Stream API Request

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Volcengine Stream API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取流响应');
      }

      let content = '';
      let tokens = 0;
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              const endTime = Date.now();
              const responseTime = endTime - startTime;
              onChunk({ 
                content: '', 
                finished: true, 
                tokens,
                responseTime: responseTime,
                firstResponseTime: firstResponseTime
              });
              break;
            }

            if (data) {
              try {
                const parsed = JSON.parse(data);
                
                // 记录首次响应时间
                if (!firstResponseTime && (parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.delta?.reasoning_content)) {
                  firstResponseTime = Date.now();
                }
                
                // 检查是否有reasoning_content字段（真实API返回）
                if (parsed.choices?.[0]?.delta?.reasoning_content) {
                  const reasoningDelta = parsed.choices?.[0]?.delta?.reasoning_content;
                  onChunk({ content: '', reasoning_content: reasoningDelta, finished: false });
                }
                
                const delta = parsed.choices?.[0]?.delta?.content || '';
                if (delta) {
                  content += delta;
                  onChunk({ content: delta, finished: false });
                }
                // 检查usage数据 - moonshot在choices[0]中返回usage
                if (parsed.choices?.[0]?.usage?.total_tokens) {
                  tokens = parsed.choices[0].usage.total_tokens;
                } else if (parsed.usage?.total_tokens) {
                  tokens = parsed.usage.total_tokens;
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        }
      }

      const responseTime = Date.now() - startTime;
      const cost = this.calculateCost(tokens, request.model);

      // 如果没有获取到tokens，估算token数量
      let finalTokens = tokens;
      let promptTokens = 0;
      let completionTokens = 0;
      
      if (finalTokens > 0) {
        // 估算prompt_tokens（通常为total_tokens的20-30%）
        promptTokens = Math.max(1, Math.round(finalTokens * 0.25));
        completionTokens = Math.max(1, finalTokens - promptTokens);
      } else {
        // 基于内容估算
        const inputText = request.messages.map(m => m.content).join('');
        promptTokens = Math.ceil(inputText.length / 4);
        completionTokens = Math.ceil(content.length / 4);
        finalTokens = promptTokens + completionTokens;
        console.warn('火山引擎流式API未返回usage数据，使用估算值');
      }

      return {
        content,
        tokens: finalTokens,
        cost,
        responseTime,
        usage: {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: finalTokens
        }
      };
    } catch (error: any) {
      console.error('Volcengine Stream API Error:', error);
      throw error; // 重新抛出原始错误
    }
  }

  calculateCost(tokens: number, model: string): number {
    // 火山引擎的估计价格（美元/1M tokens）
    const prices: Record<string, number> = {
      'ep-20250424184643-vjbdz': 0.5, // 豆包 Pro 32K
      'doubao-pro-256k-241115': 1,
      'doubao-1.5-vision-pro-250328': 2,
    };
    
    const pricePerMillion = prices[model] || 1;
    return (tokens / 1000000) * pricePerMillion;
  }
}

// Kimi (Moonshot) AI服务
export class KimiService extends AIService {
  constructor(apiKey: string) {
    super(apiKey, 'https://api.moonshot.cn/v1');
    this.client.defaults.headers['Authorization'] = `Bearer ${apiKey}`;
  }

  formatMessages(messages: Message[], systemPrompt?: string) {
    const formattedMessages = [];
    
    if (systemPrompt) {
      formattedMessages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    return formattedMessages.concat(
      messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }))
    );
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();
    
    try {
      const requestBody = {
        model: request.model,
        messages: this.formatMessages(request.messages, request.systemPrompt),
        temperature: request.temperature || 0.3,
        max_tokens: Math.min(request.maxTokens || 2048, 128000), // Kimi 128k上下文
        stream: false,
      };

      const response = await this.client.post('/chat/completions', requestBody);

      const responseTime = Date.now() - startTime;
      const content = response.data.choices[0]?.message?.content || '';
      const usage = response.data.usage;
      
      // 如果usage为null或undefined，估算token数量
      let tokens = 0;
      let promptTokens = 0;
      let completionTokens = 0;
      
      if (usage && usage.total_tokens) {
        tokens = usage.total_tokens;
        promptTokens = usage.prompt_tokens || 0;
        completionTokens = usage.completion_tokens || 0;
      } else {
        // 估算token数量（基于字符数）
        const inputText = request.messages.map(m => m.content).join('');
        promptTokens = Math.ceil(inputText.length / 4); // 大约4个字符=1个token
        completionTokens = Math.ceil(content.length / 4);
        tokens = promptTokens + completionTokens;
        console.warn('DeepSeek API未返回usage数据，使用估算值');
      }
      
      const cost = this.calculateCost(tokens, request.model);

      return {
        content,
        tokens,
        cost,
        responseTime,
        usage: {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: tokens
        }
      };
    } catch (error: any) {
      console.error('Kimi API Error:', error);
      const errorMessage = error.response?.data?.error?.message || 
                          error.response?.data?.message ||
                          error.message || 
                          '请求失败';
      throw new Error(`Kimi API错误: ${errorMessage}`);
    }
  }

  async sendMessageStream(request: ChatRequest, onChunk: StreamCallback): Promise<ChatResponse> {
    const startTime = Date.now();
    let firstResponseTime: number | undefined;
    
    try {
      const requestBody = {
        model: request.model,
        messages: this.formatMessages(request.messages, request.systemPrompt),
        temperature: request.temperature || 0.3,
        max_tokens: Math.min(request.maxTokens || 2048, 128000),
        stream: true,
      };

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Kimi Stream Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }



      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取流响应');
      }

      let content = '';
      let tokens = 0;
      const decoder = new TextDecoder();
      let chunkCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              console.log('✅ Kimi 流式完成信号');
              const endTime = Date.now();
              const responseTime = endTime - startTime;
              onChunk({ 
                content: '', 
                finished: true, 
                tokens,
                responseTime: responseTime,
                firstResponseTime: firstResponseTime
              });
              break;
            }

            if (data) {
              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content || '';
                
                // 记录首次响应时间
                if (!firstResponseTime && (delta || parsed.choices?.[0]?.delta?.reasoning_content)) {
                  firstResponseTime = Date.now();
                }
                
                // 检查是否有reasoning_content字段（真实API返回）
                if (parsed.choices?.[0]?.delta?.reasoning_content) {
                  const reasoningDelta = parsed.choices?.[0]?.delta?.reasoning_content;
                  onChunk({ content: '', reasoning_content: reasoningDelta, finished: false });
                }
                
                if (delta) {
                  chunkCount++;
                  content += delta;
                  
                  // 立即调用回调函数
                  onChunk({ content: delta, finished: false });
                }
                
                // 检查usage数据 - moonshot在choices[0]中返回usage，通常在finish_reason为stop时
                if (parsed.choices?.[0]?.usage?.total_tokens) {
                  tokens = parsed.choices[0].usage.total_tokens;
                  console.log('✅ Moonshot usage数据获取成功:', parsed.choices[0].usage);
                } else if (parsed.usage?.total_tokens) {
                  tokens = parsed.usage.total_tokens;
                  console.log('✅ Moonshot usage数据获取成功:', parsed.usage);
                }
                
                // 检查是否为完成状态
                if (parsed.choices?.[0]?.finish_reason === 'stop' && tokens > 0) {
                  console.log('✅ Moonshot 流式完成，tokens:', tokens);
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        }
      }

      // 确保发送完成信号
      onChunk({ content: '', finished: true, tokens });

      const responseTime = Date.now() - startTime;
      const cost = this.calculateCost(tokens, request.model);

      // 如果没有获取到tokens，估算token数量
      let finalTokens = tokens;
      let promptTokens = 0;
      let completionTokens = 0;
      
      if (finalTokens > 0) {
        // 估算prompt_tokens（通常为total_tokens的20-30%）
        promptTokens = Math.max(1, Math.round(finalTokens * 0.25));
        completionTokens = Math.max(1, finalTokens - promptTokens);
      } else {
        // 基于内容估算
        const inputText = request.messages.map(m => m.content).join('');
        promptTokens = Math.ceil(inputText.length / 4);
        completionTokens = Math.ceil(content.length / 4);
        finalTokens = promptTokens + completionTokens;
        console.warn('Moonshot流式API未返回usage数据，使用估算值');
      }

      return {
        content,
        tokens: finalTokens,
        cost,
        responseTime,
        usage: {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: finalTokens
        }
      };
    } catch (error: any) {
      console.error('❌ Kimi Stream API Error:', error);
      const errorMessage = error.message || '流式请求失败';
      throw new Error(`Kimi Stream API错误: ${errorMessage}`);
    }
  }

  calculateCost(tokens: number, model: string): number {
    // Kimi (Moonshot) 的价格（美元/1M tokens）
    const prices: Record<string, number> = {
      'moonshot-v1-8k': 12,    // 12美元/1M tokens
      'moonshot-v1-32k': 24,   // 24美元/1M tokens  
      'moonshot-v1-128k': 60,  // 60美元/1M tokens
      'kimi-k2-0711-preview': 80,  // 80美元/1M tokens (估算)
    };
    
    const pricePerMillion = prices[model] || 12;
    return (tokens / 1000000) * pricePerMillion;
  }
}

// Claude AI服务 (302.AI API)
export class ClaudeService extends AIService {
  constructor(apiKey: string) {
    super(apiKey, 'https://api.302ai.cn/v1'); // 302.AI Claude API URL
    this.client.defaults.headers['Authorization'] = `Bearer ${apiKey}`;
    this.client.defaults.headers['Accept'] = 'application/json'; // Claude specific
  }

  formatMessages(messages: Message[], systemPrompt?: string): any[] {
    const formattedMessages: any[] = [];

    if (systemPrompt) {
      formattedMessages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    const mappedMessages = messages.map(msg => {
      // 如果有图片，使用多模态格式
      if (msg.images && msg.images.length > 0) {
        const content = [
          {
            type: 'text',
            text: msg.content
          },
          ...msg.images.map(image => ({
            type: 'image_url',
            image_url: {
              url: image,
              detail: 'auto'
            }
          }))
        ];
        
        return {
          role: msg.role,
          content
        };
      }
      
      // 纯文本消息
      return {
        role: msg.role,
        content: msg.content,
      };
    });

    return [...formattedMessages, ...mappedMessages];
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();

    try {
      const requestBody = {
        model: request.model,
        messages: this.formatMessages(request.messages, request.systemPrompt),
        temperature: request.temperature || 0.7,
        max_tokens: Math.min(request.maxTokens || 4096, 4096),
        stream: false,
      };

      const response = await this.client.post('/chat/completions', requestBody);

      const responseTime = Date.now() - startTime;
      const content = response.data.choices?.[0]?.message?.content || '';
      const usage = response.data.usage || {};
      const tokens = usage.total_tokens || 0;
      const cost = this.calculateCost(tokens, request.model);

      return {
        content,
        tokens,
        cost,
        responseTime,
        usage: {
          prompt_tokens: usage.prompt_tokens || 0,
          completion_tokens: usage.completion_tokens || 0,
          total_tokens: usage.total_tokens || 0
        }
      };
    } catch (error: any) {
      console.error('Claude API Error:', error);
      const errorMessage = error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        '请求失败';
      throw new Error(`Claude API错误: ${errorMessage}`);
    }
  }

  async sendMessageStream(request: ChatRequest, onChunk: StreamCallback): Promise<ChatResponse> {
    const startTime = Date.now();
    let firstResponseTime: number | undefined;

    try {
      const requestBody = {
        model: request.model,
        messages: this.formatMessages(request.messages, request.systemPrompt),
        temperature: request.temperature || 0.7,
        max_tokens: Math.min(request.maxTokens || 4096, 4096),
        stream: true,
      };

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Claude Stream Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }



      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取流响应');
      }

      let content = '';
      let tokens = 0;
      const decoder = new TextDecoder();
      let chunkCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              const endTime = Date.now();
              const responseTime = endTime - startTime;
              onChunk({ 
                content: '', 
                finished: true, 
                tokens,
                responseTime: responseTime,
                firstResponseTime: firstResponseTime
              });
              break;
            }

            if (data) {
              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content || '';
                
                // 记录首次响应时间
                if (!firstResponseTime && (delta || parsed.choices?.[0]?.delta?.reasoning_content)) {
                  firstResponseTime = Date.now();
                }
                
                // 检查是否有reasoning_content字段（真实API返回）
                if (parsed.choices?.[0]?.delta?.reasoning_content) {
                  const reasoningDelta = parsed.choices?.[0]?.delta?.reasoning_content;
                  onChunk({ content: '', reasoning_content: reasoningDelta, finished: false });
                }
                
                if (delta) {
                  chunkCount++;
                  content += delta;
                  
                  onChunk({ content: delta, finished: false });
                }
                if (parsed.usage?.total_tokens) {
                  tokens = parsed.usage.total_tokens;
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        }
      }

      onChunk({ content: '', finished: true, tokens });

      const responseTime = Date.now() - startTime;
      const cost = this.calculateCost(tokens, request.model);

      // 估算prompt_tokens（通常为total_tokens的20-30%）
      const estimatedPromptTokens = Math.max(1, Math.round(tokens * 0.25));
      const estimatedCompletionTokens = Math.max(1, tokens - estimatedPromptTokens);

      return {
        content,
        tokens,
        cost,
        responseTime,
        usage: {
          prompt_tokens: estimatedPromptTokens,
          completion_tokens: estimatedCompletionTokens,
          total_tokens: tokens
        }
      };
    } catch (error: any) {
      console.error('❌ Claude Stream API Error:', error);
      const errorMessage = error.message || '流式请求失败';
      throw new Error(`Claude Stream API错误: ${errorMessage}`);
    }
  }

  calculateCost(tokens: number, model: string): number {
    const prices: Record<string, number> = {
      // Claude 的价格（美元/1M tokens）
      'claude-sonnet-3-5-20240620': 3 / 1000000,   // Input 3/M, Output 15/M
      'claude-opus-20240229': 15 / 1000000,    // Input 15/M, Output 75/M
      'claude-sonnet-20240229': 3 / 1000000,   // Input 3/M, Output 15/M
      'claude-haiku-20240307': 0.25 / 1000000, // Input 0.25/M, Output 1.25/M
      'claude-3-sonnet-20240229': 3 / 1000000,
    };

    const pricePerMillion = prices[model] || 3 / 1000000;
    return tokens * pricePerMillion;
  }
}

// 智谱AI服务
export class BigModelService extends AIService {
  constructor(apiKey: string) {
    super(apiKey, 'https://open.bigmodel.cn/api/paas/v4');
    this.client.defaults.headers['Authorization'] = `Bearer ${apiKey}`;
  }

  formatMessages(messages: Message[], systemPrompt?: string) {
    const formattedMessages = [];
    
    if (systemPrompt) {
      formattedMessages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    return formattedMessages.concat(
      messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }))
    );
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();
    
    try {
      let messages = this.formatMessages(request.messages, request.systemPrompt);
      
      // Web search functionality moved to new webSearchService
      
      const requestBody = {
        model: request.model,
        messages,
        temperature: request.temperature || 0.7,
        max_tokens: Math.min(request.maxTokens || 4096, 4096),
        stream: false,
      };

      const response = await this.client.post('/chat/completions', requestBody);

      const responseTime = Date.now() - startTime;
      let content = response.data.choices[0]?.message?.content || '';
      const usage = response.data.usage || {};
      const tokens = usage.total_tokens || 0;
      const cost = this.calculateCost(tokens, request.model);
      
      return {
        content,
        tokens,
        cost,
        responseTime,
        usage: {
          prompt_tokens: usage.prompt_tokens || 0,
          completion_tokens: usage.completion_tokens || 0,
          total_tokens: usage.total_tokens || 0
        }
      };
    } catch (error: any) {
      console.error('BigModel API Error:', error);
      const errorMessage = error.response?.data?.error?.message || 
                          error.response?.data?.message ||
                          error.message || 
                          '请求失败';
      throw new Error(`智谱AI API错误: ${errorMessage}`);
    }
  }

  async sendMessageStream(request: ChatRequest, onChunk: StreamCallback): Promise<ChatResponse> {
    const startTime = Date.now();
    let firstResponseTime: number | undefined;
    
    try {
      const requestBody = {
        model: request.model,
        messages: this.formatMessages(request.messages, request.systemPrompt),
        temperature: request.temperature || 0.7,
        max_tokens: Math.min(request.maxTokens || 4096, 4096),
        stream: true,
      };

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('BigModel Stream Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }



      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取流响应');
      }

      let content = '';
      let tokens = 0;
      const decoder = new TextDecoder();
      let chunkCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              const endTime = Date.now();
              const responseTime = endTime - startTime;
              onChunk({ 
                content: '', 
                finished: true, 
                tokens,
                responseTime: responseTime,
                firstResponseTime: firstResponseTime
              });
              break;
            }

            if (data) {
              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content || '';
                
                // 记录首次响应时间
                if (!firstResponseTime && (delta || parsed.choices?.[0]?.delta?.reasoning_content)) {
                  firstResponseTime = Date.now();
                }
                
                // 检查是否有reasoning_content字段
                if (parsed.choices?.[0]?.delta?.reasoning_content) {
                  const reasoningDelta = parsed.choices?.[0]?.delta?.reasoning_content;
                  onChunk({ content: '', reasoning_content: reasoningDelta, finished: false });
                }
                
                if (delta) {
                  chunkCount++;
                  content += delta;
                  
                  onChunk({ content: delta, finished: false });
                }
                if (parsed.usage?.total_tokens) {
                  tokens = parsed.usage.total_tokens;
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        }
      }

      // 确保发送完成信号
      onChunk({ content: '', finished: true, tokens });

      const responseTime = Date.now() - startTime;
      const cost = this.calculateCost(tokens, request.model);

      return {
        content,
        tokens,
        cost,
        responseTime,
        usage: {
          prompt_tokens: 0, // 流式响应中通常不提供详细的token分解
          completion_tokens: tokens,
          total_tokens: tokens
        }
      };
    } catch (error: any) {
      console.error('❌ BigModel Stream API Error:', error);
      const errorMessage = error.message || '流式请求失败';
      throw new Error(`智谱AI流式API错误: ${errorMessage}`);
    }
  }

  calculateCost(tokens: number, model: string): number {
    // 智谱AI定价（示例价格，请根据实际定价调整）
    const costPerToken = {
      'glm-4.5': 0.00001,
      'glm-4.5-x': 0.000015,
      'glm-4.5-v': 0.000015,
      'glm-4.5-air': 0.000005,
      'glm-4.5-airx': 0.000008,
      'glm-4.5-flash': 0, // 免费版本
    };
    
    return tokens * (costPerToken[model as keyof typeof costPerToken] || 0.00001);
  }
}

// 服务工厂
export class AIServiceFactory {
  static createService(provider: AIProvider | string, apiKey: string): AIService {
    // 自动将'doubao'视为'volcengine'，兼容历史/错误用法
    if (provider === 'doubao') provider = 'volcengine';
    switch (provider) {
      case 'deepseek':
        return new DeepSeekService(apiKey);
      case 'aliyun':
        return new AliyunService(apiKey);
      case 'volcengine':
        return new VolcengineService(apiKey);
      case 'kimi':
        return new KimiService(apiKey);
      case 'claude':
        return new ClaudeService(apiKey);
      case 'bigmodel':
        return new BigModelService(apiKey);
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }
}

// 聊天服务
export class ChatService {
  private services: Map<string, AIService> = new Map();

  setApiKey(provider: AIProvider, apiKey: string) {
    if (apiKey.trim()) {
      const service = AIServiceFactory.createService(provider, apiKey);
      this.services.set(provider, service);
    } else {
      this.services.delete(provider);
    }
  }

  async sendMessage(provider: AIProvider, request: ChatRequest): Promise<ChatResponse> {
    const service = this.services.get(provider);
    if (!service) {
      throw new Error(`请先配置 ${provider} 的API密钥`);
    }

    return await service.sendMessage(request);
  }

  async sendMessageStream(provider: AIProvider, request: ChatRequest, onChunk: StreamCallback): Promise<ChatResponse> {
    const service = this.services.get(provider);
    if (!service) {
      throw new Error(`请先配置 ${provider} 的API密钥`);
    }

    return await service.sendMessageStream(request, onChunk);
  }

  async sendMessageToAll(
    providers: AIProvider[],
    request: ChatRequest
  ): Promise<Record<string, ChatResponse | Error>> {
    const results: Record<string, ChatResponse | Error> = {};

    const promises = providers.map(async (provider) => {
      try {
        const response = await this.sendMessage(provider, request);
        results[provider] = response;
      } catch (error) {
        results[provider] = error as Error;
      }
    });

    await Promise.allSettled(promises);
    return results;
  }
}

// 全局聊天服务实例
export const chatService = new ChatService();