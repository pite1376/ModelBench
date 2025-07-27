// 统一日志管理系统
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
}

class Logger {
  private config: LogConfig;
  
  constructor(config: LogConfig = {
    level: 'info',
    enableConsole: process.env.NODE_ENV === 'development',
    enableRemote: false
  }) {
    this.config = config;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.config.level);
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const prefix = level.toUpperCase().padEnd(5);
    return `[${timestamp}] ${prefix} ${message}${data ? ` ${JSON.stringify(data)}` : ''}`;
  }

  debug(message: string, data?: any) {
    if (!this.shouldLog('debug')) return;
    if (this.config.enableConsole) {
      console.debug(this.formatMessage('debug', message, data));
    }
  }

  info(message: string, data?: any) {
    if (!this.shouldLog('info')) return;
    if (this.config.enableConsole) {
      console.info(this.formatMessage('info', message, data));
    }
  }

  warn(message: string, data?: any) {
    if (!this.shouldLog('warn')) return;
    if (this.config.enableConsole) {
      console.warn(this.formatMessage('warn', message, data));
    }
  }

  error(message: string, error?: any) {
    if (!this.shouldLog('error')) return;
    if (this.config.enableConsole) {
      console.error(this.formatMessage('error', message, error));
    }
  }

  // API专用日志方法
  apiRequest(provider: string, endpoint: string, data: any) {
    this.debug(`🚀 ${provider} API Request`, { endpoint, data });
  }

  apiResponse(provider: string, status: number, data: any) {
    this.debug(`✅ ${provider} API Response`, { status, data });
  }

  apiError(provider: string, error: any) {
    this.error(`❌ ${provider} API Error`, error);
  }

  // 流式响应专用日志
  streamStart(provider: string) {
    this.debug(`🔄 ${provider} Stream Started`);
  }

  streamChunk(provider: string, chunkIndex: number, content: string) {
    this.debug(`📝 ${provider} Stream Chunk ${chunkIndex}`, { content: content.substring(0, 50) + '...' });
  }

  streamEnd(provider: string, totalChunks: number, duration: number) {
    this.info(`✅ ${provider} Stream Completed`, { totalChunks, duration: `${duration}ms` });
  }
}

// 导出单例实例
export const logger = new Logger();

// 开发环境下暴露到全局，方便调试
if (process.env.NODE_ENV === 'development') {
  (window as any).__logger = logger;
} 