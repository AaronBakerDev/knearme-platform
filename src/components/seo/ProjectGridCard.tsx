import Image from 'next/image';
import Link from 'next/link';
import { Building2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge, Card, CardContent } from '@/components/ui';
import { cn } from '@/lib/utils';

const DEFAULT_BLUR_DATA =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMSAxIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4=';

interface ProjectGridCardProps {
  href: string;
  title: string;
  imageUrl?: string;
  imageAlt?: string | null;
  badgeLabel?: string;
  subtitle?: string;
  meta?: ReactNode;
  imageAspectClassName?: string;
  cardClassName?: string;
}

export function ProjectGridCard({
  href,
  title,
  imageUrl,
  imageAlt,
  badgeLabel,
  subtitle,
  meta,
  imageAspectClassName = 'aspect-video',
  cardClassName,
}: ProjectGridCardProps) {
  return (
    <Link href={href} className="group">
      <Card className={cn(
        'overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 h-full border-0 bg-card',
        cardClassName
      )}>
        <div className={cn('relative bg-muted overflow-hidden', imageAspectClassName)}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt || title || 'Project'}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              placeholder="blur"
              blurDataURL={DEFAULT_BLUR_DATA}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <Building2 className="h-12 w-12" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          {meta ?? (
            (badgeLabel || subtitle) && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                {badgeLabel && (
                  <Badge variant="outline" className="text-xs">
                    {badgeLabel}
                  </Badge>
                )}
                {subtitle && (
                  <span className={cn('truncate', badgeLabel && 'ml-2')}>{subtitle}</span>
                )}
              </div>
            )
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
