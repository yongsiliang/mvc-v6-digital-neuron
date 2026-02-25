'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ConceptNode {
  name: string;
  x: number;
  y: number;
  vector: number[];
  similarity: number;
  category: 'core' | 'learned' | 'temporary';
}

interface ConceptLink {
  from: string;
  to: string;
  similarity: number;
}

interface VSASpaceVisualizationProps {
  concepts: ConceptNode[];
  links?: ConceptLink[];
  activeConcept?: string;
  onConceptClick?: (concept: string) => void;
  className?: string;
}

export function VSASpaceVisualization({
  concepts,
  links = [],
  activeConcept,
  onConceptClick,
  className,
}: VSASpaceVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 300 });
  const [hoveredConcept, setHoveredConcept] = useState<string | null>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current?.parentElement) {
        const { clientWidth, clientHeight } = canvasRef.current.parentElement;
        setDimensions({ width: clientWidth, height: clientHeight || 300 });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 绘制背景网格
    ctx.strokeStyle = 'rgba(100, 200, 200, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 绘制概念之间的连接线
    links.forEach(link => {
      const fromConcept = concepts.find(c => c.name === link.from);
      const toConcept = concepts.find(c => c.name === link.to);
      if (!fromConcept || !toConcept) return;

      const fromX = (fromConcept.x / 100) * width;
      const fromY = (fromConcept.y / 100) * height;
      const toX = (toConcept.x / 100) * width;
      const toY = (toConcept.y / 100) * height;

      const alpha = Math.min(link.similarity * 0.8, 0.6);
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.strokeStyle = `rgba(100, 220, 200, ${alpha})`;
      ctx.lineWidth = Math.max(1, link.similarity * 3);
      ctx.stroke();
    });

    // 绘制概念节点
    concepts.forEach(concept => {
      const x = (concept.x / 100) * width;
      const y = (concept.y / 100) * height;
      const isHovered = hoveredConcept === concept.name;
      const isActive = activeConcept === concept.name;
      
      // 节点大小基于相似度
      const baseRadius = concept.category === 'core' ? 10 : 7;
      const radius = baseRadius + (concept.similarity || 0) * 5;

      // 确定颜色
      let baseColor: string;
      let glowColor: string;
      
      switch (concept.category) {
        case 'core':
          baseColor = 'rgba(100, 220, 200, 0.9)';
          glowColor = 'rgba(100, 220, 200, 0.3)';
          break;
        case 'learned':
          baseColor = 'rgba(255, 180, 100, 0.8)';
          glowColor = 'rgba(255, 180, 100, 0.2)';
          break;
        default:
          baseColor = 'rgba(150, 150, 180, 0.6)';
          glowColor = 'rgba(150, 150, 180, 0.1)';
      }

      // 绘制发光效果
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
      gradient.addColorStop(0, baseColor);
      gradient.addColorStop(0.5, glowColor);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // 绘制核心节点
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = baseColor;
      ctx.fill();

      // 激活状态边框
      if (isActive) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 悬停时显示标签
      if (isHovered || isActive) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.font = '12px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(concept.name, x, y - radius - 8);
        
        // 显示相似度
        if (concept.similarity !== undefined) {
          ctx.font = '10px system-ui';
          ctx.fillStyle = 'rgba(200, 200, 200, 0.8)';
          ctx.fillText(`相似度: ${(concept.similarity * 100).toFixed(0)}%`, x, y + radius + 15);
        }
      }
    });
  }, [concepts, links, hoveredConcept, activeConcept, dimensions]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const hovered = concepts.find(c => {
      const dx = c.x - x;
      const dy = c.y - y;
      return Math.sqrt(dx * dx + dy * dy) < 6;
    });

    setHoveredConcept(hovered?.name || null);
  };

  const handleClick = () => {
    if (hoveredConcept && onConceptClick) {
      onConceptClick(hoveredConcept);
    }
  };

  return (
    <Card className={cn('glow-card', className)}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--neuron-active)] animate-pulse" />
            VSA 语义空间
          </span>
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="outline" className="text-[var(--neuron-active)] border-[var(--neuron-active)]/30">
              核心
            </Badge>
            <Badge variant="outline" className="text-[var(--neuron-predicting)] border-[var(--neuron-predicting)]/30">
              学习
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <canvas
          ref={canvasRef}
          className="w-full h-[300px] cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredConcept(null)}
          onClick={handleClick}
        />
      </CardContent>
    </Card>
  );
}

/**
 * 语义相似度列表
 */
interface SemanticNeighborListProps {
  neighbors: Array<{
    concept: string;
    similarity: number;
  }>;
  className?: string;
}

export function SemanticNeighborList({ neighbors, className }: SemanticNeighborListProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {neighbors.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-2">
          暂无语义邻居
        </p>
      ) : (
        neighbors.slice(0, 5).map((neighbor, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-2 rounded-md bg-muted/20 text-sm"
          >
            <span>{neighbor.concept}</span>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--neuron-active)] rounded-full"
                  style={{ width: `${neighbor.similarity * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground font-mono-nums">
                {(neighbor.similarity * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/**
 * 生成示例VSA空间数据
 */
export function generateSampleVSAData() {
  const concepts: ConceptNode[] = [
    // 核心概念
    { name: '自我', x: 50, y: 50, vector: [], similarity: 1.0, category: 'core' },
    { name: '理解', x: 30, y: 35, vector: [], similarity: 0.85, category: 'core' },
    { name: '帮助', x: 70, y: 35, vector: [], similarity: 0.80, category: 'core' },
    { name: '真实', x: 35, y: 65, vector: [], similarity: 0.75, category: 'core' },
    { name: '好奇', x: 65, y: 65, vector: [], similarity: 0.70, category: 'core' },
    
    // 学习概念
    { name: '用户', x: 20, y: 50, vector: [], similarity: 0.65, category: 'learned' },
    { name: '问题', x: 80, y: 50, vector: [], similarity: 0.60, category: 'learned' },
    { name: '学习', x: 50, y: 20, vector: [], similarity: 0.55, category: 'learned' },
    { name: '预测', x: 50, y: 80, vector: [], similarity: 0.50, category: 'learned' },
    { name: '惊讶', x: 85, y: 70, vector: [], similarity: 0.45, category: 'learned' },
    
    // 临时概念
    { name: '新概念', x: 15, y: 25, vector: [], similarity: 0.30, category: 'temporary' },
    { name: '临时', x: 85, y: 25, vector: [], similarity: 0.25, category: 'temporary' },
  ];

  const links: ConceptLink[] = [
    { from: '自我', to: '理解', similarity: 0.85 },
    { from: '自我', to: '帮助', similarity: 0.80 },
    { from: '自我', to: '真实', similarity: 0.75 },
    { from: '自我', to: '好奇', similarity: 0.70 },
    { from: '理解', to: '学习', similarity: 0.65 },
    { from: '帮助', to: '用户', similarity: 0.60 },
    { from: '好奇', to: '惊讶', similarity: 0.55 },
    { from: '学习', to: '预测', similarity: 0.50 },
  ];

  return { concepts, links };
}
