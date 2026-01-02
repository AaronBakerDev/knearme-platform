/**
 * Project Workspace Layout - Full-width override.
 *
 * This nested layout breaks out of the parent contractor layout's
 * `container mx-auto` max-width constraint using the CSS breakout pattern:
 * - Fixed positioning spans the full viewport
 * - `top-14` accounts for the header height
 *
 * This allows the three-panel workspace (chat, canvas, form) to
 * span the full viewport width on desktop.
 *
 * @see /docs/ai-sdk/chat-artifacts-spec.md
 * @see /src/components/chat/ChatWizard.tsx for workspace implementation
 */

export default function ProjectWorkspaceLayout({
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
