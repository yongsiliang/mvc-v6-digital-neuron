/**
 * 智慧注入 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { injectLinkFieldWisdom, getInnateWisdoms } from '@/lib/neuron-v6/link-field-wisdom';

/**
 * POST /api/link-field/inject-wisdom
 * 
 * 注入核心智慧到链接场
 */
export async function POST(request: NextRequest) {
  try {
    await injectLinkFieldWisdom();
    
    const wisdoms = getInnateWisdoms();
    
    return NextResponse.json({
      success: true,
      message: '核心智慧已注入链接场',
      injectedWisdoms: wisdoms.map(w => ({
        summary: w.summary,
        type: w.type,
        domain: w.domain,
        authority: w.authority,
      })),
    });
    
  } catch (error) {
    console.error('[智慧注入 API] 失败:', error);
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 });
  }
}

/**
 * GET /api/link-field/inject-wisdom
 * 
 * 获取先天智慧列表
 */
export async function GET(request: NextRequest) {
  const wisdoms = getInnateWisdoms();
  
  return NextResponse.json({
    success: true,
    count: wisdoms.length,
    wisdoms: wisdoms.map(w => ({
      summary: w.summary,
      type: w.type,
      domain: w.domain,
      authority: w.authority,
      contentPreview: w.content.slice(0, 200) + '...',
    })),
  });
}
