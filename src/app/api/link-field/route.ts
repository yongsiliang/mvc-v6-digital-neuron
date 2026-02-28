/**
 * 链接场 API
 * 
 * 万物皆链接，链接是存在的基本形式
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSiliconBrainV2 } from '@/lib/silicon-brain/brain-v2';

// ═══════════════════════════════════════════════════════════════════════

/**
 * GET /api/link-field
 * 
 * 获取链接场状态
 */
export async function GET(request: NextRequest) {
  try {
    const brain = getSiliconBrainV2();
    const status = brain.getLinkFieldStatus();
    
    if (!status) {
      return NextResponse.json({
        success: false,
        error: '链接场未初始化',
      }, { status: 500 });
    }
    
    // 获取模式和智慧
    const patterns = brain.getAllPatterns();
    const wisdoms = brain.getAllWisdoms();
    
    return NextResponse.json({
      success: true,
      status,
      stats: {
        links: status.linkField.particleCount,
        patterns: status.patterns.total,
        laws: status.laws.abstractLawCount,
        wisdoms: status.wisdom.total,
        avgCharge: status.linkField.avgCharge,
        avgStrength: status.patterns.avgStrength,
        avgAuthority: status.wisdom.avgAuthority,
      },
      patterns: patterns.slice(0, 10).map(p => ({
        id: p.id,
        type: p.type,
        description: p.description,
        strength: p.strength,
        phase: p.phase,
        domainCount: p.domains.length,
      })),
      wisdoms: wisdoms.slice(0, 10).map(w => ({
        id: w.id,
        summary: w.summary,
        type: w.type,
        authority: w.authority,
        domains: w.domains,
      })),
    });
    
  } catch (error) {
    console.error('[Link Field API] 获取状态失败:', error);
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 });
  }
}

/**
 * POST /api/link-field
 * 
 * 记录链接或获取指导
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const brain = getSiliconBrainV2();
    
    // 获取指导
    if (body.action === 'guidance') {
      const guidance = await brain.getWisdomGuidance(
        body.context || '',
        body.domain
      );
      
      return NextResponse.json({
        success: true,
        guidance,
      });
    }
    
    // 记录链接
    if (body.action === 'record') {
      const result = await brain.recordLink({
        type: body.type,
        source: body.source,
        target: body.target,
        context: body.context || '',
        result: body.result || 'connected',
        duration: body.duration || 0,
        retryCount: body.retryCount || 0,
        metadata: body.metadata,
      });
      
      return NextResponse.json({
        success: true,
        result: result ? {
          attracted: result.attraction.attracted,
          attractorId: result.attraction.attractorId,
          newPattern: result.attraction.newPattern ? {
            id: result.attraction.newPattern.id,
            type: result.attraction.newPattern.type,
            description: result.attraction.newPattern.description,
          } : null,
          lawUpdate: result.lawUpdate ? {
            newEdges: result.lawUpdate.newEdges.length,
            newAbstractLaws: result.lawUpdate.newAbstractLaws.length,
          } : null,
          newWisdoms: result.newWisdoms.length,
        } : null,
      });
    }
    
    // 反馈
    if (body.action === 'feedback') {
      brain.feedbackLink(
        body.wisdomId,
        body.success,
        body.context
      );
      
      return NextResponse.json({
        success: true,
        message: '反馈已记录',
      });
    }
    
    return NextResponse.json({
      success: false,
      error: '未知的操作类型',
      availableActions: ['guidance', 'record', 'feedback'],
    }, { status: 400 });
    
  } catch (error) {
    console.error('[Link Field API] 操作失败:', error);
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 });
  }
}
