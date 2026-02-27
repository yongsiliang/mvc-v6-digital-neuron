/**
 * ═══════════════════════════════════════════════════════════════════════
 * 工具操作页面
 * Tools Page
 * 
 * 提供完整的工具操作界面
 * ═══════════════════════════════════════════════════════════════════════
 */

import { ToolPanel } from '@/components/tools/tool-panel';

export default function ToolsPage() {
  return (
    <div className="h-screen bg-background">
      <ToolPanel />
    </div>
  );
}
