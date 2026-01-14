/**
 * Blog 404 Not Found Page
 *
 * Custom 404 page for the blog section (/blog/*). Displays when an article,
 * category, or author doesn't exist. Provides helpful navigation back to
 * the blog home and suggests browsing available content.
 *
 * Features:
 * - Blog-specific messaging
 * - Link to /blog for browsing articles
 * - Search suggestion
 * - Consistent styling with the blog section
 *
 * @see PAY-059 in PRD for acceptance criteria
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/not-found
 */

import Link from 'next/link'
import { ArrowLeft, BookOpen, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function BlogNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        {/* 404 Visual */}
        <div className="space-y-2">
          <div className="text-8xl font-bold text-muted-foreground/20">
            404
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Article Not Found
          </h1>
          <p className="text-muted-foreground">
            The article you&apos;re looking for doesn&apos;t exist or may have been removed.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/blog">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/blog?search=">
              <Search className="h-4 w-4 mr-2" />
              Search Articles
            </Link>
          </Button>
        </div>

        {/* Helpful Suggestion */}
        <div className="pt-6 border-t">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span>Browse our latest articles and guides</span>
          </div>
        </div>
      </div>
    </div>
  )
}
