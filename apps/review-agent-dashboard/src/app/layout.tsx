import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { Providers } from '@/components/providers'
import { Sidebar } from '@/components/dashboard/Sidebar'

export const metadata: Metadata = {
  title: 'Review Agent Dashboard | KnearMe',
  description: 'Monitor and manage the contractor review analysis pipeline',
}

/**
 * Root layout component.
 * Provides dark mode by default, Geist fonts (matching knearme-portfolio),
 * sidebar navigation, and TanStack Query provider for data fetching.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 px-4 pb-8 pt-20 sm:px-6 lg:ml-64 lg:p-8 lg:pt-8">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
