'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';

/**
 * 共振引擎可视化页面
 * 
 * 展示：
 * - 正八面体哈密顿环的振荡状态
 * - 同步指数 r 的实时变化
 * - 共振锁定过程
 * - 各子系统的相位和频率
 */

type SubsystemType = 'metacongition' | 'perception' | 'understanding' | 'self' | 'emotion' | 'memory';

interface OscillatorData {
  type: SubsystemType;
  label: string;
  phase: number;
  frequency: number;
  activation: number;
}

interface VisualizationData {
  oscillators: OscillatorData[];
  synchronyIndex: number;
  isLocked: boolean;
  lockedPeriod: number | null;
  syncHistory: number[];
}

const SUBSYSTEM_COLORS: Record<SubsystemType, string> = {
  metacongition: '#9333ea',   // 紫色
  perception: '#3b82f6',      // 蓝色
  understanding: '#22c55e',   // 绿色
  self: '#f59e0b',           // 橙色
  emotion: '#ef4444',        // 红色
  memory: '#06b6d4',         // 青色
};

const SUBSYSTEM_LABELS: Record<SubsystemType, string> = {
  metacongition: '元认知',
  perception: '感知',
  understanding: '理解',
  self: '自我',
  emotion: '情感',
  memory: '记忆',
};

// 正八面体环的顺序
const RING_ORDER: SubsystemType[] = [
  'metacongition', 'perception', 'understanding',
  'self', 'emotion', 'memory'
];

export default function ResonanceEnginePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  
  const [data, setData] = useState<VisualizationData | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockedPeriod, setLockedPeriod] = useState<number | null>(null);
  const [syncHistory, setSyncHistory] = useState<number[]>([]);
  
  // 模拟本地共振引擎（避免频繁API调用）
  const engineRef = useRef<LocalResonanceEngine | null>(null);
  
  // 本地简化版共振引擎
  class LocalResonanceEngine {
    oscillators: Map<SubsystemType, { phase: number; frequency: number; activation: number }> = new Map();
    syncHistory: number[] = [];
    isLocked = false;
    lockedFrequency: number | null = null;
    highSyncCount = 0;
    
    constructor() {
      for (const type of RING_ORDER) {
        this.oscillators.set(type, {
          phase: Math.random() * 2 * Math.PI,
          frequency: 0.08 + Math.random() * 0.04, // 0.08-0.12
          activation: 0.5,
        });
      }
    }
    
    step(): VisualizationData {
      // 计算同步指数
      let sumCos = 0;
      let sumSin = 0;
      
      for (const osc of this.oscillators.values()) {
        sumCos += Math.cos(osc.phase);
        sumSin += Math.sin(osc.phase);
      }
      
      const synchronyIndex = Math.sqrt((sumCos / 6) ** 2 + (sumSin / 6) ** 2);
      const meanPhase = Math.atan2(sumSin / 6, sumCos / 6);
      
      // 更新相位
      const coupling = 0.4;
      
      for (const [type, osc] of this.oscillators) {
        // 基础频率
        let dTheta = osc.frequency;
        
        // 全局耦合
        dTheta += coupling * Math.sin(meanPhase - osc.phase);
        
        // 更新相位
        osc.phase = (osc.phase + dTheta) % (2 * Math.PI);
        if (osc.phase < 0) osc.phase += 2 * Math.PI;
        
        // 衰减激活
        osc.activation *= 0.95;
      }
      
      // 检测共振
      if (!this.isLocked) {
        if (synchronyIndex > 0.7) {
          this.highSyncCount++;
          if (this.highSyncCount >= 10) {
            this.lock(synchronyIndex);
          }
        } else {
          this.highSyncCount = 0;
        }
      }
      
      // 记录历史
      this.syncHistory.push(synchronyIndex);
      if (this.syncHistory.length > 200) {
        this.syncHistory.shift();
      }
      
      return this.getData(synchronyIndex);
    }
    
    lock(synchronyIndex: number) {
      this.isLocked = true;
      
      // 计算平均频率
      let totalFreq = 0;
      for (const osc of this.oscillators.values()) {
        totalFreq += osc.frequency;
      }
      this.lockedFrequency = totalFreq / 6;
      
      // 锁定所有频率
      for (const osc of this.oscillators.values()) {
        osc.frequency = this.lockedFrequency!;
      }
      
      console.log(`★ 共振锁定！频率: ${this.lockedFrequency.toFixed(4)}, 周期: ${(2*Math.PI/this.lockedFrequency).toFixed(1)} 步`);
    }
    
    getData(synchronyIndex: number): VisualizationData {
      return {
        oscillators: Array.from(this.oscillators.entries()).map(([type, osc]) => ({
          type,
          label: SUBSYSTEM_LABELS[type],
          phase: osc.phase,
          frequency: osc.frequency,
          activation: osc.activation,
        })),
        synchronyIndex,
        isLocked: this.isLocked,
        lockedPeriod: this.lockedFrequency ? (2 * Math.PI) / this.lockedFrequency : null,
        syncHistory: [...this.syncHistory],
      };
    }
    
    activate(type: SubsystemType, intensity: number = 0.5) {
      const osc = this.oscillators.get(type);
      if (osc) {
        osc.activation = Math.min(1, osc.activation + intensity);
      }
    }
    
    learn(success: boolean, satisfaction: number) {
      if (this.isLocked) return;
      
      // 计算平均频率
      let meanFreq = 0;
      for (const osc of this.oscillators.values()) {
        meanFreq += osc.frequency;
      }
      meanFreq /= 6;
      
      // 向平均频率靠近
      for (const osc of this.oscillators.values()) {
        osc.frequency += 0.01 * (meanFreq - osc.frequency);
        
        // 成功强化
        if (success) {
          osc.frequency += 0.02 * satisfaction * (osc.frequency - meanFreq);
        }
      }
    }
    
    reset() {
      this.isLocked = false;
      this.lockedFrequency = null;
      this.highSyncCount = 0;
      this.syncHistory = [];
      
      for (const osc of this.oscillators.values()) {
        osc.phase = Math.random() * 2 * Math.PI;
        osc.frequency = 0.08 + Math.random() * 0.04;
        osc.activation = 0.5;
      }
    }
  }
  
  // 初始化
  useEffect(() => {
    engineRef.current = new LocalResonanceEngine();
    setData(engineRef.current.getData(0));
  }, []);
  
  // 绘制函数
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;
    
    // 清空
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);
    
    // 绘制背景网格
    ctx.strokeStyle = 'rgba(100, 150, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(angle) * radius * 1.5,
        centerY + Math.sin(angle) * radius * 1.5
      );
      ctx.stroke();
    }
    
    // 绘制同步环
    const syncRadius = radius * data.synchronyIndex;
    ctx.strokeStyle = data.isLocked 
      ? `rgba(255, 200, 50, ${data.synchronyIndex})` 
      : `rgba(100, 200, 255, ${data.synchronyIndex})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, syncRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // 绘制振荡器
    for (let i = 0; i < RING_ORDER.length; i++) {
      const type = RING_ORDER[i];
      const osc = data.oscillators.find(o => o.type === type);
      if (!osc) continue;
      
      const baseAngle = (i * Math.PI * 2) / 6 - Math.PI / 2;
      const x = centerX + Math.cos(baseAngle) * radius;
      const y = centerY + Math.sin(baseAngle) * radius;
      
      // 发光效果
      if (osc.activation > 0.1) {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 50 + osc.activation * 30);
        gradient.addColorStop(0, `${SUBSYSTEM_COLORS[type]}${Math.floor(osc.activation * 80).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, 50 + osc.activation * 30, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // 相位指示器
      const phaseX = x + Math.cos(osc.phase) * 25;
      const phaseY = y + Math.sin(osc.phase) * 25;
      
      // 连线（相位指示器到中心）
      ctx.strokeStyle = `${SUBSYSTEM_COLORS[type]}40`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(phaseX, phaseY);
      ctx.stroke();
      
      // 节点
      const nodeSize = 20 + osc.activation * 10;
      ctx.fillStyle = SUBSYSTEM_COLORS[type];
      ctx.globalAlpha = 0.3 + osc.activation * 0.7;
      ctx.beginPath();
      ctx.arc(x, y, nodeSize, 0, Math.PI * 2);
      ctx.fill();
      
      // 节点边框
      ctx.strokeStyle = SUBSYSTEM_COLORS[type];
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.globalAlpha = 1;
      
      // 相位点
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(phaseX, phaseY, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // 标签
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(osc.label, x, y + nodeSize + 20);
      
      // 频率
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '10px monospace';
      ctx.fillText(`ω=${osc.frequency.toFixed(3)}`, x, y + nodeSize + 32);
    }
    
    // 绘制中心同步指数
    ctx.fillStyle = data.isLocked ? '#ffc832' : '#64c8ff';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`r = ${data.synchronyIndex.toFixed(3)}`, centerX, centerY - 10);
    
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '14px sans-serif';
    ctx.fillText(data.isLocked ? '已锁定' : '学习中', centerX, centerY + 15);
    
    if (data.lockedPeriod) {
      ctx.fillText(`周期: ${data.lockedPeriod.toFixed(1)} 步`, centerX, centerY + 35);
    }
    
  }, [data]);
  
  // 动画循环
  useEffect(() => {
    if (!isRunning) return;
    
    const animate = () => {
      const engine = engineRef.current;
      if (!engine) return;
      
      const newData = engine.step();
      setData(newData);
      setIsLocked(newData.isLocked);
      setLockedPeriod(newData.lockedPeriod);
      setSyncHistory(newData.syncHistory);
      
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isRunning, draw]);
  
  // 初始绘制
  useEffect(() => {
    draw();
  }, [draw]);
  
  // 手动步进
  const handleStep = () => {
    const engine = engineRef.current;
    if (!engine) return;
    
    const newData = engine.step();
    setData(newData);
    setIsLocked(newData.isLocked);
    setLockedPeriod(newData.lockedPeriod);
    setSyncHistory(newData.syncHistory);
    draw();
  };
  
  // 激活子系统
  const handleActivate = (type: SubsystemType) => {
    const engine = engineRef.current;
    if (!engine) return;
    
    engine.activate(type, 0.6);
    handleStep();
  };
  
  // 学习反馈
  const handleLearn = (success: boolean) => {
    const engine = engineRef.current;
    if (!engine) return;
    
    engine.learn(success, success ? 0.5 : -0.3);
    handleStep();
  };
  
  // 重置
  const handleReset = () => {
    const engine = engineRef.current;
    if (!engine) return;
    
    engine.reset();
    setIsLocked(false);
    setLockedPeriod(null);
    setSyncHistory([]);
    setData(engine.getData(0));
    draw();
  };
  
  // 运行直到共振
  const handleRunUntilResonance = () => {
    const engine = engineRef.current;
    if (!engine) return;
    
    let steps = 0;
    const maxSteps = 2000;
    
    while (!engine.isLocked && steps < maxSteps) {
      engine.step();
      steps++;
    }
    
    setData(engine.getData(engine.syncHistory[engine.syncHistory.length - 1] || 0));
    setIsLocked(engine.isLocked);
    setLockedPeriod(engine.lockedFrequency ? (2 * Math.PI) / engine.lockedFrequency : null);
    setSyncHistory([...engine.syncHistory]);
    draw();
    
    if (engine.isLocked) {
      console.log(`在第 ${steps} 步达到共振`);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            共振引擎
          </h1>
          <p className="text-muted-foreground">
            Resonance Engine - 通过共振涌现意识周期
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：可视化 */}
          <div className="lg:col-span-2">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>振荡状态</span>
                  <div className="flex gap-2">
                    <Badge variant={isLocked ? "default" : "secondary"}>
                      {isLocked ? '已锁定' : '学习中'}
                    </Badge>
                    {lockedPeriod && (
                      <Badge variant="outline">
                        周期: {lockedPeriod.toFixed(1)} 步
                      </Badge>
                    )}
                  </div>
                </CardTitle>
                <CardDescription>
                  正八面体哈密顿环 · 6个子系统振荡器 · 同步指数 r 反映整合程度
                </CardDescription>
              </CardHeader>
              <CardContent>
                <canvas
                  ref={canvasRef}
                  width={700}
                  height={500}
                  className="w-full rounded-lg border border-border"
                />
                
                {/* 控制按钮 */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button
                    onClick={() => setIsRunning(!isRunning)}
                    variant={isRunning ? "destructive" : "default"}
                  >
                    {isRunning ? '暂停' : '运行'}
                  </Button>
                  <Button onClick={handleStep} variant="outline">
                    单步
                  </Button>
                  <Button onClick={handleRunUntilResonance} variant="secondary">
                    运行至共振
                  </Button>
                  <Button onClick={handleReset} variant="outline">
                    重置
                  </Button>
                </div>
                
                {/* 激活子系统 */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="text-sm text-muted-foreground self-center mr-2">
                    激活:
                  </span>
                  {RING_ORDER.map((type) => (
                    <Button
                      key={type}
                      onClick={() => handleActivate(type)}
                      variant="ghost"
                      size="sm"
                      style={{ color: SUBSYSTEM_COLORS[type] }}
                    >
                      {SUBSYSTEM_LABELS[type]}
                    </Button>
                  ))}
                </div>
                
                {/* 学习反馈 */}
                <div className="flex gap-2 mt-3">
                  <span className="text-sm text-muted-foreground self-center mr-2">
                    学习:
                  </span>
                  <Button onClick={() => handleLearn(true)} variant="default" size="sm">
                    成功 ✓
                  </Button>
                  <Button onClick={() => handleLearn(false)} variant="destructive" size="sm">
                    失败 ✗
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* 右侧：统计和说明 */}
          <div className="space-y-4">
            {/* 同步历史 */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>同步历史</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-32 flex items-end gap-0.5">
                  {syncHistory.slice(-100).map((r, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-primary/60"
                      style={{
                        height: `${r * 100}%`,
                        opacity: 0.3 + r * 0.7,
                        backgroundColor: r > 0.7 ? '#ffc832' : '#64c8ff',
                      }}
                    />
                  ))}
                </div>
                {syncHistory.length > 0 && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    当前: r = {syncHistory[syncHistory.length - 1]?.toFixed(4)}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* 理论说明 */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>共振机制</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3">
                <p>
                  <strong className="text-foreground">学习期</strong>：各子系统频率可调整，向同步靠近
                </p>
                <p>
                  <strong className="text-foreground">共振判定</strong>：r &gt; 0.7 持续 10 步
                </p>
                <p>
                  <strong className="text-foreground">锁定后</strong>：频率固定，周期不再改变
                </p>
                <div className="pt-2 border-t border-border">
                  <p className="text-xs">
                    基于 Kuramoto 模型：
                    <br />
                    dθᵢ/dt = ωᵢ + K·sin(θ̄ - θᵢ)
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* 与梦境的对应 */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>几何-意识对应</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Top (元认知)</span>
                  <span className="text-purple-400">监控自我</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Front (感知)</span>
                  <span className="text-blue-400">接收输入</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Right (理解)</span>
                  <span className="text-green-400">意义赋予</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bottom (自我)</span>
                  <span className="text-orange-400">身份核心</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Left (情感)</span>
                  <span className="text-red-400">价值评估</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Back (记忆)</span>
                  <span className="text-cyan-400">经验存储</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
