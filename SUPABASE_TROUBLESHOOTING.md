# Supabase 故障排除指南

## 当前问题诊断

根据浏览器控制台错误信息，当前存在以下问题：

```
net::ERR_ABORTED https://phnribkdbrmhqvcnxzvy.supabase.co/rest/v1/analytics_events
Analytics upload error: TypeError: Failed to fetch
```

这表明 Supabase 数据库连接失败，可能的原因包括：

## 🔍 问题排查步骤

### 1. 检查数据库表是否存在

**在浏览器控制台运行以下命令：**

```javascript
// 检查表结构
checkSchema()

// 测试完整连接
testSupabase()
```

### 2. 验证 Supabase 项目配置

#### 2.1 确认 SQL 脚本已执行

请确保在 Supabase 控制台的 SQL 编辑器中**按顺序**执行了以下脚本：

**第一步：执行主数据库结构脚本**
```sql
-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  preferences JSONB DEFAULT '{}',
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise'))
);

-- 创建聊天会话表
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Chat',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE,
  settings JSONB DEFAULT '{}'
);

-- 创建消息表
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  model_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  token_count INTEGER,
  response_time_ms INTEGER
);

-- 创建用户设置表
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, setting_key)
);

-- 创建模型使用统计表
CREATE TABLE IF NOT EXISTS model_usage_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  model_name TEXT NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  request_count INTEGER DEFAULT 0,
  token_count INTEGER DEFAULT 0,
  total_cost DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, model_name, usage_date)
);

-- 创建系统统计表
CREATE TABLE IF NOT EXISTS system_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(stat_date)
);

-- 创建用户订阅表
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subscription_tier TEXT NOT NULL CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_anonymous_id ON users(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_model_usage_stats_user_id ON model_usage_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_model_usage_stats_date ON model_usage_stats(usage_date DESC);
CREATE INDEX IF NOT EXISTS idx_system_stats_date ON system_stats(stat_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加更新时间触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_model_usage_stats_updated_at BEFORE UPDATE ON model_usage_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**第二步：执行分析事件表脚本**
```sql
-- 创建分析事件表（优化版本）
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  timestamp BIGINT NOT NULL,
  timestamp_iso TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_anonymous_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT,
  page_url TEXT,
  user_agent TEXT,
  ip_address INET,
  country_code TEXT,
  city TEXT,
  device_type TEXT,
  browser_name TEXT,
  os_name TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_anonymous_id ON analytics_events(user_anonymous_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);

-- 创建复合索引用于常见查询
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_timestamp ON analytics_events(type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_timestamp ON analytics_events(user_anonymous_id, timestamp DESC);

-- 启用行级安全性 (RLS)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略：允许匿名用户插入自己的事件
CREATE POLICY "Allow anonymous insert" ON analytics_events
  FOR INSERT
  WITH CHECK (true);

-- 创建 RLS 策略：允许认证用户查看自己的事件
CREATE POLICY "Users can view own events" ON analytics_events
  FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- 创建 RLS 策略：允许服务角色访问所有数据
CREATE POLICY "Service role can access all" ON analytics_events
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- 添加更新时间触发器
CREATE TRIGGER update_analytics_events_updated_at 
  BEFORE UPDATE ON analytics_events 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

#### 2.2 检查 RLS 策略

确保在 Supabase 控制台的 "Authentication" > "Policies" 中看到 `analytics_events` 表的策略已创建。

### 3. 验证环境变量

检查 `.env.local` 文件中的配置：

```env
# Supabase 配置
VITE_SUPABASE_URL=https://phnribkdbrmhqvcnxzvy.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobnJpYmtkYnJtaHF2Y254enZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5ODA1MjksImV4cCI6MjA2NTU1NjUyOX0.O5JYwdZMHXc_Iln7vD9fqLedX5ZnBjIz2P8pbk-W2Gg
```

### 4. 重启开发服务器

环境变量更改后需要重启：

```bash
# 停止当前服务器 (Ctrl+C)
# 然后重新启动
npm run dev
```

## 🛠️ 常见问题解决方案

### 问题 1: "Table 'analytics_events' doesn't exist"

**解决方案：**
1. 登录 [Supabase 控制台](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 "SQL Editor"
4. 执行上述 SQL 脚本

### 问题 2: "Row Level Security policy violation"

**解决方案：**
1. 检查 RLS 策略是否正确创建
2. 确认匿名访问策略已启用
3. 在 SQL 编辑器中运行：

```sql
-- 检查现有策略
SELECT * FROM pg_policies WHERE tablename = 'analytics_events';

-- 如果策略不存在，重新创建
DROP POLICY IF EXISTS "Allow anonymous insert" ON analytics_events;
CREATE POLICY "Allow anonymous insert" ON analytics_events
  FOR INSERT
  WITH CHECK (true);
```

### 问题 3: "Invalid API key"

**解决方案：**
1. 在 Supabase 控制台检查 API 密钥
2. 确保使用的是 "anon" 密钥，不是 "service_role" 密钥
3. 更新 `.env.local` 文件中的密钥

### 问题 4: 网络连接问题

**解决方案：**
1. 检查网络连接
2. 确认 Supabase 项目状态正常
3. 检查防火墙设置

## 🧪 测试验证

### 在浏览器控制台测试

```javascript
// 1. 检查环境变量
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...');

// 2. 测试数据库连接
checkSchema().then(result => console.log('Schema check:', result));

// 3. 测试完整功能
testSupabase().then(result => console.log('Full test:', result));

// 4. 手动测试埋点
import('./src/services/analytics.js').then(({ trackEvent }) => {
  trackEvent('test_manual', { source: 'console_test' });
});
```

### 预期结果

✅ **成功的输出应该包含：**
- "✅ Supabase connection successful"
- "✅ Test data inserted successfully"
- "✅ Data query successful"
- "✅ All Supabase tests passed successfully!"

❌ **如果仍有问题，请：**
1. 复制完整的错误信息
2. 检查 Supabase 项目仪表板中的日志
3. 确认项目没有暂停或限制

## 📞 获取帮助

如果问题仍然存在，请提供：
1. 浏览器控制台的完整错误信息
2. `checkSchema()` 和 `testSupabase()` 的输出结果
3. Supabase 项目仪表板中的任何错误日志

这将帮助进一步诊断和解决问题。