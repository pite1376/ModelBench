import { getUserIdentity } from '@/utils/userIdentity';

const ANALYTICS_KEY = 'analytics_events_cache';
const RETRY_KEY = 'analytics_retry_count';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1秒
const MAX_CACHE_SIZE = 1000; // 最大缓存事件数

// 事件类型定义
export type EventType = 
  // 用户行为事件
  | 'page_view' | 'page_leave' | 'button_click' | 'link_click'
  | 'form_submit' | 'search' | 'scroll' | 'resize'
  // 聊天相关事件
  | 'message_sent' | 'message_received' | 'message_regenerated'
  | 'session_created' | 'session_deleted' | 'model_selected'
  // 性能事件
  | 'page_load_time' | 'api_response_time' | 'error_occurred'
  // 业务事件
  | 'user_registered' | 'user_login' | 'user_logout'
  | 'settings_changed' | 'theme_changed' | 'language_changed'
  // 系统事件
  | 'app_start' | 'app_error' | 'network_status_change'
  // 管理员事件
  | 'admin_test';

export interface AnalyticsEvent {
  id: string;
  type: EventType;
  payload: Record<string, any>;
  timestamp: number;
  user_anonymous_id: string;
  user_id?: string;
  session_id?: string;
  page_url?: string;
  user_agent?: string;
  retry_count?: number;
}

// 检查是否在浏览器环境
const isBrowser = typeof window !== 'undefined';

// 生成唯一ID
function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 本地缓存管理
function getCache(): AnalyticsEvent[] {
  if (!isBrowser) return [];
  try {
    const cached = localStorage.getItem(ANALYTICS_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.warn('Failed to parse analytics cache:', error);
    return [];
  }
}

function setCache(events: AnalyticsEvent[]) {
  if (!isBrowser) return;
  try {
    // 限制缓存大小
    const limitedEvents = events.slice(-MAX_CACHE_SIZE);
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(limitedEvents));
  } catch (error) {
    console.warn('Failed to save analytics cache:', error);
    // 如果存储失败，清理一些旧事件
    const reducedEvents = events.slice(-Math.floor(MAX_CACHE_SIZE / 2));
    try {
      localStorage.setItem(ANALYTICS_KEY, JSON.stringify(reducedEvents));
    } catch {
      // 如果还是失败，清空缓存
      localStorage.removeItem(ANALYTICS_KEY);
    }
  }
}

// 获取重试次数
function getRetryCount(): number {
  if (!isBrowser) return 0;
  try {
    return parseInt(localStorage.getItem(RETRY_KEY) || '0', 10);
  } catch {
    return 0;
  }
}

// 设置重试次数
function setRetryCount(count: number) {
  if (!isBrowser) return;
  localStorage.setItem(RETRY_KEY, count.toString());
}

// 清除重试次数
function clearRetryCount() {
  if (!isBrowser) return;
  localStorage.removeItem(RETRY_KEY);
}

// 数据上传接口（带重试机制）
async function uploadEvents(events: AnalyticsEvent[]): Promise<boolean> {
  if (!events.length) return true;
  
  try {
    const { supabase } = await import('@/lib/supabaseClient');
    
    // 转换数据格式以匹配数据库schema
    const dbEvents = events.map(event => ({
      type: event.type,
      payload: event.payload,
      timestamp: event.timestamp,
      user_anonymous_id: event.user_anonymous_id,
      user_id: event.user_id || null
    }));
    
    const { error } = await supabase
      .from('analytics_events')
      .insert(dbEvents);
    
    if (error) {
      console.error('Analytics upload error:', error);
      throw error;
    }
    
    // Successfully uploaded events
    return true;
  } catch (error) {
    console.error('Analytics upload failed:', error);
    return false;
  }
}

// 带重试的上传函数
async function uploadWithRetry(events: AnalyticsEvent[]): Promise<boolean> {
  const retryCount = getRetryCount();
  
  if (retryCount >= MAX_RETRIES) {
    // Max retries reached for analytics upload
    clearRetryCount();
    return false;
  }
  
  const success = await uploadEvents(events);
  
  if (success) {
    clearRetryCount();
    return true;
  } else {
    const newRetryCount = retryCount + 1;
    setRetryCount(newRetryCount);
    
    // 延迟重试
    if (newRetryCount < MAX_RETRIES) {
      setTimeout(() => {
        uploadWithRetry(events);
      }, RETRY_DELAY * newRetryCount);
    }
    
    return false;
  }
}

// 埋点主函数
export async function trackEvent(type: EventType, payload: Record<string, any> = {}) {
  if (!isBrowser) return;
  
  // 检查用户是否允许收集
  try {
    const prefs = JSON.parse(localStorage.getItem('user_preferences') || '{}');
    if (prefs.allowAnalytics === false) return;
  } catch {
    // 如果解析失败，默认允许收集
  }

  const userIdentity = getUserIdentity();
  const event: AnalyticsEvent = {
    id: generateEventId(),
    type,
    payload: {
      ...payload,
      timestamp_iso: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    timestamp: Date.now(),
    user_anonymous_id: userIdentity.anonymousId,
    page_url: window.location.href,
    user_agent: navigator.userAgent,
  };
  
  // 本地缓存
  const cache = getCache();
  cache.push(event);
  setCache(cache);

  // 异步上报（如果在线）
  if (navigator.onLine) {
    // 不等待上传完成，避免阻塞用户操作
    flushEvents().catch(error => {
      console.warn('Failed to flush events:', error);
    });
  }
}

// 批量上传并清理本地缓存
export async function flushEvents(): Promise<boolean> {
  if (!isBrowser) return false;
  
  const cache = getCache();
  if (cache.length === 0) return true;
  
  const success = await uploadWithRetry(cache);
  
  if (success) {
    setCache([]);
    // Analytics events flushed successfully
  }
  
  return success;
}

// 便捷的埋点函数
export const analytics = {
  // 页面访问
  pageView: (page: string, additionalData?: Record<string, any>) => 
    trackEvent('page_view', { page, ...additionalData }),
  
  // 按钮点击
  buttonClick: (buttonName: string, location?: string) => 
    trackEvent('button_click', { button_name: buttonName, location }),
  
  // 用户行为
  userAction: (action: string, details?: Record<string, any>) => 
    trackEvent('button_click', { action, ...details }),
  
  // 错误追踪
  error: (error: Error, context?: string) => 
    trackEvent('error_occurred', { 
      error_message: error.message, 
      error_stack: error.stack,
      context 
    }),
  
  // 性能监控
  performance: (metric: string, value: number, unit?: string) => 
    trackEvent('page_load_time', { metric, value, unit }),
  
  // 聊天相关
  chat: {
    messageSent: (modelName: string, messageLength: number, responseTime?: number) => 
      trackEvent('message_sent', { model_name: modelName, message_length: messageLength, response_time: responseTime }),
    
    sessionCreated: (models: string[]) => 
      trackEvent('session_created', { selected_models: models }),
    
    modelSelected: (modelName: string, previousModel?: string) => 
      trackEvent('model_selected', { model_name: modelName, previous_model: previousModel })
  }
};

// 自动事件监听
if (isBrowser) {
  // 网络状态变化
  window.addEventListener('online', () => {
    trackEvent('network_status_change', { status: 'online' });
    flushEvents().catch(console.warn);
  });
  
  window.addEventListener('offline', () => {
    trackEvent('network_status_change', { status: 'offline' });
  });
  
  // 页面卸载时尝试发送剩余事件
  window.addEventListener('beforeunload', () => {
    const cache = getCache();
    if (cache.length > 0) {
      // 使用 sendBeacon API 在页面卸载时发送数据
      navigator.sendBeacon && navigator.sendBeacon('/api/analytics', JSON.stringify(cache));
    }
  });
  
  // 页面可见性变化
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      trackEvent('page_leave', { page: window.location.pathname });
    } else {
      trackEvent('page_view', { page: window.location.pathname });
    }
  });
  
  // 定期清理和上传（每5分钟）
  setInterval(() => {
    if (navigator.onLine) {
      flushEvents().catch(console.warn);
    }
  }, 5 * 60 * 1000);
}