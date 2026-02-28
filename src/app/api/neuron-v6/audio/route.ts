/**
 * ═══════════════════════════════════════════════════════════════════════
 * 音频处理 API
 * 
 * 语音识别 (ASR) 和语音合成 (TTS)
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest } from 'next/server';
import { HeaderUtils, ASRClient, TTSClient, Config } from 'coze-coding-dev-sdk';

/**
 * POST /api/neuron-v6/audio
 * 
 * 请求体：
 * - 对于语音识别：{ action: 'recognize', audioUrl?: string, audioBase64?: string }
 * - 对于语音合成：{ action: 'synthesize', text: string, speaker?: string, speed?: number, volume?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    const headers = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();

    switch (action) {
      case 'recognize':
        return await handleRecognize(body, headers, config);
      case 'synthesize':
        return await handleSynthesize(body, headers, config);
      default:
        return new Response(
          JSON.stringify({ error: '无效的 action，支持: recognize, synthesize' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : '处理失败',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * 处理语音识别
 */
async function handleRecognize(
  body: { audioUrl?: string; audioBase64?: string },
  headers: Record<string, string>,
  config: Config
) {
  const { audioUrl, audioBase64 } = body;

  if (!audioUrl && !audioBase64) {
    return new Response(
      JSON.stringify({ error: '需要提供 audioUrl 或 audioBase64' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const asrClient = new ASRClient(config, headers);

  const result = await asrClient.recognize({
    uid: 'consciousness-v6',
    url: audioUrl,
    base64Data: audioBase64,
  });

  return new Response(
    JSON.stringify({
      success: true,
      text: result.text,
      duration: result.duration,
      utterances: result.utterances,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * 处理语音合成
 */
async function handleSynthesize(
  body: {
    text: string;
    speaker?: string;
    speed?: number;
    volume?: number;
    format?: 'mp3' | 'pcm' | 'ogg_opus';
    sampleRate?: 8000 | 16000 | 22050 | 24000 | 32000 | 44100 | 48000;
  },
  headers: Record<string, string>,
  config: Config
) {
  const { text, speaker, speed, volume, format, sampleRate } = body;

  if (!text) {
    return new Response(
      JSON.stringify({ error: 'text 是必需的' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const ttsClient = new TTSClient(config, headers);

  const result = await ttsClient.synthesize({
    uid: 'consciousness-v6',
    text,
    speaker: speaker || 'zh_female_xiaohe_uranus_bigtts',
    speechRate: speed || 0,
    loudnessRate: volume || 0,
    audioFormat: format || 'mp3',
    sampleRate: sampleRate || 24000,
  });

  return new Response(
    JSON.stringify({
      success: true,
      audioUri: result.audioUri,
      audioSize: result.audioSize,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * GET /api/neuron-v6/audio
 * 获取可用声音列表
 */
export async function GET() {
  return new Response(
    JSON.stringify({
      actions: [
        { action: 'recognize', description: '语音识别' },
        { action: 'synthesize', description: '语音合成' },
      ],
      voices: [
        {
          id: 'zh_female_xiaohe_uranus_bigtts',
          name: '小荷',
          gender: 'female',
          category: 'general',
          description: '通用女声，默认选择',
        },
        {
          id: 'zh_female_vv_uranus_bigtts',
          name: 'Vivi',
          gender: 'female',
          category: 'general',
          description: '中英双语女声',
        },
        {
          id: 'zh_male_m191_uranus_bigtts',
          name: '云舟',
          gender: 'male',
          category: 'general',
          description: '通用男声',
        },
        {
          id: 'zh_male_taocheng_uranus_bigtts',
          name: '小天',
          gender: 'male',
          category: 'general',
          description: '通用男声',
        },
        {
          id: 'zh_female_xueayi_saturn_bigtts',
          name: '雪阿姨',
          gender: 'female',
          category: 'audiobook',
          description: '儿童有声书',
        },
        {
          id: 'zh_male_dayi_saturn_bigtts',
          name: '大义',
          gender: 'male',
          category: 'video',
          description: '视频配音',
        },
        {
          id: 'zh_female_mizai_saturn_bigtts',
          name: '米兹',
          gender: 'female',
          category: 'video',
          description: '视频配音',
        },
        {
          id: 'saturn_zh_female_keainvsheng_tob',
          name: '可爱女生',
          gender: 'female',
          category: 'roleplay',
          description: '角色扮演',
        },
        {
          id: 'saturn_zh_male_shuanglangshaonian_tob',
          name: '爽朗少年',
          gender: 'male',
          category: 'roleplay',
          description: '角色扮演',
        },
      ],
      audioFormats: [
        { format: 'mp3', description: 'MP3 压缩音频' },
        { format: 'pcm', description: '原始 PCM 音频' },
        { format: 'ogg_opus', description: 'Ogg Opus 压缩音频' },
      ],
      sampleRates: [8000, 16000, 22050, 24000, 32000, 44100, 48000],
      constraints: {
        maxAudioDuration: '2 hours',
        maxFileSize: '100MB',
        supportedFormats: ['WAV', 'MP3', 'OGG OPUS', 'M4A'],
      },
      example: {
        recognize: {
          action: 'recognize',
          audioUrl: 'https://example.com/audio.mp3',
        },
        synthesize: {
          action: 'synthesize',
          text: '你好，欢迎来到意识系统',
          speaker: 'zh_female_xiaohe_uranus_bigtts',
          speed: 0,
          volume: 0,
        },
      },
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
