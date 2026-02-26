'use client';

import { useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

// ─────────────────────────────────────────────────────────────────────
// 可拖拽悬浮面板组件
// ─────────────────────────────────────────────────────────────────────

interface DraggablePanelProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  onClose: () => void;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
  minWidth?: number;
  minHeight?: number;
}

export function DraggablePanel({
  title,
  icon,
  children,
  onClose,
  defaultPosition = { x: 100, y: 80 },
  defaultSize = { width: 500, height: 420 },
  minWidth = 300,
  minHeight = 200,
}: DraggablePanelProps) {
  const [position, setPosition] = useState(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [size, setSize] = useState(defaultSize);
  
  const dragStartRef = useRef({ x: 0, y: 0, left: 0, top: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const panelRef = useRef<HTMLDivElement>(null);
  
  // 拖拽开始
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return; // 忽略按钮点击
    
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      left: position.x,
      top: position.y,
    };
    e.preventDefault();
  }, [position]);
  
  // 拖拽移动
  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      
      const newX = Math.max(0, Math.min(window.innerWidth - size.width, dragStartRef.current.left + deltaX));
      const newY = Math.max(0, Math.min(window.innerHeight - 100, dragStartRef.current.top + deltaY));
      
      setPosition({ x: newX, y: newY });
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, size.width, size.height]);
  
  // 调整大小开始
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    };
  }, [size]);
  
  // 调整大小移动
  useEffect(() => {
    if (!isResizing) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStartRef.current.x;
      const deltaY = e.clientY - resizeStartRef.current.y;
      
      const newWidth = Math.max(minWidth, resizeStartRef.current.width - deltaX);
      const newHeight = Math.max(minHeight, resizeStartRef.current.height + deltaY);
      
      setSize({ width: newWidth, height: newHeight });
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minWidth, minHeight]);
  
  return (
    <div
      ref={panelRef}
      className={`fixed z-50 ${isDragging ? 'cursor-grabbing' : ''} ${isResizing ? 'cursor-se-resize' : ''}`}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
      }}
    >
      <div className="w-full h-full bg-background/95 backdrop-blur-md border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* 标题栏 - 可拖拽 */}
        <div
          className="px-4 py-2.5 border-b bg-muted/30 flex items-center justify-between cursor-grab select-none"
          onMouseDown={handleDragStart}
        >
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="font-medium text-sm">{title}</h3>
          </div>
          <div className="flex items-center gap-1">
            {/* 调整大小手柄 */}
            <div
              className="w-4 h-4 cursor-se-resize flex items-center justify-center text-muted-foreground hover:text-foreground"
              onMouseDown={handleResizeStart}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 2L2 10M10 6L6 10M10 10L10 10" strokeLinecap="round" />
              </svg>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 hover:bg-muted"
            >
              ✕
            </Button>
          </div>
        </div>
        
        {/* 内容区域 */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}

export default DraggablePanel;
