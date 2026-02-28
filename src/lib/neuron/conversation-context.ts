/**
 * 对话上下文管理器
 * 
 * 实现工作记忆（当前对话上下文）：
 * - 存储用户和AI的对话历史
 * - 检索最近N条消息作为上下文
 * - 超长对话自动压缩成摘要
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 对话上下文管理器
 */
export class ConversationContext {
  private supabase = getSupabaseClient();
  
  /**
   * 获取或创建会话ID
   * 默认使用一个全局会话（可以扩展为多用户多会话）
   */
  getDefaultSessionId(): string {
    return 'default-session';
  }
  
  /**
   * 添加用户消息
   */
  async addUserMessage(sessionId: string, content: string): Promise<void> {
    await this.supabase
      .from('conversation_history')
      .insert({
        session_id: sessionId,
        role: 'user',
        content,
      });
  }
  
  /**
   * 添加AI回复
   */
  async addAssistantMessage(
    sessionId: string, 
    content: string, 
    winnerRole?: string,
    thoughts?: Array<{ role: string; core: string; confidence: number }>
  ): Promise<void> {
    await this.supabase
      .from('conversation_history')
      .insert({
        session_id: sessionId,
        role: 'assistant',
        content,
        winner_role: winnerRole,
        thoughts,
      });
  }
  
  /**
   * 获取最近N条对话历史
   */
  async getRecentHistory(
    sessionId: string, 
    limit: number = 10
  ): Promise<Array<{ role: string; content: string; winnerRole?: string }>> {
    const { data, error } = await this.supabase
      .from('conversation_history')
      .select('role, content, winner_role')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error || !data) return [];
    
    // 反转顺序，让最旧的消息在前
    return data.reverse().map(msg => ({
      role: msg.role,
      content: msg.content,
      winnerRole: msg.winner_role || undefined,
    }));
  }
  
  /**
   * 构建上下文提示（给模型看的对话历史）
   */
  async buildContextPrompt(sessionId: string): Promise<string> {
    const history = await this.getRecentHistory(sessionId, 6);
    
    if (history.length === 0) {
      return '';
    }
    
    const contextLines: string[] = ['【对话历史】'];
    
    for (const msg of history) {
      if (msg.role === 'user') {
        contextLines.push(`用户: ${msg.content}`);
      } else {
        const modelHint = msg.winnerRole ? ` (${msg.winnerRole})` : '';
        contextLines.push(`AI${modelHint}: ${msg.content.slice(0, 200)}${msg.content.length > 200 ? '...' : ''}`);
      }
    }
    
    contextLines.push('【当前问题】');
    
    return contextLines.join('\n') + '\n';
  }
  
  /**
   * 获取对话统计
   */
  async getStats(sessionId: string): Promise<{
    totalMessages: number;
    userMessages: number;
    assistantMessages: number;
  }> {
    const { count: total } = await this.supabase
      .from('conversation_history')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);
    
    const { count: userCount } = await this.supabase
      .from('conversation_history')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('role', 'user');
    
    return {
      totalMessages: total || 0,
      userMessages: userCount || 0,
      assistantMessages: (total || 0) - (userCount || 0),
    };
  }
  
  /**
   * 清除会话历史
   */
  async clearSession(sessionId: string): Promise<void> {
    await this.supabase
      .from('conversation_history')
      .delete()
      .eq('session_id', sessionId);
  }
  
  /**
   * 压缩历史为摘要（当对话太长时）
   */
  async compressIfNeeded(sessionId: string, maxLength: number = 20): Promise<void> {
    const stats = await this.getStats(sessionId);
    
    if (stats.totalMessages <= maxLength) return;
    
    // 获取需要压缩的消息
    const { data: messages } = await this.supabase
      .from('conversation_history')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(stats.totalMessages - maxLength + 5);
    
    if (!messages || messages.length === 0) return;
    
    // 生成摘要（简单版本：提取用户消息的主题）
    const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);
    const topics = this.extractTopics(userMessages);
    
    const summary = `用户之前讨论过：${topics.join('、')}。`;
    
    // 存储摘要
    await this.supabase
      .from('session_summaries')
      .insert({
        session_id: sessionId,
        summary,
        message_count: messages.length,
        topics,
      });
    
    // 删除已压缩的消息
    const idsToDelete = messages.map(m => m.id);
    await this.supabase
      .from('conversation_history')
      .delete()
      .in('id', idsToDelete);
  }
  
  /**
   * 提取主题（简单版本）
   */
  private extractTopics(messages: string[]): string[] {
    const topics: string[] = [];
    const keywords = ['设计', '系统', '问题', '代码', '功能', '架构', '实现', '优化'];
    
    for (const msg of messages) {
      for (const keyword of keywords) {
        if (msg.includes(keyword) && !topics.includes(keyword)) {
          topics.push(keyword);
          if (topics.length >= 3) return topics;
        }
      }
    }
    
    return topics.length > 0 ? topics : ['多个话题'];
  }
  
  /**
   * 获取会话摘要
   */
  async getSessionSummary(sessionId: string): Promise<string | null> {
    const { data } = await this.supabase
      .from('session_summaries')
      .select('summary')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    return data?.summary || null;
  }
}

// 全局实例
let globalContext: ConversationContext | null = null;

export function getConversationContext(): ConversationContext {
  if (!globalContext) {
    globalContext = new ConversationContext();
  }
  return globalContext;
}
