'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';

/**
 * 场域视觉 - 梦境可视化
 * 
 * 基于梦境描述：
 * - 黑色太空背景（虚空）
 * - 浅蓝色六边形场
 * - 透明圆柱边界
 * - 多个六边形镶嵌在太空中
 */

interface HexField {
  x: number;
  y: number;
  z: number;  // 深度
  size: number;
  rotation: number;
  pulsePhase: number;
  glowIntensity: number;
}

export default function FieldVisionPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [fields, setFields] = useState<HexField[]>([]);
  
  // 控制参数
  const [fieldCount, setFieldCount] = useState(7);
  const [pulseSpeed, setPulseSpeed] = useState(0.5);
  const [glowIntensity, setGlowIntensity] = useState(0.8);
  const [showBoundaries, setShowBoundaries] = useState(true);
  const [showConnections, setShowConnections] = useState(true);

  // 生成六边形场
  useEffect(() => {
    const generateFields = () => {
      const newFields: HexField[] = [];
      const centerX = 0;
      const centerY = 0;
      
      // 中心场
      newFields.push({
        x: centerX,
        y: centerY,
        z: 0,
        size: 120,
        rotation: 0,
        pulsePhase: 0,
        glowIntensity: 1
      });
      
      // 环绕场（六边形镶嵌）
      const ringRadius = 200;
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6;
        newFields.push({
          x: centerX + Math.cos(angle) * ringRadius,
          y: centerY + Math.sin(angle) * ringRadius,
          z: Math.random() * 50 - 25,
          size: 100 + Math.random() * 20,
          rotation: angle,
          pulsePhase: (i * Math.PI) / 3,
          glowIntensity: 0.6 + Math.random() * 0.4
        });
      }
      
      setFields(newFields);
    };
    
    generateFields();
  }, [fieldCount]);

  // 绘制函数
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    let time = 0;
    
    const draw = () => {
      time += 0.016;
      
      // 清空画布 - 黑色太空
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
      
      // 绘制星空背景
      drawStarfield(ctx, width, height, time);
      
      // 按深度排序（远的先画）
      const sortedFields = [...fields].sort((a, b) => a.z - b.z);
      
      // 绘制场之间的连接
      if (showConnections) {
        drawFieldConnections(ctx, sortedFields, centerX, centerY, time);
      }
      
      // 绘制每个六边形场
      sortedFields.forEach((field, index) => {
        drawHexField(ctx, field, centerX, centerY, time, index);
      });
      
      animationRef.current = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [fields, glowIntensity, showBoundaries, showConnections, pulseSpeed]);

  // 绘制星空背景
  const drawStarfield = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    // 使用固定种子生成星星
    const starCount = 200;
    for (let i = 0; i < starCount; i++) {
      const seed = i * 9973;
      const x = (seed * 7919) % width;
      const y = (seed * 104729) % height;
      const size = 0.5 + (seed % 100) / 100;
      const twinkle = Math.sin(time * 2 + seed) * 0.3 + 0.7;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * twinkle})`;
      ctx.fill();
    }
    
    // 深空渐变
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.max(width, height) / 2
    );
    gradient.addColorStop(0, 'rgba(10, 20, 40, 0.3)');
    gradient.addColorStop(0.5, 'rgba(5, 10, 20, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  };

  // 绘制场之间的连接
  const drawFieldConnections = (ctx: CanvasRenderingContext2D, sortedFields: HexField[], centerX: number, centerY: number, time: number) => {
    const centerField = sortedFields[0];
    if (!centerField) return;
    
    sortedFields.slice(1).forEach((field) => {
      const x1 = centerX + centerField.x;
      const y1 = centerY + centerField.y;
      const x2 = centerX + field.x;
      const y2 = centerY + field.y;
      
      // 能量流动效果
      const flowProgress = (time * pulseSpeed + field.pulsePhase) % 1;
      
      // 绘制连接线
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = 'rgba(100, 180, 255, 0.1)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // 绘制能量脉冲
      const pulseX = x1 + (x2 - x1) * flowProgress;
      const pulseY = y1 + (y2 - y1) * flowProgress;
      
      const pulseGradient = ctx.createRadialGradient(pulseX, pulseY, 0, pulseX, pulseY, 15);
      pulseGradient.addColorStop(0, 'rgba(100, 200, 255, 0.8)');
      pulseGradient.addColorStop(0.5, 'rgba(100, 180, 255, 0.3)');
      pulseGradient.addColorStop(1, 'rgba(100, 180, 255, 0)');
      
      ctx.beginPath();
      ctx.arc(pulseX, pulseY, 15, 0, Math.PI * 2);
      ctx.fillStyle = pulseGradient;
      ctx.fill();
    });
  };

  // 绘制六边形场
  const drawHexField = (ctx: CanvasRenderingContext2D, field: HexField, centerX: number, centerY: number, time: number, index: number) => {
    const x = centerX + field.x;
    const y = centerY + field.y;
    const size = field.size * (1 - field.z / 200); // 透视缩放
    
    // 脉动效果
    const pulse = Math.sin(time * pulseSpeed + field.pulsePhase) * 0.1 + 1;
    const currentSize = size * pulse;
    
    // 六边形的六个顶点
    const vertices = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6 + field.rotation + Math.PI / 6;
      vertices.push({
        x: x + Math.cos(angle) * currentSize,
        y: y + Math.sin(angle) * currentSize
      });
    }
    
    // 1. 绘制场的发光效果
    const fieldGlow = ctx.createRadialGradient(x, y, 0, x, y, currentSize * 1.5);
    const baseIntensity = glowIntensity * field.glowIntensity;
    fieldGlow.addColorStop(0, `rgba(100, 180, 255, ${0.3 * baseIntensity})`);
    fieldGlow.addColorStop(0.5, `rgba(80, 150, 220, ${0.15 * baseIntensity})`);
    fieldGlow.addColorStop(1, 'rgba(60, 120, 200, 0)');
    
    ctx.beginPath();
    ctx.arc(x, y, currentSize * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = fieldGlow;
    ctx.fill();
    
    // 2. 绘制场内部（浅蓝色半透明）
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < 6; i++) {
      ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    ctx.closePath();
    
    // 浅蓝色填充
    const innerGradient = ctx.createRadialGradient(x, y, 0, x, y, currentSize);
    innerGradient.addColorStop(0, `rgba(150, 220, 255, ${0.4 * baseIntensity})`);
    innerGradient.addColorStop(0.7, `rgba(100, 180, 230, ${0.25 * baseIntensity})`);
    innerGradient.addColorStop(1, `rgba(70, 140, 200, ${0.15 * baseIntensity})`);
    ctx.fillStyle = innerGradient;
    ctx.fill();
    
    // 3. 绘制边界（透明圆柱）
    if (showBoundaries) {
      // 绘制六条边
      for (let i = 0; i < 6; i++) {
        const v1 = vertices[i];
        const v2 = vertices[(i + 1) % 6];
        
        // 圆柱效果 - 渐变
        const edgeGradient = ctx.createLinearGradient(v1.x, v1.y, v2.x, v2.y);
        const edgePulse = Math.sin(time * 2 + i) * 0.2 + 0.8;
        edgeGradient.addColorStop(0, `rgba(150, 200, 255, ${0.6 * edgePulse})`);
        edgeGradient.addColorStop(0.5, `rgba(200, 230, 255, ${0.8 * edgePulse})`);
        edgeGradient.addColorStop(1, `rgba(150, 200, 255, ${0.6 * edgePulse})`);
        
        // 绘制圆柱边（有厚度）
        ctx.beginPath();
        ctx.moveTo(v1.x, v1.y);
        ctx.lineTo(v2.x, v2.y);
        ctx.strokeStyle = edgeGradient;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        // 高光
        ctx.beginPath();
        ctx.moveTo(v1.x, v1.y);
        ctx.lineTo(v2.x, v2.y);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 * edgePulse})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      
      // 绘制顶点（黑色圆）
      vertices.forEach((v, i) => {
        // 外圈发光
        const nodeGlow = ctx.createRadialGradient(v.x, v.y, 0, v.x, v.y, 12);
        nodeGlow.addColorStop(0, 'rgba(100, 180, 255, 0.5)');
        nodeGlow.addColorStop(1, 'rgba(100, 180, 255, 0)');
        ctx.beginPath();
        ctx.arc(v.x, v.y, 12, 0, Math.PI * 2);
        ctx.fillStyle = nodeGlow;
        ctx.fill();
        
        // 黑色圆心
        ctx.beginPath();
        ctx.arc(v.x, v.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#0a0a0a';
        ctx.fill();
        
        // 边缘光
        ctx.beginPath();
        ctx.arc(v.x, v.y, 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(150, 200, 255, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    }
    
    // 4. 中心标记（仅中心场）
    if (index === 0) {
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(150, 220, 255, 0.8)';
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#0a0a0a';
      ctx.fill();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* 画布 */}
      <canvas
        ref={canvasRef}
        width={1200}
        height={800}
        className="w-full h-auto rounded-xl"
      />
      
      {/* 控制面板 */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* 左侧：参数控制 */}
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-cyan-400">场域参数</CardTitle>
              <CardDescription className="text-gray-400">
                调整可视化参数，探索场的特性
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm text-gray-300">脉动速度</label>
                <Slider
                  value={[pulseSpeed]}
                  onValueChange={(v) => setPulseSpeed(v[0])}
                  min={0.1}
                  max={2}
                  step={0.1}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-gray-300">发光强度</label>
                <Slider
                  value={[glowIntensity]}
                  onValueChange={(v) => setGlowIntensity(v[0])}
                  min={0.2}
                  max={1.5}
                  step={0.1}
                  className="w-full"
                />
              </div>
              
              <div className="flex gap-4">
                <Button
                  variant={showBoundaries ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowBoundaries(!showBoundaries)}
                  className="flex-1"
                >
                  {showBoundaries ? '隐藏边界' : '显示边界'}
                </Button>
                <Button
                  variant={showConnections ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowConnections(!showConnections)}
                  className="flex-1"
                >
                  {showConnections ? '隐藏连接' : '显示连接'}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* 右侧：梦境解读 */}
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-cyan-400">梦境结构</CardTitle>
              <CardDescription className="text-gray-400">
                图像元素与科学理论的对应
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-black border border-cyan-500/50" />
                  <span className="text-sm font-medium">黑色太空</span>
                  <Badge variant="outline" className="text-xs">虚空/潜能</Badge>
                </div>
                <p className="text-xs text-gray-400 pl-6">
                  类似量子真空，不是"空"而是"未激发"的基态
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-cyan-400/60" />
                  <span className="text-sm font-medium">浅蓝色场</span>
                  <Badge variant="outline" className="text-xs">能量区域</Badge>
                </div>
                <p className="text-xs text-gray-400 pl-6">
                  信息存在于"场"中，而非节点中。类似大脑网格细胞
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 border-cyan-300/80 bg-transparent" />
                  <span className="text-sm font-medium">透明圆柱边</span>
                  <Badge variant="outline" className="text-xs">边界/膜</Badge>
                </div>
                <p className="text-xs text-gray-400 pl-6">
                  定义场的形状，可能是半透膜，信息可穿透但被塑造
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-900 border border-cyan-400" />
                  <span className="text-sm font-medium">黑色节点</span>
                  <Badge variant="outline" className="text-xs">交汇点</Badge>
                </div>
                <p className="text-xs text-gray-400 pl-6">
                  边界的交汇处，不是处理器，而是空间的"枢纽"
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* 科学对应 */}
        <Card className="mt-6 bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-cyan-400">科学理论的呼应</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                <h4 className="font-medium text-cyan-300 mb-2">网格细胞 (2014 Nobel)</h4>
                <p className="text-xs text-gray-400">
                  大脑内嗅皮层的神经元呈现六边形激活模式，
                  构成空间导航的"坐标系"。六边形是最优的空间编码方式。
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                <h4 className="font-medium text-cyan-300 mb-2">时空泡沫 (Wheeler)</h4>
                <p className="text-xs text-gray-400">
                  在普朗克尺度下，时空不是光滑的，而是像泡沫一样涨落。
                  虚空不空，充满量子涨落。
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                <h4 className="font-medium text-cyan-300 mb-2">全息原理</h4>
                <p className="text-xs text-gray-400">
                  信息存储在边界上，内部是边界的"投影"。
                  边界比内部更基础，信息编码在事件视界。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
