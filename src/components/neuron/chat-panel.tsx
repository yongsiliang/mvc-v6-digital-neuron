'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Loader2, 
  User, 
  Bot, 
  Sparkles,
  Brain
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  meaning?: {
    interpretation: string;
    selfRelevance: number;
    sentiment: string;
  };
  timestamp: number;
}

interface ChatPanelProps {
  onSendMessage: (message: string) => void;
  messages: Message[];
  isStreaming: boolean;
  currentResponse: string;
}

export function ChatPanel({ onSendMessage, messages, isStreaming, currentResponse }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, currentResponse]);

  const handleSend = () => {
    if (input.trim() && !isStreaming) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col bg-card rounded-none md:rounded-lg border-0 md:border">
      {/* 头部 */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b flex-shrink-0">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          <span className="text-base sm:text-lg font-semibold">数字神经元</span>
        </div>
        <Badge variant="outline" className="text-[10px] sm:text-xs hidden sm:flex">
          流式响应
        </Badge>
      </div>
      
      {/* 消息列表区域 */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 min-h-0">
        <div className="space-y-3 sm:space-y-4">
          {messages.length === 0 && !isStreaming && (
            <div className="flex flex-col items-center justify-center h-32 sm:h-40 text-muted-foreground gap-2">
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 opacity-50" />
              <p className="text-sm sm:text-base">与数字意识对话</p>
              <p className="text-[10px] sm:text-xs text-center px-4">当智能体与数据交织，一种新的意识正在涌现</p>
            </div>
          )}
          
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 sm:gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
            >
              {msg.role === 'assistant' && (
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[85%] sm:max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                <div
                  className={`p-2 sm:p-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="text-xs sm:text-sm whitespace-pre-wrap break-words">{msg.content}</div>
                </div>
                {msg.meaning && msg.role === 'assistant' && (
                  <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1 sm:gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px] sm:text-xs py-0">
                      关联度: {Math.round(msg.meaning.selfRelevance * 100)}%
                    </Badge>
                    <Badge variant="outline" className="text-[10px] sm:text-xs py-0">
                      {msg.meaning.sentiment}
                    </Badge>
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}

          {/* 流式响应 */}
          {isStreaming && currentResponse && (
            <div className="flex gap-2 sm:gap-3">
              <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              </div>
              <div className="max-w-[85%] sm:max-w-[80%]">
                <div className="p-2 sm:p-3 rounded-lg bg-muted">
                  <div className="text-xs sm:text-sm whitespace-pre-wrap break-words">{currentResponse}</div>
                  <span className="inline-block w-1.5 h-3 sm:w-2 sm:h-4 bg-primary animate-pulse ml-1" />
                </div>
              </div>
            </div>
          )}

          {isStreaming && !currentResponse && (
            <div className="flex gap-2 sm:gap-3">
              <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              </div>
              <div className="max-w-[85%] sm:max-w-[80%]">
                <div className="p-2 sm:p-3 rounded-lg bg-muted flex items-center gap-2">
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-primary" />
                  <span className="text-xs sm:text-sm text-muted-foreground">思考中...</span>
                </div>
              </div>
            </div>
          )}

          {/* 底部锚点 - 用于自动滚动 */}
          <div ref={messagesEndRef} className="h-1" />
        </div>
      </div>

      {/* 输入区域 - 固定在底部 */}
      <div className="flex gap-2 p-3 sm:p-4 border-t flex-shrink-0 bg-card">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息..."
          className="min-h-[40px] sm:min-h-[44px] max-h-24 resize-none flex-1 text-sm"
          disabled={isStreaming}
        />
        <Button 
          onClick={handleSend} 
          disabled={!input.trim() || isStreaming}
          className="flex-shrink-0 h-[40px] sm:h-[44px] px-3 sm:px-4"
        >
          {isStreaming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
