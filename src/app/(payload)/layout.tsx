/**
 * Payload Admin Layout
 *
 * This layout wraps all Payload admin routes. It's separate from the main
 * app layout to avoid conflicts with Supabase auth and app styling.
 *
 * Note: RootLayout requires importMap and serverFunction which are generated
 * by Payload during build. We use handleServerFunctions utility for this.
 *
 * @see PAY-003 in PRD for acceptance criteria
 */
import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'
import React from 'react'

import config from '@payload-config'

// Import Payload admin styles
import '@payloadcms/next/css'

// Import map is generated at build time by Payload
// For MVP, we use an empty map - full integration happens during build
import type { ImportMap } from 'payload'
const importMap: ImportMap = {}

type Args = {
  children: React.ReactNode
}

/**
 * Root layout for Payload admin panel
 */
const Layout = async ({ children }: Args) => {
  return (
    <RootLayout
      config={config}
      importMap={importMap}
      // @ts-expect-error - Type mismatch between ServerFunctionHandler and ServerFunctionClient
      // This is a known issue with Payload 3.70 types, works at runtime
      serverFunction={handleServerFunctions}
    >
      {children}
    </RootLayout>
  )
}

export default Layout
