import Link from 'next/link';

/**
 * Layout for authentication pages (login, signup, reset-password).
 * Provides consistent branding and minimal UI for auth flows.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Simple header with logo */}
      <header className="absolute top-0 left-0 right-0 p-4">
        <Link href="/" className="text-xl font-bold">
          KnearMe
        </Link>
      </header>

      {/* Auth content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 p-4 text-center text-sm text-muted-foreground">
        <p>
          By continuing, you agree to our{' '}
          <Link href="/terms" className="hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="hover:underline">
            Privacy Policy
          </Link>
        </p>
      </footer>
    </div>
  );
}
