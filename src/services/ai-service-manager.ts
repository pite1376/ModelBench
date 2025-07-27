import { logger } from '@/utils/logger';
import { AIService, AIServiceFactory } from './ai-service';
import { ChatRequest, ChatResponse, AIProvider, StreamCallback } from '@/types';

// 服务管理器配置
interface ServiceManagerConfig {
  maxConcurrentRequests: number;
  requestTimeout: number;
  retryAttempts: number;
  retryDelay: number;
}

// 请求队列项
interface QueueItem {
  id: string;
  provider: AIProvider;
  request: ChatRequest;
  resolve: (response: ChatResponse) => void;
  reject: (error: Error) => void;
  timestamp: number;
  retryCount: number;
}

// 流式请求队列项
interface StreamQueueItem {
  id: string;
  provider: AIProvider;
  request: ChatRequest;
  onChunk: StreamCallback;
  resolve: (response: ChatResponse) => void;
  reject: (error: Error) => void;
  timestamp: number;
  retryCount: number;
}

export class AIServiceManager {
  private services = new Map<AIProvider, AIService>();
  private requestQueue: QueueItem[] = [];
  private streamQueue: StreamQueueItem[] = [];
  private activeRequests = new Set<string>();
  private config: ServiceManagerConfig;
  private isProcessing = false;

  constructor(config: Partial<ServiceManagerConfig> = {}) {
    this.config = {
      maxConcurrentRequests: 5,
      requestTimeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };
  }

  // 设置API密钥并初始化服务
  setApiKey(provider: AIProvider, apiKey: string): void {
    try {
      const service = AIServiceFactory.createService(provider, apiKey);
      this.services.set(provider, service);
      logger.info(`AI service initialized for ${provider}`);
    } catch (error) {
      logger.error(`Failed to initialize AI service for ${provider}`, error);
      throw error;
    }
  }

  // 移除服务
  removeService(provider: AIProvider): void {
    this.services.delete(provider);
    // 清理相关的队列项
    this.requestQueue = this.requestQueue.filter(item => item.provider !== provider);
    this.streamQueue = this.streamQueue.filter(item => item.provider !== provider);
    logger.info(`AI service removed for ${provider}`);
  }

  // 发送消息
  async sendMessage(provider: AIProvider, request: ChatRequest): Promise<ChatResponse> {
    return new Promise((resolve, reject) => {
      const queueItem: QueueItem = {
        id: this.generateRequestId(),
        provider,
        request,
        resolve,
        reject,
        timestamp: Date.now(),
        retryCount: 0
      };

      this.requestQueue.push(queueItem);
      this.processQueue();
    });
  }

  // 发送流式消息
  async sendMessageStream(
    provider: AIProvider,
    request: ChatRequest,
    onChunk: StreamCallback
  ): Promise<ChatResponse> {
    return new Promise((resolve, reject) => {
      const queueItem: StreamQueueItem = {
        id: this.generateRequestId(),
        provider,
        request,
        onChunk,
        resolve,
        reject,
        timestamp: Date.now(),
        retryCount: 0
      };

      this.streamQueue.push(queueItem);
      this.processStreamQueue();
    });
  }

  // 并发发送到多个提供商
  async sendToMultipleProviders(
    providers: AIProvider[],
    request: ChatRequest
  ): Promise<Record<string, ChatResponse | Error>> {
    const promises = providers.map(async (provider) => {
      try {
        const response = await this.sendMessage(provider, request);
        return { provider, response };
      } catch (error) {
        return { provider, error: error as Error };
      }
    });

    const results = await Promise.allSettled(promises);
    const output: Record<string, ChatResponse | Error> = {};

    results.forEach((result, index) => {
      const provider = providers[index];
      if (result.status === 'fulfilled') {
        output[provider] = result.value.response || result.value.error;
      } else {
        output[provider] = new Error(result.reason?.message || 'Unknown error');
      }
    });

    return output;
  }

  // 处理普通请求队列
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    if (this.activeRequests.size >= this.config.maxConcurrentRequests) {
      return;
    }

    this.isProcessing = true;

    while (
      this.requestQueue.length > 0 &&
      this.activeRequests.size < this.config.maxConcurrentRequests
    ) {
      const item = this.requestQueue.shift()!;
      this.processQueueItem(item);
    }

    this.isProcessing = false;
  }

  // 处理流式请求队列
  private async processStreamQueue(): Promise<void> {
    if (this.streamQueue.length === 0) {
      return;
    }

    if (this.activeRequests.size >= this.config.maxConcurrentRequests) {
      return;
    }

    while (
      this.streamQueue.length > 0 &&
      this.activeRequests.size < this.config.maxConcurrentRequests
    ) {
      const item = this.streamQueue.shift()!;
      this.processStreamQueueItem(item);
    }
  }

  // 处理单个队列项
  private async processQueueItem(item: QueueItem): Promise<void> {
    const service = this.services.get(item.provider);
    if (!service) {
      item.reject(new Error(`No service available for provider: ${item.provider}`));
      return;
    }

    this.activeRequests.add(item.id);

    try {
      logger.apiRequest(item.provider, 'chat/completions', item.request);
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Request timeout after ${this.config.requestTimeout}ms`));
        }, this.config.requestTimeout);
      });

      const response = await Promise.race([
        service.sendMessage(item.request),
        timeoutPromise
      ]);

      logger.apiResponse(item.provider, 200, response);
      item.resolve(response);
    } catch (error) {
      logger.apiError(item.provider, error);
      await this.handleRequestError(item, error as Error);
    } finally {
      this.activeRequests.delete(item.id);
      // 继续处理队列
      setTimeout(() => this.processQueue(), 10);
    }
  }

  // 处理单个流式队列项
  private async processStreamQueueItem(item: StreamQueueItem): Promise<void> {
    const service = this.services.get(item.provider);
    if (!service) {
      item.reject(new Error(`No service available for provider: ${item.provider}`));
      return;
    }

    this.activeRequests.add(item.id);

    try {
      logger.streamStart(item.provider);
      
      const response = await service.sendMessageStream(item.request, (chunk) => {
        item.onChunk(chunk);
      });

      logger.streamEnd(item.provider, 0, Date.now() - item.timestamp);
      item.resolve(response);
    } catch (error) {
      logger.apiError(item.provider, error);
      await this.handleStreamError(item, error as Error);
    } finally {
      this.activeRequests.delete(item.id);
      // 继续处理队列
      setTimeout(() => this.processStreamQueue(), 10);
    }
  }

  // 处理请求错误
  private async handleRequestError(item: QueueItem, error: Error): Promise<void> {
    if (item.retryCount < this.config.retryAttempts) {
      item.retryCount++;
      logger.warn(`Retrying request for ${item.provider}, attempt ${item.retryCount}`);
      
      // 延迟重试
      setTimeout(() => {
        this.requestQueue.unshift(item);
        this.processQueue();
      }, this.config.retryDelay * item.retryCount);
    } else {
      item.reject(error);
    }
  }

  // 处理流式错误
  private async handleStreamError(item: StreamQueueItem, error: Error): Promise<void> {
    if (item.retryCount < this.config.retryAttempts) {
      item.retryCount++;
      logger.warn(`Retrying stream request for ${item.provider}, attempt ${item.retryCount}`);
      
      setTimeout(() => {
        this.streamQueue.unshift(item);
        this.processStreamQueue();
      }, this.config.retryDelay * item.retryCount);
    } else {
      item.reject(error);
    }
  }

  // 生成请求ID
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 获取服务状态
  getServiceStatus(): Record<AIProvider, boolean> {
    const status: Record<string, boolean> = {};
    (['deepseek', 'aliyun', 'volcengine', 'kimi', 'claude'] as AIProvider[]).forEach(provider => {
      status[provider] = this.services.has(provider);
    });
    return status as Record<AIProvider, boolean>;
  }

  // 获取队列状态
  getQueueStatus() {
    return {
      requestQueue: this.requestQueue.length,
      streamQueue: this.streamQueue.length,
      activeRequests: this.activeRequests.size,
      maxConcurrent: this.config.maxConcurrentRequests
    };
  }

  // 清空队列
  clearQueues(): void {
    this.requestQueue.forEach(item => {
      item.reject(new Error('Queue cleared'));
    });
    this.streamQueue.forEach(item => {
      item.reject(new Error('Queue cleared'));
    });
    
    this.requestQueue = [];
    this.streamQueue = [];
    logger.info('All queues cleared');
  }

  // 销毁管理器
  destroy(): void {
    this.clearQueues();
    this.services.clear();
    this.activeRequests.clear();
    logger.info('AI Service Manager destroyed');
  }
}

// 单例导出
export const aiServiceManager = new AIServiceManager(); 