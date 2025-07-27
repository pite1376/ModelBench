import React, { useState, useEffect } from 'react';
import { Zap, Settings, ArrowRight, Brain, Code, BarChart3, User, LogOut, Globe } from 'lucide-react';
import { useAppStore } from '@/store';
import { AuthModal } from '@/components/AuthModal';
import { useTranslation } from '@/utils/translations';

export const LandingPage: React.FC = () => {
  const { setPageMode, language, setLanguage, currentUser, isAuthenticated, logout } = useAppStore();
  const t = useTranslation(language);
  const [currentFeature, setCurrentFeature] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // 轮播功能特性
  const features = [
    { icon: Brain, text: t.landing.title, color: "text-blue-500" },
    { icon: Code, text: language === 'zh' ? "实时流式响应" : "Real-time streaming", color: "text-green-500" },
    { icon: BarChart3, text: language === 'zh' ? "性能数据分析" : "Performance analysis", color: "text-purple-500" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleModeSelect = (mode: 'simple' | 'advanced') => {
    setPageMode(mode);
  };

  return (
    <div className="min-h-screen bg-white relative">
      {/* 动态网格背景 */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      {/* 顶部导航栏 */}
      <div className="relative z-20 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <img 
                src="/favicon-96x96.png" 
                alt="ModelBench" 
                className="w-8 h-8 rounded"
              />
              <span className="text-xl font-bold text-black">{t.landing.title}</span>
            </div>

            {/* 右侧按钮组 */}
            <div className="flex items-center space-x-4">
              {/* 语言切换 */}
              <button
                onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-black transition-colors"
                title={language === 'zh' ? 'Switch to English' : '切换到中文'}
              >
                <Globe size={18} />
                <span className="text-sm font-medium">{language === 'zh' ? 'EN' : '中文'}</span>
              </button>

              {/* 认证相关按钮 */}
              {isAuthenticated && currentUser ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">
                    {currentUser.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}
                  </span>
                  <button
                    onClick={logout}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-black border border-gray-300 rounded-lg hover:border-gray-400 transition-all"
                  >
                    <LogOut size={16} />
                    <span className="text-sm font-medium">{t.common.logout}</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <User size={16} />
                  <span className="text-sm font-medium">{t.common.login}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-8">
        {/* 标题区域 */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl font-bold text-black mb-3">
            {t.landing.title}
          </h1>
          
          <p className="text-xl text-gray-600 mb-6 max-w-xl mx-auto">
            {t.landing.subtitle}
            <br />
            <span className="text-base text-gray-500">{t.landing.description}</span>
          </p>

          {/* 动态功能展示 */}
          <div className="flex items-center justify-center space-x-2 mb-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-500 ${
                    index === currentFeature
                      ? 'bg-gray-100 border-gray-300 scale-105'
                      : 'bg-white border-gray-200 scale-100'
                  }`}
                >
                  <Icon size={16} className={`text-gray-600 transition-all duration-500`} />
                  <span className={`text-sm font-medium transition-all duration-500 ${
                    index === currentFeature ? 'text-black' : 'text-gray-500'
                  }`}>
                    {feature.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 模式选择区域 */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl w-full mb-8 -mt-6">
          {/* 单提示词模式 */}
          <div className="group relative">
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-lg transition-all duration-300 hover:transform hover:scale-105">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <Zap size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black mb-1">单提示词模式</h3>
                  <p className="text-gray-600 text-sm">同一个提示词多模型输出效果对比</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-start space-x-3">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2"></div>
                  <div>
                    <h4 className="text-black font-medium text-sm">一键多模型对比</h4>
                    <p className="text-gray-500 text-xs">输入一个提示词，同时获取多个AI模型的回答</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2"></div>
                  <div>
                    <h4 className="text-black font-medium text-sm">智能模型推荐</h4>
                    <p className="text-gray-500 text-xs">根据问题类型自动推荐最适合的模型组合</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2"></div>
                  <div>
                    <h4 className="text-black font-medium text-sm">简洁易用界面</h4>
                    <p className="text-gray-500 text-xs">专为快速对比设计的简洁界面</p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => handleModeSelect('simple')}
                className="w-full bg-blue-600 text-white font-medium py-2.5 px-6 rounded-lg hover:bg-blue-700 transition-all duration-300 flex items-center justify-center space-x-2 group"
              >
                <span>开始使用</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* 多提示词模式 */}
          <div className="group relative">
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-lg transition-all duration-300 hover:transform hover:scale-105">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <Settings size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black mb-1">多提示词模式</h3>
                  <p className="text-gray-600 text-sm">多提示词多模型一起对比分析</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-start space-x-3">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2"></div>
                  <div>
                    <h4 className="text-black font-medium text-sm">矩阵式对比</h4>
                    <p className="text-gray-500 text-xs">多个提示词与多个模型的全面对比矩阵</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2"></div>
                  <div>
                    <h4 className="text-black font-medium text-sm">提示词管理</h4>
                    <p className="text-gray-500 text-xs">支持保存、编辑和复用提示词模板</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2"></div>
                  <div>
                    <h4 className="text-black font-medium text-sm">深度分析</h4>
                    <p className="text-gray-500 text-xs">提供详细的性能分析和对比报告</p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => handleModeSelect('advanced')}
                className="w-full bg-purple-600 text-white font-medium py-2.5 px-6 rounded-lg hover:bg-purple-700 transition-all duration-300 flex items-center justify-center space-x-2 group"
              >
                <span>专业体验</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* 底部信息 */}
        <div className="text-center">
          <p className="text-gray-500 text-sm mb-4">
            {t.landing.supportedModels}
          </p>
          <div className="text-xs text-gray-400">
            © 白川 2025
          </div>
        </div>
      </div>

      {/* 认证模态框 */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          // 可以在这里添加成功后的逻辑
        }}
      />
    </div>
  );
};