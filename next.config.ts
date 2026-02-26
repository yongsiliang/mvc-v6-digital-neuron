import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // outputFileTracingRoot: path.resolve(__dirname, '../../'),
  /* config options here */
  allowedDevOrigins: ['*.dev.coze.site'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lf-coze-web-cdn.coze.cn',
        pathname: '/**',
      },
    ],
  },
  
  // Turbopack 配置（Next.js 16 默认使用 Turbopack）
  turbopack: {},
  
  // TensorFlow.js 原生模块配置
  webpack: (config, { isServer }) => {
    // 排除 TensorFlow.js 的原生模块，只在服务端使用
    if (isServer) {
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push('@tensorflow/tfjs-node');
      }
    }
    
    // 处理 node 原生模块
    config.resolve = config.resolve || {};
    config.resolve.fallback = config.resolve.fallback || {};
    
    // 不在客户端 polyfill 这些模块
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
      crypto: false,
      stream: false,
      http: false,
      https: false,
      zlib: false,
      util: false,
      buffer: false,
    };
    
    return config;
  },
  
  // 实验性功能：支持服务端组件使用原生模块
  experimental: {
    serverComponentsExternalPackages: ['@tensorflow/tfjs-node'],
  },
};

export default nextConfig;
