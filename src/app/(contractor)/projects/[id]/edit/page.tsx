import { redirect } from 'next/navigation';
import { use } from 'react';

/**
 * Legacy Edit Page Redirect.
 *
 * Redirects /projects/[id]/edit to /projects/[id] for backward compatibility.
 * The unified project workspace at /projects/[id] now handles both new and
 * existing projects by deriving behavior from project state.
 *
 * @deprecated Use /projects/[id] directly
 * @see /src/app/(contractor)/projects/[id]/page.tsx for unified workspace
 */

type PageParams = {
  params: Promise<{ id: string }>;
};

export default function LegacyEditRedirect({ params }: PageParams) {
  const { id } = use(params);
  redirect(`/projects/${id}`);
}
