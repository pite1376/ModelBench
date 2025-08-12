# AI模型测试对比平台

一个现代化的AI模型测试和对比Web应用，支持多种主流AI模型的同时测试和性能对比。

## ✨ 主要特性

- **🤖 多模型支持** - 支持DeepSeek、通义千问、豆包、Kimi等主流AI模型
- **⚡ 实时对比** - 同时测试多个模型，实时显示响应结果
- **🧠 深度思考** - 支持具有推理能力的模型显示思考过程
- **💬 智能对话** - 支持上下文对话和会话管理
- **🎨 现代界面** - 响应式设计，支持深色/浅色主题
- **📊 性能分析** - 显示响应时间、token消耗等性能指标
- **🔧 灵活配置** - 支持自定义系统提示词和模型参数

## 🚀 支持的AI模型

### DeepSeek
- DeepSeek V3 0324
- DeepSeek R1 0528 (推理模型)

### 阿里云通义千问
- 通义千问 Plus/Max/Turbo 最新版
- 通义千问 Long 系列
- 通义千问2-57B
- 通义千问3系列
- QwQ-32B

### 火山引擎豆包
- 豆包 seed 1.6 thinking (推理模型)
- 豆包 Pro 32K/256K
- 豆包 Vision Pro (支持图像)

### Moonshot Kimi
- Kimi V1 8K/32K/128K
- Kimi K2 0711 Preview

### Claude
- Claude Sonnet 4
- Claude Sonnet 3-7

## 🛠️ 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **图标**: Lucide React
- **HTTP客户端**: Axios
- **数据库**: Supabase
- **部署**: GitHub Pages

## 📦 快速开始

### 本地开发

```bash
# 克隆项目
git clone https://github.com/pite1376/LLMBench.git
cd LLMBench

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 `http://localhost:5173` 开始使用

### 生产构建

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## ⚙️ 配置说明

### 1. API密钥配置

在使用前需要配置相应的API密钥：

- **DeepSeek**: 在[DeepSeek平台](https://platform.deepseek.com/)获取API密钥
- **阿里云**: 在[百炼控制台](https://bailian.console.aliyun.com/)获取DashScope API密钥
- **火山引擎**: 在[火山引擎控制台](https://console.volcengine.com/)获取API密钥
- **Moonshot**: 在[Moonshot平台](https://platform.moonshot.cn/)获取API密钥
- **Claude**: 通过302.AI获取API密钥

### 2. 环境变量

创建 `.env.local` 文件并配置以下变量：

```env
# Supabase配置（可选，用于数据存储）
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🚀 部署到GitHub Pages

### 方法一：自动部署（推荐）

1. Fork或上传代码到你的GitHub仓库
2. 在仓库设置中启用GitHub Pages
3. 选择GitHub Actions作为部署源
4. 推送代码后会自动构建和部署

### 方法二：手动部署

```bash
# 构建项目
npm run build

# 部署到GitHub Pages
npm run deploy
```

## 📱 使用说明

1. **配置API密钥** - 在设置页面添加各个AI服务商的API密钥
2. **选择模型** - 在左侧边栏选择要测试的AI模型
3. **输入问题** - 在输入框中输入你的问题或提示词
4. **查看结果** - 实时查看各个模型的响应结果和性能指标
5. **对比分析** - 比较不同模型的回答质量和响应速度

## 🎯 主要功能

- **单模型测试** - 测试单个AI模型的性能
- **多模型对比** - 同时测试多个模型并对比结果
- **会话管理** - 保存和管理对话历史
- **系统提示词** - 自定义系统提示词模板
- **性能监控** - 实时显示响应时间和token消耗
- **深度思考显示** - 支持推理模型的思考过程展示

## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进这个项目！

## 📄 开源协议

MIT License

## 🔗 相关链接

- [在线演示](https://pite1376.github.io/LLMBench/)
- [GitHub仓库](https://github.com/pite1376/LLMBench)

---

如果这个项目对你有帮助，请给个⭐️支持一下！