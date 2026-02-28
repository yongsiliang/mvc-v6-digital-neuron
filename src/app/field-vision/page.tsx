'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';

/**
 * 场域视觉 - 最终版本
 * 
 * 基于确认的结构：
 * - 背景层：黑色太空 + 淡蓝色小六边形网格（一闪一闪）
 * - 前景层：大的独立的淡蓝色刚性立体六边形（倾斜）
 */

export default function FieldVisionPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  
  // 控制参数
  const [foregroundSize, setForegroundSize] = useState(180);
  const [gridSize, setGridSize] = useState(35);
  const [tiltX, setTiltX] = useState(25);
  const [tiltZ, setTiltZ] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);

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
    
    // 3D投影
    const project3D = (x: number, y: number, z: number, rotX: number, rotZ: number) => {
      // Z轴旋转
      const cosZ = Math.cos(rotZ);
      const sinZ = Math.sin(rotZ);
      const x1 = x * cosZ - y * sinZ;
      const y1 = x * sinZ + y * cosZ;
      
      // X轴旋转（倾斜）
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const y2 = y1 * cosX - z * sinX;
      const z2 = y1 * sinX + z * cosX;
      
      // 透视
      const perspective = 1000;
      const scale = perspective / (perspective + z2);
      
      return {
        x: centerX + x1 * scale,
        y: centerY + y2 * scale,
        z: z2,
        scale: scale
      };
    };
    
    // 绘制刚性立体六边形框架
    const drawRigidHexagon = (
      ctx: CanvasRenderingContext2D,
      size: number,
      rotX: number,
      rotZ: number,
      time: number
    ) => {
      // 六个顶点
      const vertices3D: { x: number; y: number; z: number }[] = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6 - Math.PI / 2;
        vertices3D.push({
          x: Math.cos(angle) * size,
          y: Math.sin(angle) * size,
          z: 0
        });
      }
      
      // 投影
      const projected = vertices3D.map(v => project3D(v.x, v.y, v.z, rotX, rotZ));
      
      // 按深度排序边
      const edges: { i1: number; i2: number; avgZ: number }[] = [];
      for (let i = 0; i < 6; i++) {
        edges.push({
          i1: i,
          i2: (i + 1) % 6,
          avgZ: (projected[i].z + projected[(i + 1) % 6].z) / 2
        });
      }
      edges.sort((a, b) => a.avgZ - b.avgZ);
      
      // 绘制边（刚性直线）
      edges.forEach((edge) => {
        const p1 = projected[edge.i1];
        const p2 = projected[edge.i2];
        
        // 深度影响亮度
        const depthFactor = 0.6 + (p1.scale + p2.scale) / 5;
        
        // 淡蓝色，微弱闪烁
        const flicker = Math.sin(time * 3 + edge.i1) * 0.1 + 0.9;
        
        // 绘制边的发光效果
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(100, 180, 240, ${0.15 * depthFactor})`;
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        // 边主体
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(150, 210, 255, ${0.8 * depthFactor * flicker})`;
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // 高光
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(220, 240, 255, ${0.5 * depthFactor * flicker})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
      
      // 绘制顶点
      projected.forEach((p, i) => {
        const depthFactor = 0.6 + p.scale / 2;
        const flicker = Math.sin(time * 3 + i) * 0.1 + 0.9;
        
        // 发光
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 20);
        glow.addColorStop(0, `rgba(150, 220, 255, ${0.5 * depthFactor * flicker})`);
        glow.addColorStop(0.5, `rgba(100, 180, 240, ${0.2 * depthFactor})`);
        glow.addColorStop(1, 'rgba(80, 150, 220, 0)');
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, 20, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
        
        // 顶点圆
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6 * p.scale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 230, 255, ${0.9 * depthFactor * flicker})`;
        ctx.fill();
        
        // 中心黑点
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2 * p.scale, 0, Math.PI * 2);
        ctx.fillStyle = '#030508';
        ctx.fill();
      });
      
      // 内部虚空感
      const center = project3D(0, 0, 0, rotX, rotZ);
      const voidGradient = ctx.createRadialGradient(
        center.x, center.y, 0,
        center.x, center.y, size * center.scale
      );
      voidGradient.addColorStop(0, 'rgba(5, 8, 15, 0.6)');
      voidGradient.addColorStop(0.6, 'rgba(3, 5, 10, 0.3)');
      voidGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.beginPath();
      ctx.arc(center.x, center.y, size * center.scale, 0, Math.PI * 2);
      ctx.fillStyle = voidGradient;
      ctx.fill();
    };
    
    // 绘制背景小六边形
    const drawBackgroundHex = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      alpha: number
    ) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6 + Math.PI / 6;
        const px = x + Math.cos(angle) * size;
        const py = y + Math.sin(angle) * size;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(100, 170, 220, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    };
    
    // 生成背景网格
    const generateGrid = () => {
      const hexagons: { x: number; y: number; phase: number; duration: number }[] = [];
      const spacing = gridSize * 1.8;
      
      for (let row = -1; row < height / spacing + 1; row++) {
        for (let col = -1; col < width / spacing + 1; col++) {
          const offsetX = (row % 2) * (spacing / 2);
          hexagons.push({
            x: col * spacing + offsetX,
            y: row * spacing * 0.9,
            phase: Math.random() * Math.PI * 2,
            duration: 1 + Math.random() * 2
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
      for (let i = 0; i < 100; i++) {
        const seed = i * 7919;
        const x = (seed * 104729) % width;
        const y = (seed * 3943) % height;
        const size = 0.3 + (seed % 50) / 150;
        const twinkle = Math.sin(time + seed * 0.1) * 0.15 + 0.2;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 200, 230, ${twinkle})`;
        ctx.fill();
      }
      
      // 2. 背景小六边形网格（一闪一闪）
      gridHexagons.forEach((hex) => {
        // 计算与前景的距离，避免重叠
        const dx = hex.x - centerX;
        const dy = hex.y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > foregroundSize * 1.2) {
          // 一闪一闪效果
          const cycle = Math.sin(time / hex.duration + hex.phase);
          const visibility = cycle > 0.6 ? (cycle - 0.6) / 0.4 : 0;
          
          if (visibility > 0) {
            drawBackgroundHex(ctx, hex.x, hex.y, gridSize, visibility * 0.4);
          }
        }
      });
      
      // 3. 前景：大的刚性立体六边形（倾斜）
      const rotX = (tiltX * Math.PI) / 180;
      const rotZ = autoRotate ? time * 0.3 + (tiltZ * Math.PI) / 180 : (tiltZ * Math.PI) / 180;
      
      drawRigidHexagon(ctx, foregroundSize, rotX, rotZ, time);
      
      animationRef.current = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [foregroundSize, gridSize, tiltX, tiltZ, autoRotate]);

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
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm text-gray-300">前景大小: {foregroundSize}</label>
                <Slider
                  value={[foregroundSize]}
                  onValueChange={(v) => setForegroundSize(v[0])}
                  min={100}
                  max={280}
                  step={10}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-gray-300">倾斜角度: {tiltX}°</label>
                <Slider
                  value={[tiltX]}
                  onValueChange={(v) => setTiltX(v[0])}
                  min={0}
                  max={60}
                  step={1}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-gray-300">旋转角度: {tiltZ}°</label>
                <Slider
                  value={[tiltZ]}
                  onValueChange={(v) => setTiltZ(v[0])}
                  min={0}
                  max={360}
                  step={5}
                  className="w-full"
                  disabled={autoRotate}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-gray-300">背景网格大小: {gridSize}</label>
                <Slider
                  value={[gridSize]}
                  onValueChange={(v) => setGridSize(v[0])}
                  min={15}
                  max={60}
                  step={5}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
          
          {/* 结构说明 */}
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-cyan-400">确认的结构</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded-full bg-gray-900 border border-cyan-600" />
                  <h4 className="font-medium text-gray-300">背景层：黑色太空</h4>
                </div>
                <p className="text-xs text-gray-500">虚空、基态</p>
              </div>
              
              <div className="p-4 rounded-lg bg-gray-800/50 border border-cyan-900/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 border border-cyan-400/60" style={{ transform: 'rotate(30deg)' }} />
                  <h4 className="font-medium text-cyan-300">中间层：淡蓝色网格</h4>
                </div>
                <p className="text-xs text-gray-400">
                  小六边形网格，一闪一闪
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-cyan-950/50 border border-cyan-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 border-2 border-cyan-300" style={{ transform: 'rotate(30deg) perspective(100px) rotateX(20deg)' }} />
                  <h4 className="font-medium text-cyan-200">前景层：刚性立体六边形</h4>
                </div>
                <p className="text-xs text-gray-300">
                  大的、独立的、显眼<br/>
                  刚性的、立体的、倾斜的<br/>
                  淡蓝色
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* 核心洞察 */}
        <Card className="mt-6 bg-gray-900/50 border-cyan-900/30">
          <CardHeader>
            <CardTitle className="text-cyan-400">刚性立体六边形</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-white">刚性的含义</h4>
                <ul className="text-sm text-gray-400 space-y-2">
                  <li>• 边是直线，不是凹陷的弧线</li>
                  <li>• 结构稳定，不变形</li>
                  <li>• 像一个固定的框架</li>
                  <li>• 可能代表"秩序"或"规则"</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-white">立体 + 倾斜</h4>
                <ul className="text-sm text-gray-400 space-y-2">
                  <li>• 不是平面的，有深度</li>
                  <li>• 倾斜 = 有视角</li>
                  <li>• 从某个角度观看</li>
                  <li>• 可能是"从某个维度看到的"</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 rounded-lg bg-cyan-950/30 border border-cyan-800/30">
              <p className="text-cyan-200 text-sm">
                <strong>理解：</strong>前景是刚性的立体框架，背景是闪烁的网格。
                刚性框架可能是"结构"或"规则"，背景网格可能是"信息场"或"可能性空间"。
                大的六边形突出、显眼，可能是"焦点"或"入口"。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
