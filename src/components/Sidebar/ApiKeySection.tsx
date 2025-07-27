import React from 'react';
import { useAppStore } from '@/store';
import { AIProvider } from '@/types';
import { validateApiKey } from '@/utils/helpers';
import { PROVIDERS } from '@/lib/models';
import { logger } from '@/utils/logger';
import { ExternalLink } from 'lucide-react';

interface ApiKeySectionProps {
  testingApi: Partial<Record<AIProvider, boolean>>;
  setTestingApi: (testing: Partial<Record<AIProvider, boolean>>) => void;
}

export const ApiKeySection: React.FC<ApiKeySectionProps> = ({
  testingApi,
  setTestingApi
}) => {
  const { apiKeys, setApiKey } = useAppStore();

  const isProviderKeyFilled = (provider: string) => 
    !!apiKeys[(provider === 'doubao' ? 'volcengine' : provider) as AIProvider];

  // API密钥获取网站配置
  const getApiKeyUrl = (providerId: string): string => {
    const urlMap: Record<string, string> = {
      'volcengine': 'https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey?apikey=%7B%7D',
      'claude': 'https://share.302.ai/VYkzeg',
      'deepseek': 'https://platform.deepseek.com/usage',
      'kimi': 'https://platform.moonshot.cn/console/account',
      'aliyun': 'https://bailian.console.aliyun.com/?tab=model#/api-key'
    };
    return urlMap[providerId] || '';
  };

  const handleGetApiKey = (providerId: string) => {
    const url = getApiKeyUrl(providerId);
    if (url) {
      window.open(url, '_blank');
    }
  };

  const testApiConnection = async (provider: AIProvider) => {
    const apiKey = apiKeys[provider];
    if (!apiKey) return;
    
    setTestingApi({ ...testingApi, [provider]: true });
    
    try {
      // 这里可以添加实际的API测试逻辑
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟测试
      logger.info(`API connection test successful for ${provider}`);
    } catch (error) {
      logger.error(`API connection test failed for ${provider}`, error);
    } finally {
      setTestingApi({ ...testingApi, [provider]: false });
    }
  };

  return (
    <div className="space-y-4">
      {Object.values(PROVIDERS).map((provider: any) => (
        <div key={provider.id}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
            <div className="w-4 h-4 flex items-center justify-center">
              <img 
                src={provider.logo} 
                alt={provider.name} 
                className="w-4 h-4 rounded object-contain"
                onError={(e) => {
                  // 如果图片加载失败，显示emoji图标
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const emojiSpan = document.createElement('span');
                  emojiSpan.textContent = provider.icon;
                  emojiSpan.className = 'text-sm';
                  target.parentNode?.appendChild(emojiSpan);
                }}
              />
            </div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {provider.name}
            </label>
            {isProviderKeyFilled(provider.id) && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                已配置
              </span>
              )}
            </div>
            
            {/* 获取API密钥按钮 */}
            {getApiKeyUrl(provider.id) && (
              <button
                onClick={() => handleGetApiKey(provider.id)}
                className="flex items-center space-x-1 px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                title="获取API密钥"
              >
                <ExternalLink size={12} />
                <span>获取</span>
              </button>
            )}
          </div>
          
          <div className="flex space-x-2">
            <input
              id={`${provider.id}-api-key`}
              type="password"
              placeholder={`请输入 ${provider.name} API Key`}
              value={apiKeys[provider.id as AIProvider] || ''}
              onChange={(e) => setApiKey(provider.id as AIProvider, e.target.value)}
              className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
            />
            
            {apiKeys[provider.id as AIProvider] && (
              <button
                onClick={() => testApiConnection(provider.id as AIProvider)}
                disabled={testingApi[provider.id as AIProvider]}
                className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testingApi[provider.id as AIProvider] ? '测试中...' : '测试'}
              </button>
            )}
          </div>
          
          {!validateApiKey(provider.id, apiKeys[provider.id as AIProvider] || '') && 
           apiKeys[provider.id as AIProvider] && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              API Key 格式不正确
            </p>
          )}
        </div>
      ))}
    </div>
  );
}; 