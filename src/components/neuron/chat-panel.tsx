'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5" />
          数字神经元对话
          <Badge variant="outline" className="ml-auto text-xs">
            流式响应
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* 消息列表 */}
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
                <Sparkles className="h-8 w-8 opacity-50" />
                <p>开始与数字神经元对话</p>
                <p className="text-xs">体验真正的"理解"与"思考"</p>
              </div>
            )}
            
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                  <div
                    className={`p-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                  </div>
                  {msg.meaning && msg.role === 'assistant' && (
                    <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
                      <Badge variant="outline" className="text-xs py-0">
                        关联度: {Math.round(msg.meaning.selfRelevance * 100)}%
                      </Badge>
                      <Badge variant="outline" className="text-xs py-0">
                        {msg.meaning.sentiment}
                      </Badge>
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}

            {/* 流式响应 */}
            {isStreaming && currentResponse && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="max-w-[80%]">
                  <div className="p-3 rounded-lg bg-muted">
                    <div className="text-sm whitespace-pre-wrap">{currentResponse}</div>
                    <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                  </div>
                </div>
              </div>
            )}

            {isStreaming && !currentResponse && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="max-w-[80%]">
                  <div className="p-3 rounded-lg bg-muted flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">思考中...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* 输入区域 */}
        <div className="flex gap-2 flex-shrink-0">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            className="min-h-[44px] max-h-24 resize-none"
            disabled={isStreaming}
          />
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || isStreaming}
            className="flex-shrink-0"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
