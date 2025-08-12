import { supabase } from '@/lib/supabaseClient';

// 测试Supabase连接和数据库配置
export async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // 1. 测试基本连接
    const { data: healthCheck, error: healthError } = await supabase
      .from('analytics_events')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.error('❌ Supabase connection failed:', healthError);
      return {
        success: false,
        error: healthError,
        message: 'Failed to connect to Supabase database'
      };
    }
    
    console.log('✅ Supabase connection successful');
    
    // 2. 测试插入数据
    const testEvent = {
      type: 'test_event',
      payload: { test: true, timestamp: new Date().toISOString() },
      timestamp: Date.now(),
      user_anonymous_id: 'test-user-' + Date.now()
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('analytics_events')
      .insert([testEvent])
      .select();
    
    if (insertError) {
      console.error('❌ Failed to insert test data:', insertError);
      return {
        success: false,
        error: insertError,
        message: 'Database connection works but insert failed. Check RLS policies.'
      };
    }
    
    console.log('✅ Test data inserted successfully:', insertData);
    
    // 3. 测试查询数据
    const { data: queryData, error: queryError } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('type', 'test_event')
      .limit(5);
    
    if (queryError) {
      console.error('❌ Failed to query data:', queryError);
      return {
        success: false,
        error: queryError,
        message: 'Insert works but query failed. Check RLS policies.'
      };
    }
    
    console.log('✅ Data query successful:', queryData);
    
    return {
      success: true,
      message: 'All Supabase tests passed successfully!',
      data: {
        insertedRecords: insertData?.length || 0,
        queriedRecords: queryData?.length || 0
      }
    };
    
  } catch (error) {
    console.error('❌ Unexpected error during Supabase test:', error);
    return {
      success: false,
      error,
      message: 'Unexpected error occurred during testing'
    };
  }
}

// 检查数据库表结构
export async function checkDatabaseSchema() {
  console.log('🔍 Checking database schema...');
  
  try {
    // 检查analytics_events表是否存在
    const { data, error } = await supabase
      .from('analytics_events')
      .select('*')
      .limit(0);
    
    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          message: 'analytics_events table does not exist. Please run the SQL scripts in Supabase console.'
        };
      }
      return {
        success: false,
        error,
        message: 'Failed to check table schema'
      };
    }
    
    return {
      success: true,
      message: 'analytics_events table exists and is accessible'
    };
    
  } catch (error) {
    return {
      success: false,
      error,
      message: 'Error checking database schema'
    };
  }
}

// 在浏览器控制台中运行测试
if (typeof window !== 'undefined') {
  // 将测试函数暴露到全局作用域，方便在控制台调试
  (window as any).testSupabase = testSupabaseConnection;
  (window as any).testSupabaseConnection = testSupabaseConnection;
  (window as any).checkSchema = checkDatabaseSchema;
  
  console.log('🔧 Supabase test functions available:');
  console.log('- Run testSupabase() or testSupabaseConnection() to test connection and operations');
  console.log('- Run checkSchema() to check if tables exist');
}