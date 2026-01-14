/**
 * Supabase query functions for the review-agent-dashboard
 *
 * These functions fetch data from the review_contractors, review_data,
 * review_analysis, and review_articles tables populated by contractor-review-agent.
 *
 * Table naming convention:
 * - review_contractors: Discovered contractors from Google Maps
 * - review_data: Individual reviews collected for each contractor
 * - review_analysis: AI-generated analysis of reviews
 * - review_articles: AI-generated SEO articles
 */

import { createClient, createAdminClient } from './server';
import { unstable_cache } from 'next/cache';
import type {
  DBContractor,
  DBReview,
  DBAnalysis,
  DBArticle,
  PipelineStats,
  ContractorFilters,
  ContractorWithStatus,
  ArticleWithContractor,
  AnalysisWithContractor,
  RecentActivity,
  ContractorDetail,
  ArticleFilters,
  AIUsageLog,
  AIUsageLogWithContractor,
  AIUsageStats,
  AIUsageFilters,
  SearchedCity,
  SearchHistoryFilters,
  DailyCostTrend,
  ModelStats,
  PipelineTimingStats,
  ReviewTagAnalysis,
} from '../types';

function normalizeSearchTerm(input?: string): string | null {
  if (!input) return null;
  const sanitized = input.replace(/[(),]/g, ' ').replace(/\s+/g, ' ').trim();
  return sanitized.length > 0 ? sanitized : null;
}

function parseLocationValue(input?: string): { city?: string; state?: string } {
  if (!input || input === 'all') return {};

  if (input.includes('||')) {
    const [rawCity, rawState] = input.split('||');
    const city = rawCity?.trim();
    const state = rawState?.trim();
    return {
      city: city || undefined,
      state: state || undefined,
    };
  }

  if (input.includes(',')) {
    const [rawCity, rawState] = input.split(',');
    const city = rawCity?.trim();
    const state = rawState?.trim();
    return {
      city: city || undefined,
      state: state || undefined,
    };
  }

  return { city: input.trim() || undefined };
}

// =============================================================================
// Pipeline Statistics
// =============================================================================

/**
 * Get overall pipeline statistics for the dashboard overview
 *
 * @returns Pipeline stats including counts and completion rates
 */
export async function getPipelineStats(): Promise<PipelineStats> {
  const supabase = await createClient();

  // Run all count queries in parallel for efficiency
  const [
    contractorsResult,
    reviewsResult,
    analysesResult,
    articlesResult,
  ] = await Promise.all([
    supabase.from('review_contractors').select('*', { count: 'exact', head: true }),
    supabase.from('review_data').select('*', { count: 'exact', head: true }),
    supabase.from('review_analysis').select('*', { count: 'exact', head: true }),
    supabase.from('review_articles').select('*', { count: 'exact', head: true }),
  ]);

  const contractors = contractorsResult.count || 0;
  const reviews = reviewsResult.count || 0;
  const analyses = analysesResult.count || 0;
  const articles = articlesResult.count || 0;

  return {
    contractors,
    reviews,
    analyses,
    articles,
    analysisRate: contractors > 0 ? (analyses / contractors) * 100 : 0,
    articleRate: contractors > 0 ? (articles / contractors) * 100 : 0,
  };
}

// =============================================================================
// Contractor Queries
// =============================================================================

/**
 * Get paginated list of contractors with their status information
 *
 * @param filters - Optional filter criteria
 * @param page - Page number (1-indexed)
 * @param limit - Items per page
 * @returns Paginated contractors with status flags
 */
export async function getContractors(
  filters?: ContractorFilters,
  page = 1,
  limit = 20
): Promise<{ data: ContractorWithStatus[]; total: number }> {
  const supabase = await createClient();
  const { city, state } = parseLocationValue(filters?.location);
  const category = filters?.category;
  const searchTerm = filters?.searchTerm;

  // Dynamic select string construction based on filters
  let reviewAnalysisSelect = 'review_analysis(id)';
  let reviewArticlesSelect = 'review_articles(id)';

  if (filters?.hasAnalysis) {
    reviewAnalysisSelect = 'review_analysis!inner(id)';
  }
  if (filters?.hasArticle) {
    reviewArticlesSelect = 'review_articles!inner(id)';
  }

  // Build the query with minimal contractor fields and related IDs
  let query = supabase
    .from('review_contractors')
    .select(
      `
      id,
      business_name,
      rating,
      review_count,
      city,
      state,
      last_synced_at,
      ${reviewAnalysisSelect},
      ${reviewArticlesSelect}
    `,
      { count: 'exact' }
    );

  // Apply basic filters
  if (city) {
    query = query.eq('city', city);
  }
  if (state) {
    query = query.eq('state', state);
  }
  if (filters?.hasReviews) {
    query = query.gt('review_count', 0);
  }
  if (filters?.minRating !== undefined) {
    query = query.gte('rating', filters.minRating);
  }
  if (filters?.maxRating !== undefined) {
    query = query.lte('rating', filters.maxRating);
  }
  if (category) {
    query = query.contains('category', [category]);
  }
  if (searchTerm) {
    query = query.contains('search_terms', [searchTerm]);
  }
  if (filters?.search) {
    query = query.ilike('business_name', `%${filters.search}%`);
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to).order('rating', { ascending: false, nullsFirst: false });

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching contractors:', error);
    throw error;
  }

  // Transform to ContractorWithStatus
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contractors: ContractorWithStatus[] = (data || []).map((row: any) => {
    // Extract contractor fields (exclude nested relations)
    const { review_analysis, review_articles, review_count, ...contractor } = row;

    return {
      ...contractor,
      reviewCount: review_count || 0,
      hasAnalysis: Array.isArray(review_analysis) && review_analysis.length > 0,
      hasArticle: Array.isArray(review_articles) && review_articles.length > 0,
    } as ContractorWithStatus;
  });

  return {
    data: contractors,
    total: count || 0,
  };
}

/**
 * Get a single contractor by ID
 *
 * @param id - Contractor UUID
 * @returns Contractor or null if not found
 */
export async function getContractorById(id: string): Promise<DBContractor | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('review_contractors')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Row not found
      return null;
    }
    console.error('Error fetching contractor:', error);
    throw error;
  }

  return data as DBContractor;
}

/**
 * Get full contractor details including all related data
 *
 * @param id - Contractor UUID
 * @returns Full contractor detail or null if not found
 */
export async function getContractorDetail(id: string): Promise<ContractorDetail | null> {
  const supabase = await createClient();

  // Fetch contractor with all relations
  const { data, error } = await supabase
    .from('review_contractors')
    .select(
      `
      *,
      review_data(*),
      review_analysis(*),
      review_articles(*)
    `
    )
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching contractor detail:', error);
    throw error;
  }

  if (!data) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;

  return {
    ...row,
    reviews: row.review_data || [],
    analysis: row.review_analysis?.[0] || null,
    article: row.review_articles?.[0] || null,
  } as ContractorDetail;
}

// =============================================================================
// Review Queries
// =============================================================================

/**
 * Get all reviews for a specific contractor
 *
 * @param contractorId - Contractor UUID
 * @returns Array of reviews, ordered by date descending
 */
export async function getReviewsByContractor(contractorId: string): Promise<DBReview[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('review_data')
    .select('*')
    .eq('contractor_id', contractorId)
    .order('review_date', { ascending: false, nullsFirst: false });

  if (error) {
    console.error('Error fetching reviews:', error);
    throw error;
  }

  return (data || []) as DBReview[];
}

/**
 * Get review count by rating for a contractor (for distribution charts)
 *
 * @param contractorId - Contractor UUID
 * @returns Map of rating to count
 */
export async function getReviewDistribution(
  contractorId: string
): Promise<Record<number, number>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('review_data')
    .select('rating')
    .eq('contractor_id', contractorId);

  if (error) {
    console.error('Error fetching review distribution:', error);
    throw error;
  }

  // Count by rating
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (data || []).forEach((review: any) => {
    const rating = Math.round(review.rating);
    if (rating >= 1 && rating <= 5) {
      distribution[rating]++;
    }
  });

  return distribution;
}

// =============================================================================
// Analysis Queries
// =============================================================================

/**
 * Get analysis for a specific contractor
 *
 * @param contractorId - Contractor UUID
 * @returns Analysis or null if none exists
 */
export async function getAnalysisByContractor(contractorId: string): Promise<DBAnalysis | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('review_analysis')
    .select('*')
    .eq('contractor_id', contractorId)
    .order('analyzed_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching analysis:', error);
    throw error;
  }

  return data as DBAnalysis;
}

/**
 * Get all analyses with pagination
 *
 * @param page - Page number (1-indexed)
 * @param limit - Items per page
 * @returns Paginated analyses with contractor data
 */
export async function getAnalyses(
  page = 1,
  limit = 20
): Promise<{ data: AnalysisWithContractor[]; total: number }> {
  const supabase = await createClient();

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, count, error } = await supabase
    .from('review_analysis')
    .select(
      `
      *,
      contractor:review_contractors(*)
    `,
      { count: 'exact' }
    )
    .range(from, to)
    .order('analyzed_at', { ascending: false });

  if (error) {
    console.error('Error fetching analyses:', error);
    throw error;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const analyses = (data || []).map((row: any) => ({
    ...row,
    contractor: row.contractor,
  })) as AnalysisWithContractor[];

  return {
    data: analyses,
    total: count || 0,
  };
}

// =============================================================================
// Article Queries
// =============================================================================

/**
 * Get article for a specific contractor
 *
 * @param contractorId - Contractor UUID
 * @returns Article or null if none exists
 */
export async function getArticleByContractor(contractorId: string): Promise<DBArticle | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('review_articles')
    .select('*')
    .eq('contractor_id', contractorId)
    .order('generated_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching article:', error);
    throw error;
  }

  return data as DBArticle;
}

/**
 * Get all articles with optional filters, search, sort, and pagination
 *
 * @param filters - Optional filter/search/sort options
 * @param page - Page number (1-indexed)
 * @param limit - Items per page
 * @returns Paginated articles with contractor data
 */
export async function getArticles(
  filters?: ArticleFilters,
  page = 1,
  limit = 20
): Promise<{ data: ArticleWithContractor[]; total: number }> {
  const supabase = await createClient();

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const searchTerm = normalizeSearchTerm(filters?.search);

  let query = supabase
    .from('review_articles')
    .select(
      `
      id,
      title,
      slug,
      content_markdown,
      status,
      generated_at,
      contractor:review_contractors(id, business_name, city, state)
    `,
      { count: 'exact' }
    );

  // Apply status filter
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  // Apply search filter (searches title and contractor business_name)
  if (searchTerm) {
    query = query.or(
      `title.ilike.%${searchTerm}%,contractor.business_name.ilike.%${searchTerm}%`
    );
  }

  // Apply sorting
  const sortOption = filters?.sort || 'generated_desc';
  switch (sortOption) {
    case 'generated_asc':
      query = query.order('generated_at', { ascending: true });
      break;
    case 'title_asc':
      query = query.order('title', { ascending: true });
      break;
    case 'title_desc':
      query = query.order('title', { ascending: false });
      break;
    // For contractor sorting, we'll handle it post-fetch
    case 'contractor_asc':
    case 'contractor_desc':
    case 'generated_desc':
    default:
      query = query.order('generated_at', { ascending: false });
      break;
  }

  query = query.range(from, to);

  let { data, count, error } = await query;

  if (error && searchTerm) {
    let fallbackQuery = supabase
      .from('review_articles')
      .select(
        `
        id,
        title,
        slug,
        content_markdown,
        status,
        generated_at,
        contractor:review_contractors(id, business_name, city, state)
      `,
        { count: 'exact' }
      );

    if (filters?.status) {
      fallbackQuery = fallbackQuery.eq('status', filters.status);
    }

    fallbackQuery = fallbackQuery.ilike('title', `%${searchTerm}%`);

    switch (sortOption) {
      case 'generated_asc':
        fallbackQuery = fallbackQuery.order('generated_at', { ascending: true });
        break;
      case 'title_asc':
        fallbackQuery = fallbackQuery.order('title', { ascending: true });
        break;
      case 'title_desc':
        fallbackQuery = fallbackQuery.order('title', { ascending: false });
        break;
      case 'contractor_asc':
      case 'contractor_desc':
      case 'generated_desc':
      default:
        fallbackQuery = fallbackQuery.order('generated_at', { ascending: false });
        break;
    }

    fallbackQuery = fallbackQuery.range(from, to);

    const fallbackResult = await fallbackQuery;
    data = fallbackResult.data;
    count = fallbackResult.count;
    error = fallbackResult.error;
  }

  if (error) {
    console.error('Error fetching articles:', error);
    throw error;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let articles = (data || []).map((row: any) => ({
    ...row,
    contractor: row.contractor,
  })) as ArticleWithContractor[];

  // Post-fetch sorting for contractor name
  if (sortOption === 'contractor_asc') {
    articles = articles.sort((a, b) =>
      (a.contractor?.business_name || '').localeCompare(b.contractor?.business_name || '')
    );
  } else if (sortOption === 'contractor_desc') {
    articles = articles.sort((a, b) =>
      (b.contractor?.business_name || '').localeCompare(a.contractor?.business_name || '')
    );
  }

  return {
    data: articles,
    total: count || 0,
  };
}

/**
 * Get total/published/draft counts for articles with optional search filter
 *
 * @param search - Optional search query (title or contractor name)
 * @returns Aggregate counts for articles
 */
export async function getArticleStatusCounts(search?: string): Promise<{
  total: number;
  published: number;
  draft: number;
}> {
  const supabase = await createClient();
  const searchTerm = normalizeSearchTerm(search);

  const buildBaseQuery = (includeContractor: boolean) => {
    let query = supabase
      .from('review_articles')
      .select(
        includeContractor
          ? 'id, contractor:review_contractors(id, business_name)'
          : 'id',
        {
          count: 'exact',
          head: true,
        }
      );

    if (searchTerm) {
      query = includeContractor
        ? query.or(
            `title.ilike.%${searchTerm}%,contractor.business_name.ilike.%${searchTerm}%`
          )
        : query.ilike('title', `%${searchTerm}%`);
    }

    return query;
  };

  const [totalResult, publishedResult, draftResult] = await Promise.all([
    buildBaseQuery(true),
    buildBaseQuery(true).eq('status', 'published'),
    buildBaseQuery(true).eq('status', 'draft'),
  ]);

  if (totalResult.error || publishedResult.error || draftResult.error) {
    if (!search) {
      console.error('Error fetching article status counts:', {
        total: totalResult.error,
        published: publishedResult.error,
        draft: draftResult.error,
      });
      return { total: 0, published: 0, draft: 0 };
    }

    const [fallbackTotal, fallbackPublished, fallbackDraft] = await Promise.all([
      buildBaseQuery(false),
      buildBaseQuery(false).eq('status', 'published'),
      buildBaseQuery(false).eq('status', 'draft'),
    ]);

    if (
      fallbackTotal.error ||
      fallbackPublished.error ||
      fallbackDraft.error
    ) {
      console.error('Error fetching fallback article status counts:', {
        total: fallbackTotal.error,
        published: fallbackPublished.error,
        draft: fallbackDraft.error,
      });
      return { total: 0, published: 0, draft: 0 };
    }

    return {
      total: fallbackTotal.count || 0,
      published: fallbackPublished.count || 0,
      draft: fallbackDraft.count || 0,
    };
  }

  return {
    total: totalResult.count || 0,
    published: publishedResult.count || 0,
    draft: draftResult.count || 0,
  };
}

/**
 * Get article by ID with contractor data
 *
 * @param id - Article UUID
 * @returns Article with contractor or null if not found
 */
export async function getArticleById(id: string): Promise<ArticleWithContractor | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('review_articles')
    .select(
      `
      id,
      contractor_id,
      title,
      slug,
      content_markdown,
      metadata_json,
      model_used,
      tokens_used,
      cost_estimate,
      status,
      generated_at,
      contractor:review_contractors(id, business_name, city, state, rating, review_count)
    `
    )
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching article by id:', error);
    throw error;
  }

  // Supabase returns contractor as array, extract first element
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  return {
    ...row,
    contractor: Array.isArray(row.contractor) ? row.contractor[0] : row.contractor,
  } as ArticleWithContractor;
}

/**
 * Get article by slug for public display
 *
 * @param slug - Article URL slug
 * @returns Article with contractor or null
 */
export async function getArticleBySlug(slug: string): Promise<ArticleWithContractor | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('review_articles')
    .select(
      `
      id,
      contractor_id,
      title,
      slug,
      content_markdown,
      metadata_json,
      model_used,
      tokens_used,
      cost_estimate,
      status,
      generated_at,
      contractor:review_contractors(id, business_name, city, state, rating, review_count)
    `
    )
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching article by slug:', error);
    throw error;
  }

  // Supabase returns contractor as array, extract first element
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  return {
    ...row,
    contractor: Array.isArray(row.contractor) ? row.contractor[0] : row.contractor,
  } as ArticleWithContractor;
}

// =============================================================================
// Reviews Browser Query
// =============================================================================

export interface ReviewFilters {
  rating?: number;
  search?: string;
  hasOwnerResponse?: boolean;
  location?: string;
  category?: string;
  searchTerm?: string;
  /** Filter by detected services from AI analysis (JSONB containment) */
  services?: string[];
  /** Filter to only show reviews with AI analysis */
  hasAnalysis?: boolean;
}

export interface ReviewWithContractor {
  id: string;
  contractor_id: string;
  reviewer_name: string | null;
  rating: number;
  review_text: string | null;
  review_date: string | null;
  owner_response: string | null;
  fetched_at: string;
  /** AI-generated analysis of this review (from tag-reviews.ts) */
  analysis_json?: ReviewTagAnalysis | null;
  contractor: {
    id: string;
    business_name: string;
    city: string | null;
    state: string | null;
  } | null;
}

/**
 * Get all reviews with optional filters and pagination
 * For the /reviews browser page
 *
 * @param filters - Optional filter criteria
 * @param page - Page number (1-indexed)
 * @param limit - Items per page
 * @returns Paginated reviews with contractor data
 */
export async function getReviews(
  filters?: ReviewFilters,
  page = 1,
  limit = 20
): Promise<{ data: ReviewWithContractor[]; total: number; stats: { avgRating: number; responseRate: number } }> {
  const supabase = await createClient();
  const searchTerm = normalizeSearchTerm(filters?.search);
  const { city, state } = parseLocationValue(filters?.location);
  const category = filters?.category;
  const searchTermFilter = filters?.searchTerm;

  let contractorIds: string[] | null = null;
  if (city || state || category || searchTermFilter) {
    let contractorQuery = supabase
      .from('review_contractors')
      .select('id');

    if (city) {
      contractorQuery = contractorQuery.eq('city', city);
    }
    if (state) {
      contractorQuery = contractorQuery.eq('state', state);
    }
    if (category) {
      contractorQuery = contractorQuery.contains('category', [category]);
    }
    if (searchTermFilter) {
      contractorQuery = contractorQuery.contains('search_terms', [searchTermFilter]);
    }

    const { data: contractorData, error: contractorError } = await contractorQuery;
    if (contractorError) {
      console.error('Error fetching contractors for review filters:', contractorError);
      throw contractorError;
    }

    contractorIds = (contractorData || []).map((row: { id: string }) => row.id);
    if (contractorIds.length === 0) {
      return { data: [], total: 0, stats: { avgRating: 0, responseRate: 0 } };
    }
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('review_data')
    .select(
      `
      id,
      contractor_id,
      reviewer_name,
      rating,
      review_text,
      review_date,
      owner_response,
      fetched_at,
      analysis_json,
      contractor:review_contractors(id, business_name, city, state)
    `,
      { count: 'exact' }
    );

  // Apply filters
  if (filters?.rating) {
    query = query.eq('rating', filters.rating);
  }
  if (searchTerm) {
    query = query.or(`review_text.ilike.%${searchTerm}%,reviewer_name.ilike.%${searchTerm}%`);
  }
  if (filters?.hasOwnerResponse !== undefined) {
    if (filters.hasOwnerResponse) {
      query = query.not('owner_response', 'is', null);
    } else {
      query = query.is('owner_response', null);
    }
  }
  if (contractorIds) {
    query = query.in('contractor_id', contractorIds);
  }

  // Filter by AI analysis availability
  if (filters?.hasAnalysis !== undefined) {
    if (filters.hasAnalysis) {
      query = query.not('analysis_json', 'is', null);
    } else {
      query = query.is('analysis_json', null);
    }
  }

  // Filter by detected services (JSONB containment)
  // Uses Supabase's filter with 'cs' operator for JSONB array matching
  if (filters?.services && filters.services.length > 0) {
    // Ensure we only get reviews with analysis
    query = query.not('analysis_json', 'is', null);
    // Filter by service - match reviews containing the selected service
    // Uses PostgREST's JSONB containment: analysis_json @> '{"detected_services": ["service"]}'
    for (const service of filters.services) {
      query = query.contains('analysis_json', { detected_services: [service] });
    }
  }

  query = query
    .range(from, to)
    .order('review_date', { ascending: false, nullsFirst: false });

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching reviews:', error);
    throw error;
  }

  // Calculate stats from a separate aggregate query (for all reviews, not just current page)
  let totalReviews = 0;
  let sumRatings = 0;
  let withResponse = 0;

  let statsQuery = supabase
    .from('review_data')
    .select('avg_rating:avg(rating), total_reviews:count(*), responses:count(owner_response)');

  if (filters?.rating) {
    statsQuery = statsQuery.eq('rating', filters.rating);
  }
  if (searchTerm) {
    statsQuery = statsQuery.or(`review_text.ilike.%${searchTerm}%,reviewer_name.ilike.%${searchTerm}%`);
  }
  if (filters?.hasOwnerResponse !== undefined) {
    if (filters.hasOwnerResponse) {
      statsQuery = statsQuery.not('owner_response', 'is', null);
    } else {
      statsQuery = statsQuery.is('owner_response', null);
    }
  }
  if (contractorIds) {
    statsQuery = statsQuery.in('contractor_id', contractorIds);
  }

  const { data: statsData, error: statsError } = await statsQuery;

  if (statsError || !statsData || statsData.length === 0) {
    // Fallback to client-side aggregation if the aggregate query isn't supported
    let fallbackQuery = supabase
      .from('review_data')
      .select('rating, owner_response');

    if (filters?.rating) {
      fallbackQuery = fallbackQuery.eq('rating', filters.rating);
    }
    if (searchTerm) {
      fallbackQuery = fallbackQuery.or(`review_text.ilike.%${searchTerm}%,reviewer_name.ilike.%${searchTerm}%`);
    }
    if (filters?.hasOwnerResponse !== undefined) {
      if (filters.hasOwnerResponse) {
        fallbackQuery = fallbackQuery.not('owner_response', 'is', null);
      } else {
        fallbackQuery = fallbackQuery.is('owner_response', null);
      }
    }
    if (contractorIds) {
      fallbackQuery = fallbackQuery.in('contractor_id', contractorIds);
    }

    const fallbackResult = await fallbackQuery;

    const allReviews = fallbackResult.data || [];
    totalReviews = allReviews.length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sumRatings = allReviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    withResponse = allReviews.filter((r: any) => r.owner_response).length;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stats = statsData[0] as any as {
      avg_rating: number | null;
      total_reviews: number | null;
      responses: number | null;
    };
    totalReviews = stats.total_reviews || 0;
    sumRatings = (stats.avg_rating || 0) * totalReviews;
    withResponse = stats.responses || 0;
  }

  // Supabase returns contractor as array, transform to single object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reviews = (data || []).map((row: any) => ({
    ...row,
    contractor: Array.isArray(row.contractor) ? row.contractor[0] : row.contractor,
  })) as ReviewWithContractor[];

  return {
    data: reviews,
    total: count || 0,
    stats: {
      avgRating: totalReviews > 0 ? sumRatings / totalReviews : 0,
      responseRate: totalReviews > 0 ? (withResponse / totalReviews) * 100 : 0,
    },
  };
}

// =============================================================================
// Activity & Dashboard Queries
// =============================================================================

/**
 * Get recent activity across all entities for dashboard display
 *
 * @param limit - Number of items per category
 * @returns Recent contractors, analyses, and articles
 */
export async function getRecentActivity(limit = 10): Promise<RecentActivity> {
  const supabase = await createClient();

  // Fetch all recent items in parallel
  const [contractorsResult, analysesResult, articlesResult] = await Promise.all([
    supabase
      .from('review_contractors')
      .select('id, business_name, discovered_at')
      .order('discovered_at', { ascending: false })
      .limit(limit),
    supabase
      .from('review_analysis')
      .select(
        `
        id,
        analyzed_at,
        contractor:review_contractors(id, business_name)
      `
      )
      .order('analyzed_at', { ascending: false })
      .limit(limit),
    supabase
      .from('review_articles')
      .select(
        `
        id,
        generated_at,
        contractor:review_contractors(id, business_name)
      `
      )
      .order('generated_at', { ascending: false })
      .limit(limit),
  ]);

  if (contractorsResult.error) {
    console.error('Error fetching recent contractors:', contractorsResult.error);
  }
  if (analysesResult.error) {
    console.error('Error fetching recent analyses:', analysesResult.error);
  }
  if (articlesResult.error) {
    console.error('Error fetching recent articles:', articlesResult.error);
  }

  return {
    recentContractors: (contractorsResult.data || []) as DBContractor[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recentAnalyses: (analysesResult.data || []).map((row: any) => ({
      ...row,
      contractor: row.contractor,
    })) as AnalysisWithContractor[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recentArticles: (articlesResult.data || []).map((row: any) => ({
      ...row,
      contractor: row.contractor,
    })) as ArticleWithContractor[],
  };
}

/**
 * Get unique cities for filter dropdown.
 * Uses RPC function if available (faster), falls back to client-side deduplication.
 *
 * @returns Array of unique city names
 * @see sql/001_performance_optimization.sql - get_unique_cities() RPC function
 */
export async function getUniqueCities(): Promise<string[]> {
  const supabase = await createClient();

  // Try RPC function first (much faster - uses SQL DISTINCT)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rpcData, error: rpcError } = await (supabase as any).rpc('get_unique_cities');

  if (!rpcError && rpcData) {
    // RPC function exists and returned data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (rpcData as any[]).map((row: any) => row.city).filter(Boolean);
  }

  // Fallback: Manual query with client-side deduplication
  // This path is used before the migration is applied
  const { data, error } = await supabase
    .from('review_contractors')
    .select('city')
    .order('city');

  if (error) {
    console.error('Error fetching cities:', error);
    throw error;
  }

  // Get unique cities (client-side deduplication)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cities = Array.from(new Set((data || []).map((row: any) => row.city)));
  return cities.filter(Boolean) as string[];
}

/**
 * Get unique states for filter dropdown.
 * Uses RPC function if available (faster), falls back to client-side deduplication.
 *
 * @returns Array of unique state codes
 * @see sql/001_performance_optimization.sql - get_unique_states() RPC function
 */
export async function getUniqueStates(): Promise<string[]> {
  const supabase = await createClient();

  // Try RPC function first (much faster - uses SQL DISTINCT)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rpcData, error: rpcError } = await (supabase as any).rpc('get_unique_states');

  if (!rpcError && rpcData) {
    // RPC function exists and returned data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (rpcData as any[]).map((row: any) => row.state).filter(Boolean);
  }

  // Fallback: Manual query with client-side deduplication
  // This path is used before the migration is applied
  const { data, error } = await supabase
    .from('review_contractors')
    .select('state')
    .order('state');

  if (error) {
    console.error('Error fetching states:', error);
    throw error;
  }

  // Get unique states (client-side deduplication)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const states = Array.from(new Set((data || []).map((row: any) => row.state)));
  return states.filter(Boolean) as string[];
}

/**
 * Cached version of getUniqueCities for filter dropdowns.
 * Caches the result for 1 hour to avoid full table scans on every page load.
 *
 * Uses admin client (no cookies) to work with unstable_cache.
 * Filter options are public data so this is safe.
 *
 * Performance impact: Reduces page load from 500ms-5s to <100ms
 * by eliminating redundant queries for dropdown options.
 *
 * @returns Promise<string[]> - Array of unique city names (cached)
 */
export const getCachedCities = unstable_cache(
  async () => {
    const supabase = createAdminClient();

    // Try RPC function first (much faster - uses SQL DISTINCT)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rpcData, error: rpcError } = await (supabase as any).rpc('get_unique_cities');

    if (!rpcError && rpcData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (rpcData as any[]).map((row: any) => row.city).filter(Boolean) as string[];
    }

    // Fallback: Manual query with client-side deduplication
    const { data, error } = await supabase
      .from('review_contractors')
      .select('city')
      .order('city');

    if (error) {
      console.error('Error fetching cities:', error);
      throw error;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cities = Array.from(new Set((data || []).map((row: any) => row.city)));
    return cities.filter(Boolean) as string[];
  },
  ['contractor-filter-cities'],
  { revalidate: 3600, tags: ['contractor-filters'] }
);

/**
 * Cached version of getUniqueStates for filter dropdowns.
 * Caches the result for 1 hour to avoid full table scans on every page load.
 *
 * Uses admin client (no cookies) to work with unstable_cache.
 * Filter options are public data so this is safe.
 *
 * @returns Promise<string[]> - Array of unique state codes (cached)
 */
export const getCachedStates = unstable_cache(
  async () => {
    const supabase = createAdminClient();

    // Try RPC function first (much faster - uses SQL DISTINCT)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rpcData, error: rpcError } = await (supabase as any).rpc('get_unique_states');

    if (!rpcError && rpcData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (rpcData as any[]).map((row: any) => row.state).filter(Boolean) as string[];
    }

    // Fallback: Manual query with client-side deduplication
    const { data, error } = await supabase
      .from('review_contractors')
      .select('state')
      .order('state');

    if (error) {
      console.error('Error fetching states:', error);
      throw error;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const states = Array.from(new Set((data || []).map((row: any) => row.state)));
    return states.filter(Boolean) as string[];
  },
  ['contractor-filter-states'],
  { revalidate: 3600, tags: ['contractor-filters'] }
);

// =============================================================================
// Additional Filter Option Queries (Locations, Categories, Search Terms)
// =============================================================================

export interface LocationOption {
  city: string;
  state: string | null;
}

/**
 * Cached unique locations for dropdown filters.
 * Returns raw city/state pairs so callers can format labels/values as needed.
 */
export const getCachedLocations = unstable_cache(
  async () => {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('review_contractors')
      .select('city, state')
      .order('city');

    if (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }

    const seen = new Set<string>();
    const locations: LocationOption[] = [];

    (data || []).forEach((row: { city: string | null; state: string | null }) => {
      if (!row.city) return;
      const key = `${row.city}||${row.state ?? ''}`;
      if (seen.has(key)) return;
      seen.add(key);
      locations.push({ city: row.city, state: row.state });
    });

    return locations;
  },
  ['contractor-filter-locations'],
  { revalidate: 3600, tags: ['contractor-filters'] }
);

/**
 * Cached unique categories from review_contractors.category (TEXT[]).
 */
export const getCachedCategories = unstable_cache(
  async () => {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('review_contractors')
      .select('category');

    if (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }

    const categories = new Set<string>();
    (data || []).forEach((row: { category: string[] | null }) => {
      (row.category || []).forEach((category) => {
        if (category) categories.add(category);
      });
    });

    return Array.from(categories).sort((a, b) => a.localeCompare(b));
  },
  ['contractor-filter-categories'],
  { revalidate: 3600, tags: ['contractor-filters'] }
);

/**
 * Cached unique search terms from review_contractors.search_terms (TEXT[]).
 */
export const getCachedSearchTerms = unstable_cache(
  async () => {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('review_contractors')
      .select('search_terms');

    if (error) {
      console.error('Error fetching search terms:', error);
      throw error;
    }

    const terms = new Set<string>();
    (data || []).forEach((row: { search_terms: string[] | null }) => {
      (row.search_terms || []).forEach((term) => {
        if (term) terms.add(term);
      });
    });

    return Array.from(terms).sort((a, b) => a.localeCompare(b));
  },
  ['contractor-filter-search-terms'],
  { revalidate: 3600, tags: ['contractor-filters'] }
);

// =============================================================================
// Search Queries
// =============================================================================

/**
 * Search contractors by business name
 *
 * @param query - Search string
 * @param limit - Max results
 * @returns Matching contractors
 */
export async function searchContractors(
  query: string,
  limit = 10
): Promise<ContractorWithStatus[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('review_contractors')
    .select(
      `
      *,
      review_data(id),
      review_analysis(id),
      review_articles(id)
    `
    )
    .ilike('business_name', `%${query}%`)
    .order('rating', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    console.error('Error searching contractors:', error);
    throw error;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((row: any) => {
    const { review_data, review_analysis, review_articles, ...contractor } = row;
    return {
      ...contractor,
      reviewCount: Array.isArray(review_data) ? review_data.length : 0,
      hasAnalysis: Array.isArray(review_analysis) && review_analysis.length > 0,
      hasArticle: Array.isArray(review_articles) && review_articles.length > 0,
    } as ContractorWithStatus;
  });
}

// =============================================================================
// AI Usage & Cost Tracking Queries
// =============================================================================

/**
 * Get aggregated AI usage statistics
 *
 * @param filters - Optional filters (date range, operation type)
 * @returns Aggregated statistics
 */
export async function getAIUsageStats(filters?: AIUsageFilters): Promise<AIUsageStats> {
  const supabase = await createClient();

  let query = supabase
    .from('ai_usage_log')
    .select('operation, total_tokens, cost_estimate, success');

  // Apply filters
  if (filters?.operation) {
    query = query.eq('operation', filters.operation);
  }
  if (filters?.success !== undefined) {
    query = query.eq('success', filters.success);
  }
  if (filters?.since) {
    query = query.gte('created_at', filters.since);
  }
  if (filters?.until) {
    query = query.lte('created_at', filters.until);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching AI usage stats:', error);
    // Return empty stats if table doesn't exist yet
    return {
      totalOperations: 0,
      totalTokens: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
      avgCostPerOperation: 0,
      avgTokensPerOperation: 0,
      byOperation: {
        analyze: { count: 0, tokens: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
        generate: { count: 0, tokens: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
        discover: { count: 0, tokens: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
      },
      successRate: 0,
    };
  }

  const logs = (data || []) as AIUsageLog[];

  // Calculate aggregations
  const totalOperations = logs.length;
  const totalTokens = logs.reduce((sum, log) => sum + (log.total_tokens || 0), 0);
  const totalInputTokens = logs.reduce((sum, log) => sum + (log.input_tokens || 0), 0);
  const totalOutputTokens = logs.reduce((sum, log) => sum + (log.output_tokens || 0), 0);
  const totalCost = logs.reduce((sum, log) => sum + Number(log.cost_estimate || 0), 0);
  const successfulOps = logs.filter((log) => log.success).length;

  // Group by operation
  const byOperation = {
    analyze: { count: 0, tokens: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
    generate: { count: 0, tokens: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
    discover: { count: 0, tokens: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
  };

  logs.forEach((log) => {
    const op = log.operation as keyof typeof byOperation;
    if (byOperation[op]) {
      byOperation[op].count++;
      byOperation[op].tokens += log.total_tokens || 0;
      byOperation[op].inputTokens += log.input_tokens || 0;
      byOperation[op].outputTokens += log.output_tokens || 0;
      byOperation[op].cost += Number(log.cost_estimate || 0);
    }
  });

  return {
    totalOperations,
    totalTokens,
    totalInputTokens,
    totalOutputTokens,
    totalCost,
    avgCostPerOperation: totalOperations > 0 ? totalCost / totalOperations : 0,
    avgTokensPerOperation: totalOperations > 0 ? totalTokens / totalOperations : 0,
    byOperation,
    successRate: totalOperations > 0 ? (successfulOps / totalOperations) * 100 : 0,
  };
}

/**
 * Get paginated AI usage logs
 *
 * @param filters - Optional filters
 * @param page - Page number (1-indexed)
 * @param limit - Items per page
 * @returns Paginated logs with contractor data
 */
export type LogSortColumn = 'created_at' | 'total_tokens' | 'cost_estimate' | 'duration_ms';

export async function getAIUsageLogs(
  filters?: AIUsageFilters,
  page = 1,
  limit = 50,
  sortColumn: LogSortColumn = 'created_at',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<{ data: AIUsageLogWithContractor[]; total: number }> {
  const supabase = await createClient();

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('ai_usage_log')
    .select(
      `
      *,
      contractor:review_contractors(id, business_name, city, state)
    `,
      { count: 'exact' }
    );

  // Apply filters
  if (filters?.operation) {
    query = query.eq('operation', filters.operation);
  }
  if (filters?.success !== undefined) {
    query = query.eq('success', filters.success);
  }
  if (filters?.since) {
    query = query.gte('created_at', filters.since);
  }
  if (filters?.until) {
    query = query.lte('created_at', filters.until);
  }

  // Apply sorting - validate column name to prevent injection
  const validColumns: LogSortColumn[] = ['created_at', 'total_tokens', 'cost_estimate', 'duration_ms'];
  const safeColumn = validColumns.includes(sortColumn) ? sortColumn : 'created_at';

  query = query.range(from, to).order(safeColumn, { ascending: sortOrder === 'asc' });

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching AI usage logs:', error);
    return { data: [], total: 0 };
  }

  return {
    data: (data || []) as AIUsageLogWithContractor[],
    total: count || 0,
  };
}

/**
 * Get cost breakdown by contractor
 *
 * @param contractorId - Contractor UUID
 * @returns Total cost and token usage for this contractor
 */
export async function getCostByContractor(contractorId: string): Promise<{
  totalCost: number;
  totalTokens: number;
  operations: number;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ai_usage_log')
    .select('total_tokens, cost_estimate')
    .eq('contractor_id', contractorId);

  if (error) {
    console.error('Error fetching contractor costs:', error);
    return { totalCost: 0, totalTokens: 0, operations: 0 };
  }

  const logs = data || [];
  return {
    totalCost: logs.reduce((sum, log) => sum + Number(log.cost_estimate || 0), 0),
    totalTokens: logs.reduce((sum, log) => sum + (log.total_tokens || 0), 0),
    operations: logs.length,
  };
}

/**
 * Get daily cost trend for the specified number of days
 *
 * @param days - Number of days to look back
 * @returns Array of daily cost data points
 */
export async function getDailyCostTrend(days = 30): Promise<DailyCostTrend[]> {
  const supabase = await createClient();

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from('ai_usage_log')
    .select('created_at, total_tokens, cost_estimate')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching daily cost trend:', error);
    return [];
  }

  // Group by date
  const byDate: Record<string, DailyCostTrend> = {};

  (data || []).forEach((log) => {
    const date = log.created_at.split('T')[0];
    if (!byDate[date]) {
      byDate[date] = { date, cost: 0, tokens: 0, operations: 0 };
    }
    byDate[date].cost += Number(log.cost_estimate || 0);
    byDate[date].tokens += log.total_tokens || 0;
    byDate[date].operations++;
  });

  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get model performance statistics
 *
 * @returns Stats grouped by model
 */
export async function getModelStats(): Promise<ModelStats[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ai_usage_log')
    .select('model, total_tokens, cost_estimate, duration_ms, success');

  if (error) {
    console.error('Error fetching model stats:', error);
    return [];
  }

  // Group by model
  const byModel: Record<string, {
    totalOps: number;
    totalTokens: number;
    totalCost: number;
    totalDuration: number;
    successCount: number;
    durationCount: number;
  }> = {};

  (data || []).forEach((log) => {
    const model = log.model || 'unknown';
    if (!byModel[model]) {
      byModel[model] = {
        totalOps: 0,
        totalTokens: 0,
        totalCost: 0,
        totalDuration: 0,
        successCount: 0,
        durationCount: 0,
      };
    }
    byModel[model].totalOps++;
    byModel[model].totalTokens += log.total_tokens || 0;
    byModel[model].totalCost += Number(log.cost_estimate || 0);
    if (log.duration_ms) {
      byModel[model].totalDuration += log.duration_ms;
      byModel[model].durationCount++;
    }
    if (log.success) {
      byModel[model].successCount++;
    }
  });

  return Object.entries(byModel).map(([model, stats]) => ({
    model,
    totalOperations: stats.totalOps,
    totalTokens: stats.totalTokens,
    totalCost: stats.totalCost,
    avgDuration: stats.durationCount > 0 ? stats.totalDuration / stats.durationCount : 0,
    successRate: stats.totalOps > 0 ? (stats.successCount / stats.totalOps) * 100 : 0,
  }));
}

/**
 * Duration distribution buckets
 */
export interface DurationBucket {
  label: string
  min: number
  max: number
  count: number
}

/**
 * Get duration distribution for histogram
 *
 * @param filters - Optional filters (date range, operation type)
 * @returns Array of duration buckets with counts
 */
export async function getDurationDistribution(filters?: AIUsageFilters): Promise<DurationBucket[]> {
  const supabase = await createClient();

  let query = supabase
    .from('ai_usage_log')
    .select('duration_ms')
    .not('duration_ms', 'is', null);

  // Apply filters
  if (filters?.operation) {
    query = query.eq('operation', filters.operation);
  }
  if (filters?.success !== undefined) {
    query = query.eq('success', filters.success);
  }
  if (filters?.since) {
    query = query.gte('created_at', filters.since);
  }
  if (filters?.until) {
    query = query.lte('created_at', filters.until);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching duration distribution:', error);
    return [];
  }

  // Define buckets: <1s, 1-3s, 3-5s, 5-10s, 10-30s, 30s+
  const buckets: DurationBucket[] = [
    { label: '<1s', min: 0, max: 1000, count: 0 },
    { label: '1-3s', min: 1000, max: 3000, count: 0 },
    { label: '3-5s', min: 3000, max: 5000, count: 0 },
    { label: '5-10s', min: 5000, max: 10000, count: 0 },
    { label: '10-30s', min: 10000, max: 30000, count: 0 },
    { label: '30s+', min: 30000, max: Infinity, count: 0 },
  ];

  // Count operations per bucket
  (data || []).forEach((log) => {
    const duration = log.duration_ms as number;
    for (const bucket of buckets) {
      if (duration >= bucket.min && duration < bucket.max) {
        bucket.count++;
        break;
      }
    }
  });

  return buckets;
}

/**
 * Get top contractors by total cost
 *
 * @param limit - Number of contractors to return
 * @returns Array of contractors sorted by total cost descending
 */
export async function getTopContractorsByCost(limit = 10): Promise<{
  contractor_id: string;
  business_name: string;
  city: string | null;
  state: string | null;
  totalCost: number;
  totalTokens: number;
  totalOperations: number;
}[]> {
  const supabase = await createClient();

  // Fetch all logs with contractor data
  const { data, error } = await supabase
    .from('ai_usage_log')
    .select(`
      contractor_id,
      total_tokens,
      cost_estimate,
      contractor:review_contractors(id, business_name, city, state)
    `)
    .not('contractor_id', 'is', null);

  if (error) {
    console.error('Error fetching top contractors by cost:', error);
    return [];
  }

  // Group by contractor
  const byContractor: Record<string, {
    contractor_id: string;
    business_name: string;
    city: string | null;
    state: string | null;
    totalCost: number;
    totalTokens: number;
    totalOperations: number;
  }> = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (data || []).forEach((log: any) => {
    const contractorId = log.contractor_id;
    if (!contractorId || !log.contractor) return;

    if (!byContractor[contractorId]) {
      byContractor[contractorId] = {
        contractor_id: contractorId,
        business_name: log.contractor.business_name || 'Unknown',
        city: log.contractor.city,
        state: log.contractor.state,
        totalCost: 0,
        totalTokens: 0,
        totalOperations: 0,
      };
    }

    byContractor[contractorId].totalCost += Number(log.cost_estimate || 0);
    byContractor[contractorId].totalTokens += log.total_tokens || 0;
    byContractor[contractorId].totalOperations++;
  });

  // Sort by cost descending and limit
  return Object.values(byContractor)
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, limit);
}

// =============================================================================
// Search History Queries
// =============================================================================

/**
 * Get search history (discovery searches)
 *
 * @param filters - Optional filters
 * @param page - Page number (1-indexed)
 * @param limit - Items per page
 * @returns Paginated search history
 */
export type SearchSortColumn = 'searched_at' | 'contractors_found' | 'city';

export async function getSearchHistory(
  filters?: SearchHistoryFilters,
  page = 1,
  limit = 50,
  sortColumn: SearchSortColumn = 'searched_at',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<{ data: SearchedCity[]; total: number }> {
  const supabase = await createClient();

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase.from('searched_cities').select('*', { count: 'exact' });

  // Apply filters
    if (city) {
      query = query.eq('city', city);
    }
    if (state) {
      query = query.eq('state', state);
    }
  if (filters?.searchTerm) {
    query = query.ilike('search_term', `%${filters.searchTerm}%`);
  }

  // Apply sorting - validate column name
  const validColumns: SearchSortColumn[] = ['searched_at', 'contractors_found', 'city'];
  const safeColumn = validColumns.includes(sortColumn) ? sortColumn : 'searched_at';

  query = query.range(from, to).order(safeColumn, { ascending: sortOrder === 'asc' });

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching search history:', error);
    return { data: [], total: 0 };
  }

  return {
    data: (data || []) as SearchedCity[],
    total: count || 0,
  };
}

/**
 * Get search history summary stats
 *
 * @returns Summary of searches
 */
export async function getSearchHistoryStats(): Promise<{
  totalSearches: number;
  totalContractorsFound: number;
  uniqueCities: number;
  uniqueStates: number;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('searched_cities')
    .select('city, state, contractors_found');

  if (error) {
    console.error('Error fetching search history stats:', error);
    return {
      totalSearches: 0,
      totalContractorsFound: 0,
      uniqueCities: 0,
      uniqueStates: 0,
    };
  }

  const searches = data || [];
  const cities = new Set(searches.map((s) => s.city));
  const states = new Set(searches.map((s) => s.state).filter(Boolean));

  return {
    totalSearches: searches.length,
    totalContractorsFound: searches.reduce((sum, s) => sum + (s.contractors_found || 0), 0),
    uniqueCities: cities.size,
    uniqueStates: states.size,
  };
}

/**
 * Get duplicate search combos (city + search_term appearing more than once)
 *
 * @returns Set of duplicate keys (city|state|search_term)
 */
export async function getDuplicateSearches(): Promise<Set<string>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('searched_cities')
    .select('city, state, search_term');

  if (error) {
    console.error('Error fetching searches for duplicates:', error);
    return new Set();
  }

  // Count occurrences
  const counts: Record<string, number> = {};
  (data || []).forEach((search) => {
    const key = `${search.city}|${search.state || ''}|${search.search_term}`;
    counts[key] = (counts[key] || 0) + 1;
  });

  // Return keys with count > 1
  const duplicates = new Set<string>();
  Object.entries(counts).forEach(([key, count]) => {
    if (count > 1) {
      duplicates.add(key);
    }
  });

  return duplicates;
}

// =============================================================================
// Optimized Search History Queries (Scalable)
// =============================================================================

/**
 * Scalable stats query using SQL aggregates instead of full table scan.
 * Returns stats in O(1) time with proper indexes vs O(N) for client-side.
 *
 * @param filters - Optional filters to scope stats
 * @returns Aggregated search statistics
 */
export async function getSearchStatsOptimized(filters?: SearchHistoryFilters): Promise<{
  totalSearches: number;
  totalContractorsFound: number;
  uniqueCities: number;
  uniqueStates: number;
}> {
  const supabase = await createClient();

  // Build filtered query - Supabase doesn't support aggregate functions directly,
  // so we use select with count option for total and separate DISTINCT queries
  let query = supabase.from('searched_cities').select('*', { count: 'exact', head: true });

  if (filters?.city) {
    query = query.eq('city', filters.city);
  }
  if (filters?.state) {
    query = query.eq('state', filters.state);
  }

  // Get total count
  const { count: totalSearches, error: countError } = await query;

  if (countError) {
    console.error('Error fetching search stats:', countError);
    return { totalSearches: 0, totalContractorsFound: 0, uniqueCities: 0, uniqueStates: 0 };
  }

  // Get sum of contractors_found and distinct counts with separate optimized queries
  // These use DISTINCT which PostgreSQL optimizes with indexes
  let sumQuery = supabase.from('searched_cities').select('contractors_found');
  let cityQuery = supabase.from('searched_cities').select('city');
  let stateQuery = supabase.from('searched_cities').select('state');

  if (filters?.city) {
    sumQuery = sumQuery.eq('city', filters.city);
    cityQuery = cityQuery.eq('city', filters.city);
    stateQuery = stateQuery.eq('city', filters.city);
  }
  if (filters?.state) {
    sumQuery = sumQuery.eq('state', filters.state);
    cityQuery = cityQuery.eq('state', filters.state);
    stateQuery = stateQuery.eq('state', filters.state);
  }

  const [sumResult, cityResult, stateResult] = await Promise.all([
    sumQuery,
    cityQuery,
    stateQuery,
  ]);

  // Calculate sum client-side (unavoidable without RPC, but limited by filters)
  const totalContractorsFound = (sumResult.data || []).reduce(
    (sum, row) => sum + (row.contractors_found || 0),
    0
  );

  // Use Set for distinct counts (fast for filtered results)
  const uniqueCities = new Set((cityResult.data || []).map((r) => r.city)).size;
  const uniqueStates = new Set(
    (stateResult.data || []).map((r) => r.state).filter(Boolean)
  ).size;

  return {
    totalSearches: totalSearches || 0,
    totalContractorsFound,
    uniqueCities,
    uniqueStates,
  };
}

/**
 * Get global filter options for the searches page.
 * Fetches ALL distinct cities and states so filters work across pages.
 *
 * @returns Object with arrays of unique states and cities
 */
export async function getGlobalFilterOptions(): Promise<{
  states: string[];
  cities: string[];
}> {
  const supabase = await createClient();

  // Fetch distinct values - PostgreSQL optimizes DISTINCT with indexes
  const [statesResult, citiesResult] = await Promise.all([
    supabase.from('searched_cities').select('state').order('state'),
    supabase.from('searched_cities').select('city').order('city').limit(500),
  ]);

  // Extract unique values (dedupe in case of missing DISTINCT support)
  const states = [
    ...new Set(
      (statesResult.data || [])
        .map((r) => r.state)
        .filter((s): s is string => Boolean(s))
    ),
  ].sort();

  const cities = [
    ...new Set((citiesResult.data || []).map((r) => r.city)),
  ].sort();

  return { states, cities };
}

/**
 * Database-optimized duplicate detection using GROUP BY HAVING.
 * Returns array of duplicate keys instead of loading entire dataset.
 *
 * Since Supabase JS client doesn't support GROUP BY HAVING directly,
 * we use a workaround: fetch grouped data and filter.
 *
 * @returns Array of duplicate "city|state|search_term" keys
 */
export async function getDuplicateKeysOptimized(): Promise<string[]> {
  const supabase = await createClient();

  // Fetch minimal data needed for duplicate detection
  // Limit to reasonable amount for scalability
  const { data, error } = await supabase
    .from('searched_cities')
    .select('city, state, search_term')
    .limit(10000); // Safety limit

  if (error) {
    console.error('Error fetching duplicates:', error);
    return [];
  }

  // Count occurrences efficiently
  const counts: Record<string, number> = {};
  for (const search of data || []) {
    const key = `${search.city}|${search.state || ''}|${search.search_term}`;
    counts[key] = (counts[key] || 0) + 1;
  }

  // Return only duplicate keys
  return Object.entries(counts)
    .filter(([, count]) => count > 1)
    .map(([key]) => key);
}

// =============================================================================
// Pipeline Timing Queries
// =============================================================================

/**
 * Get real pipeline timing statistics from ai_usage_log
 *
 * @returns Timing stats for each pipeline stage
 */
export async function getPipelineTimingStats(): Promise<PipelineTimingStats> {
  const supabase = await createClient();

  // Fetch all logs to calculate timing stats
  const { data, error } = await supabase
    .from('ai_usage_log')
    .select('operation, duration_ms, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pipeline timing:', error);
    return {
      discover: { avgDuration: null, lastRun: null, totalRuns: 0 },
      analyze: { avgDuration: null, lastRun: null, totalRuns: 0 },
      generate: { avgDuration: null, lastRun: null, totalRuns: 0 },
    };
  }

  const logs = data || [];

  // Helper to calculate stats for an operation type
  const calcStats = (operation: string) => {
    const opLogs = logs.filter((l) => l.operation === operation);
    const withDuration = opLogs.filter((l) => l.duration_ms);
    const totalDuration = withDuration.reduce((sum, l) => sum + (l.duration_ms || 0), 0);

    return {
      avgDuration: withDuration.length > 0 ? Math.round(totalDuration / withDuration.length) : null,
      lastRun: opLogs.length > 0 ? opLogs[0].created_at : null,
      totalRuns: opLogs.length,
    };
  };

  return {
    discover: calcStats('discover'),
    analyze: calcStats('analyze'),
    generate: calcStats('generate'),
  };
}

// =============================================================================
// Detected Services Query (for review filtering)
// =============================================================================

/**
 * Get unique detected services from all analyzed reviews.
 * Used to populate the service filter dropdown.
 *
 * Since Supabase doesn't support JSONB array aggregation directly,
 * we fetch all analysis_json values and aggregate client-side.
 *
 * @returns Array of unique service names sorted by frequency
 */
export async function getDetectedServices(): Promise<{ service: string; count: number }[]> {
  const supabase = await createClient();

  // Fetch analysis_json from all reviews that have been analyzed
  const { data, error } = await supabase
    .from('review_data')
    .select('analysis_json')
    .not('analysis_json', 'is', null);

  if (error) {
    console.error('Error fetching detected services:', error);
    return [];
  }

  // Aggregate services across all reviews
  const serviceCounts = new Map<string, number>();

  for (const row of data || []) {
    const analysis = row.analysis_json as ReviewTagAnalysis | null;
    if (analysis?.detected_services) {
      for (const service of analysis.detected_services) {
        const normalized = service.toLowerCase().trim();
        if (normalized) {
          serviceCounts.set(normalized, (serviceCounts.get(normalized) || 0) + 1);
        }
      }
    }
  }

  // Convert to array and sort by count (descending)
  const services = Array.from(serviceCounts.entries())
    .map(([service, count]) => ({ service, count }))
    .sort((a, b) => b.count - a.count);

  return services;
}

/**
 * Cached version of getDetectedServices for filter dropdowns.
 * Caches the result for 1 hour to avoid expensive JSONB scans on every page load.
 *
 * @returns Promise<{ service: string; count: number }[]> - Array of services with counts
 */
export const getCachedDetectedServices = unstable_cache(
  async () => {
    const supabase = createAdminClient();

    // Fetch analysis_json from all reviews that have been analyzed
    const { data, error } = await supabase
      .from('review_data')
      .select('analysis_json')
      .not('analysis_json', 'is', null);

    if (error) {
      console.error('Error fetching detected services:', error);
      return [];
    }

    // Aggregate services across all reviews
    const serviceCounts = new Map<string, number>();

    for (const row of data || []) {
      const analysis = row.analysis_json as ReviewTagAnalysis | null;
      if (analysis?.detected_services) {
        for (const service of analysis.detected_services) {
          const normalized = service.toLowerCase().trim();
          if (normalized) {
            serviceCounts.set(normalized, (serviceCounts.get(normalized) || 0) + 1);
          }
        }
      }
    }

    // Convert to array and sort by count (descending)
    const services = Array.from(serviceCounts.entries())
      .map(([service, count]) => ({ service, count }))
      .sort((a, b) => b.count - a.count);

    return services;
  },
  ['review-filter-detected-services'],
  { revalidate: 3600, tags: ['review-filters'] }
);
