import React, { useState, useRef } from 'react';
import { Settings, MessageSquare, History, ChevronLeft, ChevronRight, User, X, Key, HelpCircle, BarChart3, Mail, FileText, Layers, FileSearch } from 'lucide-react';
import { useAppStore } from '@/store';
import { AIProvider } from '@/types';
import { CollapsibleSection } from './CollapsibleSection';
import { ApiKeySection } from './ApiKeySection';
import { ModelSelection } from './ModelSelection';
import { SystemPromptSection } from './SystemPromptSection';
import { SessionHistory } from './SessionHistory';
import { SystemPromptManager } from './SystemPromptManager';

export const Sidebar: React.FC = () => {
  const { 
    sessions, 
    currentSession, 
    loadSession, 
    deleteSession,
    cloudSyncStatus,
    pageMode,
    setPageMode,
    isSidebarExpanded,
    sidebarWidth,
    toggleSidebar,
    setSidebarExpanded,
    setSidebarWidth
  } = useAppStore();

  // 使用store中的侧边栏状态
  const isExpanded = isSidebarExpanded;

  // 折叠状态管理
  const [showSettings, setShowSettings] = useState(false);
  const [showSystemPrompt, setShowSystemPrompt] = useState(pageMode === 'advanced');
  const [showModels, setShowModels] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [testingApi, setTestingApi] = useState<Partial<Record<AIProvider, boolean>>>({});
  
  // 个人信息弹窗状态
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'api' | 'features' | 'settings' | 'stats' | 'contact'>('api');
  
  // API密钥区域的引用
  const apiKeySectionRef = useRef<HTMLDivElement>(null);
  
  // 拖拽调整宽度的状态
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(sidebarWidth);
  const [tempWidth, setTempWidth] = useState(sidebarWidth);
  const animationFrameRef = useRef<number | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 拖拽处理函数
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isExpanded) return; // 只有展开状态才能拖拽
    
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(sidebarWidth);
    
    // 阻止文本选择
    e.preventDefault();
  };

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    // 使用 requestAnimationFrame 优化性能
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      const deltaX = e.clientX - startX;
      const newWidth = startWidth + deltaX;
      
      // 限制最小和最大宽度
      const minWidth = 180;
      const maxWidth = 400;
      const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      
      // 立即更新临时宽度用于UI显示
      setTempWidth(constrainedWidth);
      
      // 防抖保存到store
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        setSidebarWidth(constrainedWidth);
      }, 16); // ~60fps
    });
  }, [isResizing, startX, startWidth, setSidebarWidth]);

  const handleMouseUp = React.useCallback(() => {
    setIsResizing(false);
    
    // 清理动画帧
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // 清理防抖定时器并立即保存最终宽度
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    setSidebarWidth(tempWidth);
  }, [tempWidth, setSidebarWidth]);

  // 添加全局鼠标事件监听
  React.useEffect(() => {
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

  // 组件卸载时清理动画帧和定时器
  React.useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // 同步sidebarWidth到tempWidth
  React.useEffect(() => {
    if (!isResizing) {
      setTempWidth(sidebarWidth);
    }
  }, [sidebarWidth, isResizing]);

  // 滚动到API密钥配置并展开
  const scrollToApiKey = (providerId: string) => {
    // 打开个人信息弹窗并切换到API密钥配置页面
    setShowPersonalModal(true);
    setActiveTab('api');
    
    // 如果需要滚动到特定厂商的API密钥输入框，可以在这里添加逻辑
    // 暂时延迟一下确保弹窗已经打开
    setTimeout(() => {
      // 这里可以添加滚动到特定厂商输入框的逻辑
      // 例如：找到对应的input元素并聚焦
      const providerInputId = `${providerId}-api-key`;
      const inputElement = document.getElementById(providerInputId);
      if (inputElement) {
        inputElement.focus();
        inputElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // 切换侧边栏展开/收起状态
  const handleToggleSidebar = () => {
    toggleSidebar();
  };

  // 打开个人信息弹窗
  const openPersonalModal = () => {
    setShowPersonalModal(true);
  };

  // 关闭个人信息弹窗
  const closePersonalModal = () => {
    setShowPersonalModal(false);
  };

  // 切换Tab
  const switchTab = (tab: 'api' | 'features' | 'settings' | 'stats' | 'contact') => {
    setActiveTab(tab);
  };

  return (
    <div 
      className={`
        bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col h-full hidden sm:flex overflow-x-hidden
        rounded-r-lg mr-1 relative
        ${isResizing ? '' : 'transition-all duration-300 ease-in-out'}
      `}
      style={{
        width: isExpanded ? (isResizing ? `${tempWidth}px` : `${sidebarWidth}px`) : '64px',
        minWidth: isExpanded ? '180px' : '64px',
        maxWidth: isExpanded ? '400px' : '64px'
      }}
    >
      {/* 顶部区域 */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
        {isExpanded ? (
          <>
            <button
              onClick={() => setPageMode('landing')}
              className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1 transition-colors cursor-pointer"
              title="返回首页"
            >
              <img src="https://i.postimg.cc/5tbsF8br/web-app-manifest-512x512.png" alt="ModelBench" className="w-6 h-6 rounded object-contain" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">ModelBench</span>
            </button>
                          <button
                onClick={handleToggleSidebar}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="收起侧边栏"
              >
                              <ChevronLeft size={16} className="text-gray-500 dark:text-gray-400" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center space-y-2 w-full">
            <button
              onClick={() => setPageMode('landing')}
              className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1 transition-colors cursor-pointer"
              title="返回首页"
            >
              <img src="https://i.postimg.cc/5tbsF8br/web-app-manifest-512x512.png" alt="ModelBench" className="w-8 h-8 rounded object-contain" />
            </button>
            <button
              onClick={handleToggleSidebar}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="展开侧边栏"
            >
              <ChevronRight size={16} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        )}
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        {isExpanded ? (
        <div className="space-y-0">

          {/* 模式切换按钮 */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setPageMode(pageMode === 'simple' ? 'advanced' : 'simple')}
              className="w-full text-left p-4 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              type="button"
            >
              <div className="flex items-center space-x-2">
                {pageMode === 'simple' ? (
                  <>
                    <Layers size={16} className="text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">多提示词模式</span>
                  </>
                ) : (
                  <>
                    <FileSearch size={16} className="text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">单提示词模式</span>
                  </>
                )}
              </div>
              <ChevronRight size={16} className="text-gray-400 dark:text-gray-500" />
            </button>
          </div>

          {pageMode === 'simple' ? (
            <CollapsibleSection 
              title="系统提示词" 
              onToggle={() => setShowSystemPrompt(!showSystemPrompt)}
              isOpen={showSystemPrompt}
              icon={<FileText size={16} className="text-gray-500 dark:text-gray-400" />}
              stickyOffset={0}
            >
              <SystemPromptSection />
            </CollapsibleSection>
          ) : (
            <CollapsibleSection 
              title="系统提示词管理" 
              onToggle={() => setShowSystemPrompt(!showSystemPrompt)}
              isOpen={showSystemPrompt}
              icon={<FileText size={16} className="text-gray-500 dark:text-gray-400" />}
              stickyOffset={0}
            >
              <SystemPromptManager />
            </CollapsibleSection>
          )}

          <CollapsibleSection 
            title="模型选择" 
            onToggle={() => setShowModels(!showModels)}
            isOpen={showModels}
            icon={<MessageSquare size={16} className="text-gray-500 dark:text-gray-400" />}
            stickyOffset={showSystemPrompt ? 64 : 0}
          >
              <ModelSelection onScrollToApiKey={scrollToApiKey} />
          </CollapsibleSection>

          <CollapsibleSection
            title={`会话历史 (${sessions.length})`}
            onToggle={() => setShowHistory(!showHistory)}
            isOpen={showHistory}
            icon={<History size={16} className="text-gray-500 dark:text-gray-400" />}
            stickyOffset={(showSystemPrompt ? 64 : 0) + (showModels ? 64 : 0)}
          >
            <SessionHistory
              sessions={sessions}
              currentSession={currentSession}
              loadSession={loadSession}
              deleteSession={deleteSession}
            />
          </CollapsibleSection>
        </div>
        ) : (
          // 收起状态下的图标导航
          <div className="flex flex-col items-center space-y-4 p-2">
            
            {/* 模式切换按钮 */}
            <button
              onClick={() => setPageMode(pageMode === 'simple' ? 'advanced' : 'simple')}
              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={pageMode === 'simple' ? '切换到多提示词模式' : '切换到单提示词模式'}
            >
              {pageMode === 'simple' ? (
                <Layers size={20} className="text-gray-500 dark:text-gray-400" />
              ) : (
                <FileSearch size={20} className="text-gray-500 dark:text-gray-400" />
              )}
            </button>
            
            <button
              onClick={() => {
                setSidebarExpanded(true);
                setShowSystemPrompt(true);
              }}
              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={pageMode === 'simple' ? '系统提示词' : '系统提示词管理'}
            >
              <FileText size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
            
            <button
              onClick={() => {
                setSidebarExpanded(true);
                setShowModels(true);
              }}
              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="模型选择"
            >
              <MessageSquare size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
            
            <button
              onClick={() => {
                setSidebarExpanded(true);
                setShowHistory(true);
              }}
              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="会话历史"
            >
              <History size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        )}
      </div>

      {/* 底部个人区域 */}
      <div className="p-1 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        {isExpanded ? (
                      <button
              onClick={openPersonalModal}
              className="w-full flex items-center space-x-3 p-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <img src="https://i.postimg.cc/5tbsF8br/web-app-manifest-512x512.png" alt="ModelBench" className="w-full h-full object-cover" />
          </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-gray-900 dark:text-white">ModelBench</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">在线</div>
          </div>
            <div className={`w-2 h-2 rounded-full ${
              cloudSyncStatus === 'idle' ? 'bg-green-400' :
              cloudSyncStatus === 'syncing' ? 'bg-yellow-400' :
              cloudSyncStatus === 'error' ? 'bg-red-400' :
              'bg-gray-400'
            }`}></div>
          </button>
        ) : (
          <button
            onClick={openPersonalModal}
                          className="flex flex-col items-center space-y-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors w-full"
          >
            <div className="relative">
              <img src="https://i.postimg.cc/5tbsF8br/web-app-manifest-512x512.png" alt="头像" className="w-8 h-8 rounded-full" />
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                cloudSyncStatus === 'idle' ? 'bg-green-400' :
                cloudSyncStatus === 'syncing' ? 'bg-yellow-400' :
                cloudSyncStatus === 'error' ? 'bg-red-400' :
                'bg-gray-400'
              }`}></div>
            </div>
          </button>
        )}
      </div>

      {/* 个人信息弹窗 */}
      {showPersonalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-start z-50">
          {/* 弹窗背景点击关闭 */}
          <div 
            className="absolute inset-0" 
            onClick={closePersonalModal}
          />
          
          {/* 弹窗内容 */}
          <div 
            className={`
              relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl 
              w-96 max-w-[90vw] h-[500px] overflow-hidden
              transform transition-all duration-300 ease-out
              ${isExpanded ? 'ml-56' : 'ml-16'} mb-4
              translate-y-0 opacity-100 flex flex-col
            `}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 弹窗标题栏 */}
            <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <img src="https://i.postimg.cc/5tbsF8br/web-app-manifest-512x512.png" alt="ModelBench" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">ModelBench</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">管理您的账户和设置</p>
                </div>
              </div>
              <button
                onClick={closePersonalModal}
                                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Tab导航栏 */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              {[
                { id: 'api', icon: Key, label: 'API' },
                { id: 'features', icon: HelpCircle, label: '功能' },
                { id: 'settings', icon: Settings, label: '设置' },
                { id: 'stats', icon: BarChart3, label: '统计' },
                { id: 'contact', icon: Mail, label: '联系' }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => switchTab(tab.id as any)}
                    className={`
                      flex-1 flex flex-col items-center justify-center py-3 px-1
                      text-xs font-medium transition-all duration-200 min-h-[60px]
                      ${activeTab === tab.id 
                        ? 'text-blue-600 bg-white dark:bg-gray-800 border-b-2 border-blue-600 shadow-sm' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
                      }
                    `}
                  >
                    <Icon size={18} className="mb-1" />
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* 内容区域 */}
            <div className="p-2 overflow-y-auto flex-1">
              {activeTab === 'api' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                      API密钥配置
                    </h4>
                    <button className="text-sm text-blue-600 hover:text-blue-700 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:text-blue-300 rounded-md transition-colors">
                      保存
                    </button>
                  </div>
                  
                  {/* 集成现有的API密钥配置组件 - 移除max-h限制，让内容完整显示 */}
                  <div className="overflow-y-visible">
                    <ApiKeySection testingApi={testingApi} setTestingApi={setTestingApi} />
                  </div>
                </div>
              )}

              {activeTab === 'features' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">功能介绍</h4>
                    <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-md transition-colors">
                      分享
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white mb-3">核心功能</h5>
                      <div className="space-y-3">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                          <h6 className="font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center">
                            多模型并行对比
                          </h6>
                          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                            <li>• 同时对比多个AI模型的响应结果</li>
                            <li>• 支持实时流式输出和响应对比</li>
                            <li>• 智能模型参数调优和配置管理</li>
                          </ul>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                          <h6 className="font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center">
                            系统提示词管理
                          </h6>
                          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                            <li>• 自定义系统提示词模板</li>
                            <li>• 支持多版本管理和快速切换</li>
                            <li>• 预设常用场景模板</li>
                          </ul>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                          <h6 className="font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center">
                            智能分析统计
                          </h6>
                          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                            <li>• 实时使用统计和成本分析</li>
                            <li>• 模型性能对比报告</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">偏好设置</h4>
                  
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">暂无可配置的偏好设置</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'stats' && (
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">使用统计</h4>
                  
                  {/* 对话次数统计 */}
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white mb-3">对话次数</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 text-center border border-blue-200">
                        <div className="text-xl font-bold text-blue-600">23</div>
                        <div className="text-xs text-blue-700">今日</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 text-center border border-green-200">
                        <div className="text-xl font-bold text-green-600">156</div>
                        <div className="text-xs text-green-700">本周</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 text-center border border-purple-200">
                        <div className="text-xl font-bold text-purple-600">687</div>
                        <div className="text-xs text-purple-700">本月</div>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 text-center border border-orange-200">
                        <div className="text-xl font-bold text-orange-600">2.1K</div>
                        <div className="text-xs text-orange-700">总计</div>
                      </div>
                    </div>
                  </div>

                  {/* 成本统计 */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                      💰 成本统计
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-300 flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          OpenAI
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">$12.34</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-300 flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          Claude
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">$8.76</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-300 flex items-center">
                          <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                          DeepSeek
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">$2.15</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-600 pt-2 mt-3">
                        <span className="text-gray-900 dark:text-white font-medium">本月总计:</span>
                        <span className="font-bold text-blue-600">$23.25</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 最常用模型 */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-3">🏆 最常用模型</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-300">1. GPT-4</span>
                        <span className="text-gray-600 dark:text-gray-400 font-medium">45%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-300">2. Claude-3</span>
                        <span className="text-gray-600 dark:text-gray-400 font-medium">32%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-300">3. DeepSeek</span>
                        <span className="text-gray-600 dark:text-gray-400 font-medium">23%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'contact' && (
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">✉️ 联系我</h4>
                  
                  <div className="text-center space-y-4">
                    {/* 二维码区域 */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                      <div className="w-40 h-40 bg-white rounded-lg mx-auto flex items-center justify-center shadow-sm border-2 border-gray-200 p-2">
                        <img 
                          src="https://i.postimg.cc/ZnNTvGL4/wx.png" 
                          alt="微信二维码" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">微信号</p>
                        <div 
                          className="bg-white dark:bg-gray-700 rounded-lg px-4 py-2 inline-block border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText('baichuanugi');
                              // 可以添加一个简单的提示
                              const button = document.createElement('div');
                              button.textContent = '已复制!';
                              button.className = 'fixed top-4 right-4 bg-green-500 text-white px-3 py-1 rounded text-sm z-50';
                              document.body.appendChild(button);
                              setTimeout(() => {
                                document.body.removeChild(button);
                              }, 2000);
                            } catch (err) {
                              console.error('复制失败:', err);
                            }
                          }}
                        >
                          <p className="font-mono text-lg font-medium text-gray-900 dark:text-gray-100 select-all">baichuanugi</p>
                        </div>
                      </div>
                      
                                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                          扫描二维码或点击微信号复制
                        </p>
                    </div>
                    
                    {/* 其他联系方式 */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 dark:text-white mb-3">其他联系方式</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-300">📧 邮箱</span>
                          <span className="text-blue-600">1129970100@qq.com</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-300">🌐 官网</span>
                          <span className="text-blue-600">www.modelbench.ai</span>
                        </div>
                     
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* 拖拽手柄 - 只在展开状态显示 */}
      {isExpanded && (
        <div
          className={`
            absolute top-0 right-0 w-2 h-full cursor-col-resize group z-10
            ${isResizing ? 'bg-blue-500/20' : 'hover:bg-blue-500/10'}
            transition-colors duration-200
          `}
          onMouseDown={handleMouseDown}
        >
          {/* 视觉指示器 - 更明显的拖拽提示 */}
          <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2">
            <div className={`
              w-1 h-12 rounded-full transition-all duration-200
              ${isResizing 
                ? 'bg-blue-500 w-1.5' 
                : 'bg-gray-300 dark:bg-gray-600 group-hover:bg-blue-500 group-hover:w-1.5'
              }
            `}></div>
          </div>
          
          {/* 拖拽时的视觉反馈 */}
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
      )}
    </div>
  );
};
