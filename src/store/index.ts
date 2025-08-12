import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, ChatSession, Message, ModelResponse, AIProvider, PageMode, SystemPromptItem, SystemPromptTheme, SystemPromptVersion, Language, User, RegistrationStats, CustomModel, ModelConfig } from '@/types';
import { AVAILABLE_MODELS } from '@/lib/models';
import { generateId } from '@/utils/helpers';
import { getUserIdentity } from '@/utils/userIdentity';
import * as cloudDB from '@/services/supabase-db-advanced';
import { analytics } from '@/services/analytics';

interface AppStore extends AppState {
  // 分离的会话状态
  simpleCurrentSession: ChatSession | null;
  advancedCurrentSession: ChatSession | null;
  simpleIsLoading: boolean;
  advancedIsLoading: boolean;
  
  // 模型显示状态管理
  displayedModels: string[];
  setDisplayedModels: (modelIds: string[]) => void;
  toggleModelDisplay: (modelId: string) => void;
  getDisplayedModels: () => string[];
  
  // 自定义模型管理
  customModels: CustomModel[];
  addCustomModel: (model: CustomModel) => void;
  deleteCustomModel: (modelId: string) => void;
  getAllModels: () => (ModelConfig & { isCustom?: boolean })[];
  
  // 获取当前模式的会话和加载状态
  getCurrentSession: () => ChatSession | null;
  getCurrentIsLoading: () => boolean;
  setCurrentLoading: (loading: boolean) => void;
  
  // 页面模式切换
  setPageMode: (mode: PageMode) => void;
  
  // 主题化系统提示词管理
  addSystemPromptTheme: (name: string, description: string, versions: { name: string; content: string }[]) => string;
  updateSystemPromptTheme: (id: string, updates: Partial<Pick<SystemPromptTheme, 'name' | 'description'>>) => void;
  deleteSystemPromptTheme: (id: string) => void;
  addVersionToTheme: (themeId: string, name: string, content: string) => string;
  updateThemeVersion: (themeId: string, versionId: string, updates: Partial<Pick<SystemPromptVersion, 'name' | 'content'>>) => void;
  deleteThemeVersion: (themeId: string, versionId: string) => void;
  toggleSystemPromptTheme: (id: string) => void;
  setSelectedSystemPromptThemes: (ids: string[]) => void;
  
  // 系统提示词管理（向后兼容）
  addSystemPrompt: (name: string, content: string) => string;
  updateSystemPrompt: (id: string, updates: Partial<Pick<SystemPromptItem, 'name' | 'content'>>) => void;
  deleteSystemPrompt: (id: string) => void;
  toggleSystemPrompt: (id: string) => void;
  setSelectedSystemPrompts: (ids: string[]) => void;
  
  // API Key 操作
  setApiKey: (provider: AIProvider, apiKey: string) => void;
  getApiKey: (provider: AIProvider) => string;
  
  // 模型选择操作 - 支持模式分离
  toggleModel: (modelId: string) => void;
  setSelectedModels: (modelIds: string[]) => void;
  cleanupSelectedModels: () => void;
  getCurrentSelectedModels: () => string[];
  
  // 分离的模型选择状态
  simpleSelectedModels: string[];
  advancedSelectedModels: string[];
  setSimpleSelectedModels: (modelIds: string[]) => void;
  setAdvancedSelectedModels: (modelIds: string[]) => void;
  
  // 模型参数设置
  modelParameters: Record<string, { temperature: number; top_p: number }>;
  setModelParameters: (modelId: string, parameters: { temperature: number; top_p: number }) => void;
  getModelParameters: (modelId: string) => { temperature: number; top_p: number };
  
  // 系统提示词操作
  setSystemPrompt: (prompt: string) => void;
  
  // 会话操作
  createNewSession: () => void;
  loadSession: (sessionId: string) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  deleteSession: (sessionId: string) => void;
  
  // 消息操作
  addMessage: (content: string, images?: string[]) => string;
  addModelResponse: (modelId: string, messageId: string, response: ModelResponse) => void;
  updateModelResponse: (modelId: string, messageId: string, updates: Partial<ModelResponse>) => void;
  appendToModelResponse: (modelId: string, messageId: string, content: string) => void;
  appendToReasoningContent: (modelId: string, messageId: string, reasoningContent: string) => void;
  
  // UI 状态
  setLoading: (loading: boolean) => void;
  
  // 统计操作
  addTokens: (tokens: number) => void;
  addCost: (cost: number) => void;
  
  // 数据操作
  exportSession: (sessionId: string) => string;
  importSession: (data: string) => boolean;
  clearAllData: () => void;
  
  // 新增标题生成动作
  generateSessionTitle: (sessionId: string, firstMessageContent: string) => Promise<void>;
  
  // 云端同步状态
  cloudSyncStatus: 'idle' | 'syncing' | 'error' | 'offline';
  // 云端同步方法
  syncToCloud: () => Promise<void>;
  syncFromCloud: () => Promise<void>;
  
  // 深色模式状态
  isDarkMode: boolean;
  
  // 侧边栏状态
  isSidebarExpanded: boolean;
  sidebarWidth: number; // 侧边栏自定义宽度（像素）
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
  setSidebarWidth: (width: number) => void;
  
  // 单提示词模式布局设置
  simpleLayoutMode: 'auto' | 'single' | 'double' | 'triple'; // 排列方式
  setSimpleLayoutMode: (mode: 'auto' | 'single' | 'double' | 'triple') => void;
  
  // 多提示词模式导航状态
  isAdvancedNavigationVisible: boolean;
  advancedNavigationPosition: { x: number; y: number };
  setAdvancedNavigationVisible: (visible: boolean) => void;
  setAdvancedNavigationPosition: (position: { x: number; y: number }) => void;
  
  // 右侧边栏状态
  inputMessage: string;
  setInputMessage: (message: string) => void;
  selectedFiles: File[];
  setSelectedFiles: (files: File[]) => void;
  fileInputRef: React.RefObject<HTMLInputElement> | null;
  setFileInputRef: (ref: React.RefObject<HTMLInputElement>) => void;
  handleSendMessage: () => void;
  
  // 语言设置
  language: Language;
  setLanguage: (language: Language) => void;
  
  // 网络搜索功能
  isWebSearchEnabled: boolean;
  setWebSearchEnabled: (enabled: boolean) => void;
  
  // 用户认证
  currentUser: any; // 兼容旧的用户类型和新的User类型
  isAuthenticated: boolean;
  login: (phone: string, verificationCode: string) => Promise<boolean>;
  register: (phone: string, verificationCode: string) => Promise<boolean>;
  logout: () => void;
  
  // 注册统计
  getRegistrationStats: () => RegistrationStats;
  
  // 旧的用户管理（保持兼容）
  initUser: () => Promise<void>;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      apiKeys: {
        deepseek: '',
        aliyun: '',
        volcengine: '',
        kimi: '',
        claude: '',
        bigmodel: '',
      },
      availableModels: AVAILABLE_MODELS,
      selectedModels: [], // 不默认勾选任何模型，这个字段为了向后兼容保留
      simpleSelectedModels: [], // 单提示词模式选择的模型
      advancedSelectedModels: [], // 多提示词模式选择的模型
      displayedModels: AVAILABLE_MODELS.map(m => m.id), // 默认显示所有模型
      customModels: [], // 自定义模型列表
      modelParameters: {}, // 模型参数设置
      currentSession: null,
      simpleCurrentSession: null,
      advancedCurrentSession: null,
      sessions: [],
      isLoading: false,
      simpleIsLoading: false,
      advancedIsLoading: false,
      systemPrompt: '你是一个有用的AI助手。',
      totalTokens: 0,
      totalCost: 0,
      cloudSyncStatus: 'idle',
      currentUser: null,

      // 页面模式
      pageMode: 'landing',
      
      // 深色模式
      isDarkMode: false,
      
              // 侧边栏状态
      isSidebarExpanded: true,
      sidebarWidth: 224, // 默认展开宽度（w-56 = 224px）
      
      // 单提示词模式布局设置
      simpleLayoutMode: 'auto', // 默认自动排列
      
      // 多提示词模式导航状态
      isAdvancedNavigationVisible: true,
      advancedNavigationPosition: { x: typeof window !== 'undefined' ? window.innerWidth - 100 : 800, y: typeof window !== 'undefined' ? window.innerHeight / 2 : 400 },
      
      // 右侧边栏状态
      inputMessage: '',
      selectedFiles: [],
      fileInputRef: null,
      
      // 语言设置
      language: 'zh' as Language,
      
      // 网络搜索功能
      isWebSearchEnabled: false,
      
      // 用户认证
      isAuthenticated: false,
      
      // 主题化系统提示词管理
      systemPromptThemes: [
        {
          id: 'default-theme',
          name: '通用助手',
          description: '通用的AI助手主题',
          versions: [
            {
              id: 'default-version',
              name: '标准版本',
              content: '你是一个有用的AI助手。',
              createdAt: new Date(),
              updatedAt: new Date(),
            }
          ],
          isDefault: false, // 改为false，使其可删除
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ],
      selectedSystemPromptThemes: [], // 改为空数组，不默认选择
      
      // 系统提示词管理（向后兼容）
      systemPrompts: [
        {
          id: 'default',
          name: '通用助手',
          content: '你是一个有用的AI助手。',
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ],
      selectedSystemPrompts: ['default'],

      // 获取当前模式的会话和加载状态
      getCurrentSession: () => {
        const state = get();
        if (state.pageMode === 'landing') return null;
        return state.pageMode === 'advanced' ? state.advancedCurrentSession : state.simpleCurrentSession;
      },
      
      getCurrentIsLoading: () => {
        const state = get();
        if (state.pageMode === 'landing') return false;
        return state.pageMode === 'advanced' ? state.advancedIsLoading : state.simpleIsLoading;
      },
      
      setCurrentLoading: (loading) => {
        set((state) => {
          if (state.pageMode === 'landing') return state;
          if (state.pageMode === 'advanced') {
            return { advancedIsLoading: loading };
          } else {
            return { simpleIsLoading: loading };
          }
        });
      },

      // 页面模式切换
      setPageMode: (mode) => {
        set((state) => {
          // 如果是切换到landing模式，不需要更新其他状态
          if (mode === 'landing') {
            return { pageMode: mode };
          }
          
          // 切换模式时，更新selectedModels为对应模式的选择状态
          const newSelectedModels = mode === 'advanced' ? state.advancedSelectedModels : state.simpleSelectedModels;
          // 更新当前会话
          const newCurrentSession = mode === 'advanced' ? state.advancedCurrentSession : state.simpleCurrentSession;
          // 更新加载状态
          const newIsLoading = mode === 'advanced' ? state.advancedIsLoading : state.simpleIsLoading;
          
          return { 
            pageMode: mode,
            selectedModels: newSelectedModels,
            currentSession: newCurrentSession,
            isLoading: newIsLoading
          };
        });
      },

      // 主题化系统提示词管理
      addSystemPromptTheme: (name, description, versions) => {
        const themeId = generateId();
        const newTheme: SystemPromptTheme = {
          id: themeId,
          name,
          description,
          versions: versions.map(v => ({
            id: generateId(),
            name: v.name,
            content: v.content,
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        set((state) => ({
          systemPromptThemes: [...state.systemPromptThemes, newTheme],
        }));
        
        return themeId;
      },

      updateSystemPromptTheme: (id, updates) => {
        set((state) => ({
          systemPromptThemes: state.systemPromptThemes.map(theme => 
            theme.id === id 
              ? { ...theme, ...updates, updatedAt: new Date() }
              : theme
          ),
        }));
      },

      deleteSystemPromptTheme: (id) => {
        set((state) => {
          // 移除默认主题删除限制，允许删除所有主题
          const newThemes = state.systemPromptThemes.filter(t => t.id !== id);
          const newSelectedThemes = state.selectedSystemPromptThemes.filter(tid => tid !== id);
          
          return {
            systemPromptThemes: newThemes,
            selectedSystemPromptThemes: newSelectedThemes,
          };
        });
      },

      addVersionToTheme: (themeId, name, content) => {
        const versionId = generateId();
        set((state) => ({
          systemPromptThemes: state.systemPromptThemes.map(theme => 
            theme.id === themeId
              ? {
                  ...theme,
                  versions: [...theme.versions, {
                    id: versionId,
                    name,
                    content,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  }],
                  updatedAt: new Date(),
                }
              : theme
          ),
        }));
        return versionId;
      },

      updateThemeVersion: (themeId, versionId, updates) => {
        set((state) => ({
          systemPromptThemes: state.systemPromptThemes.map(theme => 
            theme.id === themeId
              ? {
                  ...theme,
                  versions: theme.versions.map(version =>
                    version.id === versionId
                      ? { ...version, ...updates, updatedAt: new Date() }
                      : version
                  ),
                  updatedAt: new Date(),
                }
              : theme
          ),
        }));
      },

      deleteThemeVersion: (themeId, versionId) => {
        set((state) => ({
          systemPromptThemes: state.systemPromptThemes.map(theme => 
            theme.id === themeId
              ? {
                  ...theme,
                  versions: theme.versions.filter(v => v.id !== versionId),
                  updatedAt: new Date(),
                }
              : theme
          ),
        }));
      },

      toggleSystemPromptTheme: (id) => {
        set((state) => {
          const isSelected = state.selectedSystemPromptThemes.includes(id);
          let newSelected: string[];
          
          if (isSelected) {
            // 取消选择，允许全部取消
            newSelected = [];
          } else {
            // 单选模式：只能选择一个主题
            newSelected = [id];
          }
          
          return { selectedSystemPromptThemes: newSelected };
        });
      },

      setSelectedSystemPromptThemes: (ids) => {
        // 单选模式：只保留第一个，允许为空
        const validIds = ids.length > 0 ? [ids[0]] : [];
        set({ selectedSystemPromptThemes: validIds });
      },

      // 系统提示词管理（向后兼容）
      addSystemPrompt: (name, content) => {
        const id = generateId();
        const newPrompt: SystemPromptItem = {
          id,
          name,
          content,
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        set((state) => ({
          systemPrompts: [...state.systemPrompts, newPrompt],
        }));
        
        return id;
      },

      updateSystemPrompt: (id, updates) => {
        set((state) => ({
          systemPrompts: state.systemPrompts.map(prompt => 
            prompt.id === id 
              ? { ...prompt, ...updates, updatedAt: new Date() }
              : prompt
          ),
        }));
      },

      deleteSystemPrompt: (id) => {
        set((state) => {
          // 不允许删除默认提示词
          if (state.systemPrompts.find(p => p.id === id)?.isDefault) {
            return state;
          }
          
          const newSystemPrompts = state.systemPrompts.filter(p => p.id !== id);
          const newSelectedSystemPrompts = state.selectedSystemPrompts.filter(pid => pid !== id);
          
          return {
            systemPrompts: newSystemPrompts,
            selectedSystemPrompts: newSelectedSystemPrompts,
          };
        });
      },

      toggleSystemPrompt: (id) => {
        set((state) => {
          const isSelected = state.selectedSystemPrompts.includes(id);
          let newSelected: string[];
          
          if (isSelected) {
            // 取消选择，但至少保留一个
            if (state.selectedSystemPrompts.length <= 1) {
              return state; // 不允许全部取消
            }
            newSelected = state.selectedSystemPrompts.filter(pid => pid !== id);
          } else {
            // 添加选择，但最多3个
            if (state.selectedSystemPrompts.length >= 3) {
              return state; // 已达到最大限制
            }
            newSelected = [...state.selectedSystemPrompts, id];
          }
          
          return { selectedSystemPrompts: newSelected };
        });
      },

      setSelectedSystemPrompts: (ids) => {
        // 限制最多3个，至少1个
        const validIds = ids.slice(0, 3);
        if (validIds.length === 0) return;
        
        set({ selectedSystemPrompts: validIds });
      },

      // 用户初始化
      initUser: async () => {
        try {
          const identity = getUserIdentity();
          
          // 先尝试查找现有用户
          let user = await cloudDB.getUserByAnonymousId(identity.anonymousId);
          
          if (!user) {
            // 创建新用户
            user = await cloudDB.createUser({
              anonymous_id: identity.anonymousId,
              user_type: 'anonymous',
              email_verified: false,
              total_sessions: 0,
              total_messages: 0,
              preferences: {},
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              last_active: new Date().toISOString(),
            });
            console.log('✅ 新用户已创建:', user.id);
          } else {
            // 更新最后活跃时间
            user = await cloudDB.updateUser(user.id, {
              last_active: new Date().toISOString(),
            });
            console.log('✅ 现有用户已登录:', user.id);
          }
          
          set({ currentUser: user, cloudSyncStatus: 'idle' });
          
          // 延迟同步云端数据，避免在渲染期间触发状态更新
          // 使用 queueMicrotask 来确保在下一个事件循环中执行
          queueMicrotask(() => {
            setTimeout(() => {
              get().syncFromCloud();
            }, 1000);
          });
          
        } catch (error) {
          console.error('❌ 数据库用户初始化失败，使用本地模式:', error);
          
          // 数据库失败时创建模拟用户对象，使用特殊标识
          const mockUser = {
            id: 'LOCAL_MODE', // 使用特殊标识表示本地模式
            anonymous_id: getUserIdentity().anonymousId,
            user_type: 'anonymous' as const,
            email_verified: false,
            total_sessions: 0,
            total_messages: 0,
            preferences: {},
            created_at: new Date().toISOString(),
            last_active: new Date().toISOString(),
          };
          
          set({ currentUser: mockUser, cloudSyncStatus: 'offline' });
          console.log('🔧 已切换到本地存储模式');
        }
      },

      // API Key 操作
      setApiKey: (provider, apiKey) => {
        set((state) => ({
          apiKeys: {
            ...state.apiKeys,
            [provider]: apiKey,
          },
        }));
      },

      getApiKey: (provider) => {
        return get().apiKeys[provider];
      },

      // 获取当前模式下选择的模型
      getCurrentSelectedModels: () => {
        const state = get();
        return state.pageMode === 'advanced' ? state.advancedSelectedModels : state.simpleSelectedModels;
      },

      // 模型显示状态管理
      getDisplayedModels: () => {
        return get().displayedModels;
      },

      setDisplayedModels: (modelIds) => {
        set({ displayedModels: [...new Set(modelIds)] });
      },

      toggleModelDisplay: (modelId) => {
        set((state) => {
          const isDisplayed = state.displayedModels.includes(modelId);
          if (isDisplayed) {
            return {
              displayedModels: state.displayedModels.filter(id => id !== modelId)
            };
          } else {
            return {
              displayedModels: [...state.displayedModels, modelId]
            };
          }
        });
      },

      // 自定义模型管理
      addCustomModel: (model) => {
        set((state) => ({
          customModels: [...state.customModels, model],
          displayedModels: [...state.displayedModels, model.id] // 自动显示新添加的模型
        }));
      },

      deleteCustomModel: (modelId) => {
        set((state) => {
          const newCustomModels = state.customModels.filter(m => m.id !== modelId);
          const newDisplayedModels = state.displayedModels.filter(id => id !== modelId);
          
          // 如果模型已选中，取消选中
          const newSimpleSelectedModels = state.simpleSelectedModels.filter(id => id !== modelId);
          const newAdvancedSelectedModels = state.advancedSelectedModels.filter(id => id !== modelId);
          const newSelectedModels = state.selectedModels.filter(id => id !== modelId);
          
          return {
            customModels: newCustomModels,
            displayedModels: newDisplayedModels,
            simpleSelectedModels: newSimpleSelectedModels,
            advancedSelectedModels: newAdvancedSelectedModels,
            selectedModels: newSelectedModels
          };
        });
      },

      getAllModels: () => {
        const state = get();
        const allModels: (ModelConfig & { isCustom?: boolean })[] = [...state.availableModels];
        
        // 添加自定义模型
        state.customModels.forEach(customModel => {
          allModels.push({
            id: customModel.id,
            name: customModel.name,
            provider: customModel.provider as AIProvider,
            modelId: customModel.modelId,
            description: customModel.description,
            maxTokens: 4000,
            temperature: 0.7,
            supportVision: false,
            costPerToken: 0,
            isCustom: true
          });
        });
        
        return allModels;
      },

      // 模型选择操作 - 根据当前模式操作对应的状态
      toggleModel: (modelId) => {
        set((state) => {
          const currentModels = state.pageMode === 'advanced' ? state.advancedSelectedModels : state.simpleSelectedModels;
          const isSelected = currentModels.includes(modelId);
          let newSelectedModels: string[];
          
          if (isSelected) {
            newSelectedModels = currentModels.filter(id => id !== modelId);
          } else {
            // 在多提示词模式下限制最多3个模型
            if (state.pageMode === 'advanced' && currentModels.length >= 3) {
              return state; // 已达到最大限制
            }
            newSelectedModels = [...currentModels, modelId];
          }
          
          // 清理重复的模型ID和无效的模型ID
          const cleanedModels = [...new Set(newSelectedModels)].filter(id => 
            state.availableModels.some(model => model.id === id) || 
            state.customModels.some(model => model.id === id)
          );
          
          // 记录模型选择事件
          const model = [...state.availableModels, ...state.customModels].find(m => m.id === modelId);
          if (model) {
            analytics.userAction('model_selected', {
              model_id: modelId,
              model_name: model.name || modelId,
              provider: model.provider,
              action: isSelected ? 'deselected' : 'selected',
              mode: state.pageMode,
              total_selected: cleanedModels.length
            }).catch(console.warn);
          }
          
          // 更新对应模式的状态
          if (state.pageMode === 'advanced') {
            return {
              advancedSelectedModels: cleanedModels,
              selectedModels: cleanedModels, // 同步更新selectedModels以保持向后兼容
            };
          } else {
            return {
              simpleSelectedModels: cleanedModels,
              selectedModels: cleanedModels, // 同步更新selectedModels以保持向后兼容
            };
          }
        });
      },

      setSelectedModels: (modelIds) => {
        set((state) => {
          // 清理重复的模型ID和无效的模型ID
          const cleanedModels = [...new Set(modelIds)].filter(id => 
            state.availableModels.some(model => model.id === id) || 
            state.customModels.some(model => model.id === id)
          );
          
          // 根据当前模式更新对应的状态
          if (state.pageMode === 'advanced') {
            return { 
              selectedModels: cleanedModels,
              advancedSelectedModels: cleanedModels
            };
          } else {
            return { 
              selectedModels: cleanedModels,
              simpleSelectedModels: cleanedModels
            };
          }
        });
      },

      setSimpleSelectedModels: (modelIds) => {
        set((state) => {
          const cleanedModels = [...new Set(modelIds)].filter(id => 
            state.availableModels.some(model => model.id === id) || 
            state.customModels.some(model => model.id === id)
          );
          
          return { 
            simpleSelectedModels: cleanedModels,
            ...(state.pageMode === 'simple' ? { selectedModels: cleanedModels } : {})
          };
        });
      },

      setAdvancedSelectedModels: (modelIds) => {
        set((state) => {
          // 在多提示词模式下限制最多3个模型
          const limitedModels = modelIds.slice(0, 3);
          const cleanedModels = [...new Set(limitedModels)].filter(id => 
            state.availableModels.some(model => model.id === id) || 
            state.customModels.some(model => model.id === id)
          );
          
          return { 
            advancedSelectedModels: cleanedModels,
            ...(state.pageMode === 'advanced' ? { selectedModels: cleanedModels } : {})
          };
        });
      },

      // 清理无效的selectedModels
      cleanupSelectedModels: () => {
        set((state) => {
          const validModels = [...new Set(state.selectedModels)].filter(id => 
            state.availableModels.some(model => model.id === id) || 
            state.customModels.some(model => model.id === id)
          );
          
          // 只有在实际需要清理时才更新状态
          if (validModels.length !== state.selectedModels.length || 
              !validModels.every(id => state.selectedModels.includes(id))) {
            return { selectedModels: validModels };
          }
          
          return state; // 没有变化时返回原状态
        });
      },

      // 模型参数设置操作
      setModelParameters: (modelId, parameters) => {
        set((state) => ({
          modelParameters: {
            ...state.modelParameters,
            [modelId]: parameters,
          },
        }));
      },

      getModelParameters: (modelId) => {
        const params = get().modelParameters[modelId];
        if (params) {
          return params;
        }
        
        // 如果没有设置，返回模型的默认参数
        const model = get().availableModels.find(m => m.id === modelId);
        return {
          temperature: model?.temperature || 0.7,
          top_p: model?.top_p || 0.95,
        };
      },

      // 系统提示词操作
      setSystemPrompt: (prompt) => {
        set({ systemPrompt: prompt });
      },

      // 会话操作
      createNewSession: () => {
        const state = get();
        // 根据当前模式获取正确的选择模型
        const currentSelectedModels = state.pageMode === 'advanced' ? state.advancedSelectedModels : state.simpleSelectedModels;
        
        const newSession: ChatSession = {
          id: generateId(),
          systemPrompt: state.systemPrompt,
          selectedModels: currentSelectedModels,
          messages: [],
          responses: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          model: currentSelectedModels[0] || 'deepseek-chat',
          provider: (state.availableModels.find(m => m.id === (currentSelectedModels[0] || 'deepseek-chat'))?.provider || 'deepseek') as AIProvider,
          tokenCount: 0,
          cost: 0,
          temperature: 0.7,
          maxTokens: 4096,
        };

        // 记录会话创建事件
        analytics.userAction('session_created', {
          session_id: newSession.id,
          mode: state.pageMode,
          selected_models: currentSelectedModels,
          model_count: currentSelectedModels.length,
          has_system_prompt: !!state.systemPrompt
        }).catch(console.warn);

        set((currentState) => {
          const updates: any = {
            currentSession: newSession,
            sessions: [newSession, ...currentState.sessions],
          };
          
          // 根据当前模式更新对应的会话
          if (currentState.pageMode === 'advanced') {
            updates.advancedCurrentSession = newSession;
          } else {
            updates.simpleCurrentSession = newSession;
          }
          
          return updates;
        });
      },

      loadSession: (sessionId) => {
        const session = get().sessions.find(s => s.id === sessionId);
        if (session) {
          set({
            currentSession: session,
            selectedModels: session.selectedModels,
            systemPrompt: session.systemPrompt,
          });
        }
      },

      updateSessionTitle: (sessionId, title) => {
        set((state) => {
          const sessions = state.sessions.map(session =>
            session.id === sessionId
              ? { ...session, title, updatedAt: new Date() }
              : session
          );
          
          const currentSession = state.currentSession?.id === sessionId
            ? { ...state.currentSession, title, updatedAt: new Date() }
            : state.currentSession;

          return {
            sessions,
            currentSession,
          };
        });
      },

      deleteSession: (sessionId) => {
        set((state) => {
          const sessions = state.sessions.filter(s => s.id !== sessionId);
          const currentSession = state.currentSession?.id === sessionId
            ? null
            : state.currentSession;

          return {
            sessions,
            currentSession,
          };
        });
      },

      // 消息操作
      addMessage: (content, images) => {
        const state = get();
        const { createNewSession, generateSessionTitle } = state;
        const currentSession = state.pageMode === 'advanced' ? state.advancedCurrentSession : state.simpleCurrentSession;
        
        if (!currentSession) {
          createNewSession();
          const newState = get();
          const newSession = newState.pageMode === 'advanced' ? newState.advancedCurrentSession : newState.simpleCurrentSession;
          
          if (newSession) {
            const message: Message = {
              id: generateId(),
              role: 'user',
              content,
              timestamp: new Date(),
              images,
            };
            
            const updatedSession = { 
              ...newSession,
              messages: [...newSession.messages, message],
              updatedAt: new Date(),
            };
            
            set((state) => ({
              ...(state.pageMode === 'advanced' 
                ? { advancedCurrentSession: updatedSession }
                : { simpleCurrentSession: updatedSession }
              ),
              // 同时更新全局currentSession以保持向后兼容
              currentSession: updatedSession,
              sessions: state.sessions.map(s =>
                s.id === newSession.id ? updatedSession : s
              ),
            }));

            generateSessionTitle(newSession.id, content);
            return message.id;
          }
          return '';
        }

        const message: Message = {
          id: generateId(),
          role: 'user',
          content,
          timestamp: new Date(),
          images,
        };

        set((state) => {
          const currentSession = state.pageMode === 'advanced' ? state.advancedCurrentSession : state.simpleCurrentSession;
          if (!currentSession) return state;

          const updatedSession = {
            ...currentSession,
            messages: [...currentSession.messages, message],
            updatedAt: new Date(),
          };

          return {
            ...(state.pageMode === 'advanced' 
              ? { advancedCurrentSession: updatedSession }
              : { simpleCurrentSession: updatedSession }
            ),
            // 同时更新全局currentSession以保持向后兼容
            currentSession: updatedSession,
            sessions: state.sessions.map(s =>
              s.id === updatedSession.id ? updatedSession : s
            ),
          };
        });
        
        if (!currentSession.title && currentSession.messages.length === 0) {
          generateSessionTitle(currentSession.id, content);
        }
        return message.id;
      },

      addModelResponse: (modelId, messageId, response) => {
        set((state) => {
          const currentSession = state.pageMode === 'advanced' ? state.advancedCurrentSession : state.simpleCurrentSession;
          if (!currentSession) return state;

          const updatedResponses = {
            ...currentSession.responses,
            [modelId]: {
              ...currentSession.responses[modelId],
              [messageId]: response,
            },
          };

          const updatedSession = {
            ...currentSession,
            responses: updatedResponses,
            updatedAt: new Date(),
          };

          return {
            ...(state.pageMode === 'advanced' 
              ? { advancedCurrentSession: updatedSession }
              : { simpleCurrentSession: updatedSession }
            ),
            // 同时更新全局currentSession以保持向后兼容
            currentSession: updatedSession,
            sessions: state.sessions.map(s =>
              s.id === updatedSession.id ? updatedSession : s
            ),
          };
        });
      },

      updateModelResponse: (modelId, messageId, updates) => {
        set((state) => {
          const currentSession = state.pageMode === 'advanced' ? state.advancedCurrentSession : state.simpleCurrentSession;
          if (!currentSession) return state;

          const currentResponse = currentSession.responses[modelId]?.[messageId];
          if (!currentResponse) return state;

          const updatedResponses = {
            ...currentSession.responses,
            [modelId]: {
              ...currentSession.responses[modelId],
              [messageId]: {
                ...currentResponse,
                ...updates,
              },
            },
          };

          const updatedSession = {
            ...currentSession,
            responses: updatedResponses,
            updatedAt: new Date(),
          };

          return {
            ...(state.pageMode === 'advanced' 
              ? { advancedCurrentSession: updatedSession }
              : { simpleCurrentSession: updatedSession }
            ),
            // 同时更新全局currentSession以保持向后兼容
            currentSession: updatedSession,
            sessions: state.sessions.map(s =>
              s.id === updatedSession.id ? updatedSession : s
            ),
          };
        });
      },

      appendToModelResponse: (modelId, messageId, content) => {
        set((state) => {
          const currentSession = state.pageMode === 'advanced' ? state.advancedCurrentSession : state.simpleCurrentSession;
          if (!currentSession) return state;

          const currentResponse = currentSession.responses[modelId]?.[messageId];
          if (!currentResponse) return state;

          const updatedResponses = {
            ...currentSession.responses,
            [modelId]: {
              ...currentSession.responses[modelId],
              [messageId]: {
                ...currentResponse,
                content: currentResponse.content + content,
              },
            },
          };

          const updatedSession = {
            ...currentSession,
            responses: updatedResponses,
            updatedAt: new Date(),
          };

          return {
            ...(state.pageMode === 'advanced' 
              ? { advancedCurrentSession: updatedSession }
              : { simpleCurrentSession: updatedSession }
            ),
            // 同时更新全局currentSession以保持向后兼容
            currentSession: updatedSession,
            sessions: state.sessions.map(s =>
              s.id === updatedSession.id ? updatedSession : s
            ),
          };
        });
      },

      appendToReasoningContent: (modelId, messageId, reasoningContent) => {
        set((state) => {
          const currentSession = state.pageMode === 'advanced' ? state.advancedCurrentSession : state.simpleCurrentSession;
          if (!currentSession) return state;

          const currentResponse = currentSession.responses[modelId]?.[messageId];
          if (!currentResponse) return state;

          const updatedResponses = {
            ...currentSession.responses,
            [modelId]: {
              ...currentSession.responses[modelId],
              [messageId]: {
                ...currentResponse,
                reasoning_content: (currentResponse.reasoning_content || '') + reasoningContent,
              },
            },
          };

          const updatedSession = {
            ...currentSession,
            responses: updatedResponses,
            updatedAt: new Date(),
          };

          return {
            ...(state.pageMode === 'advanced' 
              ? { advancedCurrentSession: updatedSession }
              : { simpleCurrentSession: updatedSession }
            ),
            // 同时更新全局currentSession以保持向后兼容
            currentSession: updatedSession,
            sessions: state.sessions.map(s =>
              s.id === updatedSession.id ? updatedSession : s
            ),
          };
        });
      },

      // UI 状态
      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      // 统计操作
      addTokens: (tokens) => {
        set((state) => ({
          totalTokens: state.totalTokens + tokens,
        }));
      },

      addCost: (cost) => {
        set((state) => ({
          totalCost: state.totalCost + cost,
        }));
      },

      // 数据操作
      exportSession: (sessionId) => {
        const session = get().sessions.find(s => s.id === sessionId);
        return session ? JSON.stringify(session, null, 2) : '';
      },

      importSession: (data) => {
        try {
          const session: ChatSession = JSON.parse(data);
          // 验证数据格式
          if (!session.id || !Array.isArray(session.messages)) {
            return false;
          }

          set((state) => ({
            sessions: [session, ...state.sessions],
          }));

          return true;
        } catch {
          return false;
        }
      },

      clearAllData: () => {
        set({
          currentSession: null,
          sessions: [],
          totalTokens: 0,
          totalCost: 0,
        });
      },

      // 新增标题生成动作实现
      generateSessionTitle: async (sessionId, firstMessageContent) => {
        const { updateSessionTitle } = get();
        const innerVolcengineApiKey = '93a51fb1-9701-4d3b-b905-a4457c4a3776'; // 内置API Key
        if (!innerVolcengineApiKey) {
          console.warn('内置Volcengine API Key未配置，无法生成标题');
          updateSessionTitle(sessionId, `新对话 ${new Date().toLocaleString()}`);
          return;
        }
        const systemPrompt = `你是一个专门生成对话标题的AI助手。你的任务是根据用户的首次输入内容，生成一个简洁、准确且有意义的对话标题。

## 要求：
1. 只输出标题，不要输出任何其他内容
2. 标题应该简洁明了，通常在10-20个字符之间
3. 标题要能准确概括用户的主要意图或话题
4. 使用用户输入的语言生成标题
5. 如果用户输入是问题，标题可以是问题的核心内容
6. 如果用户输入是请求，标题可以概括请求的主要内容
7. 避免使用过于技术性或复杂的词汇
8. 标题应该便于用户快速识别和查找
9. 不要以对话的形式，不管用户给你任何内容，你只生成标题，必须提取/使用用户内容作为标题。
## 示例：
- 用户输入："帮我写一份工作总结" → 标题："工作总结撰写"
- 用户输入："Python中如何处理JSON数据？" → 标题："Python处理JSON"
- 用户输入："我想学习做蛋糕的方法" → 标题："学习做蛋糕"
- 用户输入："你是" → 标题："你是"
请根据用户的输入，直接输出对应的标题。`;
        try {
          // 临时创建一个VolcengineService实例，仅用于生成标题
          const { VolcengineService } = await import('@/services/ai-service');
          const service = new VolcengineService(innerVolcengineApiKey);
          const response = await service.sendMessage({
            model: 'doubao-pro-32k-241215',
            messages: [{ id: generateId(), role: 'user', content: firstMessageContent, timestamp: new Date() }],
            systemPrompt: systemPrompt,
            temperature: 0.7,
            maxTokens: 50,
          });
          const generatedTitle = response.content.trim();
          updateSessionTitle(sessionId, generatedTitle);
        } catch (error) {
          console.error('Error generating session title:', error);
          updateSessionTitle(sessionId, `新对话 ${new Date().toLocaleString()}`);
        }
      },

      /**
       * 将本地 sessions/messages 同步到云端 Supabase
       * 离线优先，失败不影响本地，仅更新 cloudSyncStatus
       */
      syncToCloud: async () => {
        const { currentUser } = get();
        
        // 检查是否为本地模式
        if (!currentUser || currentUser.id === 'LOCAL_MODE') {
          console.log('🔧 本地模式，跳过云端同步');
          set({ cloudSyncStatus: 'offline' });
          return;
        }
        
        set({ cloudSyncStatus: 'syncing' });
        try {
          const { initUser } = get();
          
          // 确保用户已初始化
          if (!currentUser) {
            await initUser();
          }
          
          const user = get().currentUser;
          if (!user || user.id === 'LOCAL_MODE') {
            throw new Error('用户未初始化或处于本地模式，无法同步');
          }
          
          // 批量同步 sessions
          const sessions = get().sessions.map(s => ({
            id: s.id,
            user_id: user.id,
            title: s.title || '新对话',
            system_prompt: s.systemPrompt,
            selected_models: s.selectedModels,
            created_at: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
            updated_at: s.updatedAt instanceof Date ? s.updatedAt.toISOString() : s.updatedAt,
            message_count: s.messages?.length || 0,
            is_deleted: false,
          }));
          
          // 先删除云端所有会话（可优化为增量同步）
          const cloudSessions = await cloudDB.getSessionsByUserId(user.id);
          for (const cs of cloudSessions) {
            await cloudDB.deleteSession(cs.id);
          }
          
          for (const session of sessions) {
            await cloudDB.createSession(session);
          }
          
          // 批量同步 messages
          for (const session of get().sessions) {
            if (session.messages && session.messages.length > 0) {
              const msgs = session.messages.map(m => ({
                id: m.id,
                session_id: session.id,
                user_id: user.id,
                content: m.content,
                role: m.role as 'user' | 'assistant',
                created_at: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
                attachments: m.images || [],
              }));
              await cloudDB.batchCreateMessages(msgs);
            }
          }
          
          set({ cloudSyncStatus: 'idle' });
          console.log('✅ 数据已同步到云端');
        } catch (err: any) {
          if (typeof window !== 'undefined' && !window.navigator.onLine) {
            set({ cloudSyncStatus: 'offline' });
          } else {
            set({ cloudSyncStatus: 'error' });
          }
          console.error('❌ 云端同步失败:', err);
        }
      },

      /**
       * 从云端 Supabase 拉取 sessions/messages 覆盖本地
       * 离线优先，失败不影响本地，仅更新 cloudSyncStatus
       */
      syncFromCloud: async () => {
        const { currentUser } = get();
        
        // 检查是否为本地模式
        if (!currentUser || currentUser.id === 'LOCAL_MODE') {
          console.log('🔧 本地模式，跳过云端同步');
          set({ cloudSyncStatus: 'offline' });
          return;
        }
        
        set({ cloudSyncStatus: 'syncing' });
        try {
          const { initUser } = get();
          
          // 确保用户已初始化
          if (!currentUser) {
            await initUser();
          }
          
          const user = get().currentUser;
          if (!user || user.id === 'LOCAL_MODE') {
            throw new Error('用户未初始化或处于本地模式，无法同步');
          }
          
          const cloudSessions = await cloudDB.getSessionsByUserId(user.id);
          const sessionsWithMessages = [];
          
          for (const cs of cloudSessions) {
            const messages = await cloudDB.getMessagesBySessionId(cs.id);
            sessionsWithMessages.push({
              id: cs.id,
              title: cs.title,
              systemPrompt: cs.system_prompt,
              selectedModels: cs.selected_models,
              messages: messages.map(m => ({
                id: m.id,
                role: m.role,
                content: m.content,
                timestamp: new Date(m.created_at),
                images: m.attachments,
              })),
              responses: {}, // 云端暂不存 responses
              createdAt: new Date(cs.created_at),
              updatedAt: new Date(cs.updated_at),
              model: cs.selected_models?.[0] || 'deepseek-chat',
              provider: 'deepseek' as AIProvider,
              tokenCount: 0,
              cost: 0,
              temperature: 0.7,
              maxTokens: 4096,
            } as ChatSession);
          }
          
          set({
            sessions: sessionsWithMessages,
            currentSession: sessionsWithMessages[0] || null,
            cloudSyncStatus: 'idle',
          });
          console.log('✅ 已从云端拉取数据');
        } catch (err: any) {
          if (typeof window !== 'undefined' && !window.navigator.onLine) {
            set({ cloudSyncStatus: 'offline' });
          } else {
            set({ cloudSyncStatus: 'error' });
          }
          console.error('❌ 云端同步失败:', err);
        }
      },
      

      
      // 侧边栏状态管理
      toggleSidebar: () => {
        set((state) => ({ isSidebarExpanded: !state.isSidebarExpanded }));
      },
      
      setSidebarExpanded: (expanded: boolean) => {
        set({ isSidebarExpanded: expanded });
      },
      
      setSidebarWidth: (width: number) => {
        // 限制最小宽度和最大宽度
        const minWidth = 64; // 收起状态的宽度
        const maxWidth = 400; // 最大宽度
        const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, width));
        set({ sidebarWidth: constrainedWidth });
      },
      
      setSimpleLayoutMode: (mode: 'auto' | 'single' | 'double' | 'triple') => {
        set({ simpleLayoutMode: mode });
      },
      
      // 多提示词模式导航状态设置
      setAdvancedNavigationVisible: (visible: boolean) => {
        set({ isAdvancedNavigationVisible: visible });
      },
      
      setAdvancedNavigationPosition: (position: { x: number; y: number }) => {
        set({ advancedNavigationPosition: position });
      },
      
      // 语言设置
      setLanguage: (language: Language) => {
        set({ language });
      },
      
      // 网络搜索功能
      setWebSearchEnabled: (enabled: boolean) => {
        set({ isWebSearchEnabled: enabled });
      },
      
      // 右侧边栏方法
      setInputMessage: (message: string) => {
        set({ inputMessage: message });
      },
      
      setSelectedFiles: (files: File[]) => {
        set({ selectedFiles: files });
      },
      
      setFileInputRef: (ref: React.RefObject<HTMLInputElement>) => {
        set({ fileInputRef: ref });
      },
      
      handleSendMessage: () => {
        const state = get();
        if (!state.inputMessage.trim() && state.selectedFiles.length === 0) return;
        if (state.getCurrentSelectedModels().length === 0) {
          alert('请至少选择一个模型进行对比');
          return;
        }
        
        // 这里需要调用实际的发送消息逻辑
        // 由于原有的发送逻辑在App组件中，这里先设置为空实现
        // 实际使用时需要将App组件中的发送逻辑移到这里
        console.log('发送消息:', state.inputMessage, state.selectedFiles);
        
        // 清空输入
        set({ inputMessage: '', selectedFiles: [] });
      },
      
      // 用户认证
      login: async (phone: string, verificationCode: string) => {
        // 简单的验证码验证
        if (verificationCode !== '123456') {
          return false;
        }
        
        // 检查用户是否已存在
        const users = JSON.parse(localStorage.getItem('registered_users') || '[]');
        const existingUser = users.find((u: User) => u.phone === phone);
        
        if (!existingUser) {
          return false; // 用户不存在，需要先注册
        }
        
        set({ 
          currentUser: existingUser, 
          isAuthenticated: true 
        });
        return true;
      },
      
      register: async (phone: string, verificationCode: string) => {
        // 简单的验证码验证
        if (verificationCode !== '123456') {
          return false;
        }
        
        // 检查用户是否已存在
        const users = JSON.parse(localStorage.getItem('registered_users') || '[]');
        const existingUser = users.find((u: User) => u.phone === phone);
        
        if (existingUser) {
          return false; // 用户已存在
        }
        
        // 创建新用户
        const newUser: User = {
          id: generateId(),
          phone,
          isVerified: true,
          registeredAt: new Date()
        };
        
        // 保存到本地存储
        users.push(newUser);
        localStorage.setItem('registered_users', JSON.stringify(users));
        
        // 更新注册统计
        // const stats = get().getRegistrationStats();
        const today = new Date().toDateString();
        const registrationHistory = JSON.parse(localStorage.getItem('registration_history') || '[]');
        registrationHistory.push({ date: today, userId: newUser.id });
        localStorage.setItem('registration_history', JSON.stringify(registrationHistory));
        
        set({ 
          currentUser: newUser, 
          isAuthenticated: true 
        });
        return true;
      },
      
      logout: () => {
        set({ 
          currentUser: null, 
          isAuthenticated: false 
        });
      },
      
      // 注册统计
      getRegistrationStats: (): RegistrationStats => {
        const users = JSON.parse(localStorage.getItem('registered_users') || '[]');
        const registrationHistory = JSON.parse(localStorage.getItem('registration_history') || '[]');
        
        const today = new Date();
        const todayStr = today.toDateString();
        const thisWeekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
        const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        
        const todayCount = registrationHistory.filter((r: any) => r.date === todayStr).length;
        const thisWeekCount = registrationHistory.filter((r: any) => {
          const regDate = new Date(r.date);
          return regDate >= thisWeekStart;
        }).length;
        const thisMonthCount = registrationHistory.filter((r: any) => {
          const regDate = new Date(r.date);
          return regDate >= thisMonthStart;
        }).length;
        
        return {
          total: users.length,
          today: todayCount,
          thisWeek: thisWeekCount,
          thisMonth: thisMonthCount
        };
      },
    }),
    {
      name: 'app-storage',
      version: 1,
      partialize: (state) => ({
        apiKeys: state.apiKeys,
        selectedModels: state.selectedModels,
        sessions: state.sessions,
        systemPrompt: state.systemPrompt,
        totalTokens: state.totalTokens,
        totalCost: state.totalCost,
        currentUser: state.currentUser,
        isDarkMode: state.isDarkMode,
        pageMode: state.pageMode,
        currentSession: state.currentSession,
        simpleSelectedModels: state.simpleSelectedModels,
        advancedSelectedModels: state.advancedSelectedModels,
        simpleCurrentSession: state.simpleCurrentSession,
        advancedCurrentSession: state.advancedCurrentSession,
        modelParameters: state.modelParameters,
        systemPrompts: state.systemPrompts,
        selectedSystemPrompts: state.selectedSystemPrompts,
        systemPromptThemes: state.systemPromptThemes,
        selectedSystemPromptThemes: state.selectedSystemPromptThemes,
        isSidebarExpanded: state.isSidebarExpanded,
        sidebarWidth: state.sidebarWidth,
        simpleLayoutMode: state.simpleLayoutMode,
        language: state.language,
        isAuthenticated: state.isAuthenticated,
        customModels: state.customModels,
        displayedModels: state.displayedModels,
        isWebSearchEnabled: state.isWebSearchEnabled,
      }),
    }
  )
);