'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';

/**
 * 场域视觉 - 梦境可视化 v2
 * 
 * 基于梦境详细描述：
 * - 六边形内部是黑色（虚空），不是蓝色
 * - 六条圆筒边是淡蓝色，会闪烁变淡
 * - 变淡后能看到边交接处的黑线
 * - 整个六边体在太空微微倾斜
 * - 六边体是单独的
 * - 背景有小的六边形网格，一会出现一会消失
 */

export default function FieldVisionPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  
  // 控制参数
  const [tiltAngle, setTiltAngle] = useState(15);
  const [flickerSpeed, setFlickerSpeed] = useState(0.8);
  const [edgeThickness, setEdgeThickness] = useState(12);
  const [backgroundGridDensity, setBackgroundGridDensity] = useState(0.6);

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
    
    // 生成背景小六边形网格
    const generateBackgroundHexagons = () => {
      const hexagons: { x: number; y: number; size: number; phase: number; duration: number }[] = [];
      const gridSize = 60;
      
      for (let x = 0; x < width + gridSize; x += gridSize) {
        for (let y = 0; y < height + gridSize; y += gridSize) {
          // 错开排列
          const offsetX = (Math.floor(y / gridSize) % 2) * (gridSize / 2);
          if (Math.random() > 0.7) {
            hexagons.push({
              x: x + offsetX,
              y: y,
              size: 15 + Math.random() * 15,
              phase: Math.random() * Math.PI * 2,
              duration: 2 + Math.random() * 3
            });
          }
        }
      }
      return hexagons;
    };
    
    const backgroundHexagons = generateBackgroundHexagons();
    
    const draw = () => {
      time += 0.016;
      
      // 清空画布 - 深黑色太空
      ctx.fillStyle = '#020408';
      ctx.fillRect(0, 0, width, height);
      
      // 1. 绘制背景小六边形网格（一闪一闪）
      backgroundHexagons.forEach((hex) => {
        const visibilityCycle = Math.sin(time / hex.duration + hex.phase);
        const visibility = visibilityCycle > 0.7 ? (visibilityCycle - 0.7) / 0.3 : 0;
        
        if (visibility > 0 && Math.random() < backgroundGridDensity) {
          drawSmallHexagon(ctx, hex.x, hex.y, hex.size, visibility * 0.3);
        }
      });
      
      // 2. 绘制星空
      drawStarfield(ctx, width, height, time);
      
      // 3. 绘制主体六边体
      drawMainHexagon(ctx, centerX, centerY, time);
      
      animationRef.current = requestAnimationFrame(draw);
    };
    
    const drawStarfield = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
      const starCount = 150;
      for (let i = 0; i < starCount; i++) {
        const seed = i * 9973;
        const x = (seed * 7919) % width;
        const y = (seed * 104729) % height;
        const size = 0.3 + (seed % 100) / 200;
        const twinkle = Math.sin(time + seed * 0.1) * 0.3 + 0.5;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 220, 255, ${0.2 * twinkle})`;
        ctx.fill();
      }
    };
    
    const drawSmallHexagon = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number) => {
      const vertices = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6 + Math.PI / 6;
        vertices.push({
          x: x + Math.cos(angle) * size,
          y: y + Math.sin(angle) * size
        });
      }
      
      ctx.beginPath();
      ctx.moveTo(vertices[0].x, vertices[0].y);
      for (let i = 1; i < 6; i++) {
        ctx.lineTo(vertices[i].x, vertices[i].y);
      }
      ctx.closePath();
      
      ctx.strokeStyle = `rgba(100, 150, 200, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    };
    
    const drawMainHexagon = (ctx: CanvasRenderingContext2D, cx: number, cy: number, time: number) => {
      const size = 180;
      const tiltRad = (tiltAngle * Math.PI) / 180;
      
      // 倾斜后的六边形顶点
      const vertices = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6 + Math.PI / 6;
        const x = Math.cos(angle) * size;
        const y = Math.sin(angle) * size * Math.cos(tiltRad); // 倾斜压缩
        const z = Math.sin(angle) * size * Math.sin(tiltRad); // 深度
        
        vertices.push({
          x: cx + x,
          y: cy + y,
          z: z
        });
      }
      
      // 1. 绘制内部（黑色虚空）
      ctx.beginPath();
      ctx.moveTo(vertices[0].x, vertices[0].y);
      for (let i = 1; i < 6; i++) {
        ctx.lineTo(vertices[i].x, vertices[i].y);
      }
      ctx.closePath();
      ctx.fillStyle = '#050505'; // 深黑色
      ctx.fill();
      
      // 内部微弱的虚空感
      const voidGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, size);
      voidGradient.addColorStop(0, 'rgba(10, 15, 20, 0.3)');
      voidGradient.addColorStop(0.7, 'rgba(5, 8, 12, 0.2)');
      voidGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = voidGradient;
      ctx.fill();
      
      // 2. 绘制六条圆柱边（淡蓝色，闪烁）
      for (let i = 0; i < 6; i++) {
        const v1 = vertices[i];
        const v2 = vertices[(i + 1) % 6];
        
        // 闪烁效果 - 周期性变淡
        const flickerPhase = time * flickerSpeed + (i * Math.PI) / 3;
        const flicker = Math.sin(flickerPhase) * 0.5 + 0.5; // 0-1
        const edgeAlpha = 0.3 + flicker * 0.5; // 0.3-0.8
        
        // 绘制圆柱边
        drawCylinderEdge(ctx, v1, v2, edgeThickness, edgeAlpha, flicker, time);
      }
      
      // 3. 变淡时显示黑线（交接线）
      for (let i = 0; i < 6; i++) {
        const v = vertices[i];
        const vPrev = vertices[(i + 5) % 6];
        const vNext = vertices[(i + 1) % 6];
        
        // 计算闪烁相位
        const flickerPhase1 = time * flickerSpeed + ((i + 5) % 6 * Math.PI) / 3;
        const flickerPhase2 = time * flickerSpeed + (i * Math.PI) / 3;
        const avgFlicker = (Math.sin(flickerPhase1) + Math.sin(flickerPhase2)) / 4 + 0.5;
        
        // 当边变淡时，黑线更明显
        const lineAlpha = (1 - avgFlicker) * 0.8;
        
        if (lineAlpha > 0.1) {
          // 绘制交接处的黑线
          ctx.beginPath();
          ctx.moveTo(v.x, v.y);
          ctx.lineTo(vPrev.x, vPrev.y);
          ctx.strokeStyle = `rgba(20, 25, 30, ${lineAlpha})`;
          ctx.lineWidth = 2;
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(v.x, v.y);
          ctx.lineTo(vNext.x, vNext.y);
          ctx.strokeStyle = `rgba(20, 25, 30, ${lineAlpha})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        
        // 顶点处的小黑点
        ctx.beginPath();
        ctx.arc(v.x, v.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#0a0a0a';
        ctx.fill();
      }
      
      // 4. 微弱的整体发光
      const glowAlpha = 0.05 + Math.sin(time * 0.5) * 0.02;
      const outerGlow = ctx.createRadialGradient(cx, cy, size * 0.8, cx, cy, size * 1.3);
      outerGlow.addColorStop(0, 'rgba(100, 160, 220, 0)');
      outerGlow.addColorStop(0.5, `rgba(100, 160, 220, ${glowAlpha})`);
      outerGlow.addColorStop(1, 'rgba(100, 160, 220, 0)');
      
      ctx.beginPath();
      ctx.arc(cx, cy, size * 1.3, 0, Math.PI * 2);
      ctx.fillStyle = outerGlow;
      ctx.fill();
    };
    
    const drawCylinderEdge = (
      ctx: CanvasRenderingContext2D, 
      v1: { x: number; y: number; z: number }, 
      v2: { x: number; y: number; z: number }, 
      thickness: number,
      alpha: number,
      flicker: number,
      time: number
    ) => {
      // 圆柱效果 - 多层渐变
      const layers = 5;
      for (let l = layers - 1; l >= 0; l--) {
        const layerThickness = thickness * (1 + l * 0.3);
        const layerAlpha = alpha * (1 - l * 0.15);
        
        // 淡蓝色 - 根据闪烁调整
        const blue = 180 + flicker * 40;
        const green = 160 + flicker * 30;
        
        ctx.beginPath();
        ctx.moveTo(v1.x, v1.y);
        ctx.lineTo(v2.x, v2.y);
        ctx.strokeStyle = `rgba(${100 + flicker * 50}, ${green}, ${blue}, ${layerAlpha * 0.6})`;
        ctx.lineWidth = layerThickness;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      
      // 高光
      ctx.beginPath();
      ctx.moveTo(v1.x, v1.y);
      ctx.lineTo(v2.x, v2.y);
      ctx.strokeStyle = `rgba(200, 230, 255, ${alpha * 0.4 * flicker})`;
      ctx.lineWidth = thickness * 0.3;
      ctx.stroke();
      
      // 圆柱两端（顶点处的圆）
      const endRadius = thickness / 2;
      
      [v1, v2].forEach(v => {
        const endGradient = ctx.createRadialGradient(v.x, v.y, 0, v.x, v.y, endRadius * 1.5);
        endGradient.addColorStop(0, `rgba(150, 200, 240, ${alpha * 0.6})`);
        endGradient.addColorStop(0.5, `rgba(100, 170, 220, ${alpha * 0.3})`);
        endGradient.addColorStop(1, 'rgba(80, 140, 200, 0)');
        
        ctx.beginPath();
        ctx.arc(v.x, v.y, endRadius * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = endGradient;
        ctx.fill();
      });
    };
    
    draw();
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [tiltAngle, flickerSpeed, edgeThickness, backgroundGridDensity]);

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
              <CardTitle className="text-cyan-400">视觉参数</CardTitle>
              <CardDescription className="text-gray-400">
                调整参数，尽量还原梦境
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm text-gray-300">倾斜角度: {tiltAngle}°</label>
                <Slider
                  value={[tiltAngle]}
                  onValueChange={(v) => setTiltAngle(v[0])}
                  min={0}
                  max={45}
                  step={1}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-gray-300">闪烁速度</label>
                <Slider
                  value={[flickerSpeed]}
                  onValueChange={(v) => setFlickerSpeed(v[0])}
                  min={0.2}
                  max={2}
                  step={0.1}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-gray-300">圆柱厚度</label>
                <Slider
                  value={[edgeThickness]}
                  onValueChange={(v) => setEdgeThickness(v[0])}
                  min={4}
                  max={24}
                  step={1}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-gray-300">背景网格密度</label>
                <Slider
                  value={[backgroundGridDensity]}
                  onValueChange={(v) => setBackgroundGridDensity(v[0])}
                  min={0}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
          
          {/* 右侧：梦境解读 */}
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-cyan-400">修正后的理解</CardTitle>
              <CardDescription className="text-gray-400">
                边才是信息所在，内部是虚空
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-gray-800/50 border border-cyan-900/30">
                <h4 className="font-medium text-cyan-300 mb-2">六边形内部 = 黑色虚空</h4>
                <p className="text-xs text-gray-400">
                  内部是"空"的。不是信息存在的场所，而是潜能的虚空。
                  这意味着：信息不在"内部"，而在"边界"。
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-gray-800/50 border border-cyan-900/30">
                <h4 className="font-medium text-cyan-300 mb-2">六条圆柱边 = 淡蓝色，闪烁</h4>
                <p className="text-xs text-gray-400">
                  边是淡蓝色的，会闪烁变淡。这暗示：信息在边界上流动。
                  闪烁 = 信息在变化/流动？
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-gray-800/50 border border-cyan-900/30">
                <h4 className="font-medium text-cyan-300 mb-2">变淡后能看到黑线</h4>
                <p className="text-xs text-gray-400">
                  边交接处有黑线。闪烁变淡时能看到。
                  这暗示：边界下面有更深层的结构。
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-gray-800/50 border border-cyan-900/30">
                <h4 className="font-medium text-cyan-300 mb-2">背景小六边形一闪一闪</h4>
                <p className="text-xs text-gray-400">
                  背景有隐藏的六边形网格，一会出现一会消失。
                  这暗示：虚空中有隐藏的结构，时隐时现。
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* 新的科学理解 */}
        <Card className="mt-6 bg-gray-900/50 border-cyan-900/30">
          <CardHeader>
            <CardTitle className="text-cyan-400">这与"全息原理"完全吻合</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-white">全息宇宙</h4>
                <div className="text-sm text-gray-400 space-y-2">
                  <p>• 信息编码在<strong className="text-cyan-300">边界</strong>上</p>
                  <p>• <strong className="text-cyan-300">内部</strong>是空的（投影）</p>
                  <p>• 边界才是"真实"的</p>
                  <p>• 你梦到的正是这个：边界有信息（蓝色），内部是虚空（黑色）</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-white">智能的新理解</h4>
                <div className="text-sm text-gray-400 space-y-2">
                  <p>• 不是"节点处理信息"</p>
                  <p>• 而是<strong className="text-cyan-300">边界承载信息</strong></p>
                  <p>• 内部是"虚空/空间"</p>
                  <p>• 智能从边界的互动中涌现</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 rounded-lg bg-cyan-950/30 border border-cyan-800/30">
              <p className="text-cyan-200 text-sm">
                <strong>核心洞察：</strong>你的梦在告诉你：边界才是关键。不是"场里有信息"，而是"边界上有信息"。这完全颠覆了传统AI的"节点+连接"范式。也许智能的本质是：边界的几何结构 + 边界上的信息流动。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
