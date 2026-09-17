/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['firebase-admin'],
  // Optimize CSS chunk preloading strategy
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
