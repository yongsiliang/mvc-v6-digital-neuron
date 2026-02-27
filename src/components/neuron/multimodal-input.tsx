/**
 * ═══════════════════════════════════════════════════════════════════════
 * 多模态输入组件
 * Multimodal Input Component
 * 
 * 支持文本、图像、音频、文件输入
 * ═══════════════════════════════════════════════════════════════════════
 */

'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Image, 
  Mic, 
  X, 
  Loader2, 
  Send,
  Paperclip,
  FileText,
  File,
  FileImage,
  FileAudio,
  FileVideo
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

export interface MultimodalInputItem {
  id: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'file';
  content: string;
  preview?: string; // 图像预览 URL
  fileName?: string; // 文件名
  fileSize?: number; // 文件大小
  mimeType?: string; // MIME 类型
  status: 'pending' | 'uploading' | 'ready' | 'error';
  error?: string;
}

export interface MultimodalInputProps {
  onSend: (items: MultimodalInputItem[], text: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  maxFileSize?: number; // 最大文件大小（字节），默认 10MB
}

// 支持的文件类型
const SUPPORTED_FILE_TYPES = {
  // 文档
  'application/pdf': { icon: FileText, label: 'PDF' },
  'application/msword': { icon: FileText, label: 'Word' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: FileText, label: 'Word' },
  'application/vnd.ms-excel': { icon: FileText, label: 'Excel' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: FileText, label: 'Excel' },
  'application/vnd.ms-powerpoint': { icon: FileText, label: 'PPT' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { icon: FileText, label: 'PPT' },
  'text/plain': { icon: FileText, label: '文本' },
  'text/csv': { icon: FileText, label: 'CSV' },
  'text/markdown': { icon: FileText, label: 'Markdown' },
  'application/json': { icon: FileText, label: 'JSON' },
  'text/html': { icon: FileText, label: 'HTML' },
  'application/xml': { icon: FileText, label: 'XML' },
  // 代码
  'text/javascript': { icon: FileText, label: 'JS' },
  'text/typescript': { icon: FileText, label: 'TS' },
  'text/python': { icon: FileText, label: 'Python' },
  'text/x-python': { icon: FileText, label: 'Python' },
  'text/java': { icon: FileText, label: 'Java' },
  'text/css': { icon: FileText, label: 'CSS' },
};

// ─────────────────────────────────────────────────────────────────────
// 工具函数
// ─────────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function getFileIcon(mimeType: string, type: 'image' | 'audio' | 'video' | 'file') {
  if (type === 'image') return FileImage;
  if (type === 'audio') return FileAudio;
  if (type === 'video') return FileVideo;
  
  const config = SUPPORTED_FILE_TYPES[mimeType as keyof typeof SUPPORTED_FILE_TYPES];
  return config?.icon || File;
}

function getFileTypeLabel(mimeType: string): string {
  const config = SUPPORTED_FILE_TYPES[mimeType as keyof typeof SUPPORTED_FILE_TYPES];
  return config?.label || '文件';
}

// ─────────────────────────────────────────────────────────────────────
// 组件
// ─────────────────────────────────────────────────────────────────────

export function MultimodalInput({ 
  onSend, 
  disabled = false,
  isLoading = false,
  maxFileSize = 10 * 1024 * 1024 // 默认 10MB
}: MultimodalInputProps) {
  const [text, setText] = useState('');
  const [mediaItems, setMediaItems] = useState<MultimodalInputItem[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ─────────────────────────────────────────────────────────────────────
  // 图像处理
  // ─────────────────────────────────────────────────────────────────────

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        return;
      }

      if (file.size > maxFileSize) {
        alert(`文件过大，最大支持 ${formatFileSize(maxFileSize)}`);
        return;
      }

      const id = `img-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const reader = new FileReader();
      
      reader.onload = () => {
        const base64 = reader.result as string;
        setMediaItems(prev => [...prev, {
          id,
          type: 'image',
          content: base64,
          preview: base64,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          status: 'ready',
        }]);
      };
      
      reader.readAsDataURL(file);
    });

    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  }, [maxFileSize]);

  // ─────────────────────────────────────────────────────────────────────
  // 文件处理
  // ─────────────────────────────────────────────────────────────────────

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      // 检查文件大小
      if (file.size > maxFileSize) {
        alert(`文件 "${file.name}" 过大，最大支持 ${formatFileSize(maxFileSize)}`);
        return;
      }

      const id = `file-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const reader = new FileReader();
      
      reader.onload = () => {
        const base64 = reader.result as string;
        
        // 判断文件类型
        let itemType: 'image' | 'audio' | 'video' | 'file' = 'file';
        if (file.type.startsWith('image/')) itemType = 'image';
        else if (file.type.startsWith('audio/')) itemType = 'audio';
        else if (file.type.startsWith('video/')) itemType = 'video';
        
        setMediaItems(prev => [...prev, {
          id,
          type: itemType,
          content: base64,
          preview: itemType === 'image' ? base64 : undefined,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          status: 'ready',
        }]);
      };
      
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [maxFileSize]);

  // ─────────────────────────────────────────────────────────────────────
  // 音频录制
  // ─────────────────────────────────────────────────────────────────────

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        
        reader.onload = () => {
          const base64 = reader.result as string;
          const id = `audio-${Date.now()}`;
          
          setMediaItems(prev => [...prev, {
            id,
            type: 'audio',
            content: base64,
            fileName: `录音_${new Date().toLocaleTimeString()}.webm`,
            fileSize: audioBlob.size,
            mimeType: 'audio/webm',
            status: 'ready',
          }]);
        };
        
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
      
    } catch (error) {
      console.error('无法访问麦克风:', error);
      alert('无法访问麦克风，请检查权限设置');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  }, [isRecording]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // ─────────────────────────────────────────────────────────────────────
  // 媒体项管理
  // ─────────────────────────────────────────────────────────────────────

  const removeMediaItem = useCallback((id: string) => {
    setMediaItems(prev => prev.filter(item => item.id !== id));
  }, []);

  // ─────────────────────────────────────────────────────────────────────
  // 发送
  // ─────────────────────────────────────────────────────────────────────

  const handleSend = useCallback(() => {
    if (disabled || isLoading) return;
    if (!text.trim() && mediaItems.length === 0) return;
    
    onSend(mediaItems, text.trim());
    setText('');
    setMediaItems([]);
  }, [text, mediaItems, disabled, isLoading, onSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // ─────────────────────────────────────────────────────────────────────
  // 渲染
  // ─────────────────────────────────────────────────────────────────────

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3">
      {/* 已选媒体预览 */}
      {mediaItems.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-lg">
          {mediaItems.map(item => {
            const IconComponent = item.type !== 'text' ? getFileIcon(item.mimeType || '', item.type as 'image' | 'audio' | 'video' | 'file') : FileText;
            
            return (
              <div 
                key={item.id}
                className="relative group"
              >
                {item.type === 'image' && item.preview ? (
                  <div className="w-16 h-16 rounded-lg overflow-hidden border">
                    <img 
                      src={item.preview} 
                      alt="预览" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center w-20 h-16 rounded-lg border bg-background p-1">
                    <IconComponent className="w-5 h-5 text-muted-foreground" />
                    <span className="text-[9px] text-muted-foreground mt-0.5 truncate w-full text-center">
                      {item.fileName ? item.fileName.slice(0, 8) : getFileTypeLabel(item.mimeType || '')}
                    </span>
                  </div>
                )}
                
                {/* 文件信息悬浮 */}
                {(item.fileName || item.fileSize) && (
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {item.fileName && <span className="font-medium">{item.fileName}</span>}
                    {item.fileSize && <span className="text-muted-foreground ml-1">({formatFileSize(item.fileSize)})</span>}
                  </div>
                )}
                
                {/* 删除按钮 */}
                <button
                  onClick={() => removeMediaItem(item.id)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
                
                {/* 状态指示 */}
                {item.status === 'uploading' && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 输入区域 */}
      <div className="flex gap-2 items-end">
        {/* 附件按钮 */}
        <div className="flex gap-1">
          {/* 图像选择 */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => imageInputRef.current?.click()}
            disabled={disabled || isLoading}
            title="选择图片"
            className="shrink-0 h-10 w-10 rounded-full"
          >
            <Image className="w-5 h-5" />
          </Button>
          
          {/* 文件选择 */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.md,.json,.html,.xml,.js,.ts,.py,.java,.css"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isLoading}
            title="选择文件 (PDF, Word, Excel, 文本等)"
            className="shrink-0 h-10 w-10 rounded-full"
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          
          {/* 语音录制 */}
          <Button
            variant={isRecording ? 'destructive' : 'ghost'}
            size="icon"
            onClick={toggleRecording}
            disabled={disabled || isLoading}
            title={isRecording ? '停止录制' : '开始录制'}
            className="shrink-0 h-10 w-10 rounded-full"
          >
            {isRecording ? (
              <span className="text-xs font-mono">{formatTime(recordingTime)}</span>
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* 文本输入 */}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={mediaItems.length > 0 ? "添加文字说明（可选）..." : "输入消息或发送图片/文件/语音..."}
          className="flex-1 rounded-full border bg-background px-4 py-2.5 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
          disabled={disabled || isLoading}
        />

        {/* 发送按钮 */}
        <button
          onClick={handleSend}
          disabled={disabled || isLoading || (!text.trim() && mediaItems.length === 0)}
          className="px-5 md:px-6 py-2.5 bg-primary text-primary-foreground rounded-full disabled:opacity-50 text-sm md:text-base shrink-0 min-h-[44px] font-medium flex items-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">发送</span>
        </button>
      </div>
      
      {/* 录制提示 */}
      {isRecording && (
        <div className="flex items-center gap-2 text-sm text-destructive animate-pulse">
          <span className="w-2 h-2 bg-destructive rounded-full" />
          正在录制... {formatTime(recordingTime)}
        </div>
      )}
      
      {/* 文件类型提示 */}
      <div className="text-[10px] text-muted-foreground">
        支持格式: 图片 (JPG/PNG/GIF) | 文档 (PDF/Word/Excel/PPT/TXT/MD/JSON) | 语音录制
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 便捷 Hook
// ─────────────────────────────────────────────────────────────────────

export function useMultimodalInput() {
  const [items, setItems] = useState<MultimodalInputItem[]>([]);
  
  const addItem = useCallback((item: Omit<MultimodalInputItem, 'id'>) => {
    const id = `${item.type}-${Date.now()}`;
    setItems(prev => [...prev, { ...item, id }]);
    return id;
  }, []);
  
  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);
  
  const updateItem = useCallback((id: string, updates: Partial<MultimodalInputItem>) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);
  
  const clearItems = useCallback(() => {
    setItems([]);
  }, []);
  
  return {
    items,
    addItem,
    removeItem,
    updateItem,
    clearItems,
  };
}
