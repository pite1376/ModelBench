// 检查是否在浏览器环境
const isBrowser = typeof window !== 'undefined';

// 生成简单的 UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 生成/获取匿名用户ID（localStorage 持久化）
export function getOrCreateAnonymousId(): string {
  if (!isBrowser) return generateUUID(); // 服务器端生成临时ID
  
  const key = 'anonymous_user_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = generateUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

// 可选：简单浏览器指纹（可扩展为更复杂方案）
export function getBrowserFingerprint(): string {
  if (!isBrowser) return '';
  
  const { userAgent, language, platform } = navigator;
  return btoa([userAgent, language, platform].join('|'));
}

// 用户识别对象
export function getUserIdentity() {
  return {
    anonymousId: getOrCreateAnonymousId(),
    fingerprint: getBrowserFingerprint(),
  };
}

// 数据删除
export function clearUserIdentity() {
  if (!isBrowser) return;
  localStorage.removeItem('anonymous_user_id');
} 