'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'

export async function updateArticleStatus(
  id: string,
  status: 'draft' | 'published'
) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('review_articles')
    .update({ status })
    .eq('id', id)

  if (error) {
    console.error('Failed to update article status:', error)
    throw new Error('Failed to update article status')
  }

  revalidatePath('/articles')
  revalidatePath(`/articles/${id}`)
}
