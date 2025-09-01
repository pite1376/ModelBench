import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store';
import { chatService } from '@/services/ai-service';
import { DeepSeekService, AliyunService, VolcengineService, ClaudeService, KimiService, BigModelService } from '@/services/ai-service';
import { analytics } from '@/services/analytics';
import { AVAILABLE_MODELS, PROVIDERS } from '@/lib/models';
import { validateApiKey } from '@/utils/helpers';
import { Send, Settings, MessageSquare, ChevronDown, ChevronRight, Paperclip, Maximize2, Minimize2, Copy, RefreshCw, X } from 'lucide-react';
import { AIProvider, ModelResponse, Message, PageMode } from '@/types';
import useLocalStorage from '@/utils/hooks';
import { copyWithFeedback } from '@/utils/clipboard';
import TypewriterEffect from './components/TypewriterEffect';
import { Sidebar } from './components/Sidebar';
import RightSidebar from './components/RightSidebar';
import { ModelSelection } from './components/Sidebar/ModelSelection';
import MarkdownRenderer from './components/MarkdownRenderer';
import ReasoningDisplay from './components/ReasoningDisplay';
import { getDocument } from 'pdfjs-dist';
import mammoth from 'mammoth';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import {
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AdminPage from './admin';
// 导入Supabase测试工具
import '@/utils/supabase-test';
import '@/utils/quick-db-test';
import '@/utils/auth-test';
// Header组件已删除
import { ModelResponseMatrix } from '@/components/ChatInterface/ModelResponseMatrix';
import { LandingPage } from '@/pages/LandingPage';
import { LayoutSelector } from '@/components/LayoutSelector';
import { extractSearchKeywords, performWebSearch, formatSearchResults, shouldPerformWebSearch } from '@/services/webSearchService';
import { toast, Toaster } from 'sonner';
import { formatTokenAndCost } from './utils/modelPricing';

interface CollapsibleSectionProps {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: React.ReactNode;
  onToggle: () => void;
  isOpen: boolean;
  className?: string;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  icon,
  onToggle,
  isOpen,
  className,
}) => {
  return (
    <div className={`border-b border-gray-200 ${className || ''}`}>
      <button
        onClick={onToggle}
        className="w-full text-left p-4 flex items-center justify-between hover:bg-gray-100"
        type="button"
      >
        <h3 className="text-sm font-medium text-gray-700 flex items-center space-x-2">
          {icon && icon}
          <span>{title}</span>
        </h3>
        {isOpen ? (
          <ChevronDown size={16} className="text-gray-500" />
        ) : (
          <ChevronRight size={16} className="text-gray-500" />
        )}
      </button>
      {isOpen && <div className="p-4">{children}</div>}
    </div>
  );
};

function SortableCard({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 99 : 1,
    background: isDragging ? '#f0f4ff' : undefined,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border border-gray-200 rounded-lg flex flex-col ${isDragging ? 'shadow-lg' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="flex-1">
      {children}
      </div>
      <div className="drag-handle p-2 cursor-move border-t border-gray-100 bg-gray-50">
        <div className="text-xs text-gray-400 text-center">拖拽移动</div>
      </div>
    </div>
  );
}

function App() {
  const {
    apiKeys,
    setApiKey,
    getApiKey,
    getCurrentSelectedModels,
    toggleModel,
    setSelectedModels,
    cleanupSelectedModels,
    currentSession,
    getCurrentSession,
    getCurrentIsLoading,
    setCurrentLoading,
    sessions,
    createNewSession,
    loadSession,
    updateSessionTitle,
    deleteSession,
    addMessage,
    addModelResponse,
    updateModelResponse,
    appendToModelResponse,
    appendToReasoningContent,
    setLoading,
    isLoading,
    systemPrompt,
    setSystemPrompt,
    totalTokens,
    totalCost,
    addTokens,
    addCost,
    clearAllData,
    generateSessionTitle,
    syncToCloud,
    syncFromCloud,
    cloudSyncStatus,
    initUser,
    getModelParameters,
    pageMode,
    setPageMode,
    systemPrompts,
    selectedSystemPrompts,
    systemPromptThemes,
    selectedSystemPromptThemes,
    simpleLayoutMode,
    setSimpleLayoutMode,
    isAdvancedNavigationVisible,
    setAdvancedNavigationVisible,
    inputMessage,
    setInputMessage,
    selectedFiles,
    setSelectedFiles,
    getAllModels,
    isWebSearchEnabled,
    setWebSearchEnabled
  } = useAppStore();

  // 获取当前模式下的选择模型和状态
  const selectedModels = getCurrentSelectedModels();
  const currentModeSession = getCurrentSession();
  const currentModeIsLoading = getCurrentIsLoading();

  // 模式切换和动画状态
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionPhase, setTransitionPhase] = useState<'normal' | 'blur-out' | 'blur-in'>('normal');

  // 矩阵响应状态（用于多提示词模式）
  const [matrixResponses, setMatrixResponses] = useState<{ [key: string]: ModelResponse }>({});
  const [matrixIsLoading, setMatrixIsLoading] = useState(false);

  const [sysPromptExpanded, setSysPromptExpanded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const modelChatRefMap = useRef<{[key: string]: HTMLDivElement}>({});
  const [modelColumnOrder, setModelColumnOrder] = useState<string[]>([]);
  const [expandedMessages, setExpandedMessages] = useState<{ [id: string]: boolean }>({});
  const [hoveredCopyId, setHoveredCopyId] = useState<string | null>(null);
  const [inputExpanded, setInputExpanded] = useState(false);
  const [modalDontAskAgain, setModalDontAskAgain] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevResponsesRef = useRef<any>({});

  // 拖拽传感器配置
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    })
  );

  // 初始化用户身份
  useEffect(() => {
    initUser();
    // 记录页面访问事件
    analytics.pageView('app_main');
  }, []); // Zustand store函数是稳定的，不需要依赖项

  // 清理无效的模型选择
  useEffect(() => {
    cleanupSelectedModels();
    // 当前选择的模型
  }, []); // Zustand store函数是稳定的，不需要依赖项

  // 记录模式切换事件
  useEffect(() => {
    analytics.userAction('page_mode_changed', {
      mode: pageMode,
      timestamp: Date.now()
    });
  }, [pageMode]);

  // 监听selectedModels变化
  useEffect(() => {
    // selectedModels已更新
  }, [selectedModels]);

  // 页面加载时恢复矩阵响应数据
  useEffect(() => {
    if (pageMode === 'advanced' && selectedModels.length > 0 && selectedSystemPromptThemes.length > 0) {
      rebuildMatrixResponsesFromSession();
    }
  }, [pageMode, selectedModels, selectedSystemPromptThemes, currentModeSession]);

  // 页面刷新后恢复当前会话数据
  useEffect(() => {
    const currentModeSession = getCurrentSession();
    if (currentModeSession && !currentSession) {
      // 如果当前模式有会话但store中的currentSession为空，则恢复它
      console.log('页面刷新后恢复会话数据:', currentModeSession.id, '模式:', pageMode);
      
      // 通过setPageMode来触发currentSession的更新
      setPageMode(pageMode);
      
      if (pageMode === 'advanced' && selectedModels.length > 0 && selectedSystemPromptThemes.length > 0) {
        // 延迟执行重建矩阵响应，确保currentSession已更新
        setTimeout(() => {
          rebuildMatrixResponsesFromSession();
        }, 100);
      }
    }
  }, [pageMode, getCurrentSession, currentSession, selectedModels, selectedSystemPromptThemes, setPageMode]);

  // 检查 URL 参数是否包含管理后台访问标识
  useEffect(() => {
    const checkAdminAccess = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = window.location.hash;
      
      // 方式1: URL 参数访问 ?admin=true
      if (urlParams.get('admin') === 'true') {
        setShowAdmin(true);
        // 清除 URL 参数，避免暴露
        window.history.replaceState({}, '', window.location.pathname);
      }
      
      // 方式2: Hash 访问 #admin-panel
      if (hashParams === '#admin-panel') {
        setShowAdmin(true);
        // 清除 hash
        window.history.replaceState({}, '', window.location.pathname);
      }
    };
    
    checkAdminAccess();
    
    // 方式3: 全局控制台命令
    if (typeof window !== 'undefined') {
      (window as any).__openAdmin = () => {
        setShowAdmin(true);
        console.log('管理后台已打开');
      };
    }
  }, []);

  const isProviderKeyFilled = (provider: string) => !!apiKeys[(provider === 'doubao' ? 'volcengine' : provider) as AIProvider];

  // 滚动到底部
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentSession?.messages]);

  // API 连接测试
  const testApiConnection = async (provider: AIProvider) => {
    const apiKey = getApiKey(provider);
    if (!apiKey) return;
    
    // setTestingApi(prev => ({ ...prev, [provider]: true })); // Removed
    
    try {
      let service;
      switch (provider) {
        case 'deepseek':
          service = new DeepSeekService(apiKey);
          break;
        case 'aliyun':
          service = new AliyunService(apiKey);
          break;
        case 'volcengine':
          service = new VolcengineService(apiKey);
          break;
        case 'claude':
          service = new ClaudeService(apiKey);
          break;
        case 'kimi':
          service = new KimiService(apiKey);
          break;
        default:
          throw new Error('不支持的提供商');
      }
      
      const testModel = getAllModels().find(m => m.provider === provider);
      const response = await service.sendMessage({
        model: testModel?.modelId || '',
        messages: [{
          id: 'test',
          role: 'user',
          content: '你好',
          timestamp: new Date()
        }],
        systemPrompt: '请简短回复。',
        temperature: 0.7,
        maxTokens: 100
      });
      
      alert(`${PROVIDERS[provider].name} 连接成功！\n回复: ${response.content.substring(0, 50)}...`);
    } catch (error: any) {
      alert(`${PROVIDERS[provider].name} 连接失败：${error.message}`);
    }
    
    // setTestingApi(prev => ({ ...prev, [provider]: false })); // Removed
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      alert('只支持上传图片文件');
    }
    
    if (imageFiles.length > 5) {
      alert('最多只能上传5张图片');
      return;
    }

    setSelectedFiles([...selectedFiles, ...imageFiles].slice(0, 5));
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i: number) => i !== index));
  };

  // 清空历史确认
  const handleClearHistory = () => {
    setShowClearConfirm(true);
  };

  const handleConfirmClear = () => {
    clearAllData();
    setShowClearConfirm(false);
  };

  const handleCancelClear = () => {
    setShowClearConfirm(false);
  };

  // 拖拽结束处理
  const handleDragEnd = (result: any) => {
    console.log('拖拽结束:', result);
    
    // 检查是否有有效的拖拽操作
    if (!result.over || !result.active) {
      console.log('拖拽取消或无有效目标位置');
      return;
    }
    
    const activeId = result.active.id;
    const overId = result.over.id;
    
    if (activeId === overId) {
      console.log('拖拽位置未改变');
      return;
    }
    
    console.log(`拖拽模型 ${activeId} 到 ${overId} 的位置`);
    
    // 获取当前顺序中的索引
    const oldIndex = modelColumnOrder.indexOf(activeId);
    const newIndex = modelColumnOrder.indexOf(overId);
    
    if (oldIndex === -1 || newIndex === -1) {
      console.log('无法找到模型在当前顺序中的位置');
      return;
    }
    
    console.log(`从索引 ${oldIndex} 移动到索引 ${newIndex}`);
    
    // 使用 arrayMove 来重新排序
    const newOrder = arrayMove(modelColumnOrder, oldIndex, newIndex);
    
    console.log('新顺序:', newOrder);
    setModelColumnOrder(newOrder);
  };

  // 重新发起最后一条消息的聊天
  const handleRestartLastMessage = async () => {
    if (!currentSession || !currentSession.messages.length) return;
    
    // 获取最后一条用户消息
    const lastMessage = currentSession.messages[currentSession.messages.length - 1];
    if (lastMessage.role !== 'user') return;

    if (selectedModels.length === 0) {
      alert('请至少选择一个模型进行对比');
      return;
    }

    setCurrentLoading(true);
    
    if (pageMode === 'advanced') {
      // 多提示词模式：清空矩阵响应并重新生成
      setMatrixResponses({});
      await handleSendMatrixMessage();
    } else {
      // 单提示词模式：清除所有模型对最后一条消息的回复
      selectedModels.forEach(modelId => {
        // 完全删除该模型对该消息的回复，而不是设置为空内容
        const currentResponses = currentSession.responses[modelId] || {};
        delete currentResponses[lastMessage.id];
        
        // 重新添加空的初始回复状态
        addModelResponse(modelId, lastMessage.id, {
          content: '',
          isComplete: false,
          timestamp: new Date(),
          tokenCount: 0,
          cost: 0
      });
    });

      // 重新发送给所有选中的模型
    const startTime = Date.now();
    await Promise.all(selectedModels.map(async (modelId) => {
      const model = getAllModels().find(m => m.id === modelId);
      if (!model) return;

      const apiKey = getApiKey(model.provider);
      if (!apiKey) {
          updateModelResponse(lastMessage.id, modelId, {
          content: `请先配置 ${PROVIDERS[model.provider].name} 的API密钥`,
          isComplete: true,
          error: '未配置API密钥',
          timestamp: new Date(),
          tokenCount: 0,
          cost: 0
        });
        return;
      }

      try {
        let service;
        switch (model.provider) {
          case 'deepseek':
            service = new DeepSeekService(apiKey);
            break;
          case 'aliyun':
            service = new AliyunService(apiKey);
            break;
          case 'volcengine':
            service = new VolcengineService(apiKey);
            break;
          case 'claude':
            service = new ClaudeService(apiKey);
            break;
          case 'kimi':
            service = new KimiService(apiKey);
            break;
          case 'bigmodel':
            service = new BigModelService(apiKey);
            break;
          default:
            throw new Error('不支持的提供商');
        }

          // 获取用户配置的模型参数
          const modelParams = getModelParameters(modelId);

                 // 尝试流式响应
          let streamContent = ''; // 用于累积流式内容
         try {
           await service.sendMessageStream({
              model: model.modelId,
              messages: currentSession.messages,
             systemPrompt,
              temperature: modelParams.temperature,
              maxTokens: model.maxTokens || 4096,
           }, (chunk) => {
             if (chunk.finished) {
               // 流式完成
                updateModelResponse(modelId, lastMessage.id, { 
                 isComplete: true,
                 tokenCount: chunk.tokens || 0,
                 cost: chunk.cost || 0,
                 usage: chunk.usage || {
                   prompt_tokens: 0,
                   completion_tokens: chunk.tokens || 0,
                   total_tokens: chunk.tokens || 0
                 }
               });
             } else {
                // 累积流式内容并更新（而不是追加）
                streamContent += chunk.content;
                updateModelResponse(modelId, lastMessage.id, {
                  content: streamContent,
                  isComplete: false
                });
             }
           });
         } catch (streamError) {
           // 流式失败，回退到非流式
           console.log('流式请求失败，回退到非流式:', streamError);
           const response = await service.sendMessage({
              model: model.modelId,
              messages: currentSession.messages,
             systemPrompt,
              temperature: modelParams.temperature,
              maxTokens: model.maxTokens || 4096,
           });

            updateModelResponse(modelId, lastMessage.id, {
             content: response.content,
             isComplete: true,
             tokenCount: response.tokenCount || response.tokens || 0,
             cost: response.cost || 0,
             usage: response.usage || {
               prompt_tokens: 0,
               completion_tokens: response.tokenCount || response.tokens || 0,
               total_tokens: response.tokenCount || response.tokens || 0
             }
           });

           // 更新统计
           if (response.tokenCount || response.tokens) {
             addTokens(response.tokenCount || response.tokens || 0);
           }
           if (response.cost) addCost(response.cost);
         }

        // 记录分析事件
        await analytics.chat.messageSent(
          modelId,
          lastMessage.content.length,
          Date.now() - startTime
        );

      } catch (error: any) {
          updateModelResponse(modelId, lastMessage.id, {
          content: `错误: ${error.message}`,
          isComplete: true,
          error: error.message,
          timestamp: new Date(),
          tokenCount: 0,
          cost: 0
        });
      }
    }));
    }

    setCurrentLoading(false);
  };

  // 多提示词模式下的新建对话处理
  const handleNewSession = () => {
    if (pageMode === 'advanced') {
      // 多提示词模式：清空矩阵响应
      setMatrixResponses({});
    }
    // 调用原有的新建对话逻辑
    createNewSession();
  };

  // 多提示词模式下的单个组合重新生成
  const handleRegenerateMatrixResponse = async (modelId: string, themeId: string, versionId: string) => {
    if (!currentSession || !currentSession.messages.length) return;
    
    const lastMessage = currentSession.messages[currentSession.messages.length - 1];
    if (lastMessage.role !== 'user') return;

    const model = getAllModels().find(m => m.id === modelId);
    if (!model) return;

    const apiKey = getApiKey(model.provider);
    if (!apiKey) {
      const matrixKey = `${themeId}_${versionId}_${modelId}`;
      setMatrixResponses(prev => ({
        ...prev,
        [matrixKey]: {
          content: `请先配置 ${PROVIDERS[model.provider].name} 的API密钥`,
          isComplete: true,
          error: '未配置API密钥',
          timestamp: new Date(),
          tokenCount: 0,
          cost: 0
        }
      }));
      return;
    }
    
    // 找到对应的系统提示词版本
    const theme = systemPromptThemes.find(t => t.id === themeId);
    const version = theme?.versions.find(v => v.id === versionId);
    if (!theme || !version) return;

    const matrixKey = `${themeId}_${versionId}_${modelId}`;
    
    // 清空该组合的响应并显示加载状态
    setMatrixResponses(prev => ({
      ...prev,
      [matrixKey]: {
        content: '',
        isComplete: false,
        timestamp: new Date(),
        tokenCount: 0,
        cost: 0
      }
    }));

    setCurrentLoading(true);

    try {
      let service;
      switch (model.provider) {
        case 'deepseek':
          service = new DeepSeekService(apiKey);
          break;
        case 'aliyun':
          service = new AliyunService(apiKey);
          break;
        case 'volcengine':
          service = new VolcengineService(apiKey);
          break;
        case 'claude':
          service = new ClaudeService(apiKey);
          break;
        case 'kimi':
          service = new KimiService(apiKey);
          break;
        case 'bigmodel':
          service = new BigModelService(apiKey);
          break;
        default:
          throw new Error('不支持的提供商');
      }

      const modelParams = getModelParameters(modelId);

      // 尝试流式响应
      let streamContent = '';
      try {
        await service.sendMessageStream({
          model: model.modelId,
          messages: currentSession.messages,
          systemPrompt: version.content,
          temperature: modelParams.temperature,
          maxTokens: model.maxTokens || 4096,
        }, (chunk) => {
          if (chunk.finished) {
            setMatrixResponses(prev => ({
              ...prev,
              [matrixKey]: {
                ...prev[matrixKey],
                isComplete: true,
                tokenCount: chunk.tokens || 0,
                cost: chunk.cost || 0,
                usage: chunk.usage || {
                  prompt_tokens: 0,
                  completion_tokens: chunk.tokens || 0,
                  total_tokens: chunk.tokens || 0
                }
              }
            }));
          } else {
            streamContent += chunk.content;
            setMatrixResponses(prev => ({
              ...prev,
              [matrixKey]: {
                ...prev[matrixKey],
                content: streamContent,
                isComplete: false
              }
            }));
          }
        });
      } catch (streamError) {
        console.log('流式请求失败，回退到非流式:', streamError);
        const response = await service.sendMessage({
          model: model.modelId,
          messages: currentSession.messages,
          systemPrompt: version.content,
          temperature: modelParams.temperature,
          maxTokens: model.maxTokens || 4096,
        });

        setMatrixResponses(prev => ({
          ...prev,
          [matrixKey]: {
            content: response.content,
            isComplete: true,
            tokenCount: response.tokenCount || response.tokens || 0,
            cost: response.cost || 0,
            timestamp: new Date(),
            usage: response.usage || {
              prompt_tokens: 0,
              completion_tokens: response.tokenCount || response.tokens || 0,
              total_tokens: response.tokenCount || response.tokens || 0
            }
          }
        }));

        if (response.tokenCount || response.tokens) {
          addTokens(response.tokenCount || response.tokens || 0);
        }
        if (response.cost) addCost(response.cost);
      }

      await analytics.userAction('matrix_response_regenerated', {
        model_id: modelId,
        theme_id: themeId,
        version_id: versionId,
        version_name: version.name,
        provider: model.provider
      });

    } catch (error: any) {
      setMatrixResponses(prev => ({
        ...prev,
        [matrixKey]: {
          content: `错误: ${error.message}`,
          isComplete: true,
          error: error.message,
          timestamp: new Date(),
          tokenCount: 0,
          cost: 0
        }
      }));
    }

    setCurrentLoading(false);
  };

  // 根据布局模式获取grid类名
  const getGridClassName = () => {
    const modelCount = selectedModels.length;
    
    if (simpleLayoutMode === 'single') {
      return 'grid-cols-1';
    } else if (simpleLayoutMode === 'double') {
      return 'grid-cols-1 md:grid-cols-2';
    } else if (simpleLayoutMode === 'triple') {
      return 'grid-cols-1 md:grid-cols-3';
    } else {
      // auto模式：根据模型数量自动调整
      if (modelCount === 1) return 'grid-cols-1';
      if (modelCount === 2) return 'grid-cols-1 md:grid-cols-2';
      if (modelCount === 3) return 'grid-cols-1 md:grid-cols-3';
      if (modelCount === 4) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2';
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    }
  };

  // 渲染模型卡片内容
  const renderModelCard = (model: { id: string; name: string; provider: AIProvider; modelId: string; maxTokens?: number }) => {
    return (
      <>
        {/* 模型头部 - sticky */}
        <div className="sticky top-0 z-10 px-2 py-2 border-b border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-t-lg cursor-move transition-all duration-200"
             style={{ backdropFilter: 'blur(8px)' }}>
                      <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 flex items-center justify-center">
                  <img 
                    src={PROVIDERS[model.provider].logo} 
                    alt={PROVIDERS[model.provider].name} 
                    className="w-5 h-5 rounded object-contain"
                    onError={(e) => {
                      // 如果图片加载失败，显示emoji图标
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const emojiSpan = document.createElement('span');
                      emojiSpan.textContent = PROVIDERS[model.provider].icon;
                      emojiSpan.className = 'text-lg';
                      target.parentNode?.appendChild(emojiSpan);
                    }}
                  />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{model.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{PROVIDERS[model.provider].name}</div>
                </div>
              </div>
              
              {/* 生成状态指示器和关闭按钮 */}
              <div className="flex items-center space-x-2">
                {(() => {
                  // 获取最新消息的响应状态
                  const lastMessage = currentModeSession?.messages[currentModeSession.messages.length - 1];
                  const modelResponses = currentModeSession?.responses[model.id] as Record<string, ModelResponse>;
                  const messageResponse = lastMessage ? modelResponses?.[lastMessage.id] : null;
                  const isGenerating = messageResponse?.loading || false;
                  const isComplete = messageResponse?.isComplete || false;
                  
                  return (
                    <div 
                      className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                        isGenerating 
                          ? 'bg-yellow-400 animate-pulse' 
                          : isComplete 
                          ? 'bg-green-500' 
                          : 'bg-gray-300'
                      }`}
                      title={
                        isGenerating 
                          ? '生成中...' 
                          : isComplete 
                          ? '生成完成' 
                          : '等待生成'
                      }
                    />
                  );
                })()}
                
                {/* 关闭按钮 */}
                <button
                  className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors duration-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleModel(model.id);
                  }}
                  title="关闭模型"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
        </div>
        {/* 对话内容 */}
        <div
          className="flex-1 p-4 overflow-y-auto overflow-x-hidden min-h-[400px] max-h-[600px] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#d1d5db #f3f4f6'
          }}
          ref={el => {
            if (el) modelChatRefMap.current[model.id] = el;
          }}
        >
          {currentSession?.messages.map((message) => {
            // 确保 modelResponses 存在且是 Record<string, ModelResponse> 类型
            const modelResponses = currentSession.responses[model.id] as Record<string, ModelResponse>;
            // 确保 messageResponse 存在且是 ModelResponse 类型
            const messageResponse = modelResponses?.[message.id] as ModelResponse;
            // 渲染消息响应

            return (
              <div key={message.id} className="mb-4" data-message-id={message.id}>
                {/* 用户消息 */}
                <div className="mb-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">用户</div>
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg text-sm relative">
                    <div
                      style={{
                        maxHeight: expandedMessages[message.id] ? 'none' : '7.5em',
                        overflow: expandedMessages[message.id] ? 'visible' : 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: expandedMessages[message.id] ? 'none' : 5,
                        WebkitBoxOrient: 'vertical',
                      }}
                      className={expandedMessages[message.id] ? '' : 'line-clamp-5'}
                    >
                      {message.content}
                    </div>
                    {message.content && message.content.split('\n').length > 5 && (
                      <button
                        className="absolute right-2 bottom-2 bg-white p-1 rounded hover:bg-gray-100 border border-gray-200 text-xs text-blue-500 flex items-center"
                        onClick={() => setExpandedMessages((prev) => ({ ...prev, [message.id]: !prev[message.id] }))}
                        type="button"
                      >
                        {expandedMessages[message.id] ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                        <span className="ml-1">{expandedMessages[message.id] ? '收起' : '展开'}</span>
                      </button>
                    )}
                    {message.images && message.images.length > 0 && (
                      <div className="mt-2 flex items-center space-x-2">
                        {message.images.map((img, idx) =>
                          img.startsWith('data:') ? (
                            <img key={idx} src={img} alt="uploaded" className="w-10 h-10 object-cover rounded border" />
                          ) : (
                            <span key={idx} className="px-2 py-1 bg-gray-100 border rounded text-xs text-gray-700">已上传文档：{img}</span>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* AI回复 */}
                {messageResponse && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">
                      <span className="flex items-center">
                        <span>{model.name}</span>
                        <span className="ml-2 text-gray-400">
                          | {formatTokenAndCost(model.name, messageResponse.usage)}
                        </span>
                        {messageResponse.responseTime && (
                          <span className="ml-2">
                            ({messageResponse.responseTime}ms)
                          </span>
                        )}
                      </span>
                    </div>
                    
                    {/* 思考过程显示 */}
                    {messageResponse.reasoning_content && (
                      <ReasoningDisplay 
                        content={messageResponse.reasoning_content}
                        isLoading={messageResponse.loading}
                      />
                    )}
                    
                    <div
                      className="relative"
                      onMouseEnter={() => setHoveredCopyId(`${model.id}_${message.id}`)}
                      onMouseLeave={() => setHoveredCopyId(null)}
                    >
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-sm select-none">
                        <div>
                          {messageResponse.loading ? (
                            <div className="whitespace-pre-wrap">
                              <TypewriterEffect text={messageResponse.content} />
                            </div>
                          ) : messageResponse.error ? (
                            <div className="text-red-600 dark:text-red-400">错误: {messageResponse.error}</div>
                          ) : (
                            <MarkdownRenderer 
                              content={messageResponse.content}
                              className="text-sm"
                            />
                          )}
                        </div>
                      </div>
                      {hoveredCopyId === `${model.id}_${message.id}` && !messageResponse.loading && !messageResponse.error && (
                        <button
                          className="absolute top-2 right-2 text-xs sm:text-sm bg-white border rounded px-1 py-1 shadow hover:bg-gray-100 flex items-center"
                          style={{ minWidth: '20px', minHeight: '20px' }}
                          onClick={async (event) => {
                            event.stopPropagation();
                            event.preventDefault();
                            const button = event.target as HTMLButtonElement;
                            await copyWithFeedback(messageResponse.content, button);
                          }}
                          title="复制内容"
                        >
                          <Copy size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </>
    );
  };

  // 初始化模型顺序
  useEffect(() => {
    if (selectedModels.length > 0 && modelColumnOrder.length === 0) {
      // 初始化模型顺序
      setModelColumnOrder([...selectedModels]);
    }
  }, [selectedModels, modelColumnOrder]);

  // 模型列顺序管理 - 只在新增或移除模型时更新顺序
  useEffect(() => {
    // 管理模型顺序
    
    // 如果modelColumnOrder为空，跳过处理
    if (modelColumnOrder.length === 0) return;
    
    // 检查是否有新模型被添加或移除
    const currentOrderSet = new Set(modelColumnOrder);
    const selectedSet = new Set(selectedModels);
    
    const newModels = selectedModels.filter(model => !currentOrderSet.has(model));
    const removedModels = modelColumnOrder.filter(model => !selectedSet.has(model));
    
    // 检查模型变化
    
    if (newModels.length > 0 || removedModels.length > 0) {
      // 保留现有顺序，只添加新模型到末尾，移除已取消选择的模型
      const updatedOrder = modelColumnOrder
        .filter(model => selectedSet.has(model)) // 移除已取消选择的
        .concat(newModels); // 添加新选择的
      // 更新模型顺序
      setModelColumnOrder(updatedOrder);
    }
  }, [selectedModels, modelColumnOrder]);

  // 响应变化时自动滚动
  useEffect(() => {
    if (currentSession?.responses) {
      for (const modelId of selectedModels) {
        const modelResponses = currentSession.responses[modelId];
        if (modelResponses) {
          // 检查是否有新的响应
          const prevModelResponses = prevResponsesRef.current[modelId] || {};
          const hasNewResponse = Object.keys(modelResponses).some(msgId => {
            const current = modelResponses[msgId];
            const prev = prevModelResponses[msgId];
            return current && (!prev || current.content !== prev.content);
          });

          if (hasNewResponse) {
            // 延迟滚动以确保内容已渲染
            setTimeout(() => {
              const el = modelChatRefMap.current[modelId];
              if (el) {
                el.scrollTop = el.scrollHeight;
              }
            }, 0);
          }
        }
      }
    }
    // 保存本次 responses
    prevResponsesRef.current = JSON.parse(JSON.stringify(currentSession?.responses || {}));
  }, [currentSession?.responses, selectedModels]);

  // 从会话响应中重建矩阵响应（仅用于恢复历史对话）
  const rebuildMatrixResponsesFromSession = () => {
    // 这个函数应该只在特定情况下调用，不应该影响当前的矩阵响应
    // 暂时禁用此函数以避免内容混乱
    return;
    
    /*
    const session = getCurrentSession();
    if (!session || !session.messages.length) return;
    
    const newMatrixResponses: { [key: string]: ModelResponse } = {};
    const lastMessage = session.messages[session.messages.length - 1];
    
    // 为最后一条消息的所有模型响应重建矩阵键
    selectedModels.forEach(modelId => {
      const modelResponse = session.responses?.[modelId]?.[lastMessage.id];
      if (modelResponse) {
        // 为每个选中的主题和版本创建矩阵键
        selectedSystemPromptThemes.forEach(themeId => {
          const theme = systemPromptThemes.find(t => t.id === themeId);
          if (theme) {
            theme.versions.forEach(version => {
              const matrixKey = `${themeId}_${version.id}_${modelId}`;
              newMatrixResponses[matrixKey] = modelResponse;
            });
          }
        });
      }
    });
    
    setMatrixResponses(newMatrixResponses);
    */
  };



  // 矩阵模式的消息发送函数
  const handleSendMatrixMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    if (selectedModels.length === 0) {
      alert('请选择至少一个模型');
      return;
    }
    if (selectedSystemPromptThemes.length === 0) {
      alert('请选择至少一个系统提示词主题');
      return;
    }

    setMatrixIsLoading(true);

    // 生成矩阵键值函数（主题ID + 版本ID + 模型ID）
    const getMatrixKey = (themeId: string, versionId: string, modelId: string) => {
      return `${themeId}_${versionId}_${modelId}`;
    };

         // 清空之前的矩阵响应（但保留会话历史）
    setMatrixResponses({});

    // 处理上传的图片
    const images: string[] = [];
    for (const file of selectedFiles) {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      images.push(base64);
    }

    // 注意：这里只保存用户的原始输入到对话记录中，不包含搜索结果
    const messageId = addMessage(inputMessage.trim(), images);
    const newMessage: Message = {
      id: messageId,
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
      images
    };
    
    setInputMessage('');
    setSelectedFiles([]);
    
    // 清空文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // 获取选中的主题及其版本
    const selectedThemes = systemPromptThemes.filter(theme => 
      selectedSystemPromptThemes.includes(theme.id)
    );

    if (selectedThemes.length === 0) {
      alert('选中的主题中没有有效内容');
      setMatrixIsLoading(false);
      return;
    }

    // 计算总组合数
    const totalCombinations = selectedThemes.reduce((total, theme) => 
      total + (theme.versions.length * selectedModels.length), 0
    );

    // 开始主题化矩阵测试

    // 为每个主题×版本×模型组合发送请求
    const requests = [];
    
    for (const theme of selectedThemes) {
      for (const version of theme.versions) {
        for (const modelId of selectedModels) {
          const model = getAllModels().find(m => m.id === modelId);
          if (!model) continue;

          const matrixKey = getMatrixKey(theme.id, version.id, modelId);
          
          // 准备测试组合
          
          requests.push((async () => {
            const apiKey = getApiKey(model.provider);
            if (!apiKey) {
              // 跳过：缺少API密钥
              setMatrixResponses(prev => ({
                ...prev,
                [matrixKey]: {
                  content: `请先配置 ${PROVIDERS[model.provider].name} 的API密钥`,
                  error: '未配置API密钥',
                  timestamp: new Date(),
                  tokenCount: 0,
                  cost: 0
                }
              }));
              return;
            }

            try {
              // 开始处理组合
              const startTime = Date.now();
              
              // 初始化响应状态
              const initialResponse = {
                content: '',
                reasoning_content: '',
                isComplete: false,
                timestamp: new Date(),
                tokenCount: 0,
                cost: 0,
                startTime: startTime
              };
              
              setMatrixResponses(prev => ({
                ...prev,
                [matrixKey]: initialResponse
              }));
              
               // 只为第一个主题版本保存到会话响应中（避免重复，但保留历史对话功能）
               const isFirstThemeVersion = theme.id === selectedThemes[0].id && version.id === selectedThemes[0].versions[0].id;
               if (isFirstThemeVersion) {
              addModelResponse(modelId, messageId, initialResponse);
               }

              let service;
              switch (model.provider) {
                case 'deepseek':
                  service = new DeepSeekService(apiKey);
                  break;
                case 'aliyun':
                  service = new AliyunService(apiKey);
                  break;
                case 'volcengine':
                  service = new VolcengineService(apiKey);
                  break;
                case 'claude':
                  service = new ClaudeService(apiKey);
                  break;
                case 'kimi':
                  service = new KimiService(apiKey);
                  break;
                case 'bigmodel':
                  service = new BigModelService(apiKey);
                  break;
                default:
                  throw new Error('不支持的提供商');
              }

              // 获取历史消息并添加当前消息
              const historyMessages = currentModeSession?.messages.map(msg => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp,
                images: msg.images
              })) || [];
              
              const messages = [...historyMessages, newMessage];

              // 获取用户配置的模型参数
              const modelParams = getModelParameters(modelId);

              // 使用对应的版本内容作为系统提示词
              const systemPromptContent = version.content;

              // 使用系统提示词

              // 尝试流式响应
              let firstResponseTime: number | undefined;
              try {
                await service.sendMessageStream({
                  model: model.modelId,
                  messages,
                  systemPrompt: systemPromptContent,
                  temperature: modelParams.temperature,
                  maxTokens: model.maxTokens || 4096,
                }, (chunk) => {
                  if (chunk.finished) {
                    // 流式完成
                    const endTime = Date.now();
                    const totalResponseTime = endTime - startTime;
                    setMatrixResponses(prev => {
                      const finalResponse = {
                        content: prev[matrixKey]?.content || '',
                        reasoning_content: prev[matrixKey]?.reasoning_content || '',
                        isComplete: true,
                        timestamp: new Date(),
                        tokenCount: chunk.tokens || 0,
                        cost: chunk.cost || 0,
                        usage: {
                          prompt_tokens: 0,
                          completion_tokens: chunk.tokens || 0,
                          total_tokens: chunk.tokens || 0
                        },
                        endTime: endTime,
                        totalResponseTime: totalResponseTime,
                        firstByteLatency: firstResponseTime ? firstResponseTime - startTime : undefined,
                        responseTime: chunk.responseTime || totalResponseTime
                      };
                      
                       // 只为第一个主题版本保存到会话响应中（避免重复，但保留历史对话功能）
                       const isFirstThemeVersion = theme.id === selectedThemes[0].id && version.id === selectedThemes[0].versions[0].id;
                       if (isFirstThemeVersion) {
                      updateModelResponse(modelId, messageId, finalResponse);
                       }
                      
                      return {
                        ...prev,
                        [matrixKey]: finalResponse
                      };
                    });
                  } else {
                    // 记录首次响应时间
                    if (!firstResponseTime && (chunk.content || chunk.reasoning_content)) {
                      firstResponseTime = Date.now();
                      setMatrixResponses(prev => ({
                        ...prev,
                        [matrixKey]: {
                          ...prev[matrixKey],
                          firstResponseTime: firstResponseTime
                        }
                      }));
                    }
                    
                    // 追加流式内容
                    setMatrixResponses(prev => {
                      const currentResponse = prev[matrixKey] || {
                        content: '',
                        reasoning_content: '',
                        isComplete: false,
                        timestamp: new Date(),
                        tokenCount: 0,
                        cost: 0
                      };
                      
                      const updatedResponse = {
                        ...currentResponse,
                         content: chunk.content ? (currentResponse.content || '') + chunk.content : (currentResponse.content || ''),
                         reasoning_content: chunk.reasoning_content ? (currentResponse.reasoning_content || '') + chunk.reasoning_content : (currentResponse.reasoning_content || ''),
                        timestamp: new Date()
                      };
                      
                       // 只为第一个主题版本保存到会话响应中（避免重复，但保留历史对话功能）
                       const isFirstThemeVersion = theme.id === selectedThemes[0].id && version.id === selectedThemes[0].versions[0].id;
                       if (isFirstThemeVersion) {
                      if (chunk.content) {
                        appendToModelResponse(modelId, messageId, chunk.content);
                      }
                      if (chunk.reasoning_content) {
                        appendToReasoningContent(modelId, messageId, chunk.reasoning_content);
                         }
                      }
                      
                      return {
                        ...prev,
                        [matrixKey]: updatedResponse
                      };
                    });
                  }
                });
              } catch (streamError) {
                // 流式失败，回退到非流式
                // 流式请求失败，回退到非流式
                const response = await service.sendMessage({
                  model: model.modelId,
                  messages,
                  systemPrompt: systemPromptContent,
                  temperature: modelParams.temperature,
                  maxTokens: model.maxTokens || 4096,
                });

                // 非流式完成
                const endTime = Date.now();
                const totalResponseTime = endTime - startTime;
                const finalResponse = {
                   content: response.content || '',
                  reasoning_content: (response as any).reasoning_content || '',
                  isComplete: true,
                  timestamp: new Date(),
                  tokenCount: response.tokenCount || response.tokens || 0,
                  cost: response.cost || 0,
                  usage: response.usage || {
                    prompt_tokens: 0,
                    completion_tokens: response.tokenCount || response.tokens || 0,
                    total_tokens: response.tokenCount || response.tokens || 0
                  },
                  endTime: endTime,
                  totalResponseTime: totalResponseTime,
                  responseTime: response.responseTime || totalResponseTime
                };

                setMatrixResponses(prev => ({
                  ...prev,
                  [matrixKey]: finalResponse
                }));

                 // 只为第一个主题版本保存到会话响应中（避免重复，但保留历史对话功能）
                 const isFirstThemeVersion = theme.id === selectedThemes[0].id && version.id === selectedThemes[0].versions[0].id;
                 if (isFirstThemeVersion) {
                updateModelResponse(modelId, messageId, finalResponse);
                 }

                // 更新统计
                if (response.tokenCount || response.tokens) {
                  addTokens(response.tokenCount || response.tokens || 0);
                }
                if (response.cost) addCost(response.cost);
              }

              // 记录分析事件
              await analytics.userAction('theme_matrix_message_sent', {
                theme_id: theme.id,
                theme_name: theme.name,
                version_id: version.id,
                version_name: version.name,
                model_id: modelId,
                provider: model.provider,
                message_length: inputMessage.length,
                has_images: images.length > 0
              });

              // 处理完成

            } catch (error: any) {
              // 处理失败
              const errorResponse = {
                 content: `错误: ${error.message || '未知错误'}`,
                reasoning_content: '',
                isComplete: true,
                 error: error.message || '未知错误',
                timestamp: new Date(),
                tokenCount: 0,
                cost: 0
              };
              
              setMatrixResponses(prev => ({
                ...prev,
                [matrixKey]: errorResponse
              }));
              
               // 只为第一个主题版本保存到会话响应中（避免重复，但保留历史对话功能）
               const isFirstThemeVersion = theme.id === selectedThemes[0].id && version.id === selectedThemes[0].versions[0].id;
               if (isFirstThemeVersion) {
              updateModelResponse(modelId, messageId, errorResponse);
               }
            }
          })());
        }
      }
    }

    // 创建请求任务

    // 等待所有请求完成
    await Promise.all(requests);
    
    // 所有主题化矩阵测试完成
    setMatrixIsLoading(false);
  };

  // 单提示词模式的消息发送函数
  const handleSendSimpleMessage = async () => {
    if (!inputMessage.trim() && selectedFiles.length === 0) return;
    if (selectedModels.length === 0) {
      alert('请至少选择一个模型进行对比');
      return;
    }

    // 记录消息发送事件
    await analytics.userAction('message_sent', {
      message_length: inputMessage.length,
      has_images: selectedFiles.length > 0,
      image_count: selectedFiles.length,
      selected_models: selectedModels,
      model_count: selectedModels.length,
      mode: 'simple'
    });

    setCurrentLoading(true);
    
    // 网络搜索处理
    let finalMessage = inputMessage.trim();
    let searchContext = '';
    
    if (isWebSearchEnabled && shouldPerformWebSearch(inputMessage.trim())) {
      try {
        const bigmodelApiKey = getApiKey('bigmodel');
        if (bigmodelApiKey) {
          toast.info('正在进行网络搜索...');
          
          // 提取搜索关键词
          const keywordResult = await extractSearchKeywords(inputMessage.trim(), bigmodelApiKey);
          
          // 执行网络搜索
          const searchResponse = await performWebSearch(keywordResult.searchQuery, bigmodelApiKey, {
            search_recency_filter: keywordResult.needsTimeContext ? 'oneDay' : 'noLimit'
          });
          
          // 格式化搜索结果
          searchContext = formatSearchResults(searchResponse);
          
          if (searchContext) {
            // 将搜索结果作为上下文拼接到用户消息中（但不显示在对话框中）
            finalMessage = inputMessage.trim() + searchContext;
            toast.success('网络搜索完成，已获取相关信息');
          } else {
            toast.warning('网络搜索未找到相关结果');
          }
        }
      } catch (error: any) {
        console.error('网络搜索失败:', error);
        toast.error(`网络搜索失败: ${error.message}`);
        // 搜索失败时继续使用原始消息
      }
    }
    
    // 处理图片
    const imagePromises = selectedFiles.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    });
    
    const images = await Promise.all(imagePromises);
    
    // 确保有会话存在
    if (!currentModeSession) {
      createNewSession();
    }
    
    const messageId = addMessage(inputMessage.trim(), images);
    
    // 构建消息列表，包含刚刚添加的消息
    // 注意：发送给AI的消息使用finalMessage（包含搜索结果），但显示的消息仍是原始输入
    const newMessage: Message = {
      id: messageId,
      role: 'user',
      content: finalMessage, // 这里使用包含搜索结果的完整消息
      timestamp: new Date(),
      images
    };
    
    setInputMessage('');
    setSelectedFiles([]);
    
    // 清空文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // 为每个选中的模型发送请求
    await Promise.all(selectedModels.map(async (modelId) => {
      const model = getAllModels().find(m => m.id === modelId);
      if (!model) return;

      const apiKey = getApiKey(model.provider);
      if (!apiKey) {
        addModelResponse(modelId, messageId, {
          content: `请先配置 ${PROVIDERS[model.provider].name} 的API密钥`,
          isComplete: true,
          error: '未配置API密钥',
          timestamp: new Date(),
          tokenCount: 0,
          cost: 0
        });
        return;
      }

      try {
        // 记录开始时间
        const startTime = Date.now();
        
        // 添加初始响应
        addModelResponse(modelId, messageId, {
          content: '',
          isComplete: false,
          timestamp: new Date(),
          tokenCount: 0,
          cost: 0,
          startTime: startTime
        });

        let service;
        switch (model.provider) {
          case 'deepseek':
            service = new DeepSeekService(apiKey);
            break;
          case 'aliyun':
            service = new AliyunService(apiKey);
            break;
          case 'volcengine':
            service = new VolcengineService(apiKey);
            break;
          case 'claude':
            service = new ClaudeService(apiKey);
            break;
          case 'kimi':
            service = new KimiService(apiKey);
            break;
          case 'bigmodel':
            service = new BigModelService(apiKey);
            break;
          default:
            throw new Error('不支持的提供商');
        }

        // 获取历史消息并添加当前消息
        const historyMessages = currentModeSession?.messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          images: msg.images
        })) || [];
        
        const messages = [...historyMessages, newMessage];

        // 获取用户配置的模型参数
        const modelParams = getModelParameters(modelId);

                 // 尝试流式响应
         let firstResponseTime: number | undefined;
         try {
           await service.sendMessageStream({
            model: model.modelId,
             messages,
             systemPrompt,
            temperature: modelParams.temperature,
            maxTokens: model.maxTokens || 4096,
           }, (chunk) => {
             if (chunk.finished) {
               // 流式完成
               const endTime = Date.now();
               const totalResponseTime = endTime - startTime;
               updateModelResponse(modelId, messageId, { 
                 isComplete: true,
                 tokenCount: chunk.tokens || 0,
                 cost: chunk.cost || 0,
                 usage: chunk.usage || {
                   prompt_tokens: 0,
                   completion_tokens: chunk.tokens || 0,
                   total_tokens: chunk.tokens || 0
                 },
                 endTime: endTime,
                 totalResponseTime: totalResponseTime,
                 firstByteLatency: firstResponseTime ? firstResponseTime - startTime : undefined,
                 responseTime: chunk.responseTime || totalResponseTime
               });
             } else {
               // 记录首次响应时间
               if (!firstResponseTime && (chunk.content || chunk.reasoning_content)) {
                 firstResponseTime = Date.now();
                 updateModelResponse(modelId, messageId, {
                   firstResponseTime: firstResponseTime
                 });
               }
               // 追加流式内容
               if (chunk.content) {
                 appendToModelResponse(modelId, messageId, chunk.content);
               }
               // 追加思考过程内容
               if (chunk.reasoning_content) {
                 appendToReasoningContent(modelId, messageId, chunk.reasoning_content);
               }
             }
           });
         } catch (streamError) {
           // 流式失败，回退到非流式
           console.log('流式请求失败，回退到非流式:', streamError);
           const response = await service.sendMessage({
            model: model.modelId,
             messages,
             systemPrompt,
            temperature: modelParams.temperature,
            maxTokens: model.maxTokens || 4096,
           });

           const endTime = Date.now();
           const totalResponseTime = endTime - startTime;
           updateModelResponse(modelId, messageId, {
             content: response.content,
             isComplete: true,
             tokenCount: response.tokenCount || response.tokens || 0,
             cost: response.cost || 0,
             usage: response.usage,
             endTime: endTime,
             totalResponseTime: totalResponseTime,
             responseTime: response.responseTime || totalResponseTime
           });

           // 更新统计
           if (response.tokenCount || response.tokens) {
             addTokens(response.tokenCount || response.tokens || 0);
           }
           if (response.cost) addCost(response.cost);
         }

        // 记录分析事件
        await analytics.userAction('message_sent_simple', {
          model_name: model.name,
          message_length: inputMessage.length,
          provider: model.provider
        });

      } catch (error: any) {
        updateModelResponse(modelId, messageId, {
          content: `错误: ${error.message}`,
          isComplete: true,
          error: error.message,
          timestamp: new Date(),
          tokenCount: 0,
          cost: 0
        });
      }
    }));

    setCurrentLoading(false);
  };

    // 根据页面模式选择不同的发送函数
  const handleSendMessage = pageMode === 'advanced' ? handleSendMatrixMessage : handleSendSimpleMessage;

  // 如果显示管理后台，直接渲染管理后台组件
  if (showAdmin) {
    return <AdminPage onBack={() => setShowAdmin(false)} />;
  }

  // 如果是启动页模式，显示启动页
  if (pageMode === 'landing') {
    return <LandingPage />;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* 方式4: 隐藏的点击区域 - 左上角5x5像素的透明区域 */}
      <div 
        className="fixed top-0 left-0 w-2 h-2 opacity-0 z-50 cursor-default"
        onClick={(e) => {
          e.preventDefault();
          setShowAdmin(true);
        }}
      />

      {/* 模式切换头部 */}
      {/* 主要内容区域 - 添加顶部边距 */}
      <div 
        className={`
          flex w-full h-full pt-1 pb-1 px-1 transition-all duration-300 ease-in-out
          ${transitionPhase === 'blur-out' ? 'filter blur-lg opacity-30' : ''}
          ${transitionPhase === 'blur-in' ? 'filter blur-sm opacity-70' : ''}
          ${transitionPhase === 'normal' ? 'filter blur-0 opacity-100' : ''}
        `}
      >
      {/* 汉堡菜单按钮（仅在小屏显示） */}
      <div className="sm:hidden flex items-center p-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-0 z-40">
        <button onClick={() => setDrawerOpen(true)} className="p-2">
          <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </div>

      {/* 侧边栏 Drawer（小屏） */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex">
          <div className="w-72 bg-white dark:bg-gray-800 h-full shadow-lg p-4 overflow-y-auto overflow-x-hidden sidebar-container">
            <button className="mb-4" onClick={() => setDrawerOpen(false)}>
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            {/* 侧边栏内容复用原有 CollapsibleSection 结构 */}
            <CollapsibleSection 
              title="API密钥配置" 
              defaultOpen={false} // Removed showSettings
              icon={<Settings size={16} className="text-gray-500" />} 
              onToggle={() => {}} // Removed setShowSettings
              isOpen={false} // Removed showSettings
            >
              <div className="space-y-3">
                {Object.keys(PROVIDERS).map((key) => {
                  const typedKey = key as AIProvider;
                  const provider = PROVIDERS[typedKey];
                  return (
                    <div key={typedKey}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {provider.name}
                        {typedKey === 'aliyun' && (
                          <span className="text-blue-500 ml-1" title="阿里云DashScope API密钥">☁️</span>
                        )}
                        {typedKey === 'kimi' && (
                          <span className="text-blue-500 ml-1" title="Moonshot API密钥，支持流式输出">🌙</span>
                        )}
                      </label>
                      <input
                        type="password"
                        placeholder={
                          typedKey === 'aliyun' 
                            ? '输入DashScope API Key (sk-xxx格式)' 
                            : typedKey === 'kimi'
                            ? '输入Kimi API Key (sk-xxx格式，支持流式输出)'
                            : `输入${provider.name}的API密钥`
                        }
                        value={apiKeys[typedKey] || ''}
                        onChange={(e) => setApiKey(typedKey, e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {apiKeys[typedKey] && (
                        <div className="mt-1 flex items-center justify-between">
                          <div className="text-xs">
                            {validateApiKey(typedKey, apiKeys[typedKey]) ? (
                              <span className="text-green-600">✓ 有效</span>
                            ) : (
                              <span className="text-red-600">✗ 格式错误</span>
                            )}
                          </div>
                          {validateApiKey(typedKey, apiKeys[typedKey]) && (
                            <div className="flex space-x-1">
                              <button
                                onClick={() => testApiConnection(typedKey)}
                                // disabled={testingApi[typedKey]} // Removed testingApi
                                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                              >
                                {/* {testingApi[typedKey] ? '测试中...' : '测试'} */}
                                {/* Removed testingApi */}
                                测试
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CollapsibleSection>

            <CollapsibleSection 
              title="选择模型" 
              defaultOpen={false} // Removed showModels
              onToggle={() => {}} // Removed setShowModels
              isOpen={false} // Removed showModels
            >
              <ModelSelection />
            </CollapsibleSection>

            <CollapsibleSection 
              title="系统提示词" 
              defaultOpen={false} // Removed showSystemPrompt
              onToggle={() => {}} // Removed setShowSystemPrompt
              isOpen={false} // Removed showSystemPrompt
            >
              <div className="relative">
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="输入系统提示词..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all"
                  rows={sysPromptExpanded ? 75 : 38}
                  style={{
                    maxHeight: sysPromptExpanded ? '600px' : 'none',
                    overflow: 'auto',
                  }}
                />
                <button
                  className="absolute right-2 bottom-2 bg-white p-1 rounded hover:bg-gray-100 border border-gray-200"
                  onClick={() => setSysPromptExpanded((v) => !v)}
                  type="button"
                  title={sysPromptExpanded ? '收起' : '展开'}
                >
                  {sysPromptExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
              </div>
            </CollapsibleSection>

            <CollapsibleSection 
              title={<span>历史记录</span>}
              defaultOpen={false} // Removed showHistory
              onToggle={() => {}} // Removed setShowHistory
              isOpen={false} // Removed showHistory
            >
              <div className="space-y-2">
                <button
                  className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 mb-2"
                  onClick={handleClearHistory}
                >
                  清空
                </button>
                {sessions.length === 0 ? (
                  <p className="text-gray-500 text-sm">暂无历史对话</p>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`py-3 px-4 cursor-pointer hover:bg-blue-50 rounded-md transition-colors
                        ${currentSession?.id === session.id ? 'bg-blue-50' : ''}`}
                      onClick={() => loadSession(session.id)}
                    >
                      <p className="text-sm font-medium text-black truncate">
                        {session.title ? session.title : `新对话`}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {new Date(session.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CollapsibleSection>
          </div>
          <div className="flex-1" onClick={() => setDrawerOpen(false)} />
        </div>
      )}

      {/* 桌面端侧边栏 */}
      <Sidebar />

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white dark:bg-gray-900 rounded-l-lg ml-1 shadow-sm">
        {/* 顶部工具栏 */}
                  <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex-shrink-0 rounded-tl-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
                              <h1 className="text-base font-medium text-gray-900 dark:text-white">
                  模型对比
                </h1>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                  已选择 {selectedModels.length} 个模型
                </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* 单提示词模式下显示布局选择器 */}
              {pageMode === 'simple' && selectedModels.length > 0 && (
                <LayoutSelector 
                  selectedMode={simpleLayoutMode}
                  onChange={setSimpleLayoutMode}
                />
              )}
              
              {/* 移除多提示词模式下的导航控制器 */}
            </div>
          </div>
        </div>

        {/* 对话区域 - 占据剩余空间并可滚动 */}
        <div className="flex-1 overflow-hidden min-h-0" style={{ height: 'calc(100vh - 180px - 60px)' }}>
          {pageMode === 'advanced' ? (
            // 多提示词模式：矩阵布局
            <div className="h-full overflow-y-auto overflow-x-hidden pt-0 px-3 pb-3 w-full max-w-full">
              <ModelResponseMatrix 
                currentResponses={matrixResponses}
                isLoading={matrixIsLoading}
                messages={currentModeSession?.messages || []}
                onRegenerateResponse={handleRegenerateMatrixResponse}
              />
            </div>
          ) : (
            // 单提示词模式：原有的模型对比布局
            selectedModels.length > 0 ? (
            <div className="h-full overflow-y-auto overflow-x-hidden">
              <DndContext
                  sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={modelColumnOrder} strategy={rectSortingStrategy}>
                    {/* 根据用户选择的布局模式调整 */}
                    {(simpleLayoutMode === 'auto' && selectedModels.length === 1) ? (
                      // 自动模式下一个模型：居中显示，宽度1.5倍
                      <div className="flex justify-center p-2 sm:p-4">
                        <div className="w-full max-w-2xl" style={{ width: 'min(150%, 800px)' }}>
                          {modelColumnOrder.filter(modelId => selectedModels.includes(modelId)).map((modelId) => {
                      const model = getAllModels().find(m => m.id === modelId);
                      if (!model) return null;
                      return (
                        <SortableCard key={model.id} id={model.id}>
                                {renderModelCard(model)}
                              </SortableCard>
                              );
                            })}
                          </div>
                      </div>
                    ) : (
                      // 使用用户选择的网格布局
                      <div className={`grid gap-3 p-2 sm:p-3 ${getGridClassName()}`}>
                        {modelColumnOrder.filter(modelId => selectedModels.includes(modelId)).map((modelId) => {
                          const model = getAllModels().find(m => m.id === modelId);
                          if (!model) return null;
                          return (
                            <SortableCard key={model.id} id={model.id}>
                              {renderModelCard(model)}
                        </SortableCard>
                      );
                    })}
                  </div>
                    )}
                </SortableContext>
              </DndContext>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
              <div className="text-center flex flex-col items-center justify-center h-full w-full">
                <MessageSquare size={64} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  选择AI模型开始对话
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  在左侧选择要对比的AI模型，配置API密钥后即可开始对话
                </p>
              </div>
            </div>
            )
          )}
        </div>

        {/* 底部对话面板 */}
        <RightSidebar 
          onSendMessage={handleSendMessage}
          onNewSession={handleNewSession}
          onRestartLastMessage={handleRestartLastMessage}
          onFileUpload={handleFileUpload}
          removeFile={removeFile}
          currentSession={currentModeSession}
          selectedModels={selectedModels}
          isLoading={currentModeIsLoading}
          pageMode={pageMode}
          modelChatRefMap={modelChatRefMap}
        />

      </div>
    </div>

      {/* 清空历史弹窗 */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <div className="text-lg font-semibold mb-4 text-center">是否清空历史记录？</div>
            <label className="flex items-center text-sm mb-4 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={modalDontAskAgain}
                onChange={e => setModalDontAskAgain(e.target.checked)}
                className="mr-2"
              />
              不再提醒
            </label>
            <div className="flex justify-end space-x-2">
              <button
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
                onClick={handleCancelClear}
              >取消</button>
              <button
                className="px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white"
                onClick={handleConfirmClear}
              >确定</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast通知组件 */}
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
