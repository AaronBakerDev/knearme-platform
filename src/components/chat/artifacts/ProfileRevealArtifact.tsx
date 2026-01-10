'use client';

/**
 * Profile reveal artifact for onboarding completion.
 *
 * Renders the "wow" moment after the business profile is saved:
 * - Business card with rating and contact info
 * - AI-synthesized bio from reviews + web content
 * - Review highlights (best quotes)
 * - Project suggestions (from reviews with photos or web portfolio)
 * - CTAs to create first project or go to dashboard
 *
 * @see /docs/specs/typeform-onboarding-spec.md - Phase 5: Reveal Artifact
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
  Quote,
  Calendar,
  Camera,
  ExternalLink,
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

  const handleProjectSuggestion = (suggestion: NonNullable<ProfileRevealData['projectSuggestions']>[number]) => {
    onAction?.({ type: 'createProjectFromSuggestion', payload: suggestion });
    // Could pre-populate project creation with suggestion data
    router.push('/projects/new');
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

      <CardContent className="space-y-6">
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
          {/* Location - show address only if provided and not hidden */}
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <span>
              {data.address && !data.hideAddress && (
                <>
                  {data.address}
                  <br />
                </>
              )}
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

        {/* Rating + Years in Business */}
        <div className="flex flex-wrap items-center gap-4">
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
          {data.yearsInBusiness && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{data.yearsInBusiness}</span>
            </div>
          )}
        </div>

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

        {/* Bio - The synthesized story */}
        {data.bio && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              About
            </p>
            <p className="text-sm leading-relaxed text-foreground/90">
              {data.bio}
            </p>
          </div>
        )}

        {/* Review Highlights */}
        {data.highlights && data.highlights.length > 0 && (
          <div className="space-y-3 pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              What Customers Say
            </p>
            <div className="space-y-2">
              {data.highlights.map((highlight, idx) => (
                <div
                  key={idx}
                  className="flex gap-2 p-3 rounded-lg bg-muted/50"
                >
                  <Quote className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm italic text-foreground/80">
                    &ldquo;{highlight}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Project Suggestions */}
        {data.projectSuggestions && data.projectSuggestions.length > 0 && (
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Projects We Found
              </p>
            </div>
            <div className="space-y-2">
              {data.projectSuggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleProjectSuggestion(suggestion)}
                  className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-sm font-medium group-hover:text-primary transition-colors">
                        {suggestion.title}
                      </p>
                      {suggestion.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {suggestion.description}
                        </p>
                      )}
                      <Badge variant="outline" className="text-xs">
                        From {suggestion.source === 'review' ? 'customer review' : 'your website'}
                      </Badge>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  </div>
                  {suggestion.imageUrls && suggestion.imageUrls.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {suggestion.imageUrls.slice(0, 3).map((url, imgIdx) => (
                        <div
                          key={imgIdx}
                          className="w-12 h-12 rounded overflow-hidden bg-muted"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`Project ${idx + 1} image ${imgIdx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {suggestion.imageUrls.length > 3 && (
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                          +{suggestion.imageUrls.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </button>
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
