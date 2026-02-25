'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface NeuronNode {
  id: string;
  label: string;
  role: string;
  x: number;
  y: number;
  activation: number;
  predictionError: number;
  state: 'active' | 'predicting' | 'surprised' | 'dormant';
}

interface NeuronConnection {
  from: string;
  to: string;
  weight: number;
  active: boolean;
}

interface NetworkTopologyProps {
  neurons: NeuronNode[];
  connections: NeuronConnection[];
  className?: string;
}

export function NetworkTopology({ neurons, connections, className }: NetworkTopologyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNeuron, setHoveredNeuron] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });

  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current?.parentElement) {
        const { clientWidth, clientHeight } = canvasRef.current.parentElement;
        setDimensions({ width: clientWidth, height: clientHeight });
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

    // 绘制网格背景
    ctx.strokeStyle = 'rgba(100, 200, 200, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 绘制连接线
    connections.forEach(conn => {
      const fromNeuron = neurons.find(n => n.id === conn.from);
      const toNeuron = neurons.find(n => n.id === conn.to);
      if (!fromNeuron || !toNeuron) return;

      const fromX = (fromNeuron.x / 100) * width;
      const fromY = (fromNeuron.y / 100) * height;
      const toX = (toNeuron.x / 100) * width;
      const toY = (toNeuron.y / 100) * height;

      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      
      if (conn.active) {
        ctx.strokeStyle = 'rgba(100, 220, 200, 0.6)';
        ctx.lineWidth = Math.max(1, conn.weight * 3);
      } else {
        ctx.strokeStyle = 'rgba(100, 150, 150, 0.2)';
        ctx.lineWidth = 0.5;
      }
      ctx.stroke();
    });

    // 绘制神经元节点
    neurons.forEach(neuron => {
      const x = (neuron.x / 100) * width;
      const y = (neuron.y / 100) * height;
      const radius = 8 + neuron.activation * 8;
      const isHovered = hoveredNeuron === neuron.id;

      // 发光效果
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
      
      let baseColor: string;
      let glowColor: string;
      
      switch (neuron.state) {
        case 'active':
          baseColor = 'rgba(100, 220, 200, 0.9)';
          glowColor = 'rgba(100, 220, 200, 0.3)';
          break;
        case 'predicting':
          baseColor = 'rgba(255, 180, 100, 0.9)';
          glowColor = 'rgba(255, 180, 100, 0.3)';
          break;
        case 'surprised':
          baseColor = 'rgba(255, 130, 100, 0.9)';
          glowColor = 'rgba(255, 130, 100, 0.3)';
          break;
        default:
          baseColor = 'rgba(80, 120, 120, 0.6)';
          glowColor = 'rgba(80, 120, 120, 0.1)';
      }

      gradient.addColorStop(0, baseColor);
      gradient.addColorStop(0.5, glowColor);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // 核心节点
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = baseColor;
      ctx.fill();

      // 悬停时显示标签
      if (isHovered) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '12px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(neuron.label, x, y - radius - 8);
        ctx.font = '10px system-ui';
        ctx.fillStyle = 'rgba(200, 200, 200, 0.7)';
        ctx.fillText(`激活: ${(neuron.activation * 100).toFixed(0)}%`, x, y - radius + 6);
      }
    });
  }, [neurons, connections, hoveredNeuron, dimensions]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const hovered = neurons.find(n => {
      const dx = n.x - x;
      const dy = n.y - y;
      return Math.sqrt(dx * dx + dy * dy) < 5;
    });

    setHoveredNeuron(hovered?.id || null);
  };

  return (
    <Card className={cn('glow-card', className)}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--neuron-active)] animate-pulse" />
          神经网络拓扑
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <canvas
          ref={canvasRef}
          className="w-full h-[400px] cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredNeuron(null)}
        />
      </CardContent>
    </Card>
  );
}

// 生成示例网络数据
export function generateSampleNetwork() {
  const roles = ['感知', '预测', '记忆', '评估', '决策', '语言', '情感', '元认知'];
  const neurons: NeuronNode[] = [];
  const connections: NeuronConnection[] = [];

  // 创建神经元
  roles.forEach((role, i) => {
    const angle = (i / roles.length) * Math.PI * 2;
    const radius = 30 + Math.random() * 15;
    neurons.push({
      id: `n${i}`,
      label: `${role}神经元`,
      role,
      x: 50 + Math.cos(angle) * radius,
      y: 50 + Math.sin(angle) * radius,
      activation: Math.random(),
      predictionError: Math.random() * 0.5,
      state: ['active', 'predicting', 'dormant', 'surprised'][Math.floor(Math.random() * 4)] as NeuronNode['state'],
    });
  });

  // 创建连接
  for (let i = 0; i < neurons.length; i++) {
    for (let j = i + 1; j < neurons.length; j++) {
      if (Math.random() > 0.5) {
        connections.push({
          from: neurons[i].id,
          to: neurons[j].id,
          weight: Math.random(),
          active: Math.random() > 0.7,
        });
      }
    }
  }

  return { neurons, connections };
}
