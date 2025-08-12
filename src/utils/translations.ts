export interface Translations {
  // 通用
  common: {
    confirm: string;
    cancel: string;
    login: string;
    register: string;
    logout: string;
    phone: string;
    verificationCode: string;
    submit: string;
    close: string;
    loading: string;
  };
  
  // 首页
  landing: {
    title: string;
    subtitle: string;
    description: string;
    simpleMode: string;
    advancedMode: string;
    simpleModeDesc: string;
    advancedModeDesc: string;
    startUsing: string;
    professionalExperience: string;
    quickStart: string;
    professionalCustomization: string;
    oneClickComparison: string;
    oneClickComparisonDesc: string;
    intelligentRecommendation: string;
    intelligentRecommendationDesc: string;
    simpleInterface: string;
    simpleInterfaceDesc: string;
    parameterTuning: string;
    parameterTuningDesc: string;
    promptManagement: string;
    promptManagementDesc: string;
    deepAnalysis: string;
    deepAnalysisDesc: string;
    supportedModels: string;
    features: {
      dataSecure: string;
      realTimeResponse: string;
      cloudSync: string;
      intelligentAnalysis: string;
    };
  };
  
  // 认证
  auth: {
    loginTitle: string;
    registerTitle: string;
    phoneLabel: string;
    phonePlaceholder: string;
    verificationCodeLabel: string;
    verificationCodePlaceholder: string;
    verificationCodeHint: string;
    loginButton: string;
    registerButton: string;
    switchToRegister: string;
    switchToLogin: string;
    loginSuccess: string;
    registerSuccess: string;
    loginFailed: string;
    registerFailed: string;
    invalidPhone: string;
    invalidCode: string;
    userExists: string;
    userNotExists: string;
  };
}

export const translations: Record<'zh' | 'en', Translations> = {
  zh: {
    common: {
      confirm: '确认',
      cancel: '取消',
      login: '登录',
      register: '注册',
      logout: '退出登录',
      phone: '手机号',
      verificationCode: '验证码',
      submit: '提交',
      close: '关闭',
      loading: '加载中...',
    },
    landing: {
      title: 'ModelBench',
      subtitle: '新一代AI模型对比平台',
      description: '让每一次对话都成为最佳选择',
      simpleMode: '单提示词模式',
      advancedMode: '多提示词模式',
      simpleModeDesc: '快速上手，即刻体验',
      advancedModeDesc: '专业定制，精准控制',
      startUsing: '开始使用',
      professionalExperience: '专业体验',
      quickStart: '快速上手，即刻体验',
      professionalCustomization: '专业定制，精准控制',
      oneClickComparison: '一键对比',
      oneClickComparisonDesc: '同时向多个AI模型提问，实时对比响应结果',
      intelligentRecommendation: '智能推荐',
      intelligentRecommendationDesc: '根据问题类型自动推荐最适合的模型组合',
      simpleInterface: '极简界面',
      simpleInterfaceDesc: '专注对话体验，无需复杂配置',
      parameterTuning: '参数调优',
      parameterTuningDesc: '精细调节温度、采样等参数，获得最佳输出',
      promptManagement: '提示词管理',
      promptManagementDesc: '创建、保存和管理专业提示词模板',
      deepAnalysis: '深度分析',
      deepAnalysisDesc: '详细的性能指标和成本分析报告',
      supportedModels: '支持 OpenAI、Claude、DeepSeek、Kimi 等主流AI模型',
      features: {
        dataSecure: '🔒 数据安全',
        realTimeResponse: '⚡ 实时响应',
        cloudSync: '☁️ 云端同步',
        intelligentAnalysis: '📊 智能分析',
      },
    },
    auth: {
      loginTitle: '登录账户',
      registerTitle: '注册账户',
      phoneLabel: '手机号码',
      phonePlaceholder: '请输入手机号码',
      verificationCodeLabel: '验证码',
      verificationCodePlaceholder: '请输入验证码',
      verificationCodeHint: '测试验证码：123456',
      loginButton: '登录',
      registerButton: '注册',
      switchToRegister: '没有账户？立即注册',
      switchToLogin: '已有账户？立即登录',
      loginSuccess: '登录成功',
      registerSuccess: '注册成功',
      loginFailed: '登录失败',
      registerFailed: '注册失败',
      invalidPhone: '请输入有效的手机号码',
      invalidCode: '验证码错误',
      userExists: '用户已存在',
      userNotExists: '用户不存在，请先注册',
    },
  },
  en: {
    common: {
      confirm: 'Confirm',
      cancel: 'Cancel',
      login: 'Login',
      register: 'Register',
      logout: 'Logout',
      phone: 'Phone',
      verificationCode: 'Verification Code',
      submit: 'Submit',
      close: 'Close',
      loading: 'Loading...',
    },
    landing: {
      title: 'ModelBench',
      subtitle: 'Next-Generation AI Model Comparison Platform',
      description: 'Make every conversation the best choice',
      simpleMode: 'Simple Mode',
      advancedMode: 'Advanced Mode',
      simpleModeDesc: 'Quick start, instant experience',
      advancedModeDesc: 'Professional customization, precise control',
      startUsing: 'Start Using',
      professionalExperience: 'Professional Experience',
      quickStart: 'Quick start, instant experience',
      professionalCustomization: 'Professional customization, precise control',
      oneClickComparison: 'One-Click Comparison',
      oneClickComparisonDesc: 'Ask multiple AI models simultaneously, compare responses in real-time',
      intelligentRecommendation: 'Smart Recommendation',
      intelligentRecommendationDesc: 'Automatically recommend the best model combinations based on question types',
      simpleInterface: 'Minimalist Interface',
      simpleInterfaceDesc: 'Focus on conversation experience, no complex configuration required',
      parameterTuning: 'Parameter Tuning',
      parameterTuningDesc: 'Fine-tune temperature, sampling and other parameters for optimal output',
      promptManagement: 'Prompt Management',
      promptManagementDesc: 'Create, save and manage professional prompt templates',
      deepAnalysis: 'Deep Analysis',
      deepAnalysisDesc: 'Detailed performance metrics and cost analysis reports',
      supportedModels: 'Supports mainstream AI models including OpenAI, Claude, DeepSeek, Kimi',
      features: {
        dataSecure: '🔒 Data Security',
        realTimeResponse: '⚡ Real-time Response',
        cloudSync: '☁️ Cloud Sync',
        intelligentAnalysis: '📊 Intelligent Analysis',
      },
    },
    auth: {
      loginTitle: 'Login Account',
      registerTitle: 'Register Account',
      phoneLabel: 'Phone Number',
      phonePlaceholder: 'Enter phone number',
      verificationCodeLabel: 'Verification Code',
      verificationCodePlaceholder: 'Enter verification code',
      verificationCodeHint: 'Test code: 123456',
      loginButton: 'Login',
      registerButton: 'Register',
      switchToRegister: "Don't have an account? Register now",
      switchToLogin: 'Already have an account? Login now',
      loginSuccess: 'Login successful',
      registerSuccess: 'Registration successful',
      loginFailed: 'Login failed',
      registerFailed: 'Registration failed',
      invalidPhone: 'Please enter a valid phone number',
      invalidCode: 'Invalid verification code',
      userExists: 'User already exists',
      userNotExists: 'User does not exist, please register first',
    },
  },
};

export const useTranslation = (language: 'zh' | 'en'): Translations => {
  return translations[language];
}; 