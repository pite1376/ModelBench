import React, { useRef, useEffect, useState } from 'react';
import { useAppStore } from '@/store';
import { getModelById, PROVIDERS } from '@/lib/models';
import TypewriterEffect from '@/components/TypewriterEffect';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import ReasoningDisplay from '@/components/ReasoningDisplay';
import { ModelResponse, Message } from '@/types';
import { formatTokenAndCost } from '@/utils/modelPricing';

interface ModelResponseMatrixProps {
  currentResponses: { [key: string]: ModelResponse };
  isLoading: boolean;
  messages: Message[];
  onRegenerateResponse?: (modelId: string, themeId: string, versionId: string) => void;
}

export const ModelResponseMatrix: React.FC<ModelResponseMatrixProps> = ({
  currentResponses,
  isLoading,
  messages,
  onRegenerateResponse
}) => {
  const { 
    selectedModels, 
    selectedSystemPromptThemes, 
    systemPromptThemes, 
    getCurrentSession,
    isAdvancedNavigationVisible,
    advancedNavigationPosition,
    setAdvancedNavigationPosition
  } = useAppStore();
  const currentSession = getCurrentSession();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  // 导航拖拽状态
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const navigationRef = useRef<HTMLDivElement>(null);

  // 窗口大小监听
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 拖拽处理函数
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!navigationRef.current) return;
    
    const rect = navigationRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // 限制在窗口范围内
    const maxX = window.innerWidth - 120; // 导航宽度约为120px
    const maxY = window.innerHeight - 200; // 导航高度约为200px
    
    const constrainedX = Math.max(0, Math.min(maxX, newX));
    const constrainedY = Math.max(0, Math.min(maxY, newY));
    
    setAdvancedNavigationPosition({ x: constrainedX, y: constrainedY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 拖拽事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, dragOffset]);

  // 获取选中的主题和版本
  const themesWithVersions = selectedSystemPromptThemes.flatMap(themeId => {
    const theme = systemPromptThemes.find(t => t.id === themeId);
    if (!theme) return [];
    
    return theme.versions.map(version => ({
      theme,
      version
    }));
  });

  // 获取模型Logo
  const getModelLogo = (providerId: string) => {
    const provider = Object.values(PROVIDERS).find(p => p.id === providerId);
    return provider?.logo;
  };

  // 获取选中的模型数据
  const selectedModelsData = selectedModels.map(modelId => getModelById(modelId)).filter(Boolean) as any[];

  // 生成矩阵key
  const getMatrixKey = (themeId: string, versionId: string, modelId: string) => 
    `${themeId}_${versionId}_${modelId}`;

  // 获取模型的最新消息响应状态
  const getModelGenerationStatus = (modelId: string) => {
    if (!currentSession?.messages.length) return 'waiting';
    
    const lastMessage = currentSession.messages[currentSession.messages.length - 1];
    if (lastMessage.role !== 'user') return 'waiting';
    
    // 检查所有主题版本的响应状态
    let hasCompleted = false;
    let hasGenerating = false;
    
    for (const { theme, version } of themesWithVersions) {
      const matrixKey = getMatrixKey(theme.id, version.id, modelId);
      const response = currentResponses[matrixKey];
      
      if (response?.loading) {
        hasGenerating = true;
      } else if (response?.isComplete) {
        hasCompleted = true;
      }
    }
    
    if (hasGenerating) return 'generating';
    if (hasCompleted) return 'completed';
    return 'waiting';
  };

  if (selectedModelsData.length === 0 || themesWithVersions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-2">🎯 请选择模型和系统提示词主题</div>
        <div className="text-sm text-gray-400">
          {selectedModelsData.length === 0 && "请在左侧选择至少一个模型进行对比"}
          {selectedModelsData.length > 0 && themesWithVersions.length === 0 && "请在左侧选择至少一个系统提示词主题"}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full relative">
      {/* 固定表头：主题版本信息（横向） */}
      <div className="sticky top-0 bg-white dark:bg-gray-900 z-30 pb-2 pt-2 border-b border-gray-200 dark:border-gray-700"
           style={{ backdropFilter: 'blur(8px)' }}>
        <div className="w-full overflow-x-auto">
          <div style={{ minWidth: `${Math.max(600, themesWithVersions.length * 200 + 150)}px` }}>
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: `150px repeat(${themesWithVersions.length}, 1fr)`,
              }}
            >
              {/* 左上角区域 */}
              <div className="p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center">
                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  已选模型\（{selectedSystemPromptThemes.map(themeId => {
                    const theme = systemPromptThemes.find(t => t.id === themeId);
                    return theme?.name;
                  }).filter(Boolean).join('、')}）
                </span>
              </div>
              
              {/* 主题版本头部信息（横向排列） */}
              {themesWithVersions.map(({ theme, version }) => (
                <div key={`${theme.id}_${version.id}`} className="p-2 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg">
                  <div className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">
                    {version.name}
                  </div>
                  <div 
                    className="text-xs text-gray-600 dark:text-gray-400 leading-tight line-clamp-2 cursor-help" 
                    title={version.content}
                  >
                    {version.content.length > 60 
                      ? `${version.content.slice(0, 60)}...` 
                      : version.content
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 移除悬浮快速导航 */}

      {/* 主要内容区域 */}
      <div className="w-full overflow-x-auto pt-4">
        <div className="space-y-6" style={{ minWidth: `${Math.max(600, themesWithVersions.length * 200 + 150)}px` }}>
          {/* 矩阵内容：每个模型作为一行 */}
          {selectedModelsData.map((model) => {
            const generationStatus = getModelGenerationStatus(model.id);

            return (
              <div
                key={model.id}
                id={`model-row-${model.id}`}
                className="space-y-3"
              >
                {/* 模型信息和对话内容在同一个网格中 */}
                <div
                  className="grid gap-3"
                  style={{
                    gridTemplateColumns: `150px repeat(${themesWithVersions.length}, 1fr)`,
                  }}
                >
                  {/* 模型信息列 */}
                  <div className="flex flex-col space-y-3">
                    {/* 模型头部信息 */}
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 flex items-center justify-center">
                            <img 
                              src={getModelLogo(model.provider)} 
                              alt={model.provider}
                              className="w-6 h-6 rounded object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const provider = Object.values(PROVIDERS).find(p => p.id === model.provider);
                                const emoji = provider?.icon || '🤖';
                                const emojiSpan = document.createElement('span');
                                emojiSpan.textContent = emoji;
                                emojiSpan.className = 'text-sm';
                                target.parentNode?.appendChild(emojiSpan);
                              }}
                            />
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-900 dark:text-white">{model.name}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">{PROVIDERS[model.provider as keyof typeof PROVIDERS]?.name || model.provider}</div>
                          </div>
                        </div>

                        {/* 生成状态指示器 */}
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                              generationStatus === 'generating'
                                ? 'bg-yellow-400 animate-pulse'
                                : generationStatus === 'completed'
                                ? 'bg-green-500'
                                : 'bg-gray-300'
                            }`}
                            title={
                              generationStatus === 'generating'
                                ? '生成中...'
                                : generationStatus === 'completed'
                                ? '生成完成'
                                : '等待生成'
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 各个主题版本的详细对话 */}
                  {themesWithVersions.map(({ theme, version }) => {
                    const matrixKey = getMatrixKey(theme.id, version.id, model.id);
                    const response = currentResponses[matrixKey];

                    return (
                      <div key={`${theme.id}_${version.id}`} className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 min-h-[300px] flex flex-col">
                        {/* 对话内容区域 */}
                        <div className="p-4 h-full flex flex-col min-h-0">
                          <div className="flex-1 min-h-0 overflow-y-auto max-h-[400px] space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
                            {/* 显示完整的对话历史 */}
                            {messages.map((message, messageIndex) => {
                              // 获取当前消息的响应
                              const isLastMessage = messageIndex === messages.length - 1;
                              let messageResponse;
                              
                              if (isLastMessage) {
                                // 最新消息使用矩阵响应
                                messageResponse = response;
                              } else {
                                // 历史消息从会话响应中获取（使用标准模型ID）
                                messageResponse = currentSession?.responses?.[model.id]?.[message.id];
                              }

                              return (
                                <div key={message.id} className="space-y-2" data-message-id={message.id}>
                                  {/* 用户消息 */}
                                  <div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">用户</div>
                                    <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg text-sm">
                                      <div className="whitespace-pre-wrap">{message.content}</div>
                                      {message.images && message.images.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                          {message.images.map((image, idx) => (
                                            <img
                                              key={idx}
                                              src={image}
                                              alt={`上传的图片 ${idx + 1}`}
                                              className="max-w-[150px] max-h-[150px] rounded border object-cover"
                                            />
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* AI响应 */}
                                  {messageResponse && (
                                    <div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center space-x-2">
                                        <span>{model.name}</span>
                                        <span className="text-gray-400 dark:text-gray-500">| {formatTokenAndCost(model.name, messageResponse.usage, messageResponse.totalResponseTime || messageResponse.responseTime)}</span>
                                        {!messageResponse.isComplete && (
                                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                        )}
                                      </div>
                                      {/* 思考过程显示 */}
                                      {messageResponse.reasoning_content && (
                                        <ReasoningDisplay 
                                          content={messageResponse.reasoning_content}
                                          isLoading={!messageResponse.isComplete}
                                        />
                                      )}
                                      
                                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-sm">
                                        {!messageResponse.isComplete ? (
                                          <div className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">
                                            <TypewriterEffect 
                                              text={messageResponse.content}
                                              delay={30}
                                            />
                                          </div>
                                        ) : (
                                          <MarkdownRenderer content={messageResponse.content} />
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
