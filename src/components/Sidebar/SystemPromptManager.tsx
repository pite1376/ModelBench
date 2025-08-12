import React, { useState, useCallback } from 'react';
import { useAppStore } from '@/store';
import { Plus, Edit2, Trash2, Check, X, Download, Maximize2, Minimize2, ChevronDown, ChevronRight, Search } from 'lucide-react';

interface PromptVersion {
  name: string;
  content: string;
}

export const SystemPromptManager: React.FC = () => {
  const { 
    systemPromptThemes, 
    selectedSystemPromptThemes, 
    addSystemPromptTheme, 
    updateSystemPromptTheme, 
    deleteSystemPromptTheme,
    // addVersionToTheme,
    updateThemeVersion,
    // deleteThemeVersion,
    toggleSystemPromptTheme 
  } = useAppStore();
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [editingVersionId, setEditingVersionId] = useState<string | null>(null);
  
  // 主题管理状态
  const [newThemeName, setNewThemeName] = useState('');
  const [newThemeDescription, setNewThemeDescription] = useState('');
  const [promptVersions, setPromptVersions] = useState<PromptVersion[]>([
    { name: '版本一', content: '' },
    { name: '版本二', content: '' }
  ]);
  
  // UI状态
  const [expandedThemes, setExpandedThemes] = useState<{ [key: string]: boolean }>({});
  const [expandedInputs, setExpandedInputs] = useState<{ [key: number]: boolean }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedForDownload, setSelectedForDownload] = useState<string[]>([]);

  // 预设模板
  const presetTemplates = [
    { 
      name: '翻译助手', 
      description: '专业的多语言翻译助手',
      versions: [
        { name: '标准版本', content: '你是一个专业的翻译助手，能够准确翻译各种语言之间的文本，保持原文的语调和含义。' },
        { name: '正式版本', content: '你是一位资深的专业翻译，擅长处理商务、学术和正式文档的翻译工作，确保用词准确、语法规范。' }
      ]
    },
    { 
      name: '代码审查', 
      description: '代码质量审查专家',
      versions: [
        { name: '通用版本', content: '你是一个经验丰富的软件工程师，专门负责代码审查。请分析代码的质量、性能、安全性和最佳实践。' },
        { name: '安全版本', content: '你是网络安全专家，专注于代码安全审查。请重点关注潜在的安全漏洞、注入攻击和数据泄露风险。' }
      ]
    },
    { 
      name: '创意写作', 
      description: '创意内容创作助手',
      versions: [
        { name: '文学版本', content: '你是一个富有创意的作家，擅长创作各种类型的文学作品，包括小说、诗歌、散文等。' },
        { name: '营销版本', content: '你是营销文案专家，擅长创作吸引人的广告文案、产品描述和营销内容。' }
      ]
    },
  ];

  // 使用useCallback包装事件处理函数，避免渲染期间状态更新
  const handleToggleSystemPromptTheme = useCallback((themeId: string) => {
    toggleSystemPromptTheme(themeId);
  }, [toggleSystemPromptTheme]);

  // 搜索过滤
  const filteredThemes = systemPromptThemes.filter(theme =>
    theme.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    theme.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    theme.versions.some(v => v.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleThemeExpansion = (themeId: string) => {
    setExpandedThemes(prev => ({
      ...prev,
      [themeId]: !prev[themeId]
    }));
  };

  const handleAddVersion = () => {
    if (promptVersions.length < 3) {
      setPromptVersions(prev => [...prev, { name: `版本${prev.length + 1}`, content: '' }]);
    }
  };

  const handleVersionChange = (index: number, field: 'name' | 'content', value: string) => {
    setPromptVersions(prev => prev.map((version, i) => 
      i === index ? { ...version, [field]: value } : version
    ));
  };

  const handleUseTemplate = (template: any) => {
    setNewThemeName(template.name);
    setNewThemeDescription(template.description);
    setPromptVersions(template.versions.map((v: any, index: number) => ({
      name: v.name || `版本${index + 1}`,
      content: v.content
    })));
  };

  const handleSaveTheme = () => {
    if (!newThemeName.trim()) {
      alert('请输入主题名称');
      return;
    }

    const validVersions = promptVersions.filter(version => 
      version.name.trim() && version.content.trim()
    );
    
    if (validVersions.length === 0) {
      alert('请至少填写一个完整的版本');
      return;
    }

    addSystemPromptTheme(
      newThemeName.trim(), 
      newThemeDescription.trim(), 
      validVersions
    );

    // 重置状态
    setNewThemeName('');
    setNewThemeDescription('');
    setPromptVersions([
      { name: '版本一', content: '' },
      { name: '版本二', content: '' }
    ]);
    setIsAdding(false);
    setExpandedInputs({});
  };

  const handleCancelAdd = () => {
    setNewThemeName('');
    setNewThemeDescription('');
    setPromptVersions([
      { name: '版本一', content: '' },
      { name: '版本二', content: '' }
    ]);
    setIsAdding(false);
    setExpandedInputs({});
  };

  const toggleInputExpansion = (index: number) => {
    setExpandedInputs(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // 下载功能
  const handleOpenDownloadModal = () => {
    setSelectedForDownload([]);
    setShowDownloadModal(true);
  };

  const handleConfirmDownload = () => {
    if (selectedForDownload.length === 0) {
      alert('请选择要下载的主题');
      return;
    }

    const selectedThemes = systemPromptThemes.filter(theme => 
      selectedForDownload.includes(theme.id)
    );

    downloadThemes(selectedThemes);
    setShowDownloadModal(false);
  };

  const downloadThemes = (themes: any[]) => {
    if (themes.length === 0) {
      alert('没有可下载的主题');
      return;
    }

    let content = '';
    themes.forEach((theme, themeIndex) => {
      content += `主题: ${theme.name}\n`;
      content += `描述: ${theme.description || '无描述'}\n`;
      content += `创建时间: ${new Date(theme.createdAt).toLocaleString()}\n`;
      if (theme.isDefault) {
        content += `标签: 默认主题\n`;
      }
      content += `版本数量: ${theme.versions.length}\n\n`;

      theme.versions.forEach((version: any, versionIndex: number) => {
        content += `  ${version.name}:\n`;
        content += `  创建时间: ${new Date(version.createdAt).toLocaleString()}\n`;
        content += `  内容:\n${version.content}\n`;
        if (versionIndex < theme.versions.length - 1) {
          content += `\n  ${'—'.repeat(30)}\n\n`;
        }
      });

      if (themeIndex < themes.length - 1) {
        content += `\n${'='.repeat(50)}\n\n`;
      }
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const filename = themes.length === 1 
      ? `${themes[0].name}_主题_${new Date().toISOString().slice(0, 10)}.txt`
      : `系统提示词主题合集_${new Date().toISOString().slice(0, 10)}.txt`;
    
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleDownloadSelection = useCallback((themeId: string) => {
    setSelectedForDownload(prev => 
      prev.includes(themeId) 
        ? prev.filter(id => id !== themeId)
        : [...prev, themeId]
    );
  }, []);

  return (
    <div className="space-y-4">
      {/* 固定工具栏 */}
      <div className="sticky top-0 bottom=0 bg-white dark:bg-gray-800 z-10">
        <div className="px-0 py-0">
          <div className="flex items-center justify-end my-0">
            <div className="flex items-center space-x-1">
              {/* 搜索输入框 */}
              {showSearchInput ? (
                <div className="flex items-center space-x-1">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="搜索主题..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-32 pl-7 pr-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      autoFocus
                      onBlur={() => !searchTerm && setShowSearchInput(false)}
                    />
                    <Search size={12} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                  
                  {/* 新增按钮 */}
                  {!isAdding && (
                    <button
                      onClick={() => setIsAdding(true)}
                      className="px-1.5 py-0 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="新增主题"
                    >
                      <Plus size={12} />
                    </button>
                  )}
                  
                  {/* 下载按钮 */}
                  {systemPromptThemes.length > 0 && (
                    <button
                      onClick={handleOpenDownloadModal}
                      className="px-1.5 py-0 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="导出主题"
                    >
                      <Download size={12} />
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setShowSearchInput(true)}
                    className="px-1.5 py-0 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    title="搜索"
                  >
                    <Search size={12} />
                  </button>
                  
                  {/* 新增按钮 */}
                  {!isAdding && (
                    <button
                      onClick={() => setIsAdding(true)}
                      className="px-1.5 py-0 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="新增主题"
                    >
                      <Plus size={12} />
                    </button>
                  )}
                  
                  {/* 下载按钮 */}
                  {systemPromptThemes.length > 0 && (
                    <button
                      onClick={handleOpenDownloadModal}
                      className="px-1.5 py-0 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="导出主题"
                    >
                      <Download size={12} />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 主题添加表单 */}
      {isAdding && (
        <div className="p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div className="space-y-4">
            {/* 快速模板 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">快速模板</label>
              <div className="grid grid-cols-1 gap-1">
                {presetTemplates.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => handleUseTemplate(template)}
                    className="text-left p-2 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{template.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{template.description}</div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* 主题信息 */}
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">主题名称</label>
                <input
                  type="text"
                  value={newThemeName}
                  onChange={(e) => setNewThemeName(e.target.value)}
                  placeholder="如：翻译助手、代码审查..."
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 transition-all placeholder-gray-400 dark:placeholder-gray-500"
                  maxLength={30}
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">主题描述</label>
                <input
                  type="text"
                  value={newThemeDescription}
                  onChange={(e) => setNewThemeDescription(e.target.value)}
                  placeholder="简短描述这个主题的用途..."
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-400 dark:placeholder-gray-500"
                  maxLength={100}
                />
              </div>
            </div>
            
            {/* 版本输入框 */}
            {promptVersions.map((version, index) => (
              <div key={index} className={`prompt-version-container space-y-1 ${expandedInputs[index] ? 'expanded' : ''}`}>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    {version.name}
                  </label>
                  <button
                    onClick={() => toggleInputExpansion(index)}
                    className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                    title={expandedInputs[index] ? '收起输入框' : '展开输入框'}
                  >
                    {expandedInputs[index] ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                  </button>
                </div>
                
                <input
                  type="text"
                  value={version.name}
                  onChange={(e) => handleVersionChange(index, 'name', e.target.value)}
                  placeholder={`版本${index + 1}名称`}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-400 dark:placeholder-gray-500"
                  maxLength={20}
                />
                
                <div className="relative">
                  <textarea
                    value={version.content}
                    onChange={(e) => handleVersionChange(index, 'content', e.target.value)}
                    placeholder={`${version.name}的详细内容...`}
                    className={`expandable-textarea w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-400 dark:placeholder-gray-500 ${
                      expandedInputs[index] ? 'expanded' : ''
                    }`}
                    rows={expandedInputs[index] ? 9 : 3}
                  />
                  {expandedInputs[index] && (
                    <div className="absolute bottom-2 right-2 text-xs text-gray-400 dark:text-gray-500">
                      {version.content.length} 字符
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* 添加版本三按钮 */}
            {promptVersions.length < 3 && (
              <button
                onClick={handleAddVersion}
                className="w-full p-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded text-gray-600 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center justify-center space-x-1 text-xs"
              >
                <Plus size={12} />
                <span>添加版本三</span>
              </button>
            )}
            
            {/* 操作按钮 */}
            <div className="flex space-x-2">
              <button
                onClick={handleSaveTheme}
                className="flex-1 px-2 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 flex items-center justify-center space-x-1"
              >
                <Check size={12} />
                <span>保存</span>
              </button>
              <button
                onClick={handleCancelAdd}
                className="flex-1 px-2 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded hover:bg-gray-300 dark:hover:bg-gray-500 flex items-center justify-center space-x-1"
              >
                <X size={12} />
                <span>取消</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 主题列表 */}
      <div className="space-y-2">
        {filteredThemes.map((theme) => {
          const isSelected = selectedSystemPromptThemes.includes(theme.id);
          const isExpanded = expandedThemes[theme.id];
          
          return (
            <div key={theme.id} className="border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
              {/* 主题标题栏 */}
              <div className="flex items-center space-x-1 px-2 py-1.5">
                <input
                  type="radio"
                  name="systemPromptTheme"
                  id={theme.id}
                  checked={isSelected}
                  onChange={() => handleToggleSystemPromptTheme(theme.id)}
                  className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 flex-shrink-0"
                />
                
                <button
                  onClick={() => toggleThemeExpansion(theme.id)}
                  className="flex-1 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 px-1 py-0.5 rounded transition-colors min-w-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-medium text-gray-900 dark:text-white truncate">
                        {theme.name}
                      </span>
                      {theme.isDefault && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1 py-0.5 rounded flex-shrink-0">默认</span>
                      )}
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded flex-shrink-0">
                        {theme.versions.length}
                      </span>
                    </div>
                    {theme.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{theme.description}</div>
                    )}
                  </div>
                  
                  <div className="flex items-center ml-1 flex-shrink-0">
                    {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                  </div>
                </button>
                
                {/* 操作按钮 */}
                <div className="flex space-x-0.5 flex-shrink-0">
                  <button
                    onClick={() => setEditingThemeId(editingThemeId === theme.id ? null : theme.id)}
                    className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded"
                    title="编辑主题"
                  >
                    <Edit2 size={10} />
                  </button>
                  <button
                    onClick={() => deleteSystemPromptTheme(theme.id)}
                    className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded"
                    title="删除主题"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              </div>
              
              {/* 主题编辑表单 */}
              {editingThemeId === theme.id && (
                <div className="px-3 pb-3 border-t border-gray-100 dark:border-gray-600">
                  <div className="space-y-3 pt-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">主题名称</label>
                      <input
                        type="text"
                        defaultValue={theme.name}
                        onBlur={(e) => {
                          if (e.target.value.trim() && e.target.value !== theme.name) {
                            updateSystemPromptTheme(theme.id, { name: e.target.value.trim() });
                          }
                        }}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">主题描述</label>
                      <textarea
                        defaultValue={theme.description}
                        onBlur={(e) => {
                          if (e.target.value !== theme.description) {
                            updateSystemPromptTheme(theme.id, { description: e.target.value });
                          }
                        }}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 版本列表 */}
              {isExpanded && (
                <div className="px-3 pb-3 border-t border-gray-100 dark:border-gray-600">
                  <div className="space-y-2 pt-3">
                    {theme.versions.map((version: any) => (
                      <div key={version.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                        {editingVersionId === version.id ? (
                          /* 编辑版本内容 */
                          <div className="space-y-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">版本名称</label>
                              <input
                                type="text"
                                defaultValue={version.name}
                                onBlur={(e) => {
                                  if (e.target.value.trim() && e.target.value !== version.name) {
                                    updateThemeVersion(theme.id, version.id, { name: e.target.value.trim() });
                                  }
                                }}
                                className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">版本内容</label>
                              <textarea
                                defaultValue={version.content}
                                onBlur={(e) => {
                                  if (e.target.value !== version.content) {
                                    updateThemeVersion(theme.id, version.id, { content: e.target.value });
                                  }
                                }}
                                className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                rows={6}
                              />
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setEditingVersionId(null)}
                                className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 flex items-center space-x-1"
                              >
                                <Check size={10} />
                                <span>完成</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* 显示版本内容 */
                          <>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                📄 {version.name}
                              </span>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => setEditingVersionId(version.id)}
                                  className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded"
                                  title="编辑版本"
                                >
                                  <Edit2 size={10} />
                                </button>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(version.updatedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                              {version.content.length > 150 
                                ? `${version.content.slice(0, 150)}...` 
                                : version.content
                              }
                            </p>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>



      {/* 下载模态框 */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">选择下载内容</h3>
            
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
              {systemPromptThemes.map((theme) => (
                <label 
                  key={theme.id} 
                  className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedForDownload.includes(theme.id)}
                    onChange={() => toggleDownloadSelection(theme.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{theme.name}</div>
                    <div className="text-xs text-gray-600">
                      {theme.versions.length} 个版本
                      {theme.description && ` • ${theme.description}`}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleConfirmDownload}
                disabled={selectedForDownload.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下载选中项 ({selectedForDownload.length})
              </button>
              <button
                onClick={() => setShowDownloadModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};