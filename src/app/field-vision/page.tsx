'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';

/**
 * 场域视觉 - 3D圆筒六边形框架
 * 
 * 核心理解：
 * - 六根3D圆柱管道首尾相接
 * - 构成立体的六边形框架
 * - 内部是空的（黑色虚空）
 * - 圆柱是淡蓝色，会闪烁变淡
 * - 变淡后能看到交接处的黑线
 * - 整体在太空中微微倾斜
 * - 背景有小六边形一闪一闪
 */

export default function FieldVisionPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  
  // 控制参数
  const [rotationX, setRotationX] = useState(20);
  const [rotationZ, setRotationZ] = useState(15);
  const [cylinderRadius, setCylinderRadius] = useState(15);
  const [flickerSpeed, setFlickerSpeed] = useState(0.6);
  const [backgroundDensity, setBackgroundDensity] = useState(0.5);

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
    
    // 背景小六边形
    const backgroundHexagons: { x: number; y: number; size: number; phase: number; duration: number }[] = [];
    for (let i = 0; i < 50; i++) {
      backgroundHexagons.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 8 + Math.random() * 12,
        phase: Math.random() * Math.PI * 2,
        duration: 1.5 + Math.random() * 2
      });
    }
    
    // 3D投影函数
    const project3D = (x: number, y: number, z: number, rotX: number, rotZ: number) => {
      // 绕Z轴旋转
      const cosZ = Math.cos(rotZ);
      const sinZ = Math.sin(rotZ);
      const x1 = x * cosZ - y * sinZ;
      const y1 = x * sinZ + y * cosZ;
      
      // 绕X轴旋转
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const y2 = y1 * cosX - z * sinX;
      const z2 = y1 * sinX + z * cosX;
      
      // 透视投影
      const perspective = 800;
      const scale = perspective / (perspective + z2);
      
      return {
        x: centerX + x1 * scale,
        y: centerY + y2 * scale,
        z: z2,
        scale: scale
      };
    };
    
    // 绘制3D圆柱
    const drawCylinder3D = (
      ctx: CanvasRenderingContext2D,
      p1: { x: number; y: number; z: number; scale: number },
      p2: { x: number; y: number; z: number; scale: number },
      radius: number,
      alpha: number,
      flicker: number
    ) => {
      const avgScale = (p1.scale + p2.scale) / 2;
      const r = radius * avgScale;
      
      // 圆柱方向
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      
      // 绘制圆柱体
      ctx.save();
      ctx.translate(p1.x, p1.y);
      ctx.rotate(angle);
      
      // 圆柱主体（渐变模拟3D）
      const cylinderGradient = ctx.createLinearGradient(0, -r, 0, r);
      
      // 淡蓝色，根据闪烁调整
      const baseAlpha = alpha * (0.4 + flicker * 0.4);
      cylinderGradient.addColorStop(0, `rgba(180, 220, 255, ${baseAlpha * 0.3})`);
      cylinderGradient.addColorStop(0.3, `rgba(120, 180, 240, ${baseAlpha * 0.7})`);
      cylinderGradient.addColorStop(0.5, `rgba(150, 200, 250, ${baseAlpha})`);
      cylinderGradient.addColorStop(0.7, `rgba(100, 160, 220, ${baseAlpha * 0.7})`);
      cylinderGradient.addColorStop(1, `rgba(60, 120, 180, ${baseAlpha * 0.3})`);
      
      // 绘制圆柱体
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.3, r, 0, 0, Math.PI * 2);
      ctx.fillStyle = cylinderGradient;
      ctx.fill();
      
      ctx.beginPath();
      ctx.ellipse(length, 0, r * 0.3, r, 0, 0, Math.PI * 2);
      ctx.fillStyle = cylinderGradient;
      ctx.fill();
      
      // 圆柱侧面
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(length, -r);
      ctx.lineTo(length, r);
      ctx.lineTo(0, r);
      ctx.closePath();
      ctx.fillStyle = cylinderGradient;
      ctx.fill();
      
      // 高光
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.5);
      ctx.lineTo(length, -r * 0.5);
      ctx.strokeStyle = `rgba(220, 240, 255, ${baseAlpha * 0.5 * flicker})`;
      ctx.lineWidth = r * 0.2;
      ctx.stroke();
      
      ctx.restore();
    };
    
    // 绘制端点（交接处）
    const drawJoint = (
      ctx: CanvasRenderingContext2D,
      p: { x: number; y: number; z: number; scale: number },
      radius: number,
      alpha: number,
      flicker: number
    ) => {
      const r = radius * p.scale;
      
      // 当闪烁变淡时，显示黑线
      const blackLineAlpha = (1 - flicker) * 0.6;
      
      if (blackLineAlpha > 0.1) {
        // 黑线（底层结构）
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 0.5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(20, 25, 35, ${blackLineAlpha})`;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      
      // 端点发光
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 1.5);
      glow.addColorStop(0, `rgba(180, 220, 255, ${alpha * flicker * 0.5})`);
      glow.addColorStop(0.5, `rgba(120, 180, 240, ${alpha * flicker * 0.2})`);
      glow.addColorStop(1, 'rgba(80, 140, 200, 0)');
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();
      
      // 中心黑点
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = '#050508';
      ctx.fill();
    };
    
    const draw = () => {
      time += 0.016;
      
      // 清空 - 深黑太空
      ctx.fillStyle = '#010208';
      ctx.fillRect(0, 0, width, height);
      
      // 1. 背景小六边形（一闪一闪）
      backgroundHexagons.forEach((hex) => {
        const visibilityCycle = Math.sin(time / hex.duration + hex.phase);
        const visibility = visibilityCycle > 0.8 ? (visibilityCycle - 0.8) / 0.2 : 0;
        
        if (visibility > 0 && Math.random() < backgroundDensity) {
          drawBackgroundHex(ctx, hex.x, hex.y, hex.size, visibility * 0.25);
        }
      });
      
      // 2. 星空
      drawStars(ctx, width, height, time);
      
      // 3. 3D六边形框架
      const rotX = (rotationX * Math.PI) / 180 + Math.sin(time * 0.2) * 0.05;
      const rotZ = (rotationZ * Math.PI) / 180 + time * 0.1;
      
      // 六边形的六个顶点（在XY平面）
      const hexRadius = 180;
      const vertices3D: { x: number; y: number; z: number }[] = [];
      
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6 - Math.PI / 2;
        vertices3D.push({
          x: Math.cos(angle) * hexRadius,
          y: Math.sin(angle) * hexRadius,
          z: 0
        });
      }
      
      // 投影到2D
      const projected = vertices3D.map(v => project3D(v.x, v.y, v.z, rotX, rotZ));
      
      // 按深度排序边（远的先画）
      const edges: { i1: number; i2: number; avgZ: number }[] = [];
      for (let i = 0; i < 6; i++) {
        edges.push({
          i1: i,
          i2: (i + 1) % 6,
          avgZ: (projected[i].z + projected[(i + 1) % 6].z) / 2
        });
      }
      edges.sort((a, b) => a.avgZ - b.avgZ);
      
      // 绘制边（圆柱）
      edges.forEach((edge, idx) => {
        const p1 = projected[edge.i1];
        const p2 = projected[edge.i2];
        
        // 闪烁效果
        const flickerPhase = time * flickerSpeed + (edge.i1 * Math.PI) / 3;
        const flicker = Math.sin(flickerPhase) * 0.5 + 0.5;
        
        // 深度影响透明度
        const depthFactor = 0.5 + (p1.scale + p2.scale) / 4;
        
        drawCylinder3D(ctx, p1, p2, cylinderRadius, depthFactor, flicker);
      });
      
      // 绘制端点
      projected.forEach((p, i) => {
        const flickerPhase = time * flickerSpeed + (i * Math.PI) / 3;
        const flicker = Math.sin(flickerPhase) * 0.5 + 0.5;
        
        drawJoint(ctx, p, cylinderRadius, 0.8, flicker);
      });
      
      // 4. 内部虚空感
      const voidCenter = project3D(0, 0, 0, rotX, rotZ);
      const voidGradient = ctx.createRadialGradient(
        voidCenter.x, voidCenter.y, 0,
        voidCenter.x, voidCenter.y, 100 * voidCenter.scale
      );
      voidGradient.addColorStop(0, 'rgba(5, 8, 15, 0.8)');
      voidGradient.addColorStop(0.5, 'rgba(3, 5, 10, 0.5)');
      voidGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = voidGradient;
      ctx.beginPath();
      ctx.arc(voidCenter.x, voidCenter.y, 100 * voidCenter.scale, 0, Math.PI * 2);
      ctx.fill();
      
      animationRef.current = requestAnimationFrame(draw);
    };
    
    const drawStars = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
      for (let i = 0; i < 100; i++) {
        const seed = i * 7919;
        const x = (seed * 104729) % width;
        const y = (seed * 3943) % height;
        const size = 0.3 + (seed % 50) / 100;
        const twinkle = Math.sin(time * 2 + seed) * 0.2 + 0.3;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 200, 230, ${twinkle})`;
        ctx.fill();
      }
    };
    
    const drawBackgroundHex = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6 + Math.PI / 6;
        const px = x + Math.cos(angle) * size;
        const py = y + Math.sin(angle) * size;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(80, 130, 180, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    };
    
    draw();
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [rotationX, rotationZ, cylinderRadius, flickerSpeed, backgroundDensity]);

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
              <CardTitle className="text-cyan-400">3D视角调整</CardTitle>
              <CardDescription className="text-gray-400">
                调整参数还原梦境
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm text-gray-300">倾斜角度: {rotationX}°</label>
                <Slider
                  value={[rotationX]}
                  onValueChange={(v) => setRotationX(v[0])}
                  min={0}
                  max={60}
                  step={1}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-gray-300">旋转速度</label>
                <Slider
                  value={[rotationZ]}
                  onValueChange={(v) => setRotationZ(v[0])}
                  min={0}
                  max={30}
                  step={1}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-gray-300">圆筒粗细: {cylinderRadius}</label>
                <Slider
                  value={[cylinderRadius]}
                  onValueChange={(v) => setCylinderRadius(v[0])}
                  min={5}
                  max={30}
                  step={1}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-gray-300">闪烁速度</label>
                <Slider
                  value={[flickerSpeed]}
                  onValueChange={(v) => setFlickerSpeed(v[0])}
                  min={0.1}
                  max={1.5}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
          
          {/* 结构解读 */}
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-cyan-400">3D圆筒框架</CardTitle>
              <CardDescription className="text-gray-400">
                六根圆柱管道首尾相接
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-gray-800/50 border border-cyan-900/30">
                <h4 className="font-medium text-cyan-300 mb-2">立体圆柱管道</h4>
                <p className="text-xs text-gray-400">
                  不是平面的"边"，而是立体的圆柱管道。
                  有粗细、有体积、是3D的。
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-gray-800/50 border border-cyan-900/30">
                <h4 className="font-medium text-cyan-300 mb-2">内部是虚空</h4>
                <p className="text-xs text-gray-400">
                  框架内部没有东西，只有黑色虚空。
                  这是个"空架子"，不是"填充的场"。
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-gray-800/50 border border-cyan-900/30">
                <h4 className="font-medium text-cyan-300 mb-2">管道 = 信息通道？</h4>
                <p className="text-xs text-gray-400">
                  如果圆柱是管道，那内部可以流动东西。
                  也许信息在管道内部流动，而不是在"场"中。
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* 核心洞察 */}
        <Card className="mt-6 bg-gray-900/50 border-cyan-900/30">
          <CardHeader>
            <CardTitle className="text-cyan-400">新理解：管道网络</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                <h4 className="font-medium text-white mb-2">传统模型</h4>
                <p className="text-xs text-gray-400">
                  节点 + 线<br/>
                  节点处理信息<br/>
                  线只是连接
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                <h4 className="font-medium text-white mb-2">之前的理解</h4>
                <p className="text-xs text-gray-400">
                  场 + 边界<br/>
                  信息在场中<br/>
                  边界塑造场
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-cyan-950/50 border border-cyan-800/50">
                <h4 className="font-medium text-cyan-300 mb-2">现在理解</h4>
                <p className="text-xs text-gray-400">
                  <strong className="text-cyan-300">管道网络</strong><br/>
                  <strong className="text-cyan-300">管道内部流动信息</strong><br/>
                  <strong className="text-cyan-300">框架内部是虚空</strong>
                </p>
              </div>
            </div>
            
            <div className="mt-6 p-4 rounded-lg bg-cyan-950/30 border border-cyan-800/30">
              <p className="text-cyan-200 text-sm">
                <strong>关键洞察：</strong>你梦到的不是"填充的场"，而是"管道框架"。
                信息可能不是在"场"中存在，而是在"管道"中流动。
                这更像是一个输送系统，而不是一个处理系统。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
