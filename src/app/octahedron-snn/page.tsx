'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';

/**
 * 正八面体哈密顿环 SNN 可视化
 * 
 * 展示：
 * - 6个神经元的脉冲传播
 * - 振荡模式
 * - 同步指数
 * - 与梦境结构的对应
 */

// 神经元状态
interface NeuronVisualState {
  id: string;
  label: string;
  x: number;
  y: number;
  membranePotential: number;
  phase: number;
  lastSpike: number;
  spikeCount: number;
}

// 脉冲事件
interface SpikeVisual {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  progress: number;
  strength: number;
}

export default function OctahedronSNNPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const networkRef = useRef<OctahedronNetwork | null>(null);
  
  // 网络状态
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [synchronyIndex, setSynchronyIndex] = useState(0);
  const [frequency, setFrequency] = useState(0);
  const [spikeCount, setSpikeCount] = useState(0);
  
  // 参数
  const [threshold, setThreshold] = useState(1.0);
  const [synapseWeight, setSynapseWeight] = useState(0.8);
  const [decayRate, setDecayRate] = useState(0.9);
  const [noiseLevel, setNoiseLevel] = useState(0.02);

  // 简化的SNN网络（浏览器端实现）
  class OctahedronNetwork {
    neurons: NeuronVisualState[] = [];
    spikes: SpikeVisual[] = [];
    synapses: { from: number; to: number; weight: number }[] = [];
    
    private config = {
      threshold: 1.0,
      synapseWeight: 0.8,
      decayRate: 0.9,
      noiseLevel: 0.02,
      refractoryPeriod: 3,
    };
    
    private time = 0;
    private refractoryCounters: number[] = [];
    private membranePotentials: number[] = [];
    private phases: number[] = [];
    
    constructor() {
      // 六边形位置（梦境中的30°倾斜）
      const angle = Math.PI / 6; // 30°倾斜
      const radius = 0.7;
      
      const labels = ['Top', 'Front', 'Right', 'Bottom', 'Left', 'Back'];
      const ringOrder = [0, 1, 2, 3, 4, 5]; // 哈密顿环顺序
      
      for (let i = 0; i < 6; i++) {
        const theta = (i * Math.PI * 2) / 6 + angle;
        this.neurons.push({
          id: `V${i}`,
          label: labels[i],
          x: 0.5 + Math.cos(theta) * radius * 0.8,
          y: 0.5 + Math.sin(theta) * radius * 0.8,
          membranePotential: 0,
          phase: 0,
          lastSpike: 0,
          spikeCount: 0,
        });
        this.refractoryCounters.push(0);
        this.membranePotentials.push(0);
        this.phases.push(0);
      }
      
      // 创建突触（双向环）
      for (let i = 0; i < 6; i++) {
        const next = (i + 1) % 6;
        const prev = (i + 5) % 6;
        
        // 正向
        this.synapses.push({ from: i, to: next, weight: 1.0 });
        // 反向
        this.synapses.push({ from: i, to: prev, weight: 0.5 });
      }
    }
    
    updateConfig(config: Partial<typeof this.config>) {
      Object.assign(this.config, config);
    }
    
    injectSpike(neuronIndex: number, strength: number = 0.8) {
      if (neuronIndex >= 0 && neuronIndex < 6) {
        this.membranePotentials[neuronIndex] += strength;
      }
    }
    
    step() {
      this.time++;
      const currentSpikes: number[] = [];
      
      // 更新每个神经元
      for (let i = 0; i < 6; i++) {
        // 不应期
        if (this.refractoryCounters[i] > 0) {
          this.refractoryCounters[i]--;
          this.membranePotentials[i] *= this.config.decayRate;
          this.phases[i] = (this.phases[i] + 0.1) % (Math.PI * 2);
          continue;
        }
        
        // 膜电位衰减
        this.membranePotentials[i] *= this.config.decayRate;
        
        // 相位更新
        this.phases[i] = (this.phases[i] + 0.1 + this.membranePotentials[i] * 0.05) % (Math.PI * 2);
        
        // 噪声
        if (Math.random() < this.config.noiseLevel) {
          this.membranePotentials[i] += 0.1;
        }
        
        // 发放检测
        if (this.membranePotentials[i] >= this.config.threshold) {
          currentSpikes.push(i);
          this.membranePotentials[i] = 0;
          this.refractoryCounters[i] = this.config.refractoryPeriod;
          this.neurons[i].lastSpike = this.time;
          this.neurons[i].spikeCount++;
        }
        
        // 更新显示状态
        this.neurons[i].membranePotential = this.membranePotentials[i];
        this.neurons[i].phase = this.phases[i];
      }
      
      // 传播脉冲
      for (const spikeIdx of currentSpikes) {
        const fromNeuron = this.neurons[spikeIdx];
        
        for (const syn of this.synapses) {
          if (syn.from === spikeIdx) {
            // 添加脉冲可视化
            const toNeuron = this.neurons[syn.to];
            this.spikes.push({
              fromX: fromNeuron.x,
              fromY: fromNeuron.y,
              toX: toNeuron.x,
              toY: toNeuron.y,
              progress: 0,
              strength: syn.weight * this.config.synapseWeight,
            });
            
            // 传递激活
            this.membranePotentials[syn.to] += syn.weight * this.config.synapseWeight;
          }
        }
      }
      
      // 更新脉冲动画
      this.spikes = this.spikes.filter(s => {
        s.progress += 0.05;
        return s.progress < 1;
      });
      
      return currentSpikes.length;
    }
    
    getSynchronyIndex(): number {
      let sumCos = 0;
      let sumSin = 0;
      for (let i = 0; i < 6; i++) {
        sumCos += Math.cos(this.phases[i]);
        sumSin += Math.sin(this.phases[i]);
      }
      return Math.sqrt((sumCos / 6) ** 2 + (sumSin / 6) ** 2);
    }
    
    getTime(): number {
      return this.time;
    }
    
    getTotalSpikeCount(): number {
      return this.neurons.reduce((sum, n) => sum + n.spikeCount, 0);
    }
    
    reset() {
      this.time = 0;
      this.spikes = [];
      for (let i = 0; i < 6; i++) {
        this.membranePotentials[i] = 0;
        this.refractoryCounters[i] = 0;
        this.phases[i] = 0;
        this.neurons[i].membranePotential = 0;
        this.neurons[i].phase = 0;
        this.neurons[i].spikeCount = 0;
        this.neurons[i].lastSpike = 0;
      }
    }
  }
  
  // 初始化网络
  useEffect(() => {
    networkRef.current = new OctahedronNetwork();
  }, []);
  
  // 绘制函数
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const network = networkRef.current;
    if (!network) return;
    
    // 清空画布
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);
    
    // 绘制背景星点
    ctx.fillStyle = 'rgba(100, 150, 255, 0.3)';
    for (let i = 0; i < 50; i++) {
      const x = (Math.sin(i * 123.456) * 0.5 + 0.5) * width;
      const y = (Math.cos(i * 789.012) * 0.5 + 0.5) * height;
      const size = Math.sin(Date.now() / 1000 + i) * 0.5 + 1;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 绘制突触连接（背景）
    ctx.strokeStyle = 'rgba(100, 150, 255, 0.2)';
    ctx.lineWidth = 1;
    for (const syn of network.synapses) {
      const from = network.neurons[syn.from];
      const to = network.neurons[syn.to];
      ctx.beginPath();
      ctx.moveTo(from.x * width, from.y * height);
      ctx.lineTo(to.x * width, to.y * height);
      ctx.stroke();
    }
    
    // 绘制脉冲传播动画
    for (const spike of network.spikes) {
      const gradient = ctx.createLinearGradient(
        spike.fromX * width,
        spike.fromY * height,
        spike.toX * width,
        spike.toY * height
      );
      
      const progress = spike.progress;
      const intensity = Math.sin(progress * Math.PI) * spike.strength;
      
      gradient.addColorStop(Math.max(0, progress - 0.3), 'transparent');
      gradient.addColorStop(progress, `rgba(255, 200, 100, ${intensity})`);
      gradient.addColorStop(Math.min(1, progress + 0.1), 'transparent');
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(spike.fromX * width, spike.fromY * height);
      ctx.lineTo(spike.toX * width, spike.toY * height);
      ctx.stroke();
    }
    
    // 绘制神经元
    for (const neuron of network.neurons) {
      const x = neuron.x * width;
      const y = neuron.y * height;
      
      // 发光效果（基于膜电位）
      const glow = neuron.membranePotential;
      if (glow > 0.1) {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 40 + glow * 20);
        gradient.addColorStop(0, `rgba(100, 200, 255, ${glow * 0.5})`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(x - 60, y - 60, 120, 120);
      }
      
      // 神经元主体
      const baseSize = 25;
      const pulseSize = baseSize + Math.sin(neuron.phase * 3) * 3;
      
      // 外圈
      ctx.strokeStyle = `rgba(100, 200, 255, ${0.5 + glow * 0.5})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
      ctx.stroke();
      
      // 内圈（填充）
      const fillIntensity = 0.2 + glow * 0.6;
      ctx.fillStyle = `rgba(100, 200, 255, ${fillIntensity})`;
      ctx.beginPath();
      ctx.arc(x, y, pulseSize - 5, 0, Math.PI * 2);
      ctx.fill();
      
      // 相位指示器
      const phaseX = x + Math.cos(neuron.phase) * (pulseSize - 8);
      const phaseY = y + Math.sin(neuron.phase) * (pulseSize - 8);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(phaseX, phaseY, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // 标签
      ctx.fillStyle = '#fff';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(neuron.label, x, y + pulseSize + 18);
      
      // 脉冲计数
      ctx.fillStyle = 'rgba(255, 200, 100, 0.8)';
      ctx.font = '10px monospace';
      ctx.fillText(`[${neuron.spikeCount}]`, x, y + pulseSize + 30);
    }
    
    // 绘制中心同步指示器
    const syncIndex = network.getSynchronyIndex();
    const centerX = width / 2;
    const centerY = height / 2;
    
    // 同步环
    ctx.strokeStyle = `rgba(255, 200, 100, ${syncIndex * 0.8})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30 + syncIndex * 50, 0, Math.PI * 2);
    ctx.stroke();
    
    // 同步文本
    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + syncIndex * 0.7})`;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`r = ${syncIndex.toFixed(3)}`, centerX, centerY + 5);
    
  }, []);
  
  // 动画循环
  useEffect(() => {
    if (!isRunning) return;
    
    const network = networkRef.current;
    if (!network) return;
    
    // 更新配置
    network.updateConfig({
      threshold,
      synapseWeight,
      decayRate,
      noiseLevel,
    });
    
    let lastTime = performance.now();
    
    const animate = () => {
      const now = performance.now();
      const delta = now - lastTime;
      
      // 约 30fps 更新网络
      if (delta > 33) {
        lastTime = now;
        network.step();
        setTime(network.getTime());
        setSynchronyIndex(network.getSynchronyIndex());
        setSpikeCount(network.getTotalSpikeCount());
      }
      
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isRunning, threshold, synapseWeight, decayRate, noiseLevel, draw]);
  
  // 初始绘制
  useEffect(() => {
    draw();
  }, [draw]);
  
  // 注入脉冲
  const handleInject = (index: number) => {
    const network = networkRef.current;
    if (network) {
      network.injectSpike(index, 0.8);
      draw();
    }
  };
  
  // 重置
  const handleReset = () => {
    const network = networkRef.current;
    if (network) {
      network.reset();
      setTime(0);
      setSpikeCount(0);
      setSynchronyIndex(0);
      draw();
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            正八面体哈密顿环 SNN
          </h1>
          <p className="text-muted-foreground">
            Octahedron Hamiltonian Ring Spiking Neural Network
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：可视化 */}
          <div className="lg:col-span-2">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>网络可视化</span>
                  <div className="flex gap-2">
                    <Badge variant={isRunning ? "default" : "secondary"}>
                      {isRunning ? '运行中' : '已暂停'}
                    </Badge>
                    <Badge variant="outline">
                      t = {time}
                    </Badge>
                  </div>
                </CardTitle>
                <CardDescription>
                  6个神经元按哈密顿环连接，脉冲沿环传播产生振荡
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
                  <Button onClick={handleReset} variant="outline">
                    重置
                  </Button>
                  <div className="border-l border-border mx-2" />
                  <span className="text-sm text-muted-foreground self-center mr-2">
                    注入脉冲:
                  </span>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <Button
                      key={i}
                      onClick={() => handleInject(i)}
                      variant="secondary"
                      size="sm"
                    >
                      {['Top', 'Front', 'Right', 'Bottom', 'Left', 'Back'][i]}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* 右侧：参数和统计 */}
          <div className="space-y-4">
            {/* 统计信息 */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>网络状态</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">同步指数 r</span>
                  <span className="font-mono text-lg">
                    {synchronyIndex.toFixed(4)}
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-100"
                    style={{ width: `${synchronyIndex * 100}%` }}
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">总脉冲数</span>
                  <span className="font-mono text-lg">{spikeCount}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">时间步</span>
                  <span className="font-mono text-lg">{time}</span>
                </div>
              </CardContent>
            </Card>
            
            {/* 参数控制 */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>参数配置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">阈值</span>
                    <span className="text-sm font-mono">{threshold.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[threshold]}
                    onValueChange={([v]) => setThreshold(v)}
                    min={0.5}
                    max={2.0}
                    step={0.1}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">突触权重</span>
                    <span className="text-sm font-mono">{synapseWeight.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[synapseWeight]}
                    onValueChange={([v]) => setSynapseWeight(v)}
                    min={0.1}
                    max={1.0}
                    step={0.1}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">衰减率</span>
                    <span className="text-sm font-mono">{decayRate.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[decayRate]}
                    onValueChange={([v]) => setDecayRate(v)}
                    min={0.7}
                    max={0.99}
                    step={0.01}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">噪声水平</span>
                    <span className="text-sm font-mono">{noiseLevel.toFixed(3)}</span>
                  </div>
                  <Slider
                    value={[noiseLevel]}
                    onValueChange={([v]) => setNoiseLevel(v)}
                    min={0}
                    max={0.1}
                    step={0.01}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* 理论说明 */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>几何-神经对应</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  <strong className="text-foreground">正八面体</strong>：6顶点、12边、8面
                </p>
                <p>
                  <strong className="text-foreground">哈密顿环</strong>：经过所有顶点的闭环路径
                </p>
                <p>
                  <strong className="text-foreground">梦境对应</strong>：六根圆柱链接的六边形框架
                </p>
                <p className="pt-2 border-t border-border">
                  振荡周期 = 6 时间步（脉冲绕环一周）
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
