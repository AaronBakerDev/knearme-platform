/**
 * StaticMap Component
 *
 * Displays an embedded OpenStreetMap for a business location.
 * No API key required - uses OSM's free tile service.
 *
 * Features:
 * - OpenStreetMap iframe embed with marker
 * - Fallback to address search link if coordinates missing
 * - Loading state while map loads
 * - Responsive sizing with fixed height
 * - shadcn styling (rounded corners, border)
 *
 * @see https://www.openstreetmap.org/
 */

'use client';

import { useState } from 'react';
import { MapPin, ExternalLink, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface StaticMapProps {
  /** Business latitude (WGS84) */
  latitude: number | null;
  /** Business longitude (WGS84) */
  longitude: number | null;
  /** Business name for display */
  businessName: string;
  /** Business address (fallback if coordinates missing) */
  address?: string;
}

/**
 * Generates OpenStreetMap embed URL with marker
 * @see https://wiki.openstreetmap.org/wiki/Export
 */
function generateOsmEmbedUrl(lat: number, lon: number): string {
  // Calculate bounding box (approx 0.01 degrees = ~1km zoom)
  const delta = 0.005;
  const bbox = [
    lon - delta, // west
    lat - delta, // south
    lon + delta, // east
    lat + delta, // north
  ].join(',');

  // OSM embed URL format
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
}

/**
 * Generates Google Maps search URL for address
 */
function generateAddressSearchUrl(address: string): string {
  const encoded = encodeURIComponent(address);
  return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
}

/**
 * StaticMap Component - Embeds OpenStreetMap with business location marker.
 */
export function StaticMap({ latitude, longitude, businessName, address }: StaticMapProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Case 1: No coordinates and no address
  if (!latitude || !longitude) {
    if (!address) {
      return (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              Location not available for this business.
            </p>
          </CardContent>
        </Card>
      );
    }

    // Case 2: No coordinates, but address exists (show fallback link)
    const searchUrl = generateAddressSearchUrl(address);
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center space-y-4">
          <MapPin className="h-12 w-12 text-muted-foreground/40" />
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Map preview not available
            </p>
            <p className="text-xs text-muted-foreground mb-4">{address}</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <a href={searchUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              View on Google Maps
            </a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Case 3: Coordinates available - show OSM embed
  const embedUrl = generateOsmEmbedUrl(latitude, longitude);
  const viewUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;

  return (
    <Card>
      <CardContent className="p-0 relative">
        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg z-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* OpenStreetMap iframe */}
        <div className="relative w-full h-[250px] rounded-lg overflow-hidden">
          <iframe
            width="100%"
            height="250"
            frameBorder="0"
            scrolling="no"
            marginHeight={0}
            marginWidth={0}
            src={embedUrl}
            title={`Map showing location of ${businessName}`}
            onLoad={() => setIsLoading(false)}
            className="w-full h-full"
          />
        </div>

        {/* Footer with link to full map */}
        <div className="p-3 border-t bg-muted/30">
          <a
            href={viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            View larger map on OpenStreetMap
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
