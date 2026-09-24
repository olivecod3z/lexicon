import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  ...(process.env.FIREBASE_HOSTING === 'true' ? { output: 'export' as const } : { distDir: '.next-dev' }),
};

export default nextConfig;
