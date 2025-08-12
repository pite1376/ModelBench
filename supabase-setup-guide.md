# Supabase 数据库配置指南

## 问题解决方案

您遇到的错误 `trigger "update_chat_sessions_updated_at" for relation "chat_sessions" already exists` 表示触发器已经存在。

## 解决方法

### 方法一：使用修复版本的 SQL 脚本

我已经为您创建了一个修复版本的 SQL 脚本：`fixed-supabase-schema.sql`

**在 Supabase 控制台执行以下步骤：**

1. 登录 [Supabase 控制台](https://supabase.com/dashboard)
2. 选择您的项目
3. 点击左侧菜单的 "SQL Editor"
4. 点击 "New query" 创建新查询
5. 复制并粘贴 `fixed-supabase-schema.sql` 文件中的所有内容
6. 点击 "Run" 执行脚本

### 方法二：手动删除已存在的触发器

如果您想继续使用原始脚本，请先在 Supabase SQL 编辑器中执行以下代码来删除已存在的触发器：

```sql
-- 删除已存在的触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON chat_sessions;
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
DROP TRIGGER IF EXISTS update_model_usage_stats_updated_at ON model_usage_stats;
DROP TRIGGER IF EXISTS update_system_stats_updated_at ON system_stats;
DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;

-- 删除已存在的策略
DROP POLICY IF EXISTS "允许所有操作" ON users;
DROP POLICY IF EXISTS "允许所有操作" ON chat_sessions;
DROP POLICY IF EXISTS "允许所有操作" ON messages;
DROP POLICY IF EXISTS "允许所有操作" ON user_settings;
DROP POLICY IF EXISTS "允许所有操作" ON model_usage_stats;
DROP POLICY IF EXISTS "允许所有操作" ON system_stats;
DROP POLICY IF EXISTS "允许所有操作" ON user_subscriptions;
DROP POLICY IF EXISTS "允许所有操作" ON analytics_events;
```

然后再执行原始的 `supabase-schema.sql` 脚本。

## 验证配置

执行完 SQL 脚本后，您可以在 Supabase 控制台中验证：

1. 点击左侧菜单的 "Table Editor"
2. 确认以下表已创建：
   - users
   - chat_sessions
   - messages
   - user_settings
   - model_usage_stats
   - system_stats
   - user_subscriptions
   - analytics_events

## 测试数据库连接

配置完成后，您可以在项目中测试数据库连接：

1. 确保 `.env.local` 文件中的环境变量正确：
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

2. 在浏览器开发者工具的控制台中测试埋点功能：
   ```javascript
   // 测试埋点
   import('./src/services/analytics.js').then(({ trackEvent }) => {
     trackEvent('test_event', { test: true });
     console.log('埋点测试完成');
   });
   ```

## 注意事项

- 修复版本的脚本可以安全地多次运行
- 如果仍有问题，请检查 Supabase 项目的 API 密钥是否正确
- 确保使用的是 "anon" 密钥，不是 "service_role" 密钥

## 下一步

配置完成后，您的应用就可以：
- 存储用户数据和聊天记录
- 收集用户行为分析数据
- 进行模型使用统计
- 管理用户设置和订阅信息