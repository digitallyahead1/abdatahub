/**
 * Next.js configuration for AB Data Hub Frontend
 * @type {import('next').NextConfig}
 */
const nextConfig = {
    reactStrictMode: true,

    // Prevent Node.js-only packages from being bundled into the Edge runtime.
    // Without this, @supabase/supabase-js and @prisma/client cause
    // MIDDLEWARE_INVOCATION_FAILED on Vercel because they use Node.js APIs
    // that are unavailable in the Edge Runtime (V8 isolates).
    serverExternalPackages: [
        '@prisma/client',
        '@supabase/supabase-js',
        '@supabase/ssr',
        '@supabase/postgrest-js',
        '@supabase/realtime-js',
        '@supabase/storage-js',
        '@supabase/auth-js',
        '@supabase/functions-js',
    ],
    eslint: {
        dirs: ['app', 'components', 'lib', 'pages', 'types', 'hooks', 'context'],
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },

    images: {
        domains: [
            'localhost',
            'cdn.abdatahub.com',
        ],
        remotePatterns: [{
            protocol: 'https',
            hostname: '**.abdatahub.com',
        }, ],
    },

    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
        NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'AB Data Hub',
    },

    headers: async() => {
        return [{
            source: '/api/:path*',
            headers: [{
                key: 'Cache-Control',
                value: 'public, max-age=0, must-revalidate',
            }, ],
        }, ]
    },

    redirects: async() => {
        return [{
            source: '/admin',
            destination: '/admin/dashboard',
            permanent: false,
        }, ]
    },

    rewrites: async() => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        return {
            beforeFiles: [{
                source: '/api/:path*',
                destination: `${apiUrl}/:path*`,
            }, ],
        }
    },
}

module.exports = nextConfig