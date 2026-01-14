import { Breadcrumbs, type BreadcrumbItem } from '@/components/seo/Breadcrumbs';
import { cn } from '@/lib/utils';

interface PublicBreadcrumbHeaderProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function PublicBreadcrumbHeader({ items, className }: PublicBreadcrumbHeaderProps) {
  return (
    <header className={cn('border-b', className)}>
      <div className="container mx-auto px-4 py-4">
        <Breadcrumbs items={items} />
      </div>
    </header>
  );
}
