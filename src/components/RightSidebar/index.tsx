import React, { useState, useRef, useEffect } from 'react';
import { Send, Maximize2, Minimize2, Paperclip, Loader2, CheckCircle, Globe, Plus, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/store';
import { AVAILABLE_MODELS, PROVIDERS } from '@/lib/models';
import { toast } from 'sonner';

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
  onNewSession,
  onRestartLastMessage,
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
    createNewSession,
    getAllModels,
    isWebSearchEnabled,
    setWebSearchEnabled,
    getApiKey
  } = useAppStore();

  // 使用props或store中的数据
  const selectedModels = propSelectedModels || getCurrentSelectedModels();
  const isLoading = propIsLoading !== undefined ? propIsLoading : getCurrentIsLoading();
  
  // 检查智谱API密钥是否已配置
  const bigmodelApiKey = getApiKey('bigmodel');
  const canUseWebSearch = bigmodelApiKey && bigmodelApiKey.trim() !== '';
  
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

  // 输入框状态
  const [inputExpanded, setInputExpanded] = useState(false);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // 计算模型状态按钮的行数
  const getModelStatusRows = () => {
    if (!hasModelStatus) return 0;
    const buttonWidth = 120; // 预估每个按钮的宽度
    const containerWidth = 400; // 预估容器宽度
    const buttonsPerRow = Math.floor(containerWidth / buttonWidth);
    return Math.ceil(selectedModels.length / buttonsPerRow);
  };

  // 计算动态高度
  const getContainerHeight = () => {
    const modelStatusRows = getModelStatusRows();
    const baseHeight = inputExpanded ? 320 : 170; // 减少展开模式的基础高度
    const extraHeightForModelStatus = Math.max(0, modelStatusRows - 1) * 35; // 每额外行增加35px
    const totalHeight = baseHeight + extraHeightForModelStatus;
    
    // 限制最大高度，确保不超出屏幕（预留底部空间）
    const maxHeight = Math.min(totalHeight, windowHeight * 0.55); // 最大占屏幕55%
    return `${maxHeight}px`;
  };

  const getInputAreaHeight = () => {
    const baseHeight = inputExpanded ? 280 : 130; // 减少展开模式输入区域高度
    return `${baseHeight}px`;
  };



  // 跳转到对应模型的对话区域
  const scrollToModel = (modelId: string) => {
    // 优先使用传入的modelChatRefMap
    if (modelChatRefMap?.current?.[modelId]) {
      modelChatRefMap.current[modelId].scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    
    // 备用方案：通过ID查找元素
    // 先尝试多提示词模式的ID格式
    let modelElement = document.getElementById(`model-row-${modelId}`);
    if (modelElement) {
      modelElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    
    // 再尝试单提示词模式的ID格式
    modelElement = document.getElementById(`model-${modelId}`);
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

  // 重新生成响应
  const handleRegenerate = () => {
    if (!currentSessionData?.messages?.length) {
      toast.error('没有可重新生成的消息');
      return;
    }
    
    if (selectedModels.length === 0) {
      toast.error('请至少选择一个模型进行对比');
      return;
    }
    
    if (onRestartLastMessage) {
      onRestartLastMessage();
      toast.success('正在重新生成响应...');
    } else {
      toast.error('重新生成功能暂不可用');
    }
  };

  // 检查是否有模型状态需要显示
  const hasModelStatus = selectedModels.length > 0 && currentSessionData?.messages && currentSessionData.messages.length > 0;

  return (
    <div 
      className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300" 
      style={{ height: getContainerHeight() }}
    >
      {/* 模型状态按钮区域 - 只显示按钮，无标题和分割线 */}
      {hasModelStatus && (
        <div className="px-3 py-1.5 flex-shrink-0">
          <div className="flex flex-wrap gap-2 justify-start">
            {selectedModels.map((modelId) => {
              const model = getAllModels().find(m => m.id === modelId);
              if (!model) return null;

              const provider = PROVIDERS[model.provider];
              const lastMessage = currentSessionData.messages[currentSessionData.messages.length - 1];
              const response = currentSessionData?.responses?.[modelId]?.[lastMessage?.id];
              const isModelLoading = isLoading && response && !response.isComplete;
              const isComplete = response && response.isComplete;
              const hasError = response?.error;

              return (
                <button
                  key={modelId}
                  onClick={() => scrollToModel(modelId)}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-600/50 rounded-lg border border-gray-200/60 dark:border-gray-600/60 transition-all duration-200 text-sm min-w-0 max-w-[140px]"
                >
                  <div 
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: provider.color }}
                  />
                  <span className="text-gray-900 dark:text-white font-medium truncate">
                    {model.name}
                  </span>
                  <div className="flex-shrink-0">
                    {isModelLoading && (
                      <Loader2 size={12} className="text-blue-500 animate-spin" />
                    )}
                    {isComplete && !hasError && (
                      <CheckCircle size={12} className="text-green-500" />
                    )}
                    {hasError && (
                      <div className="w-3 h-3 rounded-full bg-red-500" title={`错误: ${response.error}`} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 输入区域 */}
      <div 
        className="px-3 py-1.5 flex-1 flex flex-col justify-between transition-all duration-300" 
        style={{ height: getInputAreaHeight() }}
      >
        {/* 文件预览 */}
        {selectedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative group">
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Upload ${index}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-3 h-3 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="移除图片"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 输入框容器 */}
        <div className="flex flex-col flex-1">
          {/* 输入框 */}
          <div className="relative bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 p-3 flex-1 mb-2">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="输入您的问题..."
              className="w-full bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:outline-none text-sm leading-relaxed"
                          rows={inputExpanded ? 6 : (hasModelStatus ? 1 : 2)}
            style={{
              maxHeight: inputExpanded ? '200px' : (hasModelStatus ? '50px' : '70px'),
              minHeight: inputExpanded ? '200px' : (hasModelStatus ? '50px' : '60px')
            }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendClick();
                }
              }}
            />
          </div>
          
          {/* 底部工具栏 - 紧贴输入框 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* 提示文字移到左侧 */}
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Enter 发送，Shift+Enter 换行
              </span>
            </div>
            
            <div className="flex items-center space-x-1">
              {/* 展开/收起按钮 - 移到最左侧 */}
              <button
                onClick={() => setInputExpanded(!inputExpanded)}
                className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                title={inputExpanded ? '收起' : '展开'}
              >
                {inputExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              
              {/* 上传文件按钮 */}
              <label className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer transition-colors rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600" title="上传文件">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Paperclip size={14} />
              </label>
              
              {/* 联网按钮 */}
              <button
                className={`p-1.5 transition-colors rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 ${
                  !canUseWebSearch ? 'text-gray-400 cursor-not-allowed' : 
                  isWebSearchEnabled ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                title={!canUseWebSearch ? "请先配置智谱API密钥以使用网络搜索功能" : isWebSearchEnabled ? "关闭网络搜索" : "开启网络搜索"}
                disabled={!canUseWebSearch}
                onClick={() => {
                  if (!canUseWebSearch) {
                    toast.error('请先在设置中配置智谱API密钥以使用网络搜索功能');
                    return;
                  }
                  setWebSearchEnabled(!isWebSearchEnabled);
                  toast.success(isWebSearchEnabled ? '网络搜索已关闭' : '网络搜索已开启');
                }}
              >
                <Globe size={14} />
              </button>
              
              {/* 新建对话按钮 */}
              <button
                onClick={() => {
                  if (onNewSession) {
                    onNewSession();
                  } else {
                    createNewSession();
                  }
                }}
                className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                title="新建对话"
              >
                <Plus size={14} />
              </button>
              
              {/* 重新生成按钮 */}
              <button
                onClick={handleRegenerate}
                disabled={!currentSessionData?.messages?.length || isLoading}
                className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="重新生成最后一次响应"
              >
                <RefreshCw size={14} />
              </button>
              
              {/* 发送按钮 */}
              <button
                onClick={handleSendClick}
                disabled={(!inputMessage.trim() && selectedFiles.length === 0) || isLoading}
                className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="发送"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
