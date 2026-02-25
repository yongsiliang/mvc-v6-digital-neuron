'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface InteractionPanelProps {
  onSendMessage: (message: string) => void;
  onFeedback: (type: 'positive' | 'negative', details?: string) => void;
  isProcessing?: boolean;
  lastResponse?: string;
  className?: string;
}

export function InteractionPanel({
  onSendMessage,
  onFeedback,
  isProcessing = false,
  lastResponse,
  className,
}: InteractionPanelProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim()) {
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
    <Card className={cn('glow-card', className)}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--neuron-predicting)] animate-pulse" />
          交互面板
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 输入区域 */}
        <div className="space-y-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入文本，神经元将处理并学习..."
            className="min-h-[80px] resize-none bg-muted/30 border-muted-foreground/20 focus:border-[var(--neuron-active)]"
            disabled={isProcessing}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              按 Enter 发送，Shift+Enter 换行
            </span>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isProcessing}
              size="sm"
              className="bg-[var(--neuron-active)] hover:bg-[var(--neuron-active)]/80"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  处理中...
                </span>
              ) : (
                '发送'
              )}
            </Button>
          </div>
        </div>

        {/* 响应区域 */}
        {lastResponse && (
          <div className="p-3 rounded-lg bg-muted/20 border border-muted-foreground/10">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {lastResponse}
            </p>
          </div>
        )}

        {/* 反馈按钮 */}
        <div className="flex items-center justify-between pt-2 border-t border-muted-foreground/10">
          <span className="text-xs text-muted-foreground">对这个响应：</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFeedback('positive')}
              className="text-[var(--signal-reward)] border-[var(--signal-reward)]/30 hover:bg-[var(--signal-reward)]/10"
            >
              <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
              </svg>
              有帮助
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFeedback('negative')}
              className="text-[var(--signal-error)] border-[var(--signal-error)]/30 hover:bg-[var(--signal-error)]/10"
            >
              <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
              </svg>
              需改进
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface FeedbackHistoryProps {
  feedback: Array<{
    id: string;
    timestamp: number;
    type: 'positive' | 'negative';
    context?: string;
  }>;
  className?: string;
}

export function FeedbackHistory({ feedback, className }: FeedbackHistoryProps) {
  return (
    <Card className={cn('glow-card', className)}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--signal-reward)]" />
          反馈历史
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[150px] overflow-y-auto">
          {feedback.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              暂无反馈记录
            </p>
          ) : (
            feedback.slice(-10).reverse().map((fb) => (
              <div
                key={fb.id}
                className={cn(
                  'flex items-center gap-2 p-2 rounded-md text-sm',
                  fb.type === 'positive' 
                    ? 'bg-[var(--signal-reward)]/10' 
                    : 'bg-[var(--signal-error)]/10'
                )}
              >
                <span className={cn(
                  'w-4 h-4 rounded-full flex items-center justify-center text-xs',
                  fb.type === 'positive' 
                    ? 'bg-[var(--signal-reward)] text-black' 
                    : 'bg-[var(--signal-error)] text-white'
                )}>
                  {fb.type === 'positive' ? '✓' : '✗'}
                </span>
                <span className="text-muted-foreground font-mono-nums text-xs">
                  {new Date(fb.timestamp).toLocaleTimeString()}
                </span>
                {fb.context && (
                  <span className="text-muted-foreground truncate text-xs">
                    {fb.context}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
