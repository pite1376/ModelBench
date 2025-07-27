import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MessageSquare, Send, Maximize2, Minimize2, Paperclip, Loader2, CheckCircle, Globe, Plus } from 'lucide-react';
import { useAppStore } from '@/store';
import { AVAILABLE_MODELS, PROVIDERS } from '@/lib/models';

interface RightSidebarProps {
  onSendMessage?: () => void;
  onNewSession?: () => void;
  onRestartLastMessage?: () => void;
  onFileUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile?: (index: number) => void;
  currentSession?: any;
  selectedModels?: string[];
  isLoading?: boolean;
  pageMode?: string;
  modelChatRefMap?: React.MutableRefObject<{[key: string]: HTMLDivElement}>;
}

const RightSidebar: React.FC<RightSidebarProps> = ({
  onSendMessage,
  onFileUpload,
  removeFile,
  currentSession,
  selectedModels: propSelectedModels,
  isLoading: propIsLoading,
  modelChatRefMap
}) => {
  const {
    getCurrentSelectedModels,
    getCurrentSession,
    getCurrentIsLoading,
    inputMessage,
    setInputMessage,
    handleSendMessage,
    selectedFiles,
    setSelectedFiles,
    fileInputRef,
    createNewSession
  } = useAppStore();

  // 使用props或store中的数据
  const selectedModels = propSelectedModels || getCurrentSelectedModels();
  const isLoading = propIsLoading !== undefined ? propIsLoading : getCurrentIsLoading();
  
  // 添加状态来强制重新渲染
  const [forceUpdate, setForceUpdate] = useState(0);
  const [currentSessionData, setCurrentSessionData] = useState(currentSession || getCurrentSession());

  // 页面刷新后重新获取对话数据
  useEffect(() => {
    // 确保在组件挂载后重新获取当前会话数据
    const session = getCurrentSession();
    setCurrentSessionData(session);
    if (session && session.messages && session.messages.length > 0) {
      // 强制重新渲染以显示对话历史
      console.log('重新加载对话历史:', session.messages.length, '条消息');
      setForceUpdate(prev => prev + 1);
    }
  }, [getCurrentSession]);
  
  // 监听store中会话数据的变化
  useEffect(() => {
    const session = currentSession || getCurrentSession();
    setCurrentSessionData(session);
  }, [currentSession, getCurrentSession, forceUpdate]);

  // 侧边栏状态
  const [isExpanded, setIsExpanded] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [inputExpanded, setInputExpanded] = useState(false);
  
  // 拖拽调整宽度的状态
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(sidebarWidth);
  const [tempWidth, setTempWidth] = useState(sidebarWidth);
  const animationFrameRef = useRef<number | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 拖拽处理函数
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isExpanded) return;
    
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(sidebarWidth);
    e.preventDefault();
  };

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      const deltaX = startX - e.clientX; // 右侧边栏向左拖拽增加宽度
      const newWidth = startWidth + deltaX;
      
      const minWidth = 280;
      const maxWidth = 500;
      const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      
      setTempWidth(constrainedWidth);
      
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        setSidebarWidth(constrainedWidth);
      }, 16);
    });
  }, [isResizing, startX, startWidth]);

  const handleMouseUp = React.useCallback(() => {
    setIsResizing(false);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    setSidebarWidth(tempWidth);
  }, [tempWidth]);

  // 添加全局鼠标事件监听
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // 同步tempWidth
  useEffect(() => {
    if (!isResizing) {
      setTempWidth(sidebarWidth);
    }
  }, [sidebarWidth, isResizing]);

  // 跳转到对应模型的对话区域
  const scrollToModel = (modelId: string) => {
    // 优先使用传入的modelChatRefMap
    if (modelChatRefMap?.current?.[modelId]) {
      modelChatRefMap.current[modelId].scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    
    // 备用方案：通过ID查找元素
    const modelElement = document.getElementById(`model-${modelId}`);
    if (modelElement) {
      modelElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onFileUpload) {
      onFileUpload(e);
    } else {
      const files = Array.from(e.target.files || []);
      setSelectedFiles([...selectedFiles, ...files]);
      e.target.value = '';
    }
  };

  // 移除文件
  const handleRemoveFile = (index: number) => {
    if (removeFile) {
      removeFile(index);
    } else {
      const newFiles = selectedFiles.filter((_, i) => i !== index);
      setSelectedFiles(newFiles);
    }
  };

  // 发送消息
  const handleSendClick = () => {
    if (!inputMessage.trim() && selectedFiles.length === 0) return;
    if (selectedModels.length === 0) {
      alert('请至少选择一个模型进行对比');
      return;
    }
    
    if (onSendMessage) {
      // 先设置store中的状态，然后调用App.tsx中的发送函数
      setInputMessage(inputMessage);
      setSelectedFiles(selectedFiles);
      onSendMessage();
      // 清空本地状态
      setInputMessage('');
      setSelectedFiles([]);
    } else {
      handleSendMessage();
    }
  };

  return (
    <div className="fixed top-1 right-1 z-50">
      {/* 收起状态的按钮组 - 位置移到页面中间 */}
      {!isExpanded && (
        <div
          className="flex flex-col space-y-3"
          style={{
            position: 'fixed',
            top: '50%',
            right: '20px',
            transform: 'translateY(-50%)',
            zIndex: 50
          }}
        >
          {/* 对话面板按钮 */}
          <button
            onClick={() => setIsExpanded(true)}
            className="w-12 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
            title="展开对话面板"
          >
            <img src="/modelbench-logo.svg" alt="ModelBench" className="w-6 h-6" />
          </button>
          
          {/* 新建对话按钮 */}
          <button
            onClick={() => {
              createNewSession();
              setIsExpanded(true);
            }}
            className="w-12 h-12 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center text-gray-700 dark:text-gray-300"
            title="新建对话"
          >
            <Plus size={20} />
          </button>
        </div>
      )}

      {/* 展开状态的侧边栏 - 与左侧边栏保持一致的样式 */}
      {isExpanded && (
        <div
          className={`
            bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
            rounded-lg shadow-xl flex flex-col overflow-hidden relative mr-1
            ${isResizing ? '' : 'transition-all duration-300 ease-in-out'}
          `}
          style={{
            width: isResizing ? `${tempWidth}px` : `${sidebarWidth}px`,
            height: 'calc(100vh - 0.5rem)',
            minWidth: '280px',
            maxWidth: '500px'
          }}
        >
          {/* 头部 - 与左侧边栏保持一致 */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-2">
              <img src="/modelbench-logo.svg" alt="ModelBench" className="w-4 h-4" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">对话面板</span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="收起面板"
            >
              <ChevronRight size={16} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* 对话区域 - 显示对话历史 */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
            <div className="space-y-0">
              {/* 当前输入预览 */}
              {inputMessage.trim() && (
                <div className="border-b border-gray-200 dark:border-gray-700 p-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                    <div className="text-xs text-blue-600 dark:text-blue-400 mb-1 font-medium">当前输入</div>
                    <div className="text-sm text-gray-900 dark:text-white break-words leading-relaxed">
                      {inputMessage}
                    </div>
                  </div>
                </div>
              )}

              {/* 对话历史 */}
              {currentSessionData?.messages && currentSessionData.messages.length > 0 ? (
                <div className="space-y-0">
                  {currentSessionData.messages.map((message, index) => (
                    <div key={message.id}>
                      {/* 用户消息 */}
                      <div className="p-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                          <div className="text-xs text-blue-600 dark:text-blue-400 mb-1 font-medium">
                            用户 · {new Date(message.timestamp).toLocaleTimeString()}
                          </div>
                          <div className="text-sm text-gray-900 dark:text-white break-words leading-relaxed">
                            {message.content}
                          </div>
                          {message.images && message.images.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {message.images.map((image, imgIndex) => (
                                <img
                                  key={imgIndex}
                                  src={image}
                                  alt={`附件 ${imgIndex + 1}`}
                                  className="w-16 h-16 object-cover rounded border border-blue-200 dark:border-blue-800"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 模型回复状态 */}
                      {selectedModels.length > 0 && (
                        <div className="px-4 pb-4">
                          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                            模型回复状态
                          </div>
                          <div className="space-y-2">
                            {selectedModels.map((modelId) => {
                              const model = AVAILABLE_MODELS.find(m => m.id === modelId);
                              if (!model) return null;

                              const provider = PROVIDERS[model.provider];
                              const response = currentSessionData?.responses?.[modelId]?.[message.id];
                              const isModelLoading = isLoading && response && !response.isComplete;
                              const hasResponse = response && response.content;
                              const isComplete = response && response.isComplete;

                              return (
                                <button
                                  key={modelId}
                                  onClick={() => scrollToModel(modelId)}
                                  className="w-full text-left p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-600/50 rounded-lg border border-gray-200/60 dark:border-gray-600/60 transition-all duration-200 group hover:shadow-sm"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                      <div 
                                        className="w-2.5 h-2.5 rounded-full"
                                        style={{ backgroundColor: provider.color }}
                                      />
                                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {model.name}
                                      </span>
                                      {isModelLoading && (
                                        <Loader2 size={12} className="text-blue-500 animate-spin" />
                                      )}
                                      {isComplete && (
                                        <CheckCircle size={12} className="text-green-500" />
                                      )}
                                    </div>
                                    <ChevronRight size={12} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                                  </div>
                                  {hasResponse && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                      {response.content.length > 60 ? 
                                        response.content.substring(0, 60) + '...' : 
                                        response.content
                                      }
                                    </div>
                                  )}
                                  {response?.error && (
                                    <div className="text-xs text-red-500 dark:text-red-400 line-clamp-1 leading-relaxed">
                                      错误: {response.error}
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                /* 空状态 */
                <div className="p-4">
                  <div className="text-center py-12">
                    <img src="/modelbench-logo.svg" alt="ModelBench" className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                      {selectedModels.length === 0 ? '请先选择模型开始对话' : '暂无对话记录'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 输入区域 - 固定在底部 */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
            {/* 文件预览 */}
            {selectedFiles.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Upload ${index}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      title="移除图片"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 现代化输入框 */}
            <div className="relative bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 p-3">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="输入您的问题..."
                className="w-full bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:outline-none text-sm leading-relaxed"
                rows={inputExpanded ? 6 : 2}
                style={{
                  maxHeight: inputExpanded ? '150px' : '60px',
                  minHeight: '40px'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendClick();
                  }
                }}
              />
              
              {/* 底部工具栏 */}
              <div className="flex items-center justify-between mt-2 pt-2">
                <div className="flex items-center space-x-2">
                  {/* 上传文件按钮 */}
                  <label className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer transition-colors rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600" title="上传文件">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <Paperclip size={16} />
                  </label>
                  
                  {/* 联网按钮（待开发） */}
                  <button
                    className="p-2 text-gray-400 cursor-not-allowed rounded-lg" 
                    title="联网功能（开发中）"
                    disabled
                  >
                    <Globe size={16} />
                  </button>
                  
                  {/* 新建对话按钮 */}
                  <button
                    onClick={() => {
                      createNewSession();
                    }}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                    title="新建对话"
                  >
                    <Plus size={16} />
                  </button>
                  
                  {/* 展开/收起按钮 */}
                  <button
                    onClick={() => setInputExpanded(!inputExpanded)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                    title={inputExpanded ? '收起' : '展开'}
                  >
                    {inputExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </button>
                </div>
                
                {/* 发送按钮 */}
                <button
                  onClick={handleSendClick}
                  disabled={(!inputMessage.trim() && selectedFiles.length === 0) || isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm transition-colors"
                >
                  <Send size={14} />
                  <span>发送</span>
                </button>
              </div>
              
              {/* 提示文字 */}
              <div className="mt-2">
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  Enter 发送，Shift+Enter 换行
                </span>
              </div>
            </div>
          </div>

          {/* 拖拽手柄 */}
          <div
            className={`
              absolute top-0 left-0 w-2 h-full cursor-col-resize group z-10
              ${isResizing ? 'bg-blue-500/20' : 'hover:bg-blue-500/10'}
              transition-colors duration-200
            `}
            onMouseDown={handleMouseDown}
          >
            <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1/2">
              <div className={`
                w-1 h-12 rounded-full transition-all duration-200
                ${isResizing 
                  ? 'bg-blue-500 w-1.5' 
                  : 'bg-gray-300 dark:bg-gray-600 group-hover:bg-blue-500 group-hover:w-1.5'
                }
              `}></div>
            </div>
            
            {isResizing && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="flex space-x-0.5">
                  <div className="w-0.5 h-3 bg-blue-500 rounded-full opacity-60"></div>
                  <div className="w-0.5 h-3 bg-blue-500 rounded-full opacity-80"></div>
                  <div className="w-0.5 h-3 bg-blue-500 rounded-full opacity-60"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RightSidebar;