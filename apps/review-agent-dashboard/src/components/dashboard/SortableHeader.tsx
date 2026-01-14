import Link from 'next/link'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SortOrder = 'asc' | 'desc'

interface SortableHeaderProps {
  /** The column key used in URL params */
  column: string
  /** Display label for the header */
  label: string
  /** Currently active sort column */
  currentSort?: string
  /** Current sort order */
  currentOrder?: SortOrder
  /** Function to build the sort URL */
  buildSortUrl: (column: string, order: SortOrder) => string
  /** Additional className for the header cell */
  className?: string
  /** Text alignment */
  align?: 'left' | 'right' | 'center'
}

/**
 * Reusable sortable table header component.
 *
 * Renders a clickable header that toggles between ascending and descending sort.
 * Shows sort direction indicator when active.
 *
 * @example
 * <SortableHeader
 *   column="date"
 *   label="Date"
 *   currentSort={sort}
 *   currentOrder={order}
 *   buildSortUrl={(col, ord) => `?sort=${col}&order=${ord}`}
 * />
 */
export function SortableHeader({
  column,
  label,
  currentSort,
  currentOrder,
  buildSortUrl,
  className,
  align = 'left',
}: SortableHeaderProps) {
  const isActive = currentSort === column

  // Toggle order: if active and asc -> desc, if active and desc -> asc, if not active -> asc
  const nextOrder: SortOrder = isActive && currentOrder === 'asc' ? 'desc' : 'asc'
  const href = buildSortUrl(column, nextOrder)

  const alignClass = {
    left: 'text-left justify-start',
    right: 'text-right justify-end',
    center: 'text-center justify-center',
  }[align]

  return (
    <th className={cn('px-4 py-3 font-medium text-muted-foreground', className)}>
      <Link
        href={href}
        className={cn(
          'inline-flex items-center gap-1 hover:text-foreground transition-colors group',
          alignClass,
          isActive && 'text-foreground'
        )}
      >
        <span>{label}</span>
        <span className="w-4 h-4 flex items-center justify-center">
          {isActive ? (
            currentOrder === 'asc' ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )
          ) : (
            <ChevronsUpDown className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
          )}
        </span>
      </Link>
    </th>
  )
}

/**
 * Helper to parse sort params from URL search params
 */
export function parseSortParams(
  searchParams: { sort?: string; order?: string },
  defaultSort: string,
  defaultOrder: SortOrder = 'desc'
): { sort: string; order: SortOrder } {
  const sort = searchParams.sort || defaultSort
  const order = (searchParams.order === 'asc' || searchParams.order === 'desc')
    ? searchParams.order
    : defaultOrder
  return { sort, order }
}

/**
 * Helper to build sort URL while preserving other params
 */
export function buildSortUrlHelper(
  baseUrl: string,
  currentParams: Record<string, string | undefined>,
  column: string,
  order: SortOrder
): string {
  const merged = { ...currentParams, sort: column, order, page: '1' }
  const queryParts = Object.entries(merged)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`)
  return queryParts.length > 0 ? `${baseUrl}?${queryParts.join('&')}` : baseUrl
}
