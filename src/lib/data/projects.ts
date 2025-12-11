
export type RelatedProject = {
    id: string;
    title: string | null;
    slug: string | null;
    city_slug: string | null;
    city: string | null;
    project_type_slug: string | null;
    project_type: string | null;
    contractor_id: string;
    contractor_business_name?: string;
    cover_image?: {
        storage_path: string;
        alt_text: string | null;
    };
};

/**
 * Server-side helper to fetch related projects with diverse matching.
 *
 * Algorithm:
 * 1. Fetch projects from same contractor (limit 2)
 * 2. Fetch projects of same type in different cities (limit 2)
 * 3. Fetch projects of different types in same city (limit 2)
 * 4. Deduplicate and return up to `limit` projects
 *
 * @param supabase - Supabase client
 * @param currentProject - The current project to find related projects for
 * @param limit - Maximum number of related projects to return
 */
export async function fetchRelatedProjects(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: any,
    currentProject: {
        id: string;
        contractor_id: string;
        city_slug: string;
        project_type_slug: string;
    },
    limit: number = 6
): Promise<RelatedProject[]> {
    const { id, contractor_id, city_slug, project_type_slug } = currentProject;

    // Fetch all potential related projects in one query for efficiency
    const { data } = await supabase
        .from('projects')
        .select(`
      id, title, slug, city_slug, city, project_type_slug, project_type, contractor_id,
      contractor:contractors(business_name),
      project_images(storage_path, alt_text, display_order)
    `)
        .eq('status', 'published')
        .neq('id', id)
        .or(`contractor_id.eq.${contractor_id},city_slug.eq.${city_slug},project_type_slug.eq.${project_type_slug}`)
        .order('published_at', { ascending: false })
        .limit(20);

    if (!data) return [];

    // Type the raw data
    type RawProject = {
        id: string;
        title: string | null;
        slug: string | null;
        city_slug: string | null;
        city: string | null;
        project_type_slug: string | null;
        project_type: string | null;
        contractor_id: string;
        contractor: { business_name: string } | null;
        project_images: Array<{ storage_path: string; alt_text: string | null; display_order: number }>;
    };

    const projects = data as RawProject[];

    // Categorize projects
    const sameContractor: RelatedProject[] = [];
    const sameTypeOtherCity: RelatedProject[] = [];
    const sameCityOtherType: RelatedProject[] = [];

    projects.forEach((p) => {
        // Get cover image (first by display_order)
        const sortedImages = [...(p.project_images || [])].sort(
            (a, b) => a.display_order - b.display_order
        );
        const coverImage = sortedImages[0];

        const relatedProject: RelatedProject = {
            id: p.id,
            title: p.title,
            slug: p.slug,
            city_slug: p.city_slug,
            city: p.city,
            project_type_slug: p.project_type_slug,
            project_type: p.project_type,
            contractor_id: p.contractor_id,
            contractor_business_name: p.contractor?.business_name || undefined,
            cover_image: coverImage ? {
                storage_path: coverImage.storage_path,
                alt_text: coverImage.alt_text,
            } : undefined,
        };

        if (p.contractor_id === contractor_id) {
            sameContractor.push(relatedProject);
        } else if (p.project_type_slug === project_type_slug && p.city_slug !== city_slug) {
            sameTypeOtherCity.push(relatedProject);
        } else if (p.city_slug === city_slug && p.project_type_slug !== project_type_slug) {
            sameCityOtherType.push(relatedProject);
        }
    });

    // Build diverse result set
    const result: RelatedProject[] = [];
    const seen = new Set<string>();

    // Add up to 2 from same contractor
    for (const p of sameContractor.slice(0, 2)) {
        if (!seen.has(p.id)) {
            result.push(p);
            seen.add(p.id);
        }
    }

    // Add up to 2 from same type, different city
    for (const p of sameTypeOtherCity.slice(0, 2)) {
        if (!seen.has(p.id) && result.length < limit) {
            result.push(p);
            seen.add(p.id);
        }
    }

    // Add up to 2 from same city, different type
    for (const p of sameCityOtherType.slice(0, 2)) {
        if (!seen.has(p.id) && result.length < limit) {
            result.push(p);
            seen.add(p.id);
        }
    }

    // Fill remaining slots with any other projects
    const allRemaining = [...sameContractor, ...sameTypeOtherCity, ...sameCityOtherType];
    for (const p of allRemaining) {
        if (!seen.has(p.id) && result.length < limit) {
            result.push(p);
            seen.add(p.id);
        }
    }

    return result;
}
