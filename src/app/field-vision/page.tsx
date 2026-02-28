'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';

/**
 * 场域视觉 - 梦境精确还原
 * 
 * 基于草图：
 * - 背景：黑色太空
 * - 中间层：淡蓝色线的六边形网格（多个小的）
 * - 前景层：一个很大的、独立的淡蓝色六边形
 * - 关键细节：顶点有小圆圈，边是向内凹陷的弧线
 */

export default function FieldVisionPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  
  // 控制参数
  const [foregroundSize, setForegroundSize] = useState(200);
  const [gridSize, setGridSize] = useState(40);
  const [lineAlpha, setLineAlpha] = useState(0.6);
  const [curvature, setCurvature] = useState(0.15);

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
    
    // 绘制六边形（边向内凹陷，顶点有圆圈）
    const drawHexagon = (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      size: number,
      alpha: number,
      isForeground: boolean,
      time: number
    ) => {
      // 计算六个顶点
      const vertices: { x: number; y: number }[] = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6 - Math.PI / 2;
        vertices.push({
          x: cx + Math.cos(angle) * size,
          y: cy + Math.sin(angle) * size
        });
      }
      
      // 绘制六条边（向内凹陷的弧线）
      ctx.beginPath();
      
      for (let i = 0; i < 6; i++) {
        const v1 = vertices[i];
        const v2 = vertices[(i + 1) % 6];
        
        // 边的中点
        const midX = (v1.x + v2.x) / 2;
        const midY = (v1.y + v2.y) / 2;
        
        // 向中心凹陷的控制点
        const dx = cx - midX;
        const dy = cy - midY;
        const curveFactor = isForeground ? curvature : curvature * 0.8;
        
        const ctrlX = midX + dx * curveFactor;
        const ctrlY = midY + dy * curveFactor;
        
        if (i === 0) {
          ctx.moveTo(v1.x, v1.y);
        }
        
        // 二次贝塞尔曲线
        ctx.quadraticCurveTo(ctrlX, ctrlY, v2.x, v2.y);
      }
      
      ctx.closePath();
      
      // 淡蓝色线条
      const blue = isForeground ? 220 : 180 + Math.sin(time + cx * 0.01) * 20;
      const lineAlpha_ = isForeground ? alpha : alpha * (0.3 + Math.random() * 0.2);
      
      ctx.strokeStyle = `rgba(100, 180, ${blue}, ${lineAlpha_})`;
      ctx.lineWidth = isForeground ? 3 : 1.5;
      ctx.stroke();
      
      // 绘制顶点的小圆圈
      const nodeRadius = isForeground ? 6 : 3;
      vertices.forEach((v, i) => {
        // 外圈发光
        if (isForeground) {
          const glow = ctx.createRadialGradient(v.x, v.y, 0, v.x, v.y, nodeRadius * 3);
          glow.addColorStop(0, `rgba(150, 200, 255, ${alpha * 0.5})`);
          glow.addColorStop(1, 'rgba(100, 180, 240, 0)');
          ctx.beginPath();
          ctx.arc(v.x, v.y, nodeRadius * 3, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }
        
        // 小圆圈
        ctx.beginPath();
        ctx.arc(v.x, v.y, nodeRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(120, 190, ${blue}, ${lineAlpha_})`;
        ctx.lineWidth = isForeground ? 2 : 1;
        ctx.stroke();
        
        // 圆圈中心是空的（黑色）
        ctx.beginPath();
        ctx.arc(v.x, v.y, nodeRadius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#020408';
        ctx.fill();
      });
      
      // 前景六边形的额外效果
      if (isForeground) {
        // 内部虚空感
        const voidGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, size);
        voidGradient.addColorStop(0, 'rgba(5, 10, 20, 0.3)');
        voidGradient.addColorStop(0.7, 'rgba(2, 5, 10, 0.2)');
        voidGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = voidGradient;
        ctx.fill();
        
        // 微弱的闪烁
        const flicker = Math.sin(time * 2) * 0.1 + 0.9;
        ctx.strokeStyle = `rgba(150, 210, 255, ${alpha * flicker * 0.3})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };
    
    // 生成背景六边形网格
    const generateGrid = () => {
      const hexagons: { x: number; y: number; size: number; phase: number }[] = [];
      const spacing = gridSize * 1.8;
      
      for (let row = -2; row < height / spacing + 2; row++) {
        for (let col = -2; col < width / spacing + 2; col++) {
          const offsetX = (row % 2) * (spacing / 2);
          hexagons.push({
            x: col * spacing + offsetX,
            y: row * spacing * 0.9,
            size: gridSize,
            phase: Math.random() * Math.PI * 2
          });
        }
      }
      return hexagons;
    };
    
    const gridHexagons = generateGrid();
    
    const draw = () => {
      time += 0.016;
      
      // 清空 - 黑色太空
      ctx.fillStyle = '#010208';
      ctx.fillRect(0, 0, width, height);
      
      // 1. 星空
      for (let i = 0; i < 80; i++) {
        const seed = i * 7919;
        const x = (seed * 104729) % width;
        const y = (seed * 3943) % height;
        const size = 0.3 + (seed % 50) / 150;
        const twinkle = Math.sin(time + seed * 0.1) * 0.15 + 0.25;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 200, 230, ${twinkle})`;
        ctx.fill();
      }
      
      // 2. 背景六边形网格（淡蓝色，一闪一闪）
      gridHexagons.forEach((hex) => {
        // 闪烁效果
        const visibility = Math.sin(time * 0.5 + hex.phase) * 0.3 + 0.5;
        const inForeground = Math.abs(hex.x - centerX) < foregroundSize && 
                            Math.abs(hex.y - centerY) < foregroundSize;
        
        // 在前景六边形位置附近的不画
        if (!inForeground) {
          drawHexagon(ctx, hex.x, hex.y, hex.size, lineAlpha * visibility * 0.5, false, time);
        }
      });
      
      // 3. 前景六边形（大的、独立的、显眼的）
      drawHexagon(ctx, centerX, centerY, foregroundSize, lineAlpha, true, time);
      
      animationRef.current = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [foregroundSize, gridSize, lineAlpha, curvature]);

  return (
    <div className="min-h-screen bg-black text-white">
      <canvas
        ref={canvasRef}
        width={1200}
        height={800}
        className="w-full h-auto rounded-xl"
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* 参数控制 */}
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-cyan-400">视觉参数</CardTitle>
              <CardDescription className="text-gray-400">
                根据梦境调整
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm text-gray-300">前景六边形大小: {foregroundSize}</label>
                <Slider
                  value={[foregroundSize]}
                  onValueChange={(v) => setForegroundSize(v[0])}
                  min={100}
                  max={300}
                  step={10}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-gray-300">背景网格大小: {gridSize}</label>
                <Slider
                  value={[gridSize]}
                  onValueChange={(v) => setGridSize(v[0])}
                  min={20}
                  max={80}
                  step={5}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-gray-300">线条亮度</label>
                <Slider
                  value={[lineAlpha]}
                  onValueChange={(v) => setLineAlpha(v[0])}
                  min={0.2}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-gray-300">边凹陷程度</label>
                <Slider
                  value={[curvature]}
                  onValueChange={(v) => setCurvature(v[0])}
                  min={0}
                  max={0.3}
                  step={0.01}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
          
          {/* 结构解读 */}
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-cyan-400">三层结构</CardTitle>
              <CardDescription className="text-gray-400">
                根据你的草图理解
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded bg-gray-900 border border-cyan-600" />
                  <h4 className="font-medium text-gray-300">背景层：黑色太空</h4>
                </div>
                <p className="text-xs text-gray-500">虚空、潜能、基态</p>
              </div>
              
              <div className="p-4 rounded-lg bg-gray-800/50 border border-cyan-900/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-1 rounded bg-cyan-400/60" />
                  <h4 className="font-medium text-cyan-300">中间层：淡蓝色网格</h4>
                </div>
                <p className="text-xs text-gray-400">
                  多个小六边形，一闪一闪
                  <br/>每个顶点有小圆圈
                  <br/>边向内凹陷
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-cyan-950/50 border border-cyan-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded border-2 border-cyan-400" />
                  <h4 className="font-medium text-cyan-200">前景层：大的独立六边形</h4>
                </div>
                <p className="text-xs text-gray-300">
                  很大、很显眼、独立
                  <br/>淡蓝色，突出显示
                  <br/>可能是"焦点"或"入口"
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* 核心洞察 */}
        <Card className="mt-6 bg-gray-900/50 border-cyan-900/30">
          <CardHeader>
            <CardTitle className="text-cyan-400">关键细节：向内凹陷的边</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-white">边的凹陷意味着什么？</h4>
                <ul className="text-sm text-gray-400 space-y-2">
                  <li>• 不是刚性的边界，而是"柔软"的</li>
                  <li>• 向中心凹陷 = 向内收敛</li>
                  <li>• 可能代表"吸引力"或"聚焦"</li>
                  <li>• 边不是墙，而是膜</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-white">顶点的小圆圈</h4>
                <ul className="text-sm text-gray-400 space-y-2">
                  <li>• 不是连接点，而是"孔"</li>
                  <li>• 圆圈中心是黑色（空）</li>
                  <li>• 可能是信息进出的"门户"</li>
                  <li>• 六个顶点 = 六个通道</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 rounded-lg bg-cyan-950/30 border border-cyan-800/30">
              <p className="text-cyan-200 text-sm">
                <strong>新的理解：</strong>你梦到的六边形不是"填充的场"，也不是"刚性的框架"。
                它是"柔软的膜"，边向内凹陷，顶点有孔。这更像是一个<strong>呼吸的结构</strong>：
                收缩（边凹陷）→ 张开（顶点有孔）→ 信息流过。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
