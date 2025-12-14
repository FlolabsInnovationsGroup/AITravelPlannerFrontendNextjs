import withBundleAnalyzer from '@next/bundle-analyzer';

// Suppress baseline-browser-mapping warning (we have the latest version)
if (process.env.SUPPRESS_BASELINE_WARNING === 'true') {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const message = args.join(' ');
    if (message.includes('baseline-browser-mapping') && message.includes('over two months old')) {
      return; // Suppress this specific warning
    }
    originalWarn.apply(console, args);
  };
}

const nextConfig = {
  // Disable webpack cache in development to prevent chunk loading failures
  experimental: {
    // Disable webpack cache for stability in development
    webpackBuildWorker: false,
  },
  // Turbopack configuration - explicitly set root directory
  turbopack: {
    root: process.cwd(), // Use current working directory as root
  },
  // Prevent chunk loading failures with proper cache headers
  onDemandEntries: {
    // Keep pages in memory longer in development
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
  // Environment-specific configuration
  env: {
    // Ensure HTTPS API URL in production
    NEXT_PUBLIC_API_URL: process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_API_URL || 'https://api.flomadtravel.com'
      : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
    // Explicitly expose Google Maps API key to client
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  },
  // Image configuration for Next.js 15/16
  images: {
    formats: ['image/webp', 'image/avif'],
    qualities: [50, 75, 85, 90, 100], // Required for Next.js 16 compatibility
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
  webpack: (config, { isServer, webpack, dev }) => {
    // Fix chunk loading failures in development
    if (dev) {
      // Disable webpack's built-in cache in development
      config.cache = false;
      
      // Use consistent chunk naming without hashes
      config.output.filename = 'static/chunks/[name].js';
      config.output.chunkFilename = 'static/chunks/[name].js';
    }

    // Optimization settings for stable chunk loading
    config.optimization = {
      ...config.optimization,
      moduleIds: 'named', // Use readable module IDs in development
      chunkIds: 'named', // Use readable chunk IDs in development
      runtimeChunk: dev ? 'single' : false, // Single runtime chunk in dev
      // Simplified code splitting to prevent chunk loading failures
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000,
        cacheGroups: {
          default: false,
          vendors: false,
          // Framework code
          framework: {
            name: 'framework',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            priority: 40,
            enforce: true,
          },
          // Google Maps libraries
          maps: {
            name: 'maps',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](@googlemaps|@react-google-maps)[\\/]/,
            priority: 30,
            enforce: true,
          },
          // UI libraries
          ui: {
            name: 'ui',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](@radix-ui|@headlessui|framer-motion)[\\/]/,
            priority: 25,
            enforce: true,
          },
          // Shared libraries
          lib: {
            name: 'lib',
            test: /[\\/]node_modules[\\/]/,
            priority: 20,
            minChunks: 2,
            reuseExistingChunk: true,
          },
          // Application commons
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 10,
            reuseExistingChunk: true,
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