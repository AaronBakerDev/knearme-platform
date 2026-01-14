/**
 * Supabase client for contractor-review-agent
 *
 * Provides database operations for contractors, reviews, analysis, and articles.
 * Uses the service role key for full access (bypasses RLS).
 *
 * @see /supabase/migrations/001_review_agent_schema.sql for schema
 * @see /src/lib/types.ts for type definitions
 */

import { createClient, SupabaseClient as SupabaseClientType } from '@supabase/supabase-js';
import type {
  DBContractor,
  DBReview,
  DBAnalysis,
  DBArticle,
  ReviewAnalysis,
  ArticleMetadata,
} from './types';

// =============================================================================
// Types
// =============================================================================

export interface GetContractorsOptions {
  city?: string;
  category?: string;
  minRating?: number;
  minReviews?: number;
  limit?: number;
  /** Only return contractors that don't have reviews collected yet */
  needsReviews?: boolean;
  /** Only return contractors that don't have analysis yet */
  needsAnalysis?: boolean;
}

export interface SaveArticleInput {
  title: string;
  slug: string;
  content_markdown: string;
  metadata_json: ArticleMetadata;
  status?: 'draft' | 'published';
  // Tracking fields
  model_used?: string;
  tokens_used?: number;
  cost_estimate?: number;
}

// =============================================================================
// Supabase Client Class
// =============================================================================

/**
 * SupabaseClient wraps the Supabase JS client with typed methods
 * for the contractor review agent database operations.
 *
 * Usage:
 * ```typescript
 * const db = createSupabaseClient();
 * const contractor = await db.getContractor('ChIJ...');
 * ```
 */
export class SupabaseClient {
  private client: SupabaseClientType;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL environment variable is required');
    }
    if (!supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    }

    this.client = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  // ===========================================================================
  // Contractor Operations
  // ===========================================================================

  /**
   * Insert or update a contractor by place_id
   * Uses upsert with ON CONFLICT on place_id
   *
   * For array fields (category, search_terms), merges new values with existing
   * rather than overwriting to accumulate data across multiple discovery runs.
   *
   * Accepts both single values (from discovery) and full arrays (from sync/import):
   * - category: string → merged into existing array
   * - categories: string[] → merged with existing array (preserves all)
   * - search_term: string → merged into existing array
   * - search_terms: string[] → merged with existing array (preserves all)
   */
  async upsertContractor(
    contractor: Omit<Partial<DBContractor>, 'category' | 'search_terms'> & {
      place_id: string;
      business_name: string;
      city: string;
      country: string;
      /** Single category from Google Maps API - merged into category array */
      category?: string;
      /** Full category array (for sync/import) - merged with existing */
      categories?: string[];
      /** Discovery search term - merged into search_terms array */
      search_term?: string;
      /** Full search_terms array (for sync/import) - merged with existing */
      search_terms?: string[];
    }
  ): Promise<DBContractor> {
    const now = new Date().toISOString();

    // Fetch existing contractor to merge arrays
    const existing = await this.getContractor(contractor.place_id);

    // Merge category arrays
    const existingCategories = existing?.category || [];
    const newCategories = contractor.categories || (contractor.category ? [contractor.category] : []);
    const mergedCategories = [...new Set([...existingCategories, ...newCategories])];

    // Merge search_terms arrays
    const existingSearchTerms = existing?.search_terms || [];
    const newSearchTerms = contractor.search_terms || (contractor.search_term ? [contractor.search_term] : []);
    const mergedSearchTerms = [...new Set([...existingSearchTerms, ...newSearchTerms])];

    // Remove array input fields before spreading (they're not DB columns)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { category: _category, categories: _categories, search_term: _searchTerm, search_terms: _searchTerms, ...contractorData } = contractor;

    const { data, error } = await this.client
      .from('review_contractors')
      .upsert(
        {
          ...contractorData,
          category: mergedCategories,
          search_terms: mergedSearchTerms,
          last_synced_at: now,
          discovered_at: existing?.discovered_at || now,
        },
        {
          onConflict: 'place_id',
        }
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to upsert contractor: ${error.message}`);
    }

    return data as DBContractor;
  }

  /**
   * Get a contractor by place_id
   */
  async getContractor(placeId: string): Promise<DBContractor | null> {
    const { data, error } = await this.client
      .from('review_contractors')
      .select('*')
      .eq('place_id', placeId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw new Error(`Failed to get contractor: ${error.message}`);
    }

    return data as DBContractor;
  }

  /**
   * Get a contractor by internal ID
   */
  async getContractorById(id: string): Promise<DBContractor | null> {
    const { data, error } = await this.client
      .from('review_contractors')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get contractor by id: ${error.message}`);
    }

    return data as DBContractor;
  }

  /**
   * List contractors with optional filters
   *
   * @param options.city - Filter by city name (case-insensitive partial match)
   * @param options.category - Filter by category (exact match)
   * @param options.minRating - Minimum rating filter
   * @param options.minReviews - Minimum review count filter
   * @param options.limit - Maximum results (default 100)
   * @param options.needsReviews - Only return contractors without collected reviews
   * @param options.needsAnalysis - Only return contractors without analysis
   */
  async getContractors(options: GetContractorsOptions = {}): Promise<DBContractor[]> {
    const { city, category, minRating, minReviews, limit = 100, needsReviews, needsAnalysis } = options;

    // Use a raw query if we need to filter by missing reviews/analysis
    if (needsReviews || needsAnalysis) {
      // Build the SQL dynamically based on options
      let sql = `
        SELECT rc.* FROM review_contractors rc
        WHERE 1=1
      `;
      const params: unknown[] = [];
      let paramIndex = 1;

      if (city) {
        sql += ` AND rc.city ILIKE $${paramIndex}`;
        params.push(`%${city}%`);
        paramIndex++;
      }

      if (category) {
        // Use ANY() for array containment check
        sql += ` AND $${paramIndex} = ANY(rc.category)`;
        params.push(category);
        paramIndex++;
      }

      if (minRating !== undefined) {
        sql += ` AND rc.rating >= $${paramIndex}`;
        params.push(minRating);
        paramIndex++;
      }

      if (minReviews !== undefined) {
        sql += ` AND rc.review_count >= $${paramIndex}`;
        params.push(minReviews);
        paramIndex++;
      }

      if (needsReviews) {
        sql += ` AND NOT EXISTS (SELECT 1 FROM review_data rd WHERE rd.contractor_id = rc.id LIMIT 1)`;
      }

      if (needsAnalysis) {
        sql += ` AND NOT EXISTS (SELECT 1 FROM review_analysis ra WHERE ra.contractor_id = rc.id)`;
      }

      sql += ` ORDER BY rc.review_count DESC LIMIT $${paramIndex}`;
      params.push(limit);

      // Execute via Supabase RPC or raw query
      // Note: This requires a helper function or we use the simpler approach
      // For now, we'll use a two-step approach with subquery simulation
      const { data, error } = await this.client.rpc('get_contractors_needing_data', {
        p_city: city || null,
        p_category: category || null,
        p_min_rating: minRating || null,
        p_min_reviews: minReviews || null,
        p_needs_reviews: needsReviews || false,
        p_needs_analysis: needsAnalysis || false,
        p_limit: limit,
      });

      if (error) {
        // If RPC doesn't exist, fall back to simpler approach
        console.warn('RPC not available, falling back to simple query. Consider creating the function.');
        // Fall through to simple query
      } else {
        return (data || []) as DBContractor[];
      }
    }

    // Simple query without needs* filters
    let query = this.client
      .from('review_contractors')
      .select('*')
      .order('review_count', { ascending: false });

    if (city) {
      query = query.ilike('city', `%${city}%`);
    }

    if (category) {
      // Use contains() for array containment check (Supabase @> operator)
      query = query.contains('category', [category]);
    }

    if (minRating !== undefined) {
      query = query.gte('rating', minRating);
    }

    if (minReviews !== undefined) {
      query = query.gte('review_count', minReviews);
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get contractors: ${error.message}`);
    }

    return (data || []) as DBContractor[];
  }

  // ===========================================================================
  // Review Operations
  // ===========================================================================

  /**
   * Bulk insert reviews for a contractor
   * Skips reviews that already exist (by review_id)
   */
  async upsertReviews(
    contractorId: string,
    reviews: Array<{
      review_id: string | null;
      review_text: string | null;
      rating: number;
      reviewer_name: string | null;
      review_date: string | null;
      owner_response: string | null;
    }>
  ): Promise<{ inserted: number; skipped: number }> {
    if (reviews.length === 0) {
      return { inserted: 0, skipped: 0 };
    }

    const now = new Date().toISOString();

    // Prepare records with contractor_id and fetched_at
    const records = reviews.map((review) => ({
      contractor_id: contractorId,
      review_id: review.review_id,
      review_text: review.review_text,
      rating: review.rating,
      reviewer_name: review.reviewer_name,
      review_date: review.review_date,
      owner_response: review.owner_response,
      fetched_at: now,
    }));

    // Use upsert with ignoreDuplicates to skip existing reviews
    const { data, error } = await this.client
      .from('review_data')
      .upsert(records, {
        onConflict: 'contractor_id,review_id',
        ignoreDuplicates: true,
      })
      .select();

    if (error) {
      throw new Error(`Failed to upsert reviews: ${error.message}`);
    }

    const inserted = data?.length || 0;
    const skipped = reviews.length - inserted;

    return { inserted, skipped };
  }

  /**
   * Get all reviews for a contractor
   */
  async getReviews(contractorId: string): Promise<DBReview[]> {
    const { data, error } = await this.client
      .from('review_data')
      .select('*')
      .eq('contractor_id', contractorId)
      .order('review_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to get reviews: ${error.message}`);
    }

    return (data || []) as DBReview[];
  }

  /**
   * Get review count for a contractor
   */
  async getReviewCount(contractorId: string): Promise<number> {
    const { count, error } = await this.client
      .from('review_data')
      .select('*', { count: 'exact', head: true })
      .eq('contractor_id', contractorId);

    if (error) {
      throw new Error(`Failed to get review count: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Get reviews that need tagging (no analysis_json yet)
   *
   * @param options.contractorId - Filter by contractor
   * @param options.city - Filter by city (via contractor join)
   * @param options.limit - Max reviews to return
   * @param options.includeAnalyzed - Include already-analyzed reviews (default false)
   */
  async getReviewsNeedingTags(options: {
    contractorId?: string;
    city?: string;
    limit?: number;
    includeAnalyzed?: boolean;
  } = {}): Promise<Array<DBReview & { contractor: Pick<DBContractor, 'id' | 'business_name' | 'category' | 'city'> }>> {
    const { contractorId, city, limit = 100, includeAnalyzed = false } = options;

    // If filtering by city, first get contractor IDs in that city
    let contractorIds: string[] | undefined;
    if (city) {
      const { data: contractors, error: contractorError } = await this.client
        .from('review_contractors')
        .select('id')
        .ilike('city', `%${city}%`);

      if (contractorError) {
        throw new Error(`Failed to get contractors for city: ${contractorError.message}`);
      }

      contractorIds = (contractors || []).map((c: { id: string }) => c.id);
      if (contractorIds.length === 0) {
        return []; // No contractors in this city
      }
    }

    let query = this.client
      .from('review_data')
      .select(`
        *,
        contractor:review_contractors!contractor_id (
          id,
          business_name,
          category,
          city
        )
      `)
      .order('fetched_at', { ascending: false });

    if (!includeAnalyzed) {
      query = query.is('analysis_json', null);
    }

    if (contractorId) {
      query = query.eq('contractor_id', contractorId);
    } else if (contractorIds) {
      // Filter by contractor IDs in the city
      query = query.in('contractor_id', contractorIds);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get reviews needing tags: ${error.message}`);
    }

    return (data || []) as Array<DBReview & { contractor: Pick<DBContractor, 'id' | 'business_name' | 'category' | 'city'> }>;
  }

  /**
   * Update review with analysis tags
   */
  async updateReviewAnalysis(
    reviewId: string,
    analysis: unknown,
    modelUsed: string
  ): Promise<void> {
    const { error } = await this.client
      .from('review_data')
      .update({
        analysis_json: analysis,
        analyzed_at: new Date().toISOString(),
      })
      .eq('id', reviewId);

    if (error) {
      throw new Error(`Failed to update review analysis: ${error.message}`);
    }
  }

  /**
   * Bulk update reviews with analysis tags
   */
  async updateReviewsAnalysisBatch(
    updates: Array<{ id: string; analysis: unknown }>
  ): Promise<{ updated: number; errors: string[] }> {
    const errors: string[] = [];
    let updated = 0;

    // Supabase doesn't support bulk updates with different values,
    // so we need to do individual updates
    for (const { id, analysis } of updates) {
      const { error } = await this.client
        .from('review_data')
        .update({
          analysis_json: analysis,
          analyzed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        errors.push(`Review ${id}: ${error.message}`);
      } else {
        updated++;
      }
    }

    return { updated, errors };
  }

  // ===========================================================================
  // Analysis Operations
  // ===========================================================================

  /**
   * Save or update analysis for a contractor
   *
   * @param contractorId - The contractor's UUID
   * @param analysis - The analysis JSON from Gemini
   * @param tracking - Optional tracking data (model, tokens, cost)
   */
  async saveAnalysis(
    contractorId: string,
    analysis: ReviewAnalysis,
    tracking?: {
      model_used: string;
      tokens_used: number;
      cost_estimate: number;
    }
  ): Promise<DBAnalysis> {
    const now = new Date().toISOString();

    const { data, error } = await this.client
      .from('review_analysis')
      .upsert(
        {
          contractor_id: contractorId,
          analysis_json: analysis,
          analyzed_at: now,
          ...(tracking && {
            model_used: tracking.model_used,
            tokens_used: tracking.tokens_used,
            cost_estimate: tracking.cost_estimate,
          }),
        },
        {
          onConflict: 'contractor_id',
        }
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save analysis: ${error.message}`);
    }

    return data as DBAnalysis;
  }

  /**
   * Get analysis for a contractor
   */
  async getAnalysis(contractorId: string): Promise<DBAnalysis | null> {
    const { data, error } = await this.client
      .from('review_analysis')
      .select('*')
      .eq('contractor_id', contractorId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get analysis: ${error.message}`);
    }

    return data as DBAnalysis;
  }

  // ===========================================================================
  // Article Operations
  // ===========================================================================

  /**
   * Save or update article for a contractor
   */
  async saveArticle(contractorId: string, article: SaveArticleInput): Promise<DBArticle> {
    const now = new Date().toISOString();

    const { data, error } = await this.client
      .from('review_articles')
      .upsert(
        {
          contractor_id: contractorId,
          title: article.title,
          slug: article.slug,
          content_markdown: article.content_markdown,
          metadata_json: article.metadata_json,
          status: article.status || 'draft',
          generated_at: now,
          // Tracking fields
          ...(article.model_used && { model_used: article.model_used }),
          ...(article.tokens_used && { tokens_used: article.tokens_used }),
          ...(article.cost_estimate && { cost_estimate: article.cost_estimate }),
        },
        {
          onConflict: 'contractor_id',
        }
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save article: ${error.message}`);
    }

    return data as DBArticle;
  }

  /**
   * Get article for a contractor
   */
  async getArticle(contractorId: string): Promise<DBArticle | null> {
    const { data, error } = await this.client
      .from('review_articles')
      .select('*')
      .eq('contractor_id', contractorId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get article: ${error.message}`);
    }

    return data as DBArticle;
  }

  /**
   * Update article status
   */
  async updateArticleStatus(
    contractorId: string,
    status: 'draft' | 'published'
  ): Promise<DBArticle> {
    const { data, error } = await this.client
      .from('review_articles')
      .update({ status })
      .eq('contractor_id', contractorId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update article status: ${error.message}`);
    }

    return data as DBArticle;
  }

  /**
   * Get article by slug
   */
  async getArticleBySlug(slug: string): Promise<DBArticle | null> {
    const { data, error } = await this.client
      .from('review_articles')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get article by slug: ${error.message}`);
    }

    return data as DBArticle;
  }

  // ===========================================================================
  // Searched Cities Operations
  // ===========================================================================

  /**
   * Check if a city/search combination has already been searched
   */
  async hasBeenSearched(
    city: string,
    searchTerm: string,
    state?: string,
    country: string = 'USA'
  ): Promise<{ searched: boolean; searchedAt?: string; contractorsFound?: number }> {
    let query = this.client
      .from('searched_cities')
      .select('searched_at, contractors_found')
      .eq('city', city)
      .eq('search_term', searchTerm)
      .eq('country', country);

    // Handle state - check for NULL if not provided, otherwise match exact value
    if (state) {
      query = query.eq('state', state);
    } else {
      query = query.is('state', null);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { searched: false };
      }
      throw new Error(`Failed to check searched cities: ${error.message}`);
    }

    return {
      searched: true,
      searchedAt: data.searched_at,
      contractorsFound: data.contractors_found,
    };
  }

  /**
   * Record that a city/search combination has been searched
   */
  async recordSearch(
    city: string,
    searchTerm: string,
    contractorsFound: number,
    state?: string,
    country: string = 'USA'
  ): Promise<void> {
    const { error } = await this.client
      .from('searched_cities')
      .upsert(
        {
          city,
          state: state || null,
          country,
          search_term: searchTerm,
          contractors_found: contractorsFound,
          searched_at: new Date().toISOString(),
        },
        {
          onConflict: 'city,state,country,search_term',
        }
      );

    if (error) {
      throw new Error(`Failed to record search: ${error.message}`);
    }
  }

  /**
   * Get all searched cities
   */
  async getSearchedCities(): Promise<Array<{
    city: string;
    state: string | null;
    country: string;
    search_term: string;
    searched_at: string;
    contractors_found: number;
  }>> {
    const { data, error } = await this.client
      .from('searched_cities')
      .select('*')
      .order('searched_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get searched cities: ${error.message}`);
    }

    return data || [];
  }

  // ===========================================================================
  // AI Usage Logging Operations
  // ===========================================================================

  /**
   * Log an AI operation for cost tracking and observability
   *
   * @see ai_usage_log table in database
   */
  async logAIUsage(usage: {
    operation: 'analyze' | 'generate';
    contractor_id?: string;
    model: string;
    input_tokens?: number;
    output_tokens?: number;
    total_tokens: number;
    cost_estimate: number;
    duration_ms: number;
    success?: boolean;
    error_message?: string;
  }): Promise<void> {
    const { error } = await this.client
      .from('ai_usage_log')
      .insert({
        operation: usage.operation,
        contractor_id: usage.contractor_id || null,
        model: usage.model,
        input_tokens: usage.input_tokens || null,
        output_tokens: usage.output_tokens || null,
        total_tokens: usage.total_tokens,
        cost_estimate: usage.cost_estimate,
        duration_ms: usage.duration_ms,
        success: usage.success ?? true,
        error_message: usage.error_message || null,
        created_at: new Date().toISOString(),
      });

    if (error) {
      // Log but don't throw - usage logging shouldn't break the main flow
      console.error(`Failed to log AI usage: ${error.message}`);
    }
  }

  /**
   * Get AI usage statistics for a time period
   */
  async getAIUsageStats(options: {
    since?: string;  // ISO date string
    operation?: 'analyze' | 'generate';
  } = {}): Promise<{
    total_operations: number;
    total_tokens: number;
    total_cost: number;
    by_operation: Record<string, { count: number; tokens: number; cost: number }>;
  }> {
    let query = this.client
      .from('ai_usage_log')
      .select('*');

    if (options.since) {
      query = query.gte('created_at', options.since);
    }

    if (options.operation) {
      query = query.eq('operation', options.operation);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get AI usage stats: ${error.message}`);
    }

    const logs = data || [];
    const byOperation: Record<string, { count: number; tokens: number; cost: number }> = {};

    let totalTokens = 0;
    let totalCost = 0;

    for (const log of logs) {
      totalTokens += log.total_tokens || 0;
      totalCost += parseFloat(log.cost_estimate) || 0;

      if (!byOperation[log.operation]) {
        byOperation[log.operation] = { count: 0, tokens: 0, cost: 0 };
      }
      byOperation[log.operation].count++;
      byOperation[log.operation].tokens += log.total_tokens || 0;
      byOperation[log.operation].cost += parseFloat(log.cost_estimate) || 0;
    }

    return {
      total_operations: logs.length,
      total_tokens: totalTokens,
      total_cost: totalCost,
      by_operation: byOperation,
    };
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a new SupabaseClient instance
 *
 * Usage:
 * ```typescript
 * import { createSupabaseClient } from './lib/supabase';
 *
 * const db = createSupabaseClient();
 * const contractor = await db.getContractor('ChIJ...');
 * ```
 */
export function createSupabaseClient(): SupabaseClient {
  return new SupabaseClient();
}
