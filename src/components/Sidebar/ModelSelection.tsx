import React, { useState, useEffect, useRef } from 'react';
import { Settings } from 'lucide-react';
import { useAppStore } from '@/store';
import { getModelsByProviderGrouped, PROVIDERS } from '@/lib/models';
import type { ModelConfig } from '@/types';
// 移除不再使用的图标导入
import { ModelParametersModal } from './ModelParametersModal';
import { ApiKeyPromptModal } from '../ApiKeyPromptModal';
import { ModelManagement } from './ModelManagement';

interface ModelSelectionProps {
  onScrollToApiKey?: (providerId: string) => void;
}

export const ModelSelection: React.FC<ModelSelectionProps> = ({ onScrollToApiKey }) => {
  const { getCurrentSelectedModels, toggleModel, apiKeys, pageMode, getDisplayedModels, getAllModels } = useAppStore();
  const selectedModels = getCurrentSelectedModels();
  // 移除展开状态管理，因为已有悬浮弹窗显示模型
  const [settingsModal, setSettingsModal] = useState<{ isOpen: boolean; modelId: string }>({ 
    isOpen: false, 
    modelId: '' 
  });
  const [apiKeyPrompt, setApiKeyPrompt] = useState<{ isOpen: boolean; providerId: string }>({
    isOpen: false,
    providerId: ''
  });
  const [hoverPopup, setHoverPopup] = useState<{ isVisible: boolean; providerId: string; position: { x: number; y: number } }>({
    isVisible: false,
    providerId: '',
    position: { x: 0, y: 0 }
  });
  const [modelManagementOpen, setModelManagementOpen] = useState(false);
  // 移除不再使用的初始化引用
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 检查提供商是否有API密钥
  const isProviderAvailable = (provider: string) => {
    const providerKey = provider === 'doubao' ? 'volcengine' : provider;
    return !!apiKeys[providerKey as keyof typeof apiKeys];
  };

  // 检查模型是否可以被选择
  const canSelectModel = (modelId: string) => {
    const isSelected = selectedModels.includes(modelId);
    // 如果已经选中，可以取消选择
    if (isSelected) return true;
    
    // 如果是多提示词模式且已选择3个模型，不能再选择新的
    if (pageMode === 'advanced' && selectedModels.length >= 3) {
      return false;
    }
    
    return true;
  };

  // 移除展开状态初始化，因为不再需要展开功能

  // 移除切换展开功能，因为已有悬浮弹窗显示模型

  // 处理跳转到API密钥配置
  const handleGoToApiKey = () => {
    if (onScrollToApiKey) {
      onScrollToApiKey(apiKeyPrompt.providerId);
    }
  };

  // 处理鼠标悬浮显示模型列表
  const handleProviderHover = (event: React.MouseEvent, providerId: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    const rect = event.currentTarget.getBoundingClientRect();
    setHoverPopup({
      isVisible: true,
      providerId,
      position: {
        x: rect.right + 10,
        y: rect.top
      }
    });
  };

  // 处理鼠标离开
  const handleProviderLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoverPopup({
        isVisible: false,
        providerId: '',
        position: { x: 0, y: 0 }
      });
    }, 200); // 200ms延迟，避免鼠标快速移动时闪烁
  };

  // 处理悬浮窗鼠标进入
  const handlePopupEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  // 处理悬浮窗鼠标离开
  const handlePopupLeave = () => {
    setHoverPopup({
      isVisible: false,
      providerId: '',
      position: { x: 0, y: 0 }
    });
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const displayedModelIds = getDisplayedModels();
  const allModels = getAllModels();
  
  const allProviderGroups = Object.entries(
    allModels.reduce((groups, model) => {
      if (!groups[model.provider]) {
        groups[model.provider] = [];
      }
      groups[model.provider].push(model);
      return groups;
    }, {} as Record<string, (ModelConfig & { isCustom?: boolean })[]>)
  );
  
  // 只显示在displayedModels中的模型
  const providerGroups = allProviderGroups
    .map(([provider, models]) => ({
      id: provider,
      name: PROVIDERS[provider as keyof typeof PROVIDERS]?.name || provider,
      models: models.filter(model => displayedModelIds.includes(model.id))
    }))
    .filter(group => group.models.length > 0);

  return (
    <div className="space-y-2">
      {/* 显示模式和选择限制提示 - 只在有选择限制时显示 */}
      {pageMode === 'advanced' && selectedModels.length >= 3 && (
        <div className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-1 rounded-md">
          ⚠️ 多提示词模式：已达到最多3个模型的选择上限
        </div>
      )}
      
      {providerGroups.map((group) => {
        // const isAvailable = isProviderAvailable(group.id);
        
        return (
          <div key={group.id} className="border border-gray-200 dark:border-gray-600 rounded-lg">
            {/* 厂商标题栏 - 仅用于悬浮显示模型 */}
            <div
              onMouseEnter={(e) => handleProviderHover(e, group.id)}
              onMouseLeave={handleProviderLeave}
              className="w-full flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 flex items-center justify-center">
                  <img 
                    src={PROVIDERS[group.id as keyof typeof PROVIDERS]?.logo} 
                    alt={group.name} 
                    className="w-4 h-4 rounded object-contain"
                    onError={(e) => {
                      // 如果图片加载失败，显示emoji图标
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const emojiSpan = document.createElement('span');
                      emojiSpan.textContent = PROVIDERS[group.id as keyof typeof PROVIDERS]?.icon || '❓';
                      emojiSpan.className = 'text-sm';
                      target.parentNode?.appendChild(emojiSpan);
                    }}
                  />
                </div>
                <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
                  {group.name}
                </span>
              </div>
              {/* 移除展开/收起箭头 */}
            </div>

            {/* 移除模型列表显示，因为已有悬浮弹窗显示模型 */}
          </div>
        );
      })}
      
      {/* 显示当前选择状态 */}
      {selectedModels.length > 0 && (
        <div className="flex items-center justify-between text-xs text-green-600 bg-green-50 px-1.5 py-1 rounded-md mt-2">
          <span>✅ 已选择 {selectedModels.length}/{providerGroups.reduce((total, group) => total + group.models.length, 0)} 个模型</span>
          <button
            onClick={() => setModelManagementOpen(true)}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 ml-2"
            title="模型管理"
          >
            <Settings className="w-3 h-3" />
            <span>管理</span>
          </button>
        </div>
      )}
      
      {/* 当没有选择模型时也显示管理按钮 */}
      {selectedModels.length === 0 && (
        <div className="flex items-center justify-between text-xs text-amber-600 bg-amber-50 px-1.5 py-1 rounded-md mt-2">
          <span>⚠️ 请至少选择一个模型</span>
          <button
            onClick={() => setModelManagementOpen(true)}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 ml-2"
            title="模型管理"
          >
            <Settings className="w-3 h-3" />
            <span>管理</span>
          </button>
        </div>
      )}

      {/* 模型参数设置模态框 */}
      <ModelParametersModal
        isOpen={settingsModal.isOpen}
        modelId={settingsModal.modelId}
        onClose={() => setSettingsModal({ isOpen: false, modelId: '' })}
      />

      {/* API密钥提示框 */}
      <ApiKeyPromptModal
        isOpen={apiKeyPrompt.isOpen}
        providerId={apiKeyPrompt.providerId}
        onClose={() => setApiKeyPrompt({ isOpen: false, providerId: '' })}
        onGoToApiKey={handleGoToApiKey}
      />

      {/* 悬浮模型列表弹窗 */}
      {hoverPopup.isVisible && (() => {
        const hoveredGroup = providerGroups.find(g => g.id === hoverPopup.providerId);
        if (!hoveredGroup) return null;
        
        const isAvailable = isProviderAvailable(hoveredGroup.id);
        
        return (
          <div
            className="fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-4 max-w-xs custom-scrollbar"
            style={{
              left: `${hoverPopup.position.x}px`,
              top: `${hoverPopup.position.y}px`,
              maxHeight: '400px',
              overflowY: 'auto'
            }}
            onMouseEnter={handlePopupEnter}
            onMouseLeave={handlePopupLeave}
          >
            {!isAvailable && (
              <div className="mb-3 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                ⚠️ 请先配置 {hoveredGroup.name} 的 API 密钥，
                <button 
                  onClick={() => {
                    if (onScrollToApiKey) {
                      onScrollToApiKey(hoveredGroup.id);
                    }
                    setHoverPopup({ isVisible: false, providerId: '', position: { x: 0, y: 0 } });
                  }}
                  className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 ml-1"
                >
                  点击去配置
                </button>
              </div>
            )}
            
            {/* 模型列表 */}
            <div className="space-y-2">
              {hoveredGroup.models.map(model => {
                const isSelected = selectedModels.includes(model.id);
                const canSelect = canSelectModel(model.id);
                const isDisabled = !isAvailable || !canSelect;
                
                return (
                  <div 
                    key={model.id} 
                    className={`flex items-start p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      id={`popup-${model.id}`}
                      checked={isSelected}
                      onChange={() => toggleModel(model.id)}
                      disabled={isDisabled}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50 mt-0.5"
                    />
                    <label 
                      htmlFor={`popup-${model.id}`} 
                      className={`ml-2 text-xs flex-1 cursor-pointer ${
                        isDisabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <span className="font-medium">{model.name}</span>
                          {model.isReasoner && (
                            <span className="text-xs text-gray-600 dark:text-gray-400" title="推理模型">🧠</span>
                          )}
                          {model.supportVision && (
                            <span className="text-xs text-green-600 dark:text-green-400" title="支持视觉">👁️</span>
                          )}
                        </div>
                        {isSelected && (
                          <span className="text-xs text-blue-600 dark:text-blue-400">✓</span>
                        )}
                      </div>
                      {model.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {model.description}
                        </div>
                      )}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
      
      {/* 模型管理弹窗 */}
      <ModelManagement
        isOpen={modelManagementOpen}
        onClose={() => setModelManagementOpen(false)}
      />
    </div>
  );
};