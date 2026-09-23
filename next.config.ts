/** @type {import('next').NextConfig} */
const nextConfig = {
  // ═══════════════════════════════════════════════════════════════════════════
  // 📸 OPTIMISATION DES IMAGES
  // ═══════════════════════════════════════════════════════════════════════════
  images: {
    // Note: unoptimized:true désactive l'optimisation automatique
    // Pour le SEO, il est RECOMMANDÉ de l'activer en production (remplacer par false)
    unoptimized: true,
    
    // Formats modernes (activés automatiquement quand unoptimized: false)
    formats: ['image/avif', 'image/webp'],
    
    // Tailles responsive pour différents écrans
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Domaines autorisés pour les images externes
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔒 HEADERS DE SÉCURITÉ ET PERFORMANCE
  // ═══════════════════════════════════════════════════════════════════════════
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      // Cache pour les assets statiques
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔀 REDIRECTIONS (à activer après l'achat du domaine)
  // ═══════════════════════════════════════════════════════════════════════════
  async redirects() {
    return [
      // Décommenter après l'achat du domaine wend-kabre.bf
      // {
      //   source: '/:path*',
      //   has: [
      //     {
      //       type: 'host',
      //       value: 'wend-kabre-bf.vercel.app',
      //     },
      //   ],
      //   destination: 'https://wend-kabre.bf/:path*',
      //   permanent: true,
      // },
    ];
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ⚙️ CONFIGURATION TYPESCRIPT
  // ═══════════════════════════════════════════════════════════════════════════
  typescript: {
    ignoreBuildErrors: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 📦 PACKAGES EXTERNES (Firebase Admin)
  // ═══════════════════════════════════════════════════════════════════════════
  serverExternalPackages: ['firebase-admin'],

  // ═══════════════════════════════════════════════════════════════════════════
  // 🚀 OPTIMISATIONS EXPÉRIMENTALES
  // ═══════════════════════════════════════════════════════════════════════════
  experimental: {
    // Optimiser l'import des packages volumineux
    optimizePackageImports: ['lucide-react', 'firebase', 'firebase-admin'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎯 CONFIGURATION PRODUCTION
  // ═══════════════════════════════════════════════════════════════════════════
  compress: true, // Compression Gzip/Brotli automatique
  poweredByHeader: false, // Masquer "X-Powered-By: Next.js" pour la sécurité
  reactStrictMode: true, // Mode strict React pour détecter les problèmes
  
  // Analyse du bundle (décommenter pour analyser la taille)
  // webpack: (config, { isServer }) => {
  //   if (!isServer) {
  //     config.resolve.alias = {
  //       ...config.resolve.alias,
  //       '@firebase/app': '@firebase/app',
  //     };
  //   }
  //   return config;
  // },
};

export default nextConfig;
