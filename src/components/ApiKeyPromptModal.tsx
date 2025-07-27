import React from 'react';
import { X, Key } from 'lucide-react';
import { PROVIDERS } from '@/lib/models';

interface ApiKeyPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerId: string;
  onGoToApiKey: () => void;
}

export const ApiKeyPromptModal: React.FC<ApiKeyPromptModalProps> = ({
  isOpen,
  onClose,
  providerId,
  onGoToApiKey,
}) => {
  if (!isOpen) return null;

  const provider = PROVIDERS[providerId as keyof typeof PROVIDERS];
  if (!provider) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* 背景点击关闭 */}
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />
      
      {/* 提示框内容 */}
      <div 
        className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        >
          <X size={20} className="text-gray-500 dark:text-gray-400" />
        </button>

        {/* 图标和标题 */}
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center mr-4">
            <Key size={24} className="text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              需要配置API密钥
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {provider.name}
            </p>
          </div>
        </div>

        {/* 提示内容 */}
        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            要使用 <span className="font-medium">{provider.name}</span> 的模型，请先配置相应的API密钥。
          </p>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              💡 您可以在个人信息页面的"API密钥配置"中添加密钥，
              <button 
                onClick={() => {
                  onGoToApiKey();
                  onClose();
                }}
                className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 ml-1"
              >
                点击去配置
              </button>
            </p>
          </div>
        </div>

        {/* 按钮区域 */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => {
              onGoToApiKey();
              onClose();
            }}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Key size={16} />
            <span>去配置</span>
          </button>
        </div>
      </div>
    </div>
  );
};