'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

/**
 * 目标状态
 */
type GoalStatus = 'active' | 'completed' | 'abandoned' | 'blocked';

/**
 * 目标
 */
interface Goal {
  id: string;
  description: string;
  priority: number;
  progress: number;
  subGoals: Goal[];
  status: GoalStatus;
  createdAt: number;
  deadline?: number;
}

/**
 * 任务状态
 */
type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/**
 * 任务
 */
interface Task {
  id: string;
  description: string;
  status: TaskStatus;
  priority: number;
  assignedNeuron?: string;
  startedAt?: number;
  completedAt?: number;
}

/**
 * 计划步骤
 */
interface PlanStep {
  id: string;
  description: string;
  status: TaskStatus;
  order: number;
}

/**
 * 计划
 */
interface Plan {
  id: string;
  goalId: string;
  steps: PlanStep[];
  currentStepIndex: number;
  createdAt: number;
}

/**
 * 计划面板属性
 */
interface PlanningPanelProps {
  goals: Goal[];
  activeTasks: Task[];
  currentPlan?: Plan | null;
  className?: string;
}

const goalStatusStyles: Record<GoalStatus, { color: string; label: string }> = {
  active: { color: 'bg-[var(--neuron-active)]/20 text-[var(--neuron-active)] border-[var(--neuron-active)]/30', label: '进行中' },
  completed: { color: 'bg-[var(--signal-reward)]/20 text-[var(--signal-reward)] border-[var(--signal-reward)]/30', label: '已完成' },
  abandoned: { color: 'bg-muted/20 text-muted-foreground border-muted/30', label: '已放弃' },
  blocked: { color: 'bg-[var(--neuron-surprised)]/20 text-[var(--neuron-surprised)] border-[var(--neuron-surprised)]/30', label: '已阻塞' },
};

const taskStatusStyles: Record<TaskStatus, { color: string; icon: string }> = {
  pending: { color: 'text-muted-foreground', icon: '○' },
  in_progress: { color: 'text-[var(--neuron-active)]', icon: '◐' },
  completed: { color: 'text-[var(--signal-reward)]', icon: '●' },
  failed: { color: 'text-[var(--signal-error)]', icon: '✗' },
};

export function PlanningPanel({
  goals,
  activeTasks,
  currentPlan,
  className,
}: PlanningPanelProps) {
  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  return (
    <Card className={cn('glow-card', className)}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--neuron-predicting)] animate-pulse" />
            目标与计划
          </span>
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="outline">{activeGoals.length} 活跃</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 当前计划 */}
        {currentPlan && (
          <div className="space-y-2">
            <h4 className="text-xs text-muted-foreground uppercase">当前计划</h4>
            <div className="p-3 rounded-lg bg-muted/20 border border-muted-foreground/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">步骤进度</span>
                <span className="text-xs font-mono-nums">
                  {currentPlan.currentStepIndex + 1} / {currentPlan.steps.length}
                </span>
              </div>
              <div className="space-y-1">
                {currentPlan.steps.map((step, i) => (
                  <div
                    key={step.id}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded text-xs',
                      i < currentPlan.currentStepIndex
                        ? 'bg-[var(--signal-reward)]/10 text-[var(--signal-reward)]'
                        : i === currentPlan.currentStepIndex
                          ? 'bg-[var(--neuron-active)]/10 text-[var(--neuron-active)]'
                          : 'bg-muted/10 text-muted-foreground'
                    )}
                  >
                    <span className="w-4 text-center font-mono-nums">{i + 1}</span>
                    <span className="flex-1 truncate">{step.description}</span>
                    {i < currentPlan.currentStepIndex && <span>✓</span>}
                    {i === currentPlan.currentStepIndex && (
                      <span className="animate-pulse">▶</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 活跃目标 */}
        <div className="space-y-2">
          <h4 className="text-xs text-muted-foreground uppercase">活跃目标</h4>
          {activeGoals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">暂无活跃目标</p>
          ) : (
            <div className="space-y-2">
              {activeGoals.map(goal => (
                <div
                  key={goal.id}
                  className="p-3 rounded-lg bg-muted/20 border border-muted-foreground/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium truncate flex-1">
                      {goal.description}
                    </span>
                    <Badge className={cn('ml-2', goalStatusStyles[goal.status].color)}>
                      {goalStatusStyles[goal.status].label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={goal.progress * 100} className="h-1.5 flex-1" />
                    <span className="text-xs font-mono-nums text-muted-foreground">
                      {(goal.progress * 100).toFixed(0)}%
                    </span>
                  </div>
                  {/* 子目标 */}
                  {goal.subGoals.length > 0 && (
                    <div className="mt-2 pl-3 border-l-2 border-muted-foreground/20 space-y-1">
                      {goal.subGoals.slice(0, 3).map(subGoal => (
                        <div
                          key={subGoal.id}
                          className="flex items-center gap-2 text-xs text-muted-foreground"
                        >
                          <span>{subGoal.status === 'completed' ? '✓' : '○'}</span>
                          <span className="truncate">{subGoal.description}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 活跃任务 */}
        <div className="space-y-2">
          <h4 className="text-xs text-muted-foreground uppercase">活跃任务</h4>
          {activeTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">暂无活跃任务</p>
          ) : (
            <div className="space-y-1 max-h-[120px] overflow-y-auto">
              {activeTasks.slice(0, 5).map(task => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 p-2 rounded-md bg-muted/10 text-xs"
                >
                  <span className={taskStatusStyles[task.status].color}>
                    {taskStatusStyles[task.status].icon}
                  </span>
                  <span className="flex-1 truncate">{task.description}</span>
                  {task.assignedNeuron && (
                    <Badge variant="outline" className="text-[var(--neuron-active)] text-[10px]">
                      {task.assignedNeuron}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 执行控制面板
 */
interface ExecutivePanelProps {
  focusItems: Array<{
    id: string;
    type: string;
    priority: number;
    attention: number;
  }>;
  currentFocus?: string;
  attentionMode: 'focused' | 'divided' | 'exploratory';
  className?: string;
}

const attentionModeStyles = {
  focused: { label: '专注模式', color: 'var(--neuron-active)', icon: '🎯' },
  divided: { label: '分配模式', color: 'var(--neuron-predicting)', icon: '⚡' },
  exploratory: { label: '探索模式', color: 'var(--signal-reward)', icon: '🔍' },
};

export function ExecutivePanel({
  focusItems,
  currentFocus,
  attentionMode,
  className,
}: ExecutivePanelProps) {
  const mode = attentionModeStyles[attentionMode];

  return (
    <Card className={cn('glow-card', className)}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: mode.color }}
            />
            执行控制
          </span>
          <Badge
            variant="outline"
            style={{ borderColor: mode.color, color: mode.color }}
          >
            {mode.icon} {mode.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 当前焦点 */}
        {currentFocus && (
          <div className="p-3 rounded-lg bg-muted/20 border border-muted-foreground/10">
            <h4 className="text-xs text-muted-foreground mb-2">当前焦点</h4>
            <p className="text-sm font-medium">{currentFocus}</p>
          </div>
        )}

        {/* 注意力分配 */}
        <div className="space-y-2">
          <h4 className="text-xs text-muted-foreground uppercase">注意力分配</h4>
          {focusItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">暂无焦点项目</p>
          ) : (
            <div className="space-y-2">
              {focusItems.map(item => (
                <div key={item.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate">{item.type}</span>
                    <span className="font-mono-nums text-muted-foreground">
                      {(item.attention * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="overflow-hidden h-1.5 text-xs flex rounded-full bg-muted">
                    <div
                      className="transition-all duration-300 rounded-full"
                      style={{
                        width: `${item.attention * 100}%`,
                        backgroundColor: 'var(--neuron-active)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 生成示例计划数据
 */
export function generateSamplePlanningData() {
  const goals: Goal[] = [
    {
      id: 'goal-1',
      description: '理解用户意图并提供有意义的回应',
      priority: 0.9,
      progress: 0.65,
      status: 'active',
      subGoals: [
        {
          id: 'sub-1',
          description: '分析输入语义',
          priority: 0.8,
          progress: 1.0,
          status: 'completed',
          subGoals: [],
          createdAt: Date.now() - 5000,
        },
        {
          id: 'sub-2',
          description: '检索相关记忆',
          priority: 0.7,
          progress: 0.5,
          status: 'active',
          subGoals: [],
          createdAt: Date.now() - 4000,
        },
        {
          id: 'sub-3',
          description: '生成响应',
          priority: 0.9,
          progress: 0,
          status: 'active',
          subGoals: [],
          createdAt: Date.now() - 3000,
        },
      ],
      createdAt: Date.now() - 10000,
    },
    {
      id: 'goal-2',
      description: '持续学习并改进预测模型',
      priority: 0.7,
      progress: 0.35,
      status: 'active',
      subGoals: [],
      createdAt: Date.now() - 60000,
    },
  ];

  const activeTasks: Task[] = [
    {
      id: 'task-1',
      description: '处理当前输入',
      status: 'in_progress',
      priority: 0.9,
      assignedNeuron: 'n-input',
      startedAt: Date.now() - 2000,
    },
    {
      id: 'task-2',
      description: '检索长期记忆',
      status: 'pending',
      priority: 0.6,
      assignedNeuron: 'n-memory',
    },
    {
      id: 'task-3',
      description: '更新预测模型',
      status: 'pending',
      priority: 0.5,
    },
  ];

  const currentPlan: Plan = {
    id: 'plan-1',
    goalId: 'goal-1',
    steps: [
      { id: 'step-1', description: '接收并解析输入', status: 'completed', order: 1 },
      { id: 'step-2', description: '语义理解与意图识别', status: 'completed', order: 2 },
      { id: 'step-3', description: '记忆检索与关联', status: 'in_progress', order: 3 },
      { id: 'step-4', description: '生成响应内容', status: 'pending', order: 4 },
      { id: 'step-5', description: '输出并学习反馈', status: 'pending', order: 5 },
    ],
    currentStepIndex: 2,
    createdAt: Date.now() - 8000,
  };

  return { goals, activeTasks, currentPlan };
}

/**
 * 生成示例执行控制数据
 */
export function generateSampleExecutiveData() {
  const focusItems = [
    { id: 'focus-1', type: '用户输入处理', priority: 0.9, attention: 0.7 },
    { id: 'focus-2', type: '记忆检索', priority: 0.7, attention: 0.5 },
    { id: 'focus-3', type: '预测更新', priority: 0.5, attention: 0.3 },
    { id: 'focus-4', type: '自我监控', priority: 0.3, attention: 0.2 },
  ];

  return {
    focusItems,
    currentFocus: '用户输入处理',
    attentionMode: 'focused' as const,
  };
}
