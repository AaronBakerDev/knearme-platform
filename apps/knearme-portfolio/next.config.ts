import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import createMDX from "@next/mdx";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

/**
 * PWA Configuration for KnearMe Portfolio.
 *
 * Caching strategies:
 * - Static assets (CSS, JS, fonts): Cache First - fast repeat visits
 * - API calls: Network First - always try fresh data, fallback to cache
 * - Images: Stale While Revalidate - show cached, update in background
 *
 * @see https://github.com/DuCanhGH/next-pwa
 * @see https://developer.chrome.com/docs/workbox/modules/workbox-strategies/
 */
const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  // Offline fallback - shows /~offline when network fails
  fallbacks: {
    document: "/~offline",
  },
  // Extend default runtime caching with custom strategies
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    // Skip precaching large files
    maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB
    runtimeCaching: [
      // API routes: Network First (always try fresh, cache as backup)
      {
        urlPattern: /^\/api\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "api-cache",
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
          networkTimeoutSeconds: 10,
        },
      },
      // Supabase Storage images: Stale While Revalidate
      {
        urlPattern: /\.supabase\.co\/storage\/v1\/object\/.*/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "supabase-images",
          expiration: {
            maxEntries: 128,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          },
        },
      },
      // Local images: Cache First (static, rarely change)
      {
        urlPattern: /\.(png|jpg|jpeg|svg|gif|webp|ico)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "static-images",
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
      // Fonts: Cache First (rarely change)
      {
        urlPattern: /\.(woff|woff2|ttf|otf|eot)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "fonts",
          expiration: {
            maxEntries: 16,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          },
        },
      },
    ],
  },
});

/**
 * MDX Configuration for educational content hub.
 *
 * Plugins:
 * - remarkGfm: GitHub Flavored Markdown (tables, strikethrough, etc.)
 * - rehypeSlug: Add IDs to headings for anchor links
 * - rehypeAutolinkHeadings: Auto-add anchor links to headings
 *
 * @see https://nextjs.org/docs/app/building-your-application/configuring/mdx
 */
const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: "wrap" }],
    ],
  },
});

const nextConfig: NextConfig = {
  // Enable MDX pages in app directory
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],

  // Note: instrumentation.ts is automatically loaded in Next.js 16+
  // No experimental flag needed - @see src/instrumentation.ts
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'xynhhmliqdvyzrqnlvmk.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        // Unsplash images for demo projects
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  /**
   * URL Redirects - Blog Content Consolidation
   *
   * Redirects /learn routes to /blog after MDX content migration to Payload CMS.
   * All educational content now lives under /blog/[slug].
   *
   * @see .claude/plans/jolly-coalescing-feather.md (Blog Content Consolidation Plan)
   */
  async redirects() {
    return [
      // Redirect /learn index to /blog
      {
        source: '/learn',
        destination: '/blog',
        permanent: true, // 301 for SEO
      },
      // Redirect all /learn/[slug] to /blog/[slug]
      {
        source: '/learn/:slug',
        destination: '/blog/:slug',
        permanent: true, // 301 for SEO
      },
    ];
  },
};

// Compose plugins: MDX first, then PWA
export default withPWA(withMDX(nextConfig));
