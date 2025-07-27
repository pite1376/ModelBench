/**
 * 复制文本到剪贴板的通用函数
 * 支持现代 Clipboard API 和降级方案
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // 降级方案：直接使用传统的 document.execCommand，兼容性更好
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // 设置样式以避免影响页面布局，但要保证可见
    textArea.style.position = 'fixed';
    textArea.style.left = '0';
    textArea.style.top = '0';
    textArea.style.width = '1px';
    textArea.style.height = '1px';
    textArea.style.opacity = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.background = 'transparent';
    
    document.body.appendChild(textArea);
    textArea.select();
    textArea.setSelectionRange(0, text.length);
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (successful) {
      return true;
    }
    
    // 如果传统方法失败，再尝试现代 API
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    return false;
    
  } catch (err) {
    console.error('复制失败:', err);
    return false;
  }
}

/**
 * 带有用户反馈的复制函数
 * @param text 要复制的文本
 * @param button 按钮元素，用于显示反馈
 * @param successText 成功时显示的文本
 * @param duration 反馈显示的持续时间（毫秒）
 */
export async function copyWithFeedback(
  text: string,
  button?: HTMLButtonElement,
  successText: string = '已复制',
  duration: number = 1500
): Promise<boolean> {
  const success = await copyToClipboard(text);
  
  if (button) {
    const originalText = button.textContent;
    
    if (success) {
      button.textContent = successText;
      button.style.backgroundColor = '#10b981'; // green-500
      button.style.color = 'white';
    } else {
      button.textContent = '复制失败';
      button.style.backgroundColor = '#ef4444'; // red-500
      button.style.color = 'white';
    }
    
    setTimeout(() => {
      button.textContent = originalText;
      button.style.backgroundColor = '';
      button.style.color = '';
    }, duration);
  }
  
  return success;
} 