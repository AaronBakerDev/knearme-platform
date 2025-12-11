"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Dark-only theme provider.
 *
 * Keeps the next-themes context for components that call useTheme (for example
 * the Sonner toaster) while locking the UI to dark mode everywhere.
 *
 * Configuration:
 * - attribute="class" - Adds .dark class to <html> (reinforces dark variants)
 * - forcedTheme="dark" - No light/system option
 * - disableTransitionOnChange - Prevents flash during hydration
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      forcedTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
