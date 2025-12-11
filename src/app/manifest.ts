/**
 * PWA Web App Manifest Configuration.
 *
 * Defines how the app appears when installed on a device:
 * - App name and icons
 * - Theme colors and display mode
 * - Start URL and scope
 *
 * Icons are provided as SVG files in /public/icons/. For production,
 * convert to PNG using: npx sharp-cli -i public/icons/*.svg -o public/icons/
 * Or use an online tool like realfavicongenerator.net
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest
 * @see https://web.dev/add-manifest/
 */

import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'KnearMe Portfolio',
    short_name: 'KnearMe',
    description: 'AI-powered portfolio platform for masonry contractors. Build professional project showcases in minutes.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#18181b', // zinc-900 - matches the dark header
    orientation: 'portrait-primary',
    scope: '/',
    icons: [
      {
        src: '/icons/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
      },
      {
        src: '/icons/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
      },
      {
        src: '/icons/icon-maskable-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
    // Screenshots are optional - uncomment when screenshots are available
    // screenshots: [
    //   {
    //     src: '/screenshots/dashboard.png',
    //     sizes: '1280x720',
    //     type: 'image/png',
    //     form_factor: 'wide',
    //     label: 'Contractor Dashboard',
    //   },
    //   {
    //     src: '/screenshots/project-creation.png',
    //     sizes: '390x844',
    //     type: 'image/png',
    //     form_factor: 'narrow',
    //     label: 'Project Creation Flow',
    //   },
    // ],
    categories: ['business', 'productivity'],
    shortcuts: [
      {
        name: 'New Project',
        short_name: 'New',
        description: 'Create a new portfolio project',
        url: '/projects/new',
        icons: [{ src: '/icons/shortcut-new.svg', sizes: '96x96', type: 'image/svg+xml' }],
      },
      {
        name: 'My Projects',
        short_name: 'Projects',
        description: 'View all your projects',
        url: '/projects',
        icons: [{ src: '/icons/shortcut-projects.svg', sizes: '96x96', type: 'image/svg+xml' }],
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
  };
}
