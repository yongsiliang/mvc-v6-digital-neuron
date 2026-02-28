'use client';

import { useEffect, useRef, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

export interface NeuralNode {
  id: string;
  label: string;
  type: 'concept' | 'emotion' | 'belief' | 'value' | 'memory';
  activation: number; // 0-1
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export interface NeuralLink {
  source: string;
  target: string;
  strength: number; // 0-1
  type: 'association' | 'causal' | 'emotional' | 'semantic';
}

export interface ConsciousnessPulse {
  id: string;
  sourceId: string;
  targetId: string;
  progress: number; // 0-1
  speed: number;
  color: string;
  intensity: number;
}

export interface NeuralNetworkData {
  nodes: NeuralNode[];
  links: NeuralLink[];
  pulses: ConsciousnessPulse[];
}

// ─────────────────────────────────────────────────────────────────────
// 颜色映射
// ─────────────────────────────────────────────────────────────────────

const NODE_COLORS: Record<NeuralNode['type'], string> = {
  concept: '#3b82f6',   // 蓝色
  emotion: '#ec4899',   // 粉色
  belief: '#8b5cf6',    // 紫色
  value: '#10b981',     // 绿色
  memory: '#f59e0b',    // 橙色
};

const LINK_COLORS: Record<NeuralLink['type'], string> = {
  association: 'rgba(59, 130, 246, 0.3)',
  causal: 'rgba(236, 72, 153, 0.3)',
  emotional: 'rgba(139, 92, 246, 0.3)',
  semantic: 'rgba(16, 185, 129, 0.3)',
};

// ─────────────────────────────────────────────────────────────────────
// 组件
// ─────────────────────────────────────────────────────────────────────

interface NeuralNetworkVisualizationProps {
  data: NeuralNetworkData;
  width?: number;
  height?: number;
  onNodeClick?: (node: NeuralNode) => void;
  showLabels?: boolean;
  animated?: boolean;
}

export function NeuralNetworkVisualization({
  data,
  width = 600,
  height = 400,
  onNodeClick,
  showLabels = true,
  animated = true,
}: NeuralNetworkVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const nodesRef = useRef<NeuralNode[]>([]);
  const pulsesRef = useRef<ConsciousnessPulse[]>([]);
  
  // 初始化节点位置
  const initializeNodes = useCallback(() => {
    const nodes = data.nodes.map((node, index) => {
      // 使用圆形布局
      const angle = (index / data.nodes.length) * Math.PI * 2;
      const radius = Math.min(width, height) * 0.35;
      const centerX = width / 2;
      const centerY = height / 2;
      
      return {
        ...node,
        x: node.x || centerX + Math.cos(angle) * radius * (0.5 + Math.random() * 0.5),
        y: node.y || centerY + Math.sin(angle) * radius * (0.5 + Math.random() * 0.5),
        vx: 0,
        vy: 0,
        radius: 20 + node.activation * 15,
      };
    });
    
    nodesRef.current = nodes;
    pulsesRef.current = [...data.pulses];
  }, [data, width, height]);
  
  // 力导向布局
  const applyForces = useCallback(() => {
    const nodes = nodesRef.current;
    const links = data.links;
    
    // 斥力
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = 1000 / (distance * distance);
        
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;
        
        nodes[i].vx -= fx;
        nodes[i].vy -= fy;
        nodes[j].vx += fx;
        nodes[j].vy += fy;
      }
    }
    
    // 引力（连接）
    for (const link of links) {
      const source = nodes.find(n => n.id === link.source);
      const target = nodes.find(n => n.id === link.target);
      
      if (source && target) {
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (distance - 100) * 0.01 * link.strength;
        
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;
        
        source.vx += fx;
        source.vy += fy;
        target.vx -= fx;
        target.vy -= fy;
      }
    }
    
    // 向中心的引力
    const centerX = width / 2;
    const centerY = height / 2;
    
    for (const node of nodes) {
      const dx = centerX - node.x;
      const dy = centerY - node.y;
      node.vx += dx * 0.001;
      node.vy += dy * 0.001;
      
      // 阻尼
      node.vx *= 0.9;
      node.vy *= 0.9;
      
      // 更新位置
      node.x += node.vx;
      node.y += node.vy;
      
      // 边界约束
      const padding = 30;
      node.x = Math.max(padding, Math.min(width - padding, node.x));
      node.y = Math.max(padding, Math.min(height - padding, node.y));
    }
  }, [data.links, width, height]);
  
  // 更新脉冲
  const updatePulses = useCallback(() => {
    const pulses = pulsesRef.current;
    
    for (const pulse of pulses) {
      pulse.progress += pulse.speed * 0.02;
      
      if (pulse.progress > 1) {
        pulse.progress = 0;
      }
    }
  }, []);
  
  // 绘制
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const nodes = nodesRef.current;
    const links = data.links;
    const pulses = pulsesRef.current;
    
    // 清空画布
    ctx.clearRect(0, 0, width, height);
    
    // 绘制背景渐变
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.max(width, height) / 2
    );
    gradient.addColorStop(0, 'rgba(139, 92, 246, 0.05)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // 绘制连接线
    for (const link of links) {
      const source = nodes.find(n => n.id === link.source);
      const target = nodes.find(n => n.id === link.target);
      
      if (source && target) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = LINK_COLORS[link.type];
        ctx.lineWidth = link.strength * 3;
        ctx.stroke();
      }
    }
    
    // 绘制脉冲
    for (const pulse of pulses) {
      const source = nodes.find(n => n.id === pulse.sourceId);
      const target = nodes.find(n => n.id === pulse.targetId);
      
      if (source && target) {
        const x = source.x + (target.x - source.x) * pulse.progress;
        const y = source.y + (target.y - source.y) * pulse.progress;
        
        ctx.beginPath();
        ctx.arc(x, y, 4 + pulse.intensity * 4, 0, Math.PI * 2);
        ctx.fillStyle = pulse.color;
        ctx.fill();
        
        // 光晕效果
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, 15);
        glowGradient.addColorStop(0, pulse.color);
        glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // 绘制节点
    for (const node of nodes) {
      const color = NODE_COLORS[node.type];
      const radius = node.radius * (0.8 + node.activation * 0.4);
      
      // 光晕
      const glowGradient = ctx.createRadialGradient(
        node.x, node.y, 0,
        node.x, node.y, radius * 2
      );
      glowGradient.addColorStop(0, color + '40');
      glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius * 2, 0, Math.PI * 2);
      ctx.fill();
      
      // 节点主体
      const nodeGradient = ctx.createRadialGradient(
        node.x - radius * 0.3, node.y - radius * 0.3, 0,
        node.x, node.y, radius
      );
      nodeGradient.addColorStop(0, color);
      nodeGradient.addColorStop(1, color + '80');
      
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = nodeGradient;
      ctx.fill();
      
      // 边框
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // 激活指示器
      if (node.activation > 0.5) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 5, 0, Math.PI * 2 * node.activation);
        ctx.strokeStyle = color + '80';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      // 标签
      if (showLabels && node.label) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const label = node.label.length > 8 
          ? node.label.slice(0, 8) + '...' 
          : node.label;
        ctx.fillText(label, node.x, node.y + radius + 12);
      }
    }
  }, [data.links, width, height, showLabels]);
  
  // 动画循环
  useEffect(() => {
    initializeNodes();
    
    const animate = () => {
      if (animated) {
        applyForces();
        updatePulses();
      }
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [animated, initializeNodes, applyForces, updatePulses, draw]);
  
  // 点击处理
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !onNodeClick) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    for (const node of nodesRef.current) {
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      if (distance <= node.radius) {
        onNodeClick(node);
        break;
      }
    }
  };
  
  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleClick}
      className="rounded-lg bg-background/50"
      style={{ cursor: onNodeClick ? 'pointer' : 'default' }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────
// 意识流可视化组件
// ─────────────────────────────────────────────────────────────────────

export interface ConsciousnessFlowProps {
  streams: Array<{
    type: 'awareness' | 'goal_tracking' | 'self_observation' | 'environmental' | 'latent_intention';
    content: string;
    intensity: number;
  }>;
  width?: number;
  height?: number;
}

export function ConsciousnessFlow({
  streams,
  width = 400,
  height = 200,
}: ConsciousnessFlowProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const animate = () => {
      timeRef.current += 0.02;
      
      // 清空
      ctx.clearRect(0, 0, width, height);
      
      // 绘制流动背景
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, 'rgba(139, 92, 246, 0.1)');
      gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.1)');
      gradient.addColorStop(1, 'rgba(139, 92, 246, 0.1)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      // 绘制波形
      for (let i = 0; i < streams.length; i++) {
        const stream = streams[i];
        const yOffset = (height / (streams.length + 1)) * (i + 1);
        const amplitude = stream.intensity * 20;
        
        ctx.beginPath();
        ctx.moveTo(0, yOffset);
        
        for (let x = 0; x <= width; x += 2) {
          const y = yOffset + 
            Math.sin((x * 0.02) + timeRef.current + i) * amplitude +
            Math.sin((x * 0.01) + timeRef.current * 0.5) * amplitude * 0.5;
          ctx.lineTo(x, y);
        }
        
        const colors: Record<string, string> = {
          awareness: 'rgba(139, 92, 246, 0.6)',
          goal_tracking: 'rgba(16, 185, 129, 0.6)',
          self_observation: 'rgba(59, 130, 246, 0.6)',
          environmental: 'rgba(245, 158, 11, 0.6)',
          latent_intention: 'rgba(236, 72, 153, 0.6)',
        };
        
        ctx.strokeStyle = colors[stream.type] || 'rgba(139, 92, 246, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [streams, width, height]);
  
  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded-lg"
    />
  );
}

// ─────────────────────────────────────────────────────────────────────
// 概念图谱组件
// ─────────────────────────────────────────────────────────────────────

export interface ConceptNode {
  id: string;
  label: string;
  category: string;
  connections: number;
}

export interface ConceptGraphProps {
  concepts: ConceptNode[];
  width?: number;
  height?: number;
  highlightConcept?: string;
}

export function ConceptGraph({
  concepts,
  width = 300,
  height = 300,
  highlightConcept,
}: ConceptGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  
  // 简单的圆形布局
  const layoutConcepts = () => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;
    
    return concepts.map((concept, index) => {
      const angle = (index / concepts.length) * Math.PI * 2 - Math.PI / 2;
      return {
        ...concept,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      };
    });
  };
  
  const positionedConcepts = layoutConcepts();
  
  // 类别颜色
  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      '认知': '#3b82f6',
      '情感': '#ec4899',
      '价值': '#10b981',
      '记忆': '#f59e0b',
      '概念': '#8b5cf6',
    };
    return colors[category] || '#6b7280';
  };
  
  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="rounded-lg"
    >
      {/* 连接线到中心 */}
      {positionedConcepts.map((concept) => (
        <line
          key={`line-${concept.id}`}
          x1={width / 2}
          y1={height / 2}
          x2={concept.x}
          y2={concept.y}
          stroke={getCategoryColor(concept.category)}
          strokeWidth={Math.max(1, concept.connections * 0.5)}
          strokeOpacity={0.3}
        />
      ))}
      
      {/* 中心节点 */}
      <circle
        cx={width / 2}
        cy={height / 2}
        r={15}
        fill="url(#centerGradient)"
        stroke="#8b5cf6"
        strokeWidth={2}
      />
      
      {/* 概念节点 */}
      {positionedConcepts.map((concept) => {
        const isHighlighted = highlightConcept === concept.id;
        const color = getCategoryColor(concept.category);
        const nodeRadius = 8 + concept.connections * 2;
        
        return (
          <g key={concept.id}>
            {/* 节点光晕 */}
            {isHighlighted && (
              <circle
                cx={concept.x}
                cy={concept.y}
                r={nodeRadius + 8}
                fill={color}
                fillOpacity={0.2}
                className="animate-pulse"
              />
            )}
            
            {/* 节点 */}
            <circle
              cx={concept.x}
              cy={concept.y}
              r={nodeRadius}
              fill={color}
              stroke={isHighlighted ? '#ffffff' : color}
              strokeWidth={isHighlighted ? 2 : 1}
              fillOpacity={isHighlighted ? 1 : 0.8}
            />
            
            {/* 标签 */}
            <text
              x={concept.x}
              y={concept.y + nodeRadius + 12}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="10"
              fontWeight={isHighlighted ? 'bold' : 'normal'}
            >
              {concept.label.length > 6 ? concept.label.slice(0, 6) + '..' : concept.label}
            </text>
          </g>
        );
      })}
      
      {/* 渐变定义 */}
      <defs>
        <radialGradient id="centerGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#3b82f6" />
        </radialGradient>
      </defs>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 认知负荷可视化
// ─────────────────────────────────────────────────────────────────────

export interface CognitiveLoadVisualProps {
  intrinsic: number;
  extraneous: number;
  germane: number;
  threshold: number;
  width?: number;
  height?: number;
}

export function CognitiveLoadVisual({
  intrinsic,
  extraneous,
  germane,
  threshold,
  width = 300,
  height = 150,
}: CognitiveLoadVisualProps) {
  const total = intrinsic + extraneous + germane;
  const isOverloaded = total > threshold;
  
  return (
    <div 
      className="relative rounded-lg overflow-hidden"
      style={{ width, height }}
    >
      {/* 背景 */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-blue-900/20" />
      
      {/* 负荷条 */}
      <div className="absolute bottom-0 left-0 right-0 h-4 flex">
        <div 
          className="bg-blue-500/60 transition-all duration-500"
          style={{ width: `${(intrinsic / threshold) * 100}%` }}
        />
        <div 
          className="bg-amber-500/60 transition-all duration-500"
          style={{ width: `${(extraneous / threshold) * 100}%` }}
        />
        <div 
          className="bg-green-500/60 transition-all duration-500"
          style={{ width: `${(germane / threshold) * 100}%` }}
        />
      </div>
      
      {/* 阈值线 */}
      <div 
        className="absolute bottom-4 w-0.5 bg-red-500"
        style={{ left: `${threshold * 100}%`, height: '100%' }}
      >
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs text-red-400">
          阈值
        </span>
      </div>
      
      {/* 总负荷指示 */}
      <div className="absolute top-2 right-2 text-xs">
        <span className={isOverloaded ? 'text-red-400' : 'text-green-400'}>
          {isOverloaded ? '⚠️ 过载' : '✅ 正常'}
        </span>
      </div>
      
      {/* 图例 */}
      <div className="absolute top-2 left-2 flex gap-2 text-xs">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded bg-blue-500" />
          内在
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded bg-amber-500" />
          外在
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded bg-green-500" />
          相关
        </span>
      </div>
    </div>
  );
}

export default NeuralNetworkVisualization;
