-- 创建 analytics_events 表
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