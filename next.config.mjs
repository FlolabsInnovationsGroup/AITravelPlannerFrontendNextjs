/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable linting during builds for better code quality
  eslint: {
    // Remove ignoreDuringBuilds to enable linting
    dirs: ['src', 'components', 'lib', 'services', 'types'],
  },
  // Remove standalone output to fix Windows symlink issues
  // output: 'standalone', // Commented out due to Windows EPERM symlink errors
  // outputFileTracingRoot: process.cwd(),
  // Move outputFileTracingExcludes to root level (Next.js 15+ requirement)
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@swc/core-linux-x64-gnu',
      'node_modules/@swc/core-linux-x64-musl',
      'node_modules/@esbuild/darwin-x64',
      'node_modules/@esbuild/linux-x64',
    ],
  },
  webpack: (config, { isServer }) => {
    // Optimization settings
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      chunkIds: 'deterministic'
    }
    return config
  },
  async redirects() {
    return [
      {
        source: '/auth-redirect',
        destination: '/auth/callback/google',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;