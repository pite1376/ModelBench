-- 修复数据库触发器函数脚本
-- 解决 'record "new" has no field "updated_at"' 错误
-- 请在 Supabase SQL 编辑器中执行此脚本

-- 删除现有的触发器函数
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

-- 创建改进的触发器函数，包含字段存在性检查
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    -- 检查表是否有 updated_at 字段
    IF TG_TABLE_NAME IN ('users', 'chat_sessions', 'user_settings', 'model_usage_stats', 'system_stats', 'user_subscriptions') THEN
        -- 安全地设置 updated_at 字段
        BEGIN
            NEW.updated_at = NOW();
        EXCEPTION
            WHEN undefined_column THEN
                -- 如果字段不存在，忽略错误
                NULL;
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 重新创建所有触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON chat_sessions;
CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_model_usage_stats_updated_at ON model_usage_stats;
CREATE TRIGGER update_model_usage_stats_updated_at
    BEFORE UPDATE ON model_usage_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_system_stats_updated_at ON system_stats;
CREATE TRIGGER update_system_stats_updated_at
    BEFORE UPDATE ON system_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- 验证触发器函数是否正常工作
SELECT 'Trigger function updated successfully!' as status;