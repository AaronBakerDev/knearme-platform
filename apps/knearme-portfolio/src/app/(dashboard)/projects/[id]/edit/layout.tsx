/**
 * Legacy Edit Layout - Passthrough.
 *
 * This layout exists for the redirect page. It's minimal since
 * the redirect happens immediately.
 *
 * @deprecated The unified workspace is at /projects/[id]
 */

export default function LegacyEditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
