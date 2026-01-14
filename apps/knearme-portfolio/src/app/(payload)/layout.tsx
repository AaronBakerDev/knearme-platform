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
 * @see https://github.com/payloadcms/payload/discussions/9769 for serverFunctions setup
 */
import type { ServerFunctionClient } from 'payload'
import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'
import React from 'react'

import config from '@payload-config'

// Import Payload admin styles
import '@payloadcms/next/css'

// Import custom admin styling
import './custom.scss'

// Import the generated import map for custom components
import { importMap } from './admin/importMap.js'

type Args = {
  children: React.ReactNode
}

/**
 * Server function wrapper for Payload admin
 * This wraps handleServerFunctions with 'use server' directive to make it
 * serializable for passing to client components.
 */
const serverFunctions: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  })
}

/**
 * Root layout for Payload admin panel
 */
const Layout = ({ children }: Args) => {
  return (
    <RootLayout
      config={config}
      importMap={importMap}
      serverFunction={serverFunctions}
    >
      {children}
    </RootLayout>
  )
}

export default Layout
