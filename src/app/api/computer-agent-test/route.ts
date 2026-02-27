/**
 * Computer Agent 测试 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getComputerAgent } from '@/lib/computer-agent';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, params = {} } = body;
    
    const agent = getComputerAgent();
    
    let result: { success: boolean; data?: unknown; error?: string };
    
    switch (action) {
      case 'status': {
        const status = agent.getStatus();
        result = { success: true, data: status };
        break;
      }
      
      case 'captureScreen': {
        const captureResult = await agent.captureScreen();
        if (captureResult.success) {
          result = { success: true, data: { path: captureResult.value } };
        } else {
          result = { success: false, error: captureResult.error.message };
        }
        break;
      }
      
      case 'analyzeScreen': {
        const analyzeResult = await agent.analyzeScreen();
        if (analyzeResult.success) {
          result = { 
            success: true, 
            data: {
              description: analyzeResult.value.description,
              activeWindow: analyzeResult.value.activeWindow,
              elementsCount: analyzeResult.value.elements.length,
            }
          };
        } else {
          result = { success: false, error: analyzeResult.error.message };
        }
        break;
      }
      
      case 'listApps': {
        const listResult = await agent.listApps();
        if (listResult.success) {
          result = { 
            success: true, 
            data: listResult.value.slice(0, 10).map(a => ({ name: a.name, running: a.running }))
          };
        } else {
          result = { success: false, error: listResult.error.message };
        }
        break;
      }
      
      case 'listWindows': {
        const windowResult = await agent.listWindows();
        if (windowResult.success) {
          result = { 
            success: true, 
            data: windowResult.value.slice(0, 10).map(w => ({ id: w.id, title: w.title, app: w.appName }))
          };
        } else {
          result = { success: false, error: windowResult.error.message };
        }
        break;
      }
      
      case 'getMousePosition': {
        const posResult = await agent.getMousePosition();
        if (posResult.success) {
          result = { success: true, data: posResult.value };
        } else {
          result = { success: false, error: posResult.error.message };
        }
        break;
      }
      
      case 'moveMouse': {
        const { x, y } = params;
        const moveResult = await agent.moveMouse(x, y);
        if (moveResult.success) {
          result = { success: true, data: { x, y } };
        } else {
          result = { success: false, error: moveResult.error.message };
        }
        break;
      }
      
      case 'click': {
        const { x, y, button } = params;
        const clickResult = await agent.click(x, y, button || 'left');
        if (clickResult.success) {
          result = { success: true, data: { action: 'click', x, y, button } };
        } else {
          result = { success: false, error: clickResult.error.message };
        }
        break;
      }
      
      case 'typeText': {
        const { text } = params;
        const typeResult = await agent.typeText(text);
        if (typeResult.success) {
          result = { success: true, data: { text } };
        } else {
          result = { success: false, error: typeResult.error.message };
        }
        break;
      }
      
      case 'pressKey': {
        const { key } = params;
        const pressResult = await agent.pressKey(key);
        if (pressResult.success) {
          result = { success: true, data: { key } };
        } else {
          result = { success: false, error: pressResult.error.message };
        }
        break;
      }
      
      default:
        result = { success: false, error: `未知操作: ${action}` };
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Computer Agent Test API',
    actions: [
      'status',
      'captureScreen',
      'analyzeScreen', 
      'listApps',
      'listWindows',
      'getMousePosition',
      'moveMouse',
      'click',
      'typeText',
      'pressKey',
    ],
  });
}
