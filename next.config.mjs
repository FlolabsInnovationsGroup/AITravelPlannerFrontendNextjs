/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: '/auth-redirect',
        destination: '/chat',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;