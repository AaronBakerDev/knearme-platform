'use client';

/**
 * Profile reveal artifact for onboarding completion.
 *
 * Renders a celebratory summary card after the business profile is saved.
 * This is the "wow" moment where we show the user what we gathered.
 *
 * @see /docs/specs/typeform-onboarding-spec.md - Discovery Reveal feature
 */

import { useRouter } from 'next/navigation';
import {
  Star,
  MapPin,
  Phone,
  Globe,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, Button, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { ProfileRevealData } from '@/types/artifacts';

interface ProfileRevealArtifactProps {
  data: ProfileRevealData;
  onAction?: (action: { type: string; payload?: unknown }) => void;
  className?: string;
}

export function ProfileRevealArtifact({
  data,
  onAction,
  className,
}: ProfileRevealArtifactProps) {
  const router = useRouter();

  const handleCreateProject = () => {
    onAction?.({ type: 'createProject' });
    router.push('/projects/new');
  };

  const handleViewDashboard = () => {
    onAction?.({ type: 'viewDashboard' });
    router.push('/dashboard');
  };

  return (
    <Card
      className={cn(
        'overflow-hidden animate-fade-in border-primary/20 bg-gradient-to-br from-primary/5 to-background',
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-medium">Profile Complete!</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Business Name - Hero */}
        <div className="space-y-1">
          <h3 className="text-xl font-semibold tracking-tight">
            {data.businessName}
          </h3>
          {data.celebrationMessage && (
            <p className="text-sm text-muted-foreground">
              {data.celebrationMessage}
            </p>
          )}
        </div>

        {/* Contact Info */}
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <span>
              {data.address}
              <br />
              {data.city}, {data.state}
            </span>
          </div>

          {data.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span>{data.phone}</span>
            </div>
          )}

          {data.website && (
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <a
                href={data.website.startsWith('http') ? data.website : `https://${data.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline truncate"
              >
                {data.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
        </div>

        {/* Rating (if available) */}
        {data.rating && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              <span className="font-medium">{data.rating.toFixed(1)}</span>
            </div>
            {data.reviewCount && (
              <span className="text-sm text-muted-foreground">
                ({data.reviewCount} reviews)
              </span>
            )}
          </div>
        )}

        {/* Services */}
        {data.services.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Services
            </p>
            <div className="flex flex-wrap gap-1.5">
              {data.services.map((service, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="text-xs capitalize"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {service}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-2 pt-4 border-t bg-muted/30">
        <Button
          onClick={handleCreateProject}
          className="w-full"
          size="lg"
        >
          Create Your First Project
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        <Button
          onClick={handleViewDashboard}
          variant="ghost"
          className="w-full text-muted-foreground"
          size="sm"
        >
          Go to Dashboard
        </Button>
      </CardFooter>
    </Card>
  );
}
