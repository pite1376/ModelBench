import { getUserIdentity } from '@/utils/userIdentity';

// 网络搜索API配置
const WEB_SEARCH_API_URL = 'https://open.bigmodel.cn/api/paas/v4/web_search';

// 搜索引擎类型
export type SearchEngine = 'search_std' | 'search_pro' | 'search_pro_sogou' | 'search_pro_quark';

// 随机选择搜索引擎
function getRandomSearchEngine(): SearchEngine {
  const engines: SearchEngine[] = ['search_std', 'search_pro', 'search_pro_sogou', 'search_pro_quark'];
  return engines[Math.floor(Math.random() * engines.length)];
}

// 时间过滤器
export type TimeFilter = 'oneDay' | 'oneWeek' | 'oneMonth' | 'oneYear' | 'noLimit';

// 内容大小
export type ContentSize = 'medium' | 'high';

// 搜索请求参数
export interface WebSearchRequest {
  search_query: string;
  search_engine: SearchEngine;
  search_intent?: boolean;
  count?: number;
  search_recency_filter?: TimeFilter;
  content_size?: ContentSize;
  search_domain_filter?: string;
  request_id?: string;
  user_id?: string;
}

// 搜索结果项
export interface SearchResultItem {
  title: string;
  content: string;
  link: string;
  media?: string;
  icon?: string;
  refer?: string;
  publish_date?: string;
}

// 搜索意图结果
export interface SearchIntentResult {
  intent: string;
  confidence: number;
}

// 搜索响应
export interface WebSearchResponse {
  id: string;
  created: number;
  request_id: string;
  search_intent: SearchIntentResult[];
  search_result: SearchResultItem[];
}

// 关键词提取请求
export interface KeywordExtractionRequest {
  query: string;
  currentTime?: string;
}

// 关键词提取响应
export interface KeywordExtractionResponse {
  keywords: string[];
  searchQuery: string;
  needsTimeContext: boolean;
}

/**
 * 使用智谱GLM-4.5提取搜索关键词
 */
export async function extractSearchKeywords(
  query: string,
  apiKey: string
): Promise<KeywordExtractionResponse> {
  const currentTime = new Date().toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'long'
  });

  const systemPrompt = `你是一个专业的搜索关键词提取助手。请根据用户的问题提取最适合的搜索关键词。

当前时间：${currentTime}

请分析用户问题并返回JSON格式：
{
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "searchQuery": "优化后的搜索查询",
  "needsTimeContext": true/false
}

注意事项：
1. 如果问题涉及"今天"、"最近"、"现在"等时间词，设置needsTimeContext为true
2. 搜索查询应该简洁明了，不超过70个字符
3. 关键词应该是最核心的搜索词汇
4. 对于时间敏感的问题，在搜索查询中包含具体时间信息`;

  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'glm-4-plus',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`关键词提取失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('关键词提取响应为空');
    }

    // 尝试解析JSON响应
    try {
      const result = JSON.parse(content);
      return {
        keywords: result.keywords || [query],
        searchQuery: result.searchQuery || query,
        needsTimeContext: result.needsTimeContext || false
      };
    } catch (parseError) {
      // 如果解析失败，返回原始查询
      console.warn('关键词提取结果解析失败，使用原始查询:', parseError);
      return {
        keywords: [query],
        searchQuery: query,
        needsTimeContext: query.includes('今天') || query.includes('最近') || query.includes('现在')
      };
    }
  } catch (error) {
    console.error('关键词提取失败:', error);
    // 降级处理：返回原始查询
    return {
      keywords: [query],
      searchQuery: query,
      needsTimeContext: query.includes('今天') || query.includes('最近') || query.includes('现在')
    };
  }
}

/**
 * 执行网络搜索
 */
export async function performWebSearch(
  searchQuery: string,
  apiKey: string,
  options: Partial<WebSearchRequest> = {}
): Promise<WebSearchResponse> {
  const userIdentity = getUserIdentity();
  
  // 根据查询内容智能选择时间过滤器
  let timeFilter: TimeFilter = 'noLimit';
  if (searchQuery.includes('今天') || searchQuery.includes('今日')) {
    timeFilter = 'oneDay';
  } else if (searchQuery.includes('最近') || searchQuery.includes('近期')) {
    timeFilter = 'oneWeek';
  } else if (searchQuery.includes('本月') || searchQuery.includes('这个月')) {
    timeFilter = 'oneMonth';
  }

  const requestBody: WebSearchRequest = {
    search_query: searchQuery.slice(0, 70), // 限制查询长度
    search_engine: getRandomSearchEngine(), // 随机选择搜索引擎
    search_intent: true, // 启用搜索意图识别
    count: 10, // 返回10条结果
    search_recency_filter: timeFilter,
    content_size: 'high', // 获取详细内容
    request_id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    user_id: userIdentity.anonymousId,
    ...options
  };

  console.log('🔍 发起网络搜索请求:', {
    url: WEB_SEARCH_API_URL,
    searchQuery: searchQuery,
    searchEngine: requestBody.search_engine,
    timeFilter: requestBody.search_recency_filter
  });

  try {
    const response = await fetch(WEB_SEARCH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📡 网络搜索响应状态:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ 网络搜索API错误响应:', errorText);
      throw new Error(`网络搜索失败: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data: WebSearchResponse = await response.json();
    console.log('✅ 网络搜索成功，返回结果数量:', data.search_result?.length || 0);
    return data;
  } catch (error) {
    console.error('❌ 网络搜索失败:', error);
    throw error;
  }
}

/**
 * 格式化搜索结果为上下文文本
 */
export function formatSearchResults(searchResponse: WebSearchResponse): string {
  if (!searchResponse.search_result || searchResponse.search_result.length === 0) {
    return '';
  }

  const results = searchResponse.search_result.slice(0, 5); // 只取前5个结果
  
  let contextText = '\n\n--- 网络搜索结果 ---\n';
  
  results.forEach((result, index) => {
    contextText += `\n${index + 1}. ${result.title}\n`;
    contextText += `来源: ${result.link}\n`;
    if (result.publish_date) {
      contextText += `时间: ${result.publish_date}\n`;
    }
    contextText += `内容: ${result.content.slice(0, 300)}...\n`;
  });
  
  contextText += '\n--- 搜索结果结束 ---\n\n';
  
  return contextText;
}

/**
 * 获取搜索结果的来源信息
 */
export function getSearchSources(searchResponse: WebSearchResponse): Array<{title: string, url: string, time?: string}> {
  if (!searchResponse.search_result) {
    return [];
  }

  return searchResponse.search_result.slice(0, 5).map(result => ({
    title: result.title,
    url: result.link,
    time: result.publish_date
  }));
}

/**
 * 检查是否需要网络搜索
 * 基于查询内容判断是否需要实时信息
 */
export function shouldPerformWebSearch(query: string): boolean {
  const timeKeywords = ['今天', '今日', '最近', '现在', '当前', '最新', '新闻', '实时'];
  const eventKeywords = ['发生', '事件', '消息', '报道', '公布', '发布'];
  const questionKeywords = ['什么', '如何', '怎么', '为什么', '哪里', '谁'];
  
  const lowerQuery = query.toLowerCase();
  
  // 检查是否包含时间相关词汇
  const hasTimeKeywords = timeKeywords.some(keyword => lowerQuery.includes(keyword));
  
  // 检查是否包含事件相关词汇
  const hasEventKeywords = eventKeywords.some(keyword => lowerQuery.includes(keyword));
  
  // 检查是否是问题形式
  const hasQuestionKeywords = questionKeywords.some(keyword => lowerQuery.includes(keyword));
  
  // 如果包含时间词汇或事件词汇，建议搜索
  if (hasTimeKeywords || hasEventKeywords) {
    return true;
  }
  
  // 如果是问题形式且查询较短，可能需要搜索
  if (hasQuestionKeywords && query.length < 50) {
    return true;
  }
  
  return false;
}