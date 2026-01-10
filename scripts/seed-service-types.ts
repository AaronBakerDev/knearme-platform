#!/usr/bin/env npx tsx
/**
 * Seed Script: Populate service_types table with masonry services.
 *
 * This script populates the `service_types` table with data from
 * SERVICE_CONTENT, enabling dynamic service catalog functionality.
 *
 * Usage:
 *   npx tsx scripts/seed-service-types.ts
 *
 * Features:
 * - Upsert pattern (safe to re-run)
 * - Extracts data from SERVICE_CONTENT
 * - Uses shared slug mappings from src/lib/services/slug-mappings.ts
 *
 * Prerequisites:
 * - SUPABASE_SERVICE_ROLE_KEY in .env.local
 * - NEXT_PUBLIC_SUPABASE_URL in .env.local
 *
 * @see supabase/migrations/032_add_service_types.sql
 * @see src/lib/services/slug-mappings.ts (shared mappings)
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { SERVICE_SLUG_MAPPINGS, SERVICE_ICONS } from '../src/lib/services/slug-mappings';

// Load .env.local from project root
config({ path: resolve(process.cwd(), '.env.local') });

/**
 * Helper to derive url_slug from service_id using shared mappings.
 */
function getUrlSlug(serviceId: string): string {
  return SERVICE_SLUG_MAPPINGS[serviceId] || serviceId;
}

/**
 * Service seed data — uses shared slug/icon mappings for consistency.
 *
 * The url_slug and icon_emoji are derived from src/lib/services/slug-mappings.ts
 * to ensure the seed script stays in sync with runtime behavior.
 */
const SERVICES = [
  {
    service_id: 'chimney-repair',
    label: 'Chimney Repair & Rebuild',
    short_description: 'Professional chimney repair, rebuilding, and restoration services from certified masonry contractors.',
    sort_order: 1,
  },
  {
    service_id: 'tuckpointing',
    label: 'Tuckpointing & Repointing',
    short_description: 'Expert tuckpointing and repointing services to restore mortar joints and extend the life of your masonry.',
    sort_order: 2,
  },
  {
    service_id: 'brick-repair',
    label: 'Brick Repair & Replacement',
    short_description: 'Comprehensive brick repair, replacement, and restoration services for walls, foundations, and structures.',
    sort_order: 3,
  },
  {
    service_id: 'stone-work',
    label: 'Stone Work & Veneer',
    short_description: 'Custom stone masonry including natural stone walls, veneer installation, and decorative stonework.',
    sort_order: 4,
  },
  {
    service_id: 'foundation-repair',
    label: 'Foundation Repair',
    short_description: 'Professional foundation repair services including crack repair, waterproofing, and structural stabilization.',
    sort_order: 5,
  },
  {
    service_id: 'restoration',
    label: 'Historic Restoration',
    short_description: 'Specialized historic masonry restoration preserving architectural heritage with period-appropriate techniques.',
    sort_order: 6,
  },
  {
    service_id: 'waterproofing',
    label: 'Waterproofing & Sealing',
    short_description: 'Professional waterproofing and sealing services for masonry walls, foundations, and structures.',
    sort_order: 7,
  },
  {
    service_id: 'efflorescence-removal',
    label: 'Efflorescence Removal',
    short_description: 'Professional efflorescence removal and prevention services for brick, stone, and concrete surfaces.',
    sort_order: 8,
  },
  {
    service_id: 'retaining-walls',
    label: 'Retaining Walls',
    short_description: 'Custom retaining wall construction using stone, block, and brick for erosion control and landscaping.',
    sort_order: 9,
  },
  {
    service_id: 'concrete-work',
    label: 'Concrete Work',
    short_description: 'Professional concrete services including flatwork, stamped concrete, and decorative concrete applications.',
    sort_order: 10,
  },
  {
    service_id: 'fireplace',
    label: 'Fireplace Construction',
    short_description: 'Custom fireplace design and construction including indoor fireplaces, outdoor fire features, and repairs.',
    sort_order: 11,
  },
  {
    service_id: 'outdoor-living',
    label: 'Outdoor Living Spaces',
    short_description: 'Complete outdoor living solutions including patios, outdoor kitchens, fire features, and hardscaping.',
    sort_order: 12,
  },
  {
    service_id: 'commercial',
    label: 'Commercial Masonry',
    short_description: 'Commercial masonry services for buildings, storefronts, and industrial facilities.',
    sort_order: 13,
  },
];

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing environment variables:');
    if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL');
    if (!serviceRoleKey) console.error('  - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  console.log('🌱 Seeding service_types table...\n');

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const service of SERVICES) {
    // Check if already exists
    const { data: existing } = await supabase
      .from('service_types')
      .select('id')
      .eq('service_id', service.service_id)
      .single();

    // Derive url_slug and icon_emoji from shared mappings
    const url_slug = getUrlSlug(service.service_id);
    const icon_emoji = SERVICE_ICONS[service.service_id] || '🔧';

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('service_types')
        .update({
          url_slug,
          label: service.label,
          short_description: service.short_description,
          icon_emoji,
          trade: 'masonry',
          sort_order: service.sort_order,
          is_published: true,
        })
        .eq('service_id', service.service_id);

      if (error) {
        console.error(`  ❌ ${service.service_id}: ${error.message}`);
        errorCount++;
      } else {
        console.log(`  ♻️  ${service.service_id} (updated)`);
        skipCount++;
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from('service_types')
        .insert({
          service_id: service.service_id,
          url_slug,
          label: service.label,
          short_description: service.short_description,
          icon_emoji,
          trade: 'masonry',
          sort_order: service.sort_order,
          is_published: true,
        });

      if (error) {
        console.error(`  ❌ ${service.service_id}: ${error.message}`);
        errorCount++;
      } else {
        console.log(`  ✅ ${service.service_id}`);
        successCount++;
      }
    }
  }

  console.log('\n📊 Summary:');
  console.log(`  ✅ Inserted: ${successCount}`);
  console.log(`  ♻️  Updated: ${skipCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);

  if (errorCount === 0) {
    console.log('\n🎉 Service types seeded successfully!');
  } else {
    console.log('\n⚠️  Some services failed to seed. Check errors above.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
