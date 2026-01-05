import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';

const DEFAULT_BLUR_DATA =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMSAxIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4=';

interface ServiceProviderCardProps {
  href: string;
  name: string;
  photoUrl?: string | null;
  subtitle?: string;
}

export function ServiceProviderCard({
  href,
  name,
  photoUrl,
  subtitle,
}: ServiceProviderCardProps) {
  const fallbackInitial = name?.charAt(0) || 'B';

  return (
    <Link href={href} className="group">
      <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-0 bg-card">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-muted ring-2 ring-background shadow-sm">
            {photoUrl ? (
              <Image
                src={photoUrl}
                alt={name || 'Business'}
                fill
                className="object-cover"
                sizes="56px"
                placeholder="blur"
                blurDataURL={DEFAULT_BLUR_DATA}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-lg">
                {fallbackInitial}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate group-hover:text-primary transition-colors">
              {name}
            </h3>
            {subtitle && (
              <p className="text-sm text-muted-foreground truncate">
                {subtitle}
              </p>
            )}
          </div>

          <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </CardContent>
      </Card>
    </Link>
  );
}
