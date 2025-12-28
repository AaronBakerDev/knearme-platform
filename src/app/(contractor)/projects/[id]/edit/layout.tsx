/**
 * Edit Page Layout - Full-width override.
 *
 * This nested layout breaks out of the parent contractor layout's
 * `container mx-auto` max-width constraint using the CSS breakout pattern:
 * - `w-screen` sets width to 100vw (full viewport width)
 * - `margin-left: calc(50% - 50vw)` shifts element to align with viewport edge
 *
 * This allows the three-panel workspace (history sidebar, chat, canvas) to
 * span the full viewport width on desktop.
 *
 * @see /docs/ai-sdk/chat-artifacts-spec.md
 */

export default function EditPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 top-14 overflow-hidden bg-background z-10"
    >
      {children}
    </div>
  );
}
