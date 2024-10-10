/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
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