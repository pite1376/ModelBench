import { createClient } from '@supabase/supabase-js';
import { analytics } from '@/services/analytics';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

// 读取环境变量
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://phnribkdbrmhqvcnxzvy.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobnJpYmtkYnJtaHF2Y254enZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5MzI0NzIsImV4cCI6MjA1MjUwODQ3Mn0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

// 数据库连接测试工具
export class DatabaseTestTool {
  // 测试基本连接
  static async testConnection(): Promise<{ success: boolean; message: string; error?: any }> {
    try {
      console.log('🔍 Testing Supabase connection...');
      
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
        message: `数据库连接成功！当前用户表记录数: ${data?.length || 0}`
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
    const requiredTables = [
      'users', 'chat_sessions', 'messages', 
      'user_settings', 'model_usage_stats', 
      'system_stats', 'user_subscriptions', 
      'analytics_events'
    ];
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
      } catch (e: any) {
        errors.push(`${table}: ${e.message}`);
      }
    }
    
    const success = existingTables.length === requiredTables.length;
    const message = success 
      ? `所有表结构正常 (${existingTables.length}/${requiredTables.length})`
      : `表结构检查失败: ${errors.join(', ')}`;
    
    return { success, tables: existingTables, message };
  }
  
  // 测试创建用户
  static async testCreateUser(): Promise<{ success: boolean; message: string; userId?: string }> {
    try {
      const testUser = {
        anonymous_id: `test_${Date.now()}`,
        user_type: 'anonymous' as const,
        preferences: { test: true }
      };
      
      const { data, error } = await supabase
        .from('users')
        .insert([testUser])
        .select()
        .single();
      
      if (error) {
        return {
          success: false,
          message: `创建用户失败: ${error.message}`
        };
      }
      
      // 清理测试数据
      await supabase.from('users').delete().eq('id', data.id);
      
      return {
        success: true,
        message: '用户创建和删除测试成功',
        userId: data.id
      };
    } catch (error: any) {
      return {
        success: false,
        message: `用户操作测试异常: ${error.message}`
      };
    }
  }
  
  // 测试分析事件插入
  static async testAnalyticsInsert(): Promise<{ success: boolean; message: string }> {
    try {
      const testEvent = {
        type: 'app_start',
        payload: { test: true, timestamp: Date.now() },
        timestamp: Date.now(),
        user_anonymous_id: `test_${Date.now()}`
      };
      
      const { data, error } = await supabase
        .from('analytics_events')
        .insert([testEvent])
        .select()
        .single();
      
      if (error) {
        return {
          success: false,
          message: `分析事件插入失败: ${error.message}`
        };
      }
      
      // 清理测试数据
      await supabase.from('analytics_events').delete().eq('id', data.id);
      
      return {
        success: true,
        message: '分析事件插入测试成功'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `分析事件测试异常: ${error.message}`
      };
    }
  }
  
  // 完整诊断
  static async diagnose(): Promise<{
    connection: boolean;
    tables: boolean;
    permissions: boolean;
    analytics: boolean;
    details: any;
  }> {
    console.log('🔍 开始数据库完整诊断...');
    
    const connectionTest = await this.testConnection();
    const tablesTest = await this.testTables();
    const permissionsTest = await this.testCreateUser();
    const analyticsTest = await this.testAnalyticsInsert();
    
    const result = {
      connection: connectionTest.success,
      tables: tablesTest.success,
      permissions: permissionsTest.success,
      analytics: analyticsTest.success,
      details: {
        connection: connectionTest,
        tables: tablesTest,
        permissions: permissionsTest,
        analytics: analyticsTest
      }
    };
    
    // 记录诊断结果
    analytics.performance('database_diagnosis', Date.now(), 'ms');
    
    console.log('📊 诊断结果:', result);
    return result;
  }
  
  // 环境变量检查
  static checkEnvironment(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl) {
      issues.push('VITE_SUPABASE_URL 环境变量未设置');
    } else if (supabaseUrl.includes('your-project-id')) {
      issues.push('VITE_SUPABASE_URL 仍然是占位符，需要替换为实际的 Supabase URL');
    }
    
    if (!supabaseKey) {
      issues.push('VITE_SUPABASE_ANON_KEY 环境变量未设置');
    } else if (supabaseKey.length < 100) {
      issues.push('VITE_SUPABASE_ANON_KEY 格式可能不正确');
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
}

// 快速测试函数
export const quickDatabaseTest = async () => {
  console.log('🚀 开始快速数据库测试...');
  
  // 环境变量检查
  const envCheck = DatabaseTestTool.checkEnvironment();
  if (!envCheck.valid) {
    console.error('❌ 环境变量配置问题:');
    envCheck.issues.forEach(issue => console.error(`  - ${issue}`));
    return false;
  }
  
  // 连接测试
  const connectionResult = await DatabaseTestTool.testConnection();
  if (!connectionResult.success) {
    console.error('❌ 数据库连接失败:', connectionResult.message);
    return false;
  }
  
  console.log('✅ 数据库连接成功!');
  
  // 表结构测试
  const tablesResult = await DatabaseTestTool.testTables();
  if (!tablesResult.success) {
    console.warn('⚠️ 表结构问题:', tablesResult.message);
  } else {
    console.log('✅ 表结构检查通过!');
  }
  
  return connectionResult.success;
};

// 执行测试
quickDatabaseTest().then(success => {
  console.log(success ? '🎉 数据库测试完成!' : '❌ 数据库测试失败!');
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 测试执行异常:', error);
  process.exit(1);
});