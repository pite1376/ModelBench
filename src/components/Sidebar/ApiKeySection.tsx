import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store';
import { AIProvider } from '@/types';
import { validateApiKey } from '@/utils/helpers';
import { PROVIDERS } from '@/lib/models';
import { logger } from '@/utils/logger';
import { ExternalLink, CheckCircle, XCircle } from 'lucide-react';

interface ApiKeySectionProps {
  testingApi: Partial<Record<AIProvider, boolean>>;
  setTestingApi: (testing: Partial<Record<AIProvider, boolean>>) => void;
}

interface TestResult {
  success: boolean;
  message: string;
  timestamp: number;
}

export const ApiKeySection: React.FC<ApiKeySectionProps> = ({
  testingApi,
  setTestingApi
}) => {
  const { apiKeys, setApiKey } = useAppStore();
  const [testResults, setTestResults] = useState<Partial<Record<AIProvider, TestResult>>>({});

  // 自动清除测试结果的useEffect
  useEffect(() => {
    const timers: Record<string, NodeJS.Timeout> = {};
    
    Object.entries(testResults).forEach(([provider, result]) => {
      if (result && result.timestamp) {
        // 清除之前的定时器
        if (timers[provider]) {
          clearTimeout(timers[provider]);
        }
        
        // 设置5秒后清除结果
        timers[provider] = setTimeout(() => {
          setTestResults(prev => {
            const newResults = { ...prev };
            delete newResults[provider as AIProvider];
            return newResults;
          });
        }, 5000);
      }
    });
    
    // 清理函数
    return () => {
      Object.values(timers).forEach(timer => clearTimeout(timer));
    };
  }, [testResults]);

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

  // 模拟API连接测试（避免CORS跨域问题）
  const testApiConnection = async (provider: AIProvider) => {
    const apiKey = apiKeys[provider];
    if (!apiKey) return;
    
    setTestingApi({ ...testingApi, [provider]: true });
    
    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      
      // 验证API密钥格式
      const isValidFormat = validateApiKey(provider, apiKey);
      
      if (!isValidFormat) {
        throw new Error('API密钥格式不正确');
      }
      
      // 额外的格式验证规则
      let isValidKey = false;
      switch (provider) {
        case 'deepseek':
          // DeepSeek API密钥通常以sk-开头，长度在40-60字符
          isValidKey = apiKey.startsWith('sk-') && apiKey.length >= 40 && apiKey.length <= 60;
          break;
        case 'kimi':
          // Kimi API密钥格式验证
          isValidKey = apiKey.length >= 32 && /^[a-zA-Z0-9_-]+$/.test(apiKey);
          break;
        case 'claude':
          // Claude API密钥通常以sk-ant-开头
          isValidKey = apiKey.startsWith('sk-ant-') && apiKey.length >= 40;
          break;
        case 'volcengine':
          // 火山引擎API密钥格式
          isValidKey = apiKey.length >= 32 && /^[a-zA-Z0-9_-]+$/.test(apiKey);
          break;
        case 'aliyun':
          // 阿里云API密钥格式
          isValidKey = apiKey.startsWith('sk-') && apiKey.length >= 40;
          break;
        default:
          isValidKey = apiKey.length >= 20;
      }
      
      if (isValidKey) {
        setTestResults({
          ...testResults,
          [provider]: {
            success: true,
            message: 'API密钥格式验证通过',
            timestamp: Date.now()
          }
        });
        logger.info(`API key format validation successful for ${provider}`);
      } else {
        throw new Error('API密钥格式不符合要求');
      }
    } catch (error) {
      setTestResults({
        ...testResults,
        [provider]: {
          success: false,
          message: error instanceof Error ? error.message : 'API密钥验证失败',
          timestamp: Date.now()
        }
      });
      logger.error(`API key validation failed for ${provider}`, error);
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
                className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
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
              className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 placeholder-gray-400 dark:placeholder-gray-500"
            />
            
            {apiKeys[provider.id as AIProvider] && (
              <button
                onClick={() => testApiConnection(provider.id as AIProvider)}
                disabled={testingApi[provider.id as AIProvider]}
                className="px-3 py-2 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 rounded-md text-sm hover:bg-gray-700 dark:hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {testingApi[provider.id as AIProvider] ? '测试中...' : '测试'}
              </button>
            )}
          </div>
          
          {/* API Key 格式验证提示 */}
          {!validateApiKey(provider.id, apiKeys[provider.id as AIProvider] || '') && 
           apiKeys[provider.id as AIProvider] && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              API Key 格式不正确
            </p>
          )}
          
          {/* API 测试结果显示 */}
          {testResults[provider.id as AIProvider] && (
            <div className={`mt-2 flex items-center space-x-2 text-xs ${
              testResults[provider.id as AIProvider]?.success 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {testResults[provider.id as AIProvider]?.success ? (
                <CheckCircle size={14} />
              ) : (
                <XCircle size={14} />
              )}
              <span>{testResults[provider.id as AIProvider]?.message}</span>
              <span className="text-gray-400 dark:text-gray-500">
                {new Date(testResults[provider.id as AIProvider]?.timestamp || 0).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};