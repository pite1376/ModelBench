import { supabase } from '@/lib/supabaseClient';

// Supabase连接测试工具
export class SupabaseTestTool {
  // 测试基本连接
  static async testConnection(): Promise<{ success: boolean; message: string; error?: any }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count', { count: 'exact' })
        .limit(1);
      
      if (error) {
        return {
          success: false,
          message: `数据库连接失败: ${error.message}`,
          error
        };
      }
      
      return {
        success: true,
        message: `数据库连接成功，users表记录数: ${data ? (data as any).length : 0}`
      };
    } catch (error: any) {
      return {
        success: false,
        message: `连接测试异常: ${error.message}`,
        error
      };
    }
  }

  // 测试表结构
  static async testTables(): Promise<{ success: boolean; tables: string[]; message: string }> {
    const requiredTables = ['users', 'chat_sessions', 'messages', 'model_usage_stats', 'user_settings'];
    const existingTables: string[] = [];
    const errors: string[] = [];

    for (const table of requiredTables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*', { count: 'exact' })
          .limit(1);
        
        if (error) {
          errors.push(`${table}: ${error.message}`);
        } else {
          existingTables.push(table);
        }
      } catch (err: any) {
        errors.push(`${table}: ${err.message}`);
      }
    }

    return {
      success: existingTables.length === requiredTables.length,
      tables: existingTables,
      message: errors.length > 0 
        ? `部分表不存在或无权限: ${errors.join(', ')}` 
        : '所有必需的表都存在且可访问'
    };
  }

  // 测试创建用户
  static async testCreateUser(): Promise<{ success: boolean; message: string; userId?: string }> {
    try {
      const testUser = {
        anonymous_id: `test-${Date.now()}`,
        user_type: 'anonymous' as const,
        email_verified: false,
        total_sessions: 0,
        total_messages: 0,
        preferences: {},
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('users')
        .insert([testUser])
        .select()
        .single();

      if (error) {
        return {
          success: false,
          message: `创建测试用户失败: ${error.message}`
        };
      }

      // 清理测试数据
      await supabase.from('users').delete().eq('id', data.id);

      return {
        success: true,
        message: '用户创建测试成功（已清理测试数据）',
        userId: data.id
      };
    } catch (error: any) {
      return {
        success: false,
        message: `创建用户测试异常: ${error.message}`
      };
    }
  }

  // 完整诊断
  static async diagnose(): Promise<{
    connection: boolean;
    tables: boolean;
    permissions: boolean;
    details: any;
  }> {
    const connectionTest = await this.testConnection();
    const tablesTest = await this.testTables();
    const permissionsTest = await this.testCreateUser();

    return {
      connection: connectionTest.success,
      tables: tablesTest.success,
      permissions: permissionsTest.success,
      details: {
        connection: connectionTest,
        tables: tablesTest,
        permissions: permissionsTest
      }
    };
  }
}

// 在控制台中暴露测试工具
if (typeof window !== 'undefined') {
  (window as any).__testSupabase = SupabaseTestTool;
} 