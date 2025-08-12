import React, { useState, useEffect } from 'react';
import { X, Plus, Search, Settings, Trash2, Check } from 'lucide-react';
import { useAppStore } from '@/store';
import { getModelsByProviderGrouped, PROVIDERS, AVAILABLE_MODELS } from '@/lib/models';
import { ModelConfig } from '@/types';
import { toast } from 'sonner';

interface ModelManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CustomModel {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  description?: string;
  isCustom: boolean;
}

interface AddModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (model: CustomModel) => void;
}

const AddModelModal: React.FC<AddModelModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    provider: '',
    name: '',
    modelId: '',
    description: ''
  });

  const providers = Object.keys(PROVIDERS);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.provider || !formData.name || !formData.modelId) {
      toast.error('请填写所有必填字段');
      return;
    }

    const customModel: CustomModel = {
      id: `custom-${Date.now()}`,
      name: formData.name,
      provider: formData.provider,
      modelId: formData.modelId,
      description: formData.description,
      isCustom: true
    };

    onAdd(customModel);
    setFormData({ provider: '', name: '', modelId: '', description: '' });
    onClose();
    toast.success('模型添加成功');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">新增自定义模型</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              厂商名称 *
            </label>
            <select
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="">请选择厂商</option>
              {providers.map(provider => (
                <option key={provider} value={provider}>
                  {PROVIDERS[provider as keyof typeof PROVIDERS]?.name || provider}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              模型名称 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="GPT-4-Custom"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              模型标识码 *
            </label>
            <input
              type="text"
              value={formData.modelId}
              onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
              placeholder="gpt-4-custom"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">用于API调用的模型标识</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              模型描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="请输入模型描述..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              确认添加
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ModelManagement: React.FC<ModelManagementProps> = ({ isOpen, onClose }) => {
  const { getCurrentSelectedModels, toggleModel, apiKeys, getDisplayedModels, toggleModelDisplay, setDisplayedModels, getAllModels, addCustomModel, deleteCustomModel } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [addModelModalOpen, setAddModelModalOpen] = useState(false);
  const [highlightedModel, setHighlightedModel] = useState<string | null>(null);

  const selectedModels = getCurrentSelectedModels();
  const displayedModels = getDisplayedModels();
  const providerGroups = getModelsByProviderGrouped();

  // 检查提供商是否有API密钥
  const isProviderAvailable = (provider: string) => {
    const providerKey = provider === 'doubao' ? 'volcengine' : provider;
    return !!apiKeys[providerKey as keyof typeof apiKeys];
  };

  // 获取所有模型（包括自定义模型）
  const allModels = getAllModels();

  // 筛选模型
  const filteredModels = allModels.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.modelId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProvider = !selectedProvider || model.provider === selectedProvider;
    const matchesType = !selectedType; // 暂时不实现类型筛选
    const matchesStatus = !selectedStatus || 
                         (selectedStatus === 'selected' && selectedModels.includes(model.id)) ||
                         (selectedStatus === 'unselected' && !selectedModels.includes(model.id)) ||
                         (selectedStatus === 'displayed' && displayedModels.includes(model.id)) ||
                         (selectedStatus === 'hidden' && !displayedModels.includes(model.id)) ||
                         (selectedStatus === 'custom' && model.isCustom);
    
    return matchesSearch && matchesProvider && matchesType && matchesStatus;
  });

  // 按厂商分组筛选后的模型
  const groupedFilteredModels = filteredModels.reduce((groups, model) => {
    const provider = model.provider;
    if (!groups[provider]) {
      groups[provider] = [];
    }
    groups[provider].push(model);
    return groups;
  }, {} as Record<string, typeof filteredModels>);

  // 添加自定义模型
  const handleAddCustomModel = (model: CustomModel) => {
    addCustomModel({
      id: model.id,
      name: model.name,
      provider: model.provider,
      modelId: model.modelId,
      description: model.description || ''
    });
    // 高亮显示新添加的模型
    setHighlightedModel(model.id);
    setTimeout(() => setHighlightedModel(null), 2000);
  };

  // 删除自定义模型
  const handleDeleteCustomModel = (modelId: string) => {
    deleteCustomModel(modelId);
    toast.success('模型删除成功');
  };

  // 重置筛选
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedProvider('');
    setSelectedType('');
    setSelectedStatus('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl mx-4 h-[80vh] flex flex-col">
        {/* 标头 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
          <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">模型管理</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setAddModelModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4" />
              <span>新增模型</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* 筛选区域 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-600">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="搜索模型名称..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
            </div>
            
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="">所有厂商</option>
              {Object.keys(PROVIDERS).map(provider => (
                <option key={provider} value={provider}>
                  {PROVIDERS[provider as keyof typeof PROVIDERS]?.name || provider}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="">所有状态</option>
              <option value="selected">已选择</option>
              <option value="unselected">未选择</option>
              <option value="displayed">已显示</option>
              <option value="hidden">已隐藏</option>
              <option value="custom">自定义</option>
            </select>

            {(searchTerm || selectedProvider || selectedStatus) && (
              <button
                onClick={resetFilters}
                className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                重置
              </button>
            )}
          </div>
        </div>

        {/* 主内容区域 */}
        <div className="flex-1 overflow-hidden">
          <div className="p-4 overflow-y-auto h-full">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">模型列表</h3>
            
            {Object.keys(groupedFilteredModels).length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-6 text-sm">
                没有找到匹配的模型
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedFilteredModels).map(([provider, models]) => {
                  const providerInfo = PROVIDERS[provider as keyof typeof PROVIDERS];
                  const isAvailable = isProviderAvailable(provider);
                  
                  return (
                    <div key={provider} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 flex items-center justify-center">
                          <img 
                            src={providerInfo?.logo} 
                            alt={providerInfo?.name} 
                            className="w-4 h-4 rounded object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const emojiSpan = document.createElement('span');
                              emojiSpan.textContent = providerInfo?.icon || '❓';
                              emojiSpan.className = 'text-lg';
                              target.parentNode?.appendChild(emojiSpan);
                            }}
                          />
                        </div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {providerInfo?.name || provider}
                        </h4>
                        {!isAvailable && (
                          <span className="text-xs text-red-600 bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded">
                            未配置API密钥
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {models.map(model => {
                          const isSelected = selectedModels.includes(model.id);
                          const isDisplayed = displayedModels.includes(model.id);
                          const isHighlighted = highlightedModel === model.id;
                          
                          return (
                            <div 
                              key={model.id}
                              className={`border rounded-lg p-3 transition-all duration-200 ${
                                isDisplayed 
                                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                              } ${
                                isHighlighted ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <h5 className="font-medium text-sm text-gray-700 dark:text-gray-300">
                                      {model.name}
                                    </h5>
                                    {model.isCustom && (
                                      <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 px-2 py-1 rounded">
                                        自定义
                                      </span>
                                    )}
                                    {model.supportVision && (
                                      <span className="text-xs text-green-600 dark:text-green-400" title="支持视觉">
                                        👁️
                                      </span>
                                    )}
                                  </div>
                                  
                                  {model.description && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                                      {model.description}
                                    </p>
                                  )}
                                  
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {model.modelId}
                                    </span>
                                    
                                    <div className="flex items-center space-x-2">
                                      {model.isCustom && (
                                        <button
                                          onClick={() => handleDeleteCustomModel(model.id)}
                                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                          title="删除自定义模型"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      )}
                                      
                                      <button
                                        onClick={() => toggleModelDisplay(model.id)}
                                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                          isDisplayed
                                            ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400'
                                            : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400'
                                        }`}
                                      >
                                        {isDisplayed ? '隐藏' : '显示'}
                                      </button>
                                    </div>
                                  </div>
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
            )}
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="flex justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            取消
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            确定
          </button>
        </div>
      </div>

      {/* 新增模型弹窗 */}
      <AddModelModal
        isOpen={addModelModalOpen}
        onClose={() => setAddModelModalOpen(false)}
        onAdd={handleAddCustomModel}
      />
    </div>
  );
};