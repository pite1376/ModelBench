import { getUserIdentity } from '@/utils/userIdentity';

const ANALYTICS_KEY = 'analytics_events_cache';

export interface AnalyticsEvent {
  type: string;
  payload: any;
  timestamp: number;
  user: ReturnType<typeof getUserIdentity>;
}

// 检查是否在浏览器环境
const isBrowser = typeof window !== 'undefined';

// 本地缓存
function getCache(): AnalyticsEvent[] {
  if (!isBrowser) return [];
  try {
    return JSON.parse(localStorage.getItem(ANALYTICS_KEY) || '[]');
  } catch {
    return [];
  }
}
function setCache(events: AnalyticsEvent[]) {
  if (!isBrowser) return;
  localStorage.setItem(ANALYTICS_KEY, JSON.stringify(events));
}

// 上报接口（可用 Supabase/自建 API/第三方）
async function uploadEvents(events: AnalyticsEvent[]) {
  // 示例：Supabase
  try {
    const { supabase } = await import('@/lib/supabaseClient');
    const { error } = await supabase
      .from('analytics_events')
      .insert(events);
    
    if (error) {
      console.error('Analytics upload error:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Analytics upload failed:', e);
    return false;
  }
}

// 埋点主函数
export async function trackEvent(type: string, payload: any) {
  if (!isBrowser) return;
  
  // 检查用户是否允许收集
  const prefs = JSON.parse(localStorage.getItem('user_preferences') || '{}');
  if (prefs.allowAnalytics === false) return;

  const event: AnalyticsEvent = {
    type,
    payload,
    timestamp: Date.now(),
    user: getUserIdentity(),
  };
  // 本地缓存
  const cache = getCache();
  cache.push(event);
  setCache(cache);

  // 异步上报
  if (navigator.onLine) {
    await flushEvents();
  }
}

// 批量上传并清理本地缓存
export async function flushEvents() {
  if (!isBrowser) return;
  
  const cache = getCache();
  if (cache.length === 0) return;
  const success = await uploadEvents(cache);
  if (success) setCache([]);
}

// 网络恢复时自动上传
if (isBrowser) {
  window.addEventListener('online', () => {
    flushEvents();
  });
} 