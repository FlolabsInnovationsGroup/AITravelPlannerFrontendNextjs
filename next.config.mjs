import withBundleAnalyzer from '@next/bundle-analyzer';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack configuration (empty to silence Next.js 16 warning)
  turbopack: {},
  // Environment-specific configuration
  env: {
    // Ensure HTTPS API URL in production
    NEXT_PUBLIC_API_URL: process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_API_URL || 'https://api.flomadtravel.com'
      : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
    // Explicitly expose Google Maps API key to client
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  },
  // Image configuration for Next.js 15
  images: {
    formats: ['image/webp', 'image/avif'],
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
  webpack: (config, { isServer, webpack }) => {
    // Optimization settings
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      chunkIds: 'deterministic',
      splitChunks: {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          // Separate Google Maps libraries
          maps: {
            name: 'maps',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](@googlemaps|@react-google-maps)[\\/]/,
            priority: 30,
          },
          // Separate UI libraries
          ui: {
            name: 'ui',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](radix-ui|@headlessui|framer-motion)[\\/]/,
            priority: 25,
          },
        },
      },
    };

    return config;
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

// Bundle analyzer wrapper (enable with ANALYZE=true)
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default bundleAnalyzer(nextConfig);