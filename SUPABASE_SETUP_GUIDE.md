# 📋 Supabase数据库配置完整指南

## 🎯 概述

本指南将帮助您完成Supabase数据库的配置，包括执行SQL脚本、设置表结构和验证连接。

## 🔧 第一步：访问Supabase控制台

### 1.1 登录Supabase
1. 打开浏览器，访问：https://supabase.com/dashboard
2. 使用您的账号登录
3. 选择您的项目：`phnribkdbrmhqvcnxzvy`

### 1.2 进入SQL编辑器
1. 在左侧导航栏中，点击 **"SQL Editor"** 或 **"SQL编辑器"**
2. 您将看到一个代码编辑器界面

## 📝 第二步：执行SQL脚本

### 2.1 执行主数据库表结构脚本

**复制以下完整SQL代码到SQL编辑器中：**

```sql
-- AI模型对比工具 - Supabase数据库表结构
-- 请在Supabase SQL编辑器中执行此脚本

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anonymous_id TEXT UNIQUE NOT NULL,
    user_type TEXT NOT NULL DEFAULT 'anonymous' CHECK (user_type IN ('anonymous', 'registered')),
    email TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    total_sessions INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_active TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 聊天会话表
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT DEFAULT '新对话',
    system_prompt TEXT DEFAULT '你是一个有用的AI助手。',
    selected_models JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    message_count INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- 3. 消息表
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    attachments JSONB DEFAULT '[]',
    model_name TEXT,
    token_count INTEGER DEFAULT 0,
    cost DECIMAL(10, 6) DEFAULT 0
);

-- 4. 用户设置表
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    api_keys JSONB DEFAULT '{}',
    preferred_models JSONB DEFAULT '[]',
    ui_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 模型使用统计表
CREATE TABLE IF NOT EXISTS model_usage_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    model_name TEXT NOT NULL,
    date DATE NOT NULL,
    usage_count INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    total_cost DECIMAL(10, 6) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, model_name, date)
);

-- 6. 系统统计表
CREATE TABLE IF NOT EXISTS system_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE UNIQUE NOT NULL,
    total_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    popular_models JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 用户订阅表
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'enterprise')),
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    features JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_anonymous_id ON users(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_model_usage_stats_user_date ON model_usage_stats(user_id, date);

-- 创建更新时间的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为相关表添加更新时间触发器
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_model_usage_stats_updated_at
    BEFORE UPDATE ON model_usage_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_system_stats_updated_at
    BEFORE UPDATE ON system_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- 启用行级安全性（RLS）
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略（允许匿名用户访问）
CREATE POLICY "允许所有操作" ON users FOR ALL USING (true);
CREATE POLICY "允许所有操作" ON chat_sessions FOR ALL USING (true);
CREATE POLICY "允许所有操作" ON messages FOR ALL USING (true);
CREATE POLICY "允许所有操作" ON user_settings FOR ALL USING (true);
CREATE POLICY "允许所有操作" ON model_usage_stats FOR ALL USING (true);
CREATE POLICY "允许所有操作" ON system_stats FOR ALL USING (true);
CREATE POLICY "允许所有操作" ON user_subscriptions FOR ALL USING (true);

-- 插入一些初始数据
INSERT INTO system_stats (date, total_users, active_users, total_sessions, total_messages, popular_models)
VALUES (CURRENT_DATE, 0, 0, 0, 0, '[]'::jsonb)
ON CONFLICT (date) DO NOTHING;
```

**执行步骤：**
1. 将上述SQL代码完整复制到SQL编辑器中
2. 点击右下角的 **"Run"** 或 **"执行"** 按钮
3. 等待执行完成，应该看到成功消息

### 2.2 执行数据埋点表脚本

**在新的SQL查询中，复制以下代码：**

```sql
-- 创建增强版 analytics_events 表
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    payload JSONB DEFAULT '{}',
    timestamp BIGINT NOT NULL,
    timestamp_iso TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_anonymous_id VARCHAR(255),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    page_url TEXT,
    user_agent TEXT,
    timezone VARCHAR(50),
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON public.analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_anonymous_id ON public.analytics_events(user_anonymous_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);

-- 启用行级安全策略 (RLS)
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许匿名用户插入和查询自己的事件
CREATE POLICY "Allow anonymous insert" ON public.analytics_events
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow anonymous select" ON public.analytics_events
    FOR SELECT
    USING (true);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器
CREATE TRIGGER update_analytics_events_updated_at
    BEFORE UPDATE ON public.analytics_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 添加注释
COMMENT ON TABLE public.analytics_events IS '用户行为分析事件表';
COMMENT ON COLUMN public.analytics_events.type IS '事件类型';
COMMENT ON COLUMN public.analytics_events.payload IS '事件数据载荷';
COMMENT ON COLUMN public.analytics_events.timestamp IS 'Unix时间戳';
COMMENT ON COLUMN public.analytics_events.timestamp_iso IS 'ISO格式时间戳';
COMMENT ON COLUMN public.analytics_events.user_anonymous_id IS '匿名用户ID';
COMMENT ON COLUMN public.analytics_events.user_id IS '注册用户ID';
COMMENT ON COLUMN public.analytics_events.session_id IS '会话ID';
COMMENT ON COLUMN public.analytics_events.page_url IS '页面URL';
COMMENT ON COLUMN public.analytics_events.user_agent IS '用户代理字符串';
COMMENT ON COLUMN public.analytics_events.timezone IS '用户时区';
COMMENT ON COLUMN public.analytics_events.retry_count IS '重试次数';
```

**执行步骤：**
1. 点击 **"New query"** 或 **"新建查询"** 创建新的SQL查询
2. 将上述SQL代码复制到编辑器中
3. 点击 **"Run"** 或 **"执行"** 按钮
4. 等待执行完成

## ✅ 第三步：验证配置

### 3.1 检查表是否创建成功

在SQL编辑器中执行以下查询来验证表是否创建成功：

```sql
-- 查看所有表
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

您应该看到以下表：
- `analytics_events`
- `chat_sessions`
- `messages`
- `model_usage_stats`
- `system_stats`
- `user_settings`
- `user_subscriptions`
- `users`

### 3.2 测试数据插入

执行以下测试查询：

```sql
-- 测试插入一个测试用户
INSERT INTO users (anonymous_id, user_type) 
VALUES ('test-user-123', 'anonymous') 
RETURNING id, anonymous_id, created_at;

-- 测试插入一个分析事件
INSERT INTO analytics_events (type, payload, timestamp, user_anonymous_id)
VALUES ('test_event', '{"action": "test"}', EXTRACT(EPOCH FROM NOW()) * 1000, 'test-user-123')
RETURNING id, type, created_at;
```

如果执行成功，说明数据库配置正确。

## 🔧 第四步：应用程序配置验证

### 4.1 检查环境变量

确认项目根目录的 `.env.local` 文件包含正确的配置：

```bash
VITE_SUPABASE_URL=https://phnribkdbrmhqvcnxzvy.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobnJpYmtkYnJtaHF2Y254enZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5ODA1MjksImV4cCI6MjA2NTU1NjUyOX0.O5JYwdZMHXc_Iln7vD9fqLedX5ZnBjIz2P8pbk-W2Gg
```

### 4.2 重启开发服务器

在终端中重启开发服务器以加载新的环境变量：

```bash
# 停止当前服务器 (Ctrl+C)
# 然后重新启动
npm run dev
```

### 4.3 测试应用程序连接

1. 打开应用程序：http://localhost:3000/ModelBench/
2. 打开浏览器开发者工具 (F12)
3. 在控制台中应该看不到数据库连接错误
4. 尝试发送一条消息，检查是否正常工作

## 🎯 常见问题解决

### 问题1：权限错误
如果遇到权限错误，确保：
- RLS策略已正确创建
- 使用的是anon密钥而不是service_role密钥

### 问题2：表不存在
如果提示表不存在：
- 重新执行SQL脚本
- 检查是否有语法错误
- 确认在正确的数据库中执行

### 问题3：连接失败
如果应用程序无法连接：
- 检查环境变量是否正确
- 重启开发服务器
- 验证Supabase项目URL和密钥

## 🎉 完成！

恭喜！您已经成功配置了Supabase数据库。现在您的应用程序可以：

- ✅ 存储用户数据
- ✅ 管理聊天会话和消息
- ✅ 收集用户行为分析数据
- ✅ 跟踪模型使用统计
- ✅ 管理用户设置和订阅

如果遇到任何问题，请检查Supabase控制台的日志或联系技术支持。