module.exports = [
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/src/app/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/layout.tsx [app-rsc] (ecmascript)"));
}),
"[project]/src/app/error.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/error.tsx [app-rsc] (ecmascript)"));
}),
"[project]/src/app/loading.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/loading.tsx [app-rsc] (ecmascript)"));
}),
"[project]/src/lib/supabase/server.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createAdminClient",
    ()=>createAdminClient,
    "createClient",
    ()=>createClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/createServerClient.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-rsc] (ecmascript)");
;
;
async function createClient() {
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cookies"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createServerClient"])(("TURBOPACK compile-time value", "https://xynhhmliqdvyzrqnlvmk.supabase.co"), ("TURBOPACK compile-time value", "sb_publishable_rNngr5Pl4fjzZ_0rObpzPw_z_iAKyP9"), {
        cookies: {
            getAll () {
                return cookieStore.getAll();
            },
            setAll (cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options })=>cookieStore.set(name, value, options));
                } catch  {
                // The `setAll` method was called from a Server Component.
                // This can be ignored if you have middleware refreshing
                // user sessions.
                }
            }
        }
    });
}
function createAdminClient() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createServerClient"])(("TURBOPACK compile-time value", "https://xynhhmliqdvyzrqnlvmk.supabase.co"), process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY, {
        cookies: {
            getAll () {
                return [];
            },
            setAll () {}
        }
    });
}
}),
"[project]/src/lib/supabase/queries.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getAIUsageLogs",
    ()=>getAIUsageLogs,
    "getAIUsageStats",
    ()=>getAIUsageStats,
    "getAnalyses",
    ()=>getAnalyses,
    "getAnalysisByContractor",
    ()=>getAnalysisByContractor,
    "getArticleByContractor",
    ()=>getArticleByContractor,
    "getArticleById",
    ()=>getArticleById,
    "getArticleBySlug",
    ()=>getArticleBySlug,
    "getArticleStatusCounts",
    ()=>getArticleStatusCounts,
    "getArticles",
    ()=>getArticles,
    "getCachedCategories",
    ()=>getCachedCategories,
    "getCachedCities",
    ()=>getCachedCities,
    "getCachedDetectedServices",
    ()=>getCachedDetectedServices,
    "getCachedLocations",
    ()=>getCachedLocations,
    "getCachedSearchTerms",
    ()=>getCachedSearchTerms,
    "getCachedStates",
    ()=>getCachedStates,
    "getContractorById",
    ()=>getContractorById,
    "getContractorDetail",
    ()=>getContractorDetail,
    "getContractors",
    ()=>getContractors,
    "getCostByContractor",
    ()=>getCostByContractor,
    "getDailyCostTrend",
    ()=>getDailyCostTrend,
    "getDetectedServices",
    ()=>getDetectedServices,
    "getDuplicateKeysOptimized",
    ()=>getDuplicateKeysOptimized,
    "getDuplicateSearches",
    ()=>getDuplicateSearches,
    "getDurationDistribution",
    ()=>getDurationDistribution,
    "getGlobalFilterOptions",
    ()=>getGlobalFilterOptions,
    "getModelStats",
    ()=>getModelStats,
    "getPipelineStats",
    ()=>getPipelineStats,
    "getPipelineTimingStats",
    ()=>getPipelineTimingStats,
    "getRecentActivity",
    ()=>getRecentActivity,
    "getReviewDistribution",
    ()=>getReviewDistribution,
    "getReviews",
    ()=>getReviews,
    "getReviewsByContractor",
    ()=>getReviewsByContractor,
    "getSearchHistory",
    ()=>getSearchHistory,
    "getSearchHistoryStats",
    ()=>getSearchHistoryStats,
    "getSearchStatsOptimized",
    ()=>getSearchStatsOptimized,
    "getTopContractorsByCost",
    ()=>getTopContractorsByCost,
    "getUniqueCities",
    ()=>getUniqueCities,
    "getUniqueStates",
    ()=>getUniqueStates,
    "searchContractors",
    ()=>searchContractors
]);
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
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase/server.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/cache.js [app-rsc] (ecmascript)");
;
;
function normalizeSearchTerm(input) {
    if (!input) return null;
    const sanitized = input.replace(/[(),]/g, ' ').replace(/\s+/g, ' ').trim();
    return sanitized.length > 0 ? sanitized : null;
}
function parseLocationValue(input) {
    if (!input || input === 'all') return {};
    if (input.includes('||')) {
        const [rawCity, rawState] = input.split('||');
        const city1 = rawCity?.trim();
        const state1 = rawState?.trim();
        return {
            city: city1 || undefined,
            state: state1 || undefined
        };
    }
    if (input.includes(',')) {
        const [rawCity, rawState] = input.split(',');
        const city1 = rawCity?.trim();
        const state1 = rawState?.trim();
        return {
            city: city1 || undefined,
            state: state1 || undefined
        };
    }
    return {
        city: input.trim() || undefined
    };
}
async function getPipelineStats() {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    // Run all count queries in parallel for efficiency
    const [contractorsResult, reviewsResult, analysesResult, articlesResult] = await Promise.all([
        supabase.from('review_contractors').select('*', {
            count: 'exact',
            head: true
        }),
        supabase.from('review_data').select('*', {
            count: 'exact',
            head: true
        }),
        supabase.from('review_analysis').select('*', {
            count: 'exact',
            head: true
        }),
        supabase.from('review_articles').select('*', {
            count: 'exact',
            head: true
        })
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
        analysisRate: contractors > 0 ? analyses / contractors * 100 : 0,
        articleRate: contractors > 0 ? articles / contractors * 100 : 0
    };
}
async function getContractors(filters, page = 1, limit = 20) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { city: city1, state: state1 } = parseLocationValue(filters?.location);
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
    let query = supabase.from('review_contractors').select(`
      id,
      business_name,
      rating,
      review_count,
      city,
      state,
      last_synced_at,
      ${reviewAnalysisSelect},
      ${reviewArticlesSelect}
    `, {
        count: 'exact'
    });
    // Apply basic filters
    if (city1) {
        query = query.eq('city', city1);
    }
    if (state1) {
        query = query.eq('state', state1);
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
        query = query.contains('category', [
            category
        ]);
    }
    if (searchTerm) {
        query = query.contains('search_terms', [
            searchTerm
        ]);
    }
    if (filters?.search) {
        query = query.ilike('business_name', `%${filters.search}%`);
    }
    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to).order('rating', {
        ascending: false,
        nullsFirst: false
    });
    const { data, count, error } = await query;
    if (error) {
        console.error('Error fetching contractors:', error);
        throw error;
    }
    // Transform to ContractorWithStatus
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contractors = (data || []).map((row)=>{
        // Extract contractor fields (exclude nested relations)
        const { review_analysis, review_articles, review_count, ...contractor } = row;
        return {
            ...contractor,
            reviewCount: review_count || 0,
            hasAnalysis: Array.isArray(review_analysis) && review_analysis.length > 0,
            hasArticle: Array.isArray(review_articles) && review_articles.length > 0
        };
    });
    return {
        data: contractors,
        total: count || 0
    };
}
async function getContractorById(id) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from('review_contractors').select('*').eq('id', id).single();
    if (error) {
        if (error.code === 'PGRST116') {
            // Row not found
            return null;
        }
        console.error('Error fetching contractor:', error);
        throw error;
    }
    return data;
}
async function getContractorDetail(id) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    // Fetch contractor with all relations
    const { data, error } = await supabase.from('review_contractors').select(`
      *,
      review_data(*),
      review_analysis(*),
      review_articles(*)
    `).eq('id', id).single();
    if (error) {
        if (error.code === 'PGRST116') {
            return null;
        }
        console.error('Error fetching contractor detail:', error);
        throw error;
    }
    if (!data) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = data;
    return {
        ...row,
        reviews: row.review_data || [],
        analysis: row.review_analysis?.[0] || null,
        article: row.review_articles?.[0] || null
    };
}
async function getReviewsByContractor(contractorId) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from('review_data').select('*').eq('contractor_id', contractorId).order('review_date', {
        ascending: false,
        nullsFirst: false
    });
    if (error) {
        console.error('Error fetching reviews:', error);
        throw error;
    }
    return data || [];
}
async function getReviewDistribution(contractorId) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from('review_data').select('rating').eq('contractor_id', contractorId);
    if (error) {
        console.error('Error fetching review distribution:', error);
        throw error;
    }
    // Count by rating
    const distribution = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data || []).forEach((review)=>{
        const rating = Math.round(review.rating);
        if (rating >= 1 && rating <= 5) {
            distribution[rating]++;
        }
    });
    return distribution;
}
async function getAnalysisByContractor(contractorId) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from('review_analysis').select('*').eq('contractor_id', contractorId).order('analyzed_at', {
        ascending: false
    }).limit(1).single();
    if (error) {
        if (error.code === 'PGRST116') {
            return null;
        }
        console.error('Error fetching analysis:', error);
        throw error;
    }
    return data;
}
async function getAnalyses(page = 1, limit = 20) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, count, error } = await supabase.from('review_analysis').select(`
      *,
      contractor:review_contractors(*)
    `, {
        count: 'exact'
    }).range(from, to).order('analyzed_at', {
        ascending: false
    });
    if (error) {
        console.error('Error fetching analyses:', error);
        throw error;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const analyses = (data || []).map((row)=>({
            ...row,
            contractor: row.contractor
        }));
    return {
        data: analyses,
        total: count || 0
    };
}
async function getArticleByContractor(contractorId) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from('review_articles').select('*').eq('contractor_id', contractorId).order('generated_at', {
        ascending: false
    }).limit(1).single();
    if (error) {
        if (error.code === 'PGRST116') {
            return null;
        }
        console.error('Error fetching article:', error);
        throw error;
    }
    return data;
}
async function getArticles(filters, page = 1, limit = 20) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const searchTerm = normalizeSearchTerm(filters?.search);
    let query = supabase.from('review_articles').select(`
      id,
      title,
      slug,
      content_markdown,
      status,
      generated_at,
      contractor:review_contractors(id, business_name, city, state)
    `, {
        count: 'exact'
    });
    // Apply status filter
    if (filters?.status) {
        query = query.eq('status', filters.status);
    }
    // Apply search filter (searches title and contractor business_name)
    if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,contractor.business_name.ilike.%${searchTerm}%`);
    }
    // Apply sorting
    const sortOption = filters?.sort || 'generated_desc';
    switch(sortOption){
        case 'generated_asc':
            query = query.order('generated_at', {
                ascending: true
            });
            break;
        case 'title_asc':
            query = query.order('title', {
                ascending: true
            });
            break;
        case 'title_desc':
            query = query.order('title', {
                ascending: false
            });
            break;
        // For contractor sorting, we'll handle it post-fetch
        case 'contractor_asc':
        case 'contractor_desc':
        case 'generated_desc':
        default:
            query = query.order('generated_at', {
                ascending: false
            });
            break;
    }
    query = query.range(from, to);
    let { data, count, error } = await query;
    if (error && searchTerm) {
        let fallbackQuery = supabase.from('review_articles').select(`
        id,
        title,
        slug,
        content_markdown,
        status,
        generated_at,
        contractor:review_contractors(id, business_name, city, state)
      `, {
            count: 'exact'
        });
        if (filters?.status) {
            fallbackQuery = fallbackQuery.eq('status', filters.status);
        }
        fallbackQuery = fallbackQuery.ilike('title', `%${searchTerm}%`);
        switch(sortOption){
            case 'generated_asc':
                fallbackQuery = fallbackQuery.order('generated_at', {
                    ascending: true
                });
                break;
            case 'title_asc':
                fallbackQuery = fallbackQuery.order('title', {
                    ascending: true
                });
                break;
            case 'title_desc':
                fallbackQuery = fallbackQuery.order('title', {
                    ascending: false
                });
                break;
            case 'contractor_asc':
            case 'contractor_desc':
            case 'generated_desc':
            default:
                fallbackQuery = fallbackQuery.order('generated_at', {
                    ascending: false
                });
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
    let articles = (data || []).map((row)=>({
            ...row,
            contractor: row.contractor
        }));
    // Post-fetch sorting for contractor name
    if (sortOption === 'contractor_asc') {
        articles = articles.sort((a, b)=>(a.contractor?.business_name || '').localeCompare(b.contractor?.business_name || ''));
    } else if (sortOption === 'contractor_desc') {
        articles = articles.sort((a, b)=>(b.contractor?.business_name || '').localeCompare(a.contractor?.business_name || ''));
    }
    return {
        data: articles,
        total: count || 0
    };
}
async function getArticleStatusCounts(search) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const searchTerm = normalizeSearchTerm(search);
    const buildBaseQuery = (includeContractor)=>{
        let query = supabase.from('review_articles').select(includeContractor ? 'id, contractor:review_contractors(id, business_name)' : 'id', {
            count: 'exact',
            head: true
        });
        if (searchTerm) {
            query = includeContractor ? query.or(`title.ilike.%${searchTerm}%,contractor.business_name.ilike.%${searchTerm}%`) : query.ilike('title', `%${searchTerm}%`);
        }
        return query;
    };
    const [totalResult, publishedResult, draftResult] = await Promise.all([
        buildBaseQuery(true),
        buildBaseQuery(true).eq('status', 'published'),
        buildBaseQuery(true).eq('status', 'draft')
    ]);
    if (totalResult.error || publishedResult.error || draftResult.error) {
        if (!search) {
            console.error('Error fetching article status counts:', {
                total: totalResult.error,
                published: publishedResult.error,
                draft: draftResult.error
            });
            return {
                total: 0,
                published: 0,
                draft: 0
            };
        }
        const [fallbackTotal, fallbackPublished, fallbackDraft] = await Promise.all([
            buildBaseQuery(false),
            buildBaseQuery(false).eq('status', 'published'),
            buildBaseQuery(false).eq('status', 'draft')
        ]);
        if (fallbackTotal.error || fallbackPublished.error || fallbackDraft.error) {
            console.error('Error fetching fallback article status counts:', {
                total: fallbackTotal.error,
                published: fallbackPublished.error,
                draft: fallbackDraft.error
            });
            return {
                total: 0,
                published: 0,
                draft: 0
            };
        }
        return {
            total: fallbackTotal.count || 0,
            published: fallbackPublished.count || 0,
            draft: fallbackDraft.count || 0
        };
    }
    return {
        total: totalResult.count || 0,
        published: publishedResult.count || 0,
        draft: draftResult.count || 0
    };
}
async function getArticleById(id) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from('review_articles').select(`
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
    `).eq('id', id).single();
    if (error) {
        if (error.code === 'PGRST116') {
            return null;
        }
        console.error('Error fetching article by id:', error);
        throw error;
    }
    // Supabase returns contractor as array, extract first element
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = data;
    return {
        ...row,
        contractor: Array.isArray(row.contractor) ? row.contractor[0] : row.contractor
    };
}
async function getArticleBySlug(slug) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from('review_articles').select(`
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
    `).eq('slug', slug).single();
    if (error) {
        if (error.code === 'PGRST116') {
            return null;
        }
        console.error('Error fetching article by slug:', error);
        throw error;
    }
    // Supabase returns contractor as array, extract first element
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = data;
    return {
        ...row,
        contractor: Array.isArray(row.contractor) ? row.contractor[0] : row.contractor
    };
}
async function getReviews(filters, page = 1, limit = 20) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const searchTerm = normalizeSearchTerm(filters?.search);
    const { city: city1, state: state1 } = parseLocationValue(filters?.location);
    const category = filters?.category;
    const searchTermFilter = filters?.searchTerm;
    let contractorIds = null;
    if (city1 || state1 || category || searchTermFilter) {
        let contractorQuery = supabase.from('review_contractors').select('id');
        if (city1) {
            contractorQuery = contractorQuery.eq('city', city1);
        }
        if (state1) {
            contractorQuery = contractorQuery.eq('state', state1);
        }
        if (category) {
            contractorQuery = contractorQuery.contains('category', [
                category
            ]);
        }
        if (searchTermFilter) {
            contractorQuery = contractorQuery.contains('search_terms', [
                searchTermFilter
            ]);
        }
        const { data: contractorData, error: contractorError } = await contractorQuery;
        if (contractorError) {
            console.error('Error fetching contractors for review filters:', contractorError);
            throw contractorError;
        }
        contractorIds = (contractorData || []).map((row)=>row.id);
        if (contractorIds.length === 0) {
            return {
                data: [],
                total: 0,
                stats: {
                    avgRating: 0,
                    responseRate: 0
                }
            };
        }
    }
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    let query = supabase.from('review_data').select(`
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
    `, {
        count: 'exact'
    });
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
        for (const service of filters.services){
            query = query.contains('analysis_json', {
                detected_services: [
                    service
                ]
            });
        }
    }
    query = query.range(from, to).order('review_date', {
        ascending: false,
        nullsFirst: false
    });
    const { data, count, error } = await query;
    if (error) {
        console.error('Error fetching reviews:', error);
        throw error;
    }
    // Calculate stats from a separate aggregate query (for all reviews, not just current page)
    let totalReviews = 0;
    let sumRatings = 0;
    let withResponse = 0;
    let statsQuery = supabase.from('review_data').select('avg_rating:avg(rating), total_reviews:count(*), responses:count(owner_response)');
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
        let fallbackQuery = supabase.from('review_data').select('rating, owner_response');
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
        sumRatings = allReviews.reduce((sum, r)=>sum + (r.rating || 0), 0);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        withResponse = allReviews.filter((r)=>r.owner_response).length;
    } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stats = statsData[0];
        totalReviews = stats.total_reviews || 0;
        sumRatings = (stats.avg_rating || 0) * totalReviews;
        withResponse = stats.responses || 0;
    }
    // Supabase returns contractor as array, transform to single object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reviews = (data || []).map((row)=>({
            ...row,
            contractor: Array.isArray(row.contractor) ? row.contractor[0] : row.contractor
        }));
    return {
        data: reviews,
        total: count || 0,
        stats: {
            avgRating: totalReviews > 0 ? sumRatings / totalReviews : 0,
            responseRate: totalReviews > 0 ? withResponse / totalReviews * 100 : 0
        }
    };
}
async function getRecentActivity(limit = 10) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    // Fetch all recent items in parallel
    const [contractorsResult, analysesResult, articlesResult] = await Promise.all([
        supabase.from('review_contractors').select('id, business_name, discovered_at').order('discovered_at', {
            ascending: false
        }).limit(limit),
        supabase.from('review_analysis').select(`
        id,
        analyzed_at,
        contractor:review_contractors(id, business_name)
      `).order('analyzed_at', {
            ascending: false
        }).limit(limit),
        supabase.from('review_articles').select(`
        id,
        generated_at,
        contractor:review_contractors(id, business_name)
      `).order('generated_at', {
            ascending: false
        }).limit(limit)
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
        recentContractors: contractorsResult.data || [],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recentAnalyses: (analysesResult.data || []).map((row)=>({
                ...row,
                contractor: row.contractor
            })),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recentArticles: (articlesResult.data || []).map((row)=>({
                ...row,
                contractor: row.contractor
            }))
    };
}
async function getUniqueCities() {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    // Try RPC function first (much faster - uses SQL DISTINCT)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_unique_cities');
    if (!rpcError && rpcData) {
        // RPC function exists and returned data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return rpcData.map((row)=>row.city).filter(Boolean);
    }
    // Fallback: Manual query with client-side deduplication
    // This path is used before the migration is applied
    const { data, error } = await supabase.from('review_contractors').select('city').order('city');
    if (error) {
        console.error('Error fetching cities:', error);
        throw error;
    }
    // Get unique cities (client-side deduplication)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cities = Array.from(new Set((data || []).map((row)=>row.city)));
    return cities.filter(Boolean);
}
async function getUniqueStates() {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    // Try RPC function first (much faster - uses SQL DISTINCT)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_unique_states');
    if (!rpcError && rpcData) {
        // RPC function exists and returned data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return rpcData.map((row)=>row.state).filter(Boolean);
    }
    // Fallback: Manual query with client-side deduplication
    // This path is used before the migration is applied
    const { data, error } = await supabase.from('review_contractors').select('state').order('state');
    if (error) {
        console.error('Error fetching states:', error);
        throw error;
    }
    // Get unique states (client-side deduplication)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const states = Array.from(new Set((data || []).map((row)=>row.state)));
    return states.filter(Boolean);
}
const getCachedCities = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["unstable_cache"])(async ()=>{
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createAdminClient"])();
    // Try RPC function first (much faster - uses SQL DISTINCT)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_unique_cities');
    if (!rpcError && rpcData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return rpcData.map((row)=>row.city).filter(Boolean);
    }
    // Fallback: Manual query with client-side deduplication
    const { data, error } = await supabase.from('review_contractors').select('city').order('city');
    if (error) {
        console.error('Error fetching cities:', error);
        throw error;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cities = Array.from(new Set((data || []).map((row)=>row.city)));
    return cities.filter(Boolean);
}, [
    'contractor-filter-cities'
], {
    revalidate: 3600,
    tags: [
        'contractor-filters'
    ]
});
const getCachedStates = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["unstable_cache"])(async ()=>{
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createAdminClient"])();
    // Try RPC function first (much faster - uses SQL DISTINCT)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_unique_states');
    if (!rpcError && rpcData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return rpcData.map((row)=>row.state).filter(Boolean);
    }
    // Fallback: Manual query with client-side deduplication
    const { data, error } = await supabase.from('review_contractors').select('state').order('state');
    if (error) {
        console.error('Error fetching states:', error);
        throw error;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const states = Array.from(new Set((data || []).map((row)=>row.state)));
    return states.filter(Boolean);
}, [
    'contractor-filter-states'
], {
    revalidate: 3600,
    tags: [
        'contractor-filters'
    ]
});
const getCachedLocations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["unstable_cache"])(async ()=>{
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createAdminClient"])();
    const { data, error } = await supabase.from('review_contractors').select('city, state').order('city');
    if (error) {
        console.error('Error fetching locations:', error);
        throw error;
    }
    const seen = new Set();
    const locations = [];
    (data || []).forEach((row)=>{
        if (!row.city) return;
        const key = `${row.city}||${row.state ?? ''}`;
        if (seen.has(key)) return;
        seen.add(key);
        locations.push({
            city: row.city,
            state: row.state
        });
    });
    return locations;
}, [
    'contractor-filter-locations'
], {
    revalidate: 3600,
    tags: [
        'contractor-filters'
    ]
});
const getCachedCategories = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["unstable_cache"])(async ()=>{
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createAdminClient"])();
    const { data, error } = await supabase.from('review_contractors').select('category');
    if (error) {
        console.error('Error fetching categories:', error);
        throw error;
    }
    const categories = new Set();
    (data || []).forEach((row)=>{
        (row.category || []).forEach((category)=>{
            if (category) categories.add(category);
        });
    });
    return Array.from(categories).sort((a, b)=>a.localeCompare(b));
}, [
    'contractor-filter-categories'
], {
    revalidate: 3600,
    tags: [
        'contractor-filters'
    ]
});
const getCachedSearchTerms = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["unstable_cache"])(async ()=>{
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createAdminClient"])();
    const { data, error } = await supabase.from('review_contractors').select('search_terms');
    if (error) {
        console.error('Error fetching search terms:', error);
        throw error;
    }
    const terms = new Set();
    (data || []).forEach((row)=>{
        (row.search_terms || []).forEach((term)=>{
            if (term) terms.add(term);
        });
    });
    return Array.from(terms).sort((a, b)=>a.localeCompare(b));
}, [
    'contractor-filter-search-terms'
], {
    revalidate: 3600,
    tags: [
        'contractor-filters'
    ]
});
async function searchContractors(query, limit = 10) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from('review_contractors').select(`
      *,
      review_data(id),
      review_analysis(id),
      review_articles(id)
    `).ilike('business_name', `%${query}%`).order('rating', {
        ascending: false,
        nullsFirst: false
    }).limit(limit);
    if (error) {
        console.error('Error searching contractors:', error);
        throw error;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((row)=>{
        const { review_data, review_analysis, review_articles, ...contractor } = row;
        return {
            ...contractor,
            reviewCount: Array.isArray(review_data) ? review_data.length : 0,
            hasAnalysis: Array.isArray(review_analysis) && review_analysis.length > 0,
            hasArticle: Array.isArray(review_articles) && review_articles.length > 0
        };
    });
}
async function getAIUsageStats(filters) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    let query = supabase.from('ai_usage_log').select('operation, total_tokens, cost_estimate, success');
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
                analyze: {
                    count: 0,
                    tokens: 0,
                    inputTokens: 0,
                    outputTokens: 0,
                    cost: 0
                },
                generate: {
                    count: 0,
                    tokens: 0,
                    inputTokens: 0,
                    outputTokens: 0,
                    cost: 0
                },
                discover: {
                    count: 0,
                    tokens: 0,
                    inputTokens: 0,
                    outputTokens: 0,
                    cost: 0
                }
            },
            successRate: 0
        };
    }
    const logs = data || [];
    // Calculate aggregations
    const totalOperations = logs.length;
    const totalTokens = logs.reduce((sum, log)=>sum + (log.total_tokens || 0), 0);
    const totalInputTokens = logs.reduce((sum, log)=>sum + (log.input_tokens || 0), 0);
    const totalOutputTokens = logs.reduce((sum, log)=>sum + (log.output_tokens || 0), 0);
    const totalCost = logs.reduce((sum, log)=>sum + Number(log.cost_estimate || 0), 0);
    const successfulOps = logs.filter((log)=>log.success).length;
    // Group by operation
    const byOperation = {
        analyze: {
            count: 0,
            tokens: 0,
            inputTokens: 0,
            outputTokens: 0,
            cost: 0
        },
        generate: {
            count: 0,
            tokens: 0,
            inputTokens: 0,
            outputTokens: 0,
            cost: 0
        },
        discover: {
            count: 0,
            tokens: 0,
            inputTokens: 0,
            outputTokens: 0,
            cost: 0
        }
    };
    logs.forEach((log)=>{
        const op = log.operation;
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
        successRate: totalOperations > 0 ? successfulOps / totalOperations * 100 : 0
    };
}
async function getAIUsageLogs(filters, page = 1, limit = 50, sortColumn = 'created_at', sortOrder = 'desc') {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    let query = supabase.from('ai_usage_log').select(`
      *,
      contractor:review_contractors(id, business_name, city, state)
    `, {
        count: 'exact'
    });
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
    const validColumns = [
        'created_at',
        'total_tokens',
        'cost_estimate',
        'duration_ms'
    ];
    const safeColumn = validColumns.includes(sortColumn) ? sortColumn : 'created_at';
    query = query.range(from, to).order(safeColumn, {
        ascending: sortOrder === 'asc'
    });
    const { data, count, error } = await query;
    if (error) {
        console.error('Error fetching AI usage logs:', error);
        return {
            data: [],
            total: 0
        };
    }
    return {
        data: data || [],
        total: count || 0
    };
}
async function getCostByContractor(contractorId) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from('ai_usage_log').select('total_tokens, cost_estimate').eq('contractor_id', contractorId);
    if (error) {
        console.error('Error fetching contractor costs:', error);
        return {
            totalCost: 0,
            totalTokens: 0,
            operations: 0
        };
    }
    const logs = data || [];
    return {
        totalCost: logs.reduce((sum, log)=>sum + Number(log.cost_estimate || 0), 0),
        totalTokens: logs.reduce((sum, log)=>sum + (log.total_tokens || 0), 0),
        operations: logs.length
    };
}
async function getDailyCostTrend(days = 30) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const since = new Date();
    since.setDate(since.getDate() - days);
    const { data, error } = await supabase.from('ai_usage_log').select('created_at, total_tokens, cost_estimate').gte('created_at', since.toISOString()).order('created_at', {
        ascending: true
    });
    if (error) {
        console.error('Error fetching daily cost trend:', error);
        return [];
    }
    // Group by date
    const byDate = {};
    (data || []).forEach((log)=>{
        const date = log.created_at.split('T')[0];
        if (!byDate[date]) {
            byDate[date] = {
                date,
                cost: 0,
                tokens: 0,
                operations: 0
            };
        }
        byDate[date].cost += Number(log.cost_estimate || 0);
        byDate[date].tokens += log.total_tokens || 0;
        byDate[date].operations++;
    });
    return Object.values(byDate).sort((a, b)=>a.date.localeCompare(b.date));
}
async function getModelStats() {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from('ai_usage_log').select('model, total_tokens, cost_estimate, duration_ms, success');
    if (error) {
        console.error('Error fetching model stats:', error);
        return [];
    }
    // Group by model
    const byModel = {};
    (data || []).forEach((log)=>{
        const model = log.model || 'unknown';
        if (!byModel[model]) {
            byModel[model] = {
                totalOps: 0,
                totalTokens: 0,
                totalCost: 0,
                totalDuration: 0,
                successCount: 0,
                durationCount: 0
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
    return Object.entries(byModel).map(([model, stats])=>({
            model,
            totalOperations: stats.totalOps,
            totalTokens: stats.totalTokens,
            totalCost: stats.totalCost,
            avgDuration: stats.durationCount > 0 ? stats.totalDuration / stats.durationCount : 0,
            successRate: stats.totalOps > 0 ? stats.successCount / stats.totalOps * 100 : 0
        }));
}
async function getDurationDistribution(filters) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    let query = supabase.from('ai_usage_log').select('duration_ms').not('duration_ms', 'is', null);
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
    const buckets = [
        {
            label: '<1s',
            min: 0,
            max: 1000,
            count: 0
        },
        {
            label: '1-3s',
            min: 1000,
            max: 3000,
            count: 0
        },
        {
            label: '3-5s',
            min: 3000,
            max: 5000,
            count: 0
        },
        {
            label: '5-10s',
            min: 5000,
            max: 10000,
            count: 0
        },
        {
            label: '10-30s',
            min: 10000,
            max: 30000,
            count: 0
        },
        {
            label: '30s+',
            min: 30000,
            max: Infinity,
            count: 0
        }
    ];
    // Count operations per bucket
    (data || []).forEach((log)=>{
        const duration = log.duration_ms;
        for (const bucket of buckets){
            if (duration >= bucket.min && duration < bucket.max) {
                bucket.count++;
                break;
            }
        }
    });
    return buckets;
}
async function getTopContractorsByCost(limit = 10) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    // Fetch all logs with contractor data
    const { data, error } = await supabase.from('ai_usage_log').select(`
      contractor_id,
      total_tokens,
      cost_estimate,
      contractor:review_contractors(id, business_name, city, state)
    `).not('contractor_id', 'is', null);
    if (error) {
        console.error('Error fetching top contractors by cost:', error);
        return [];
    }
    // Group by contractor
    const byContractor = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data || []).forEach((log)=>{
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
                totalOperations: 0
            };
        }
        byContractor[contractorId].totalCost += Number(log.cost_estimate || 0);
        byContractor[contractorId].totalTokens += log.total_tokens || 0;
        byContractor[contractorId].totalOperations++;
    });
    // Sort by cost descending and limit
    return Object.values(byContractor).sort((a, b)=>b.totalCost - a.totalCost).slice(0, limit);
}
async function getSearchHistory(filters, page = 1, limit = 50, sortColumn = 'searched_at', sortOrder = 'desc') {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    let query = supabase.from('searched_cities').select('*', {
        count: 'exact'
    });
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
    const validColumns = [
        'searched_at',
        'contractors_found',
        'city'
    ];
    const safeColumn = validColumns.includes(sortColumn) ? sortColumn : 'searched_at';
    query = query.range(from, to).order(safeColumn, {
        ascending: sortOrder === 'asc'
    });
    const { data, count, error } = await query;
    if (error) {
        console.error('Error fetching search history:', error);
        return {
            data: [],
            total: 0
        };
    }
    return {
        data: data || [],
        total: count || 0
    };
}
async function getSearchHistoryStats() {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from('searched_cities').select('city, state, contractors_found');
    if (error) {
        console.error('Error fetching search history stats:', error);
        return {
            totalSearches: 0,
            totalContractorsFound: 0,
            uniqueCities: 0,
            uniqueStates: 0
        };
    }
    const searches = data || [];
    const cities = new Set(searches.map((s)=>s.city));
    const states = new Set(searches.map((s)=>s.state).filter(Boolean));
    return {
        totalSearches: searches.length,
        totalContractorsFound: searches.reduce((sum, s)=>sum + (s.contractors_found || 0), 0),
        uniqueCities: cities.size,
        uniqueStates: states.size
    };
}
async function getDuplicateSearches() {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from('searched_cities').select('city, state, search_term');
    if (error) {
        console.error('Error fetching searches for duplicates:', error);
        return new Set();
    }
    // Count occurrences
    const counts = {};
    (data || []).forEach((search)=>{
        const key = `${search.city}|${search.state || ''}|${search.search_term}`;
        counts[key] = (counts[key] || 0) + 1;
    });
    // Return keys with count > 1
    const duplicates = new Set();
    Object.entries(counts).forEach(([key, count])=>{
        if (count > 1) {
            duplicates.add(key);
        }
    });
    return duplicates;
}
async function getSearchStatsOptimized(filters) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    // Build filtered query - Supabase doesn't support aggregate functions directly,
    // so we use select with count option for total and separate DISTINCT queries
    let query = supabase.from('searched_cities').select('*', {
        count: 'exact',
        head: true
    });
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
        return {
            totalSearches: 0,
            totalContractorsFound: 0,
            uniqueCities: 0,
            uniqueStates: 0
        };
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
        stateQuery
    ]);
    // Calculate sum client-side (unavoidable without RPC, but limited by filters)
    const totalContractorsFound = (sumResult.data || []).reduce((sum, row)=>sum + (row.contractors_found || 0), 0);
    // Use Set for distinct counts (fast for filtered results)
    const uniqueCities = new Set((cityResult.data || []).map((r)=>r.city)).size;
    const uniqueStates = new Set((stateResult.data || []).map((r)=>r.state).filter(Boolean)).size;
    return {
        totalSearches: totalSearches || 0,
        totalContractorsFound,
        uniqueCities,
        uniqueStates
    };
}
async function getGlobalFilterOptions() {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    // Fetch distinct values - PostgreSQL optimizes DISTINCT with indexes
    const [statesResult, citiesResult] = await Promise.all([
        supabase.from('searched_cities').select('state').order('state'),
        supabase.from('searched_cities').select('city').order('city').limit(500)
    ]);
    // Extract unique values (dedupe in case of missing DISTINCT support)
    const states = [
        ...new Set((statesResult.data || []).map((r)=>r.state).filter((s)=>Boolean(s)))
    ].sort();
    const cities = [
        ...new Set((citiesResult.data || []).map((r)=>r.city))
    ].sort();
    return {
        states,
        cities
    };
}
async function getDuplicateKeysOptimized() {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    // Fetch minimal data needed for duplicate detection
    // Limit to reasonable amount for scalability
    const { data, error } = await supabase.from('searched_cities').select('city, state, search_term').limit(10000); // Safety limit
    if (error) {
        console.error('Error fetching duplicates:', error);
        return [];
    }
    // Count occurrences efficiently
    const counts = {};
    for (const search of data || []){
        const key = `${search.city}|${search.state || ''}|${search.search_term}`;
        counts[key] = (counts[key] || 0) + 1;
    }
    // Return only duplicate keys
    return Object.entries(counts).filter(([, count])=>count > 1).map(([key])=>key);
}
async function getPipelineTimingStats() {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    // Fetch all logs to calculate timing stats
    const { data, error } = await supabase.from('ai_usage_log').select('operation, duration_ms, created_at').order('created_at', {
        ascending: false
    });
    if (error) {
        console.error('Error fetching pipeline timing:', error);
        return {
            discover: {
                avgDuration: null,
                lastRun: null,
                totalRuns: 0
            },
            analyze: {
                avgDuration: null,
                lastRun: null,
                totalRuns: 0
            },
            generate: {
                avgDuration: null,
                lastRun: null,
                totalRuns: 0
            }
        };
    }
    const logs = data || [];
    // Helper to calculate stats for an operation type
    const calcStats = (operation)=>{
        const opLogs = logs.filter((l)=>l.operation === operation);
        const withDuration = opLogs.filter((l)=>l.duration_ms);
        const totalDuration = withDuration.reduce((sum, l)=>sum + (l.duration_ms || 0), 0);
        return {
            avgDuration: withDuration.length > 0 ? Math.round(totalDuration / withDuration.length) : null,
            lastRun: opLogs.length > 0 ? opLogs[0].created_at : null,
            totalRuns: opLogs.length
        };
    };
    return {
        discover: calcStats('discover'),
        analyze: calcStats('analyze'),
        generate: calcStats('generate')
    };
}
async function getDetectedServices() {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    // Fetch analysis_json from all reviews that have been analyzed
    const { data, error } = await supabase.from('review_data').select('analysis_json').not('analysis_json', 'is', null);
    if (error) {
        console.error('Error fetching detected services:', error);
        return [];
    }
    // Aggregate services across all reviews
    const serviceCounts = new Map();
    for (const row of data || []){
        const analysis = row.analysis_json;
        if (analysis?.detected_services) {
            for (const service of analysis.detected_services){
                const normalized = service.toLowerCase().trim();
                if (normalized) {
                    serviceCounts.set(normalized, (serviceCounts.get(normalized) || 0) + 1);
                }
            }
        }
    }
    // Convert to array and sort by count (descending)
    const services = Array.from(serviceCounts.entries()).map(([service, count])=>({
            service,
            count
        })).sort((a, b)=>b.count - a.count);
    return services;
}
const getCachedDetectedServices = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["unstable_cache"])(async ()=>{
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createAdminClient"])();
    // Fetch analysis_json from all reviews that have been analyzed
    const { data, error } = await supabase.from('review_data').select('analysis_json').not('analysis_json', 'is', null);
    if (error) {
        console.error('Error fetching detected services:', error);
        return [];
    }
    // Aggregate services across all reviews
    const serviceCounts = new Map();
    for (const row of data || []){
        const analysis = row.analysis_json;
        if (analysis?.detected_services) {
            for (const service of analysis.detected_services){
                const normalized = service.toLowerCase().trim();
                if (normalized) {
                    serviceCounts.set(normalized, (serviceCounts.get(normalized) || 0) + 1);
                }
            }
        }
    }
    // Convert to array and sort by count (descending)
    const services = Array.from(serviceCounts.entries()).map(([service, count])=>({
            service,
            count
        })).sort((a, b)=>b.count - a.count);
    return services;
}, [
    'review-filter-detected-services'
], {
    revalidate: 3600,
    tags: [
        'review-filters'
    ]
});
}),
"[project]/src/components/dashboard/SortableHeader.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SortableHeader",
    ()=>SortableHeader,
    "buildSortUrlHelper",
    ()=>buildSortUrlHelper,
    "parseSortParams",
    ()=>parseSortParams
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.react-server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$up$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronUp$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-up.js [app-rsc] (ecmascript) <export default as ChevronUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-down.js [app-rsc] (ecmascript) <export default as ChevronDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevrons$2d$up$2d$down$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronsUpDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevrons-up-down.js [app-rsc] (ecmascript) <export default as ChevronsUpDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-rsc] (ecmascript)");
;
;
;
;
function SortableHeader({ column, label, currentSort, currentOrder, buildSortUrl, className, align = 'left' }) {
    const isActive = currentSort === column;
    // Toggle order: if active and asc -> desc, if active and desc -> asc, if not active -> asc
    const nextOrder = isActive && currentOrder === 'asc' ? 'desc' : 'asc';
    const href = buildSortUrl(column, nextOrder);
    const alignClass = {
        left: 'text-left justify-start',
        right: 'text-right justify-end',
        center: 'text-center justify-center'
    }[align];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cn"])('px-4 py-3 font-medium text-muted-foreground', className),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
            href: href,
            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cn"])('inline-flex items-center gap-1 hover:text-foreground transition-colors group', alignClass, isActive && 'text-foreground'),
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    children: label
                }, void 0, false, {
                    fileName: "[project]/src/components/dashboard/SortableHeader.tsx",
                    lineNumber: 70,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "w-4 h-4 flex items-center justify-center",
                    children: isActive ? currentOrder === 'asc' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$up$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronUp$3e$__["ChevronUp"], {
                        className: "h-4 w-4"
                    }, void 0, false, {
                        fileName: "[project]/src/components/dashboard/SortableHeader.tsx",
                        lineNumber: 74,
                        columnNumber: 15
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                        className: "h-4 w-4"
                    }, void 0, false, {
                        fileName: "[project]/src/components/dashboard/SortableHeader.tsx",
                        lineNumber: 76,
                        columnNumber: 15
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevrons$2d$up$2d$down$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronsUpDown$3e$__["ChevronsUpDown"], {
                        className: "h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity"
                    }, void 0, false, {
                        fileName: "[project]/src/components/dashboard/SortableHeader.tsx",
                        lineNumber: 79,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/dashboard/SortableHeader.tsx",
                    lineNumber: 71,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/dashboard/SortableHeader.tsx",
            lineNumber: 62,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/dashboard/SortableHeader.tsx",
        lineNumber: 61,
        columnNumber: 5
    }, this);
}
function parseSortParams(searchParams, defaultSort, defaultOrder = 'desc') {
    const sort = searchParams.sort || defaultSort;
    const order = searchParams.order === 'asc' || searchParams.order === 'desc' ? searchParams.order : defaultOrder;
    return {
        sort,
        order
    };
}
function buildSortUrlHelper(baseUrl, currentParams, column, order) {
    const merged = {
        ...currentParams,
        sort: column,
        order,
        page: '1'
    };
    const queryParts = Object.entries(merged).filter(([, v])=>v !== undefined && v !== '').map(([k, v])=>`${k}=${encodeURIComponent(v)}`);
    return queryParts.length > 0 ? `${baseUrl}?${queryParts.join('&')}` : baseUrl;
}
}),
"[project]/src/components/dashboard/SearchFilters.tsx [app-rsc] (client reference proxy) <module evaluation>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SearchFilters",
    ()=>SearchFilters
]);
// This file is generated by next-core EcmascriptClientReferenceModule.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const SearchFilters = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call SearchFilters() from the server but SearchFilters is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/dashboard/SearchFilters.tsx <module evaluation>", "SearchFilters");
}),
"[project]/src/components/dashboard/SearchFilters.tsx [app-rsc] (client reference proxy)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SearchFilters",
    ()=>SearchFilters
]);
// This file is generated by next-core EcmascriptClientReferenceModule.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const SearchFilters = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call SearchFilters() from the server but SearchFilters is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/dashboard/SearchFilters.tsx", "SearchFilters");
}),
"[project]/src/components/dashboard/SearchFilters.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$SearchFilters$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/components/dashboard/SearchFilters.tsx [app-rsc] (client reference proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$SearchFilters$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__ = __turbopack_context__.i("[project]/src/components/dashboard/SearchFilters.tsx [app-rsc] (client reference proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$SearchFilters$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__);
}),
"[project]/src/app/searches/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SearchesPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.react-server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/search.js [app-rsc] (ecmascript) <export default as Search>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/map-pin.js [app-rsc] (ecmascript) <export default as MapPin>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/users.js [app-rsc] (ecmascript) <export default as Users>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$globe$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Globe$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/globe.js [app-rsc] (ecmascript) <export default as Globe>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$building$2d$2$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Building2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/building-2.js [app-rsc] (ecmascript) <export default as Building2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/triangle-alert.js [app-rsc] (ecmascript) <export default as AlertTriangle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$copy$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Copy$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/copy.js [app-rsc] (ecmascript) <export default as Copy>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$activity$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Activity$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/activity.js [app-rsc] (ecmascript) <export default as Activity>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$database$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Database$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/database.js [app-rsc] (ecmascript) <export default as Database>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$queries$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase/queries.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$SortableHeader$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/dashboard/SortableHeader.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$SearchFilters$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/dashboard/SearchFilters.tsx [app-rsc] (ecmascript)");
;
;
;
;
;
;
;
// =============================================================================
// Utility Functions
// =============================================================================
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}
function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'Now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return formatDate(dateString);
}
// =============================================================================
// Stat Components (Mission Control Style)
// =============================================================================
function StatBlock({ label, value, icon: Icon, color = 'emerald' }) {
    const colorClasses = {
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
        violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20'
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex items-center gap-3 px-4 py-3 bg-zinc-900/50 border border-zinc-800/50 rounded-lg",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `flex items-center justify-center h-10 w-10 rounded-lg border ${colorClasses[color]}`,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                    className: "h-5 w-5"
                }, void 0, false, {
                    fileName: "[project]/src/app/searches/page.tsx",
                    lineNumber: 86,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/searches/page.tsx",
                lineNumber: 83,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-2xl font-bold font-mono text-zinc-100 tabular-nums",
                        children: typeof value === 'number' ? value.toLocaleString() : value
                    }, void 0, false, {
                        fileName: "[project]/src/app/searches/page.tsx",
                        lineNumber: 89,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs font-medium text-zinc-500 uppercase tracking-wider",
                        children: label
                    }, void 0, false, {
                        fileName: "[project]/src/app/searches/page.tsx",
                        lineNumber: 92,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/searches/page.tsx",
                lineNumber: 88,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/searches/page.tsx",
        lineNumber: 82,
        columnNumber: 5
    }, this);
}
// =============================================================================
// Result Badge
// =============================================================================
function ResultsBadge({ count }) {
    const colorClass = count === 0 ? 'bg-red-500/15 text-red-400 border-red-500/30' : count < 10 ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: `inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-mono tabular-nums ${colorClass}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__["Users"], {
                className: "h-3 w-3"
            }, void 0, false, {
                fileName: "[project]/src/app/searches/page.tsx",
                lineNumber: 116,
                columnNumber: 7
            }, this),
            count
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/searches/page.tsx",
        lineNumber: 113,
        columnNumber: 5
    }, this);
}
// =============================================================================
// Duplicate Badge
// =============================================================================
function DuplicateBadge() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: "inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-mono uppercase tracking-wider",
        title: "This city + search term combination has been searched multiple times",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$copy$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Copy$3e$__["Copy"], {
                className: "h-2.5 w-2.5"
            }, void 0, false, {
                fileName: "[project]/src/app/searches/page.tsx",
                lineNumber: 132,
                columnNumber: 7
            }, this),
            "DUP"
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/searches/page.tsx",
        lineNumber: 128,
        columnNumber: 5
    }, this);
}
async function SearchesPage({ searchParams }) {
    const params = await searchParams;
    const page = parseInt(params.page || '1', 10);
    // Parse sort params
    const { sort, order } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$SortableHeader$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["parseSortParams"])({
        sort: params.sort,
        order: params.order
    }, 'searched_at', 'desc');
    const sortColumn = sort;
    const filters = {};
    if (params.city) filters.city = params.city;
    if (params.state) filters.state = params.state;
    // Fetch data with optimized queries (parallel)
    const [searchesResult, stats, filterOptions, duplicateKeys] = await Promise.all([
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$queries$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getSearchHistory"])(filters, page, 50, sortColumn, order),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$queries$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getSearchStatsOptimized"])(filters),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$queries$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getGlobalFilterOptions"])(),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$queries$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getDuplicateKeysOptimized"])()
    ]);
    const { data: searches, total } = searchesResult;
    const totalPages = Math.ceil(total / 50);
    // Convert duplicate keys array to Set for O(1) lookup
    const duplicatesSet = new Set(duplicateKeys);
    // Helper to check if a search is a duplicate
    const isDuplicate = (search)=>{
        const key = `${search.city}|${search.state || ''}|${search.search_term}`;
        return duplicatesSet.has(key);
    };
    // Build filter URLs
    const baseUrl = '/searches';
    const buildFilterUrl = (newParams)=>{
        const merged = {
            ...params,
            ...newParams,
            page: '1'
        };
        const queryParts = Object.entries(merged).filter(([, v])=>v !== undefined && v !== '').map(([k, v])=>`${k}=${encodeURIComponent(v)}`);
        return queryParts.length > 0 ? `${baseUrl}?${queryParts.join('&')}` : baseUrl;
    };
    // Build sort URL helper
    const buildSortUrl = (column, sortOrder)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$SortableHeader$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["buildSortUrlHelper"])(baseUrl, params, column, sortOrder);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-start justify-between",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-3 mb-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$activity$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Activity$3e$__["Activity"], {
                                                className: "h-5 w-5 text-emerald-400"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/searches/page.tsx",
                                                lineNumber: 214,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                                className: "text-2xl font-bold text-zinc-100 tracking-tight",
                                                children: "Search History"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/searches/page.tsx",
                                                lineNumber: 215,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/searches/page.tsx",
                                        lineNumber: 213,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded",
                                        children: "Live"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/searches/page.tsx",
                                        lineNumber: 219,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/searches/page.tsx",
                                lineNumber: 212,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-zinc-500 font-mono",
                                children: [
                                    "Google Maps discovery operations · ",
                                    total.toLocaleString(),
                                    ' ',
                                    "records"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/searches/page.tsx",
                                lineNumber: 223,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/searches/page.tsx",
                        lineNumber: 211,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border border-zinc-800/50 rounded-lg",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$database$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Database$3e$__["Database"], {
                                className: "h-4 w-4 text-zinc-500"
                            }, void 0, false, {
                                fileName: "[project]/src/app/searches/page.tsx",
                                lineNumber: 229,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs font-mono text-zinc-500",
                                children: "searched_cities"
                            }, void 0, false, {
                                fileName: "[project]/src/app/searches/page.tsx",
                                lineNumber: 230,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/searches/page.tsx",
                        lineNumber: 228,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/searches/page.tsx",
                lineNumber: 210,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-2 lg:grid-cols-4 gap-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(StatBlock, {
                        label: "Total Searches",
                        value: stats.totalSearches,
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"],
                        color: "emerald"
                    }, void 0, false, {
                        fileName: "[project]/src/app/searches/page.tsx",
                        lineNumber: 238,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(StatBlock, {
                        label: "Contractors Found",
                        value: stats.totalContractorsFound,
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$building$2d$2$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Building2$3e$__["Building2"],
                        color: "cyan"
                    }, void 0, false, {
                        fileName: "[project]/src/app/searches/page.tsx",
                        lineNumber: 244,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(StatBlock, {
                        label: "Cities Searched",
                        value: stats.uniqueCities,
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__["MapPin"],
                        color: "violet"
                    }, void 0, false, {
                        fileName: "[project]/src/app/searches/page.tsx",
                        lineNumber: 250,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(StatBlock, {
                        label: "States Covered",
                        value: stats.uniqueStates,
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$globe$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Globe$3e$__["Globe"],
                        color: "amber"
                    }, void 0, false, {
                        fileName: "[project]/src/app/searches/page.tsx",
                        lineNumber: 256,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/searches/page.tsx",
                lineNumber: 237,
                columnNumber: 7
            }, this),
            duplicateKeys.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"], {
                        className: "h-5 w-5 text-amber-400 shrink-0 mt-0.5"
                    }, void 0, false, {
                        fileName: "[project]/src/app/searches/page.tsx",
                        lineNumber: 267,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm font-medium text-zinc-200",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "font-mono text-amber-400",
                                        children: duplicateKeys.length
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/searches/page.tsx",
                                        lineNumber: 270,
                                        columnNumber: 15
                                    }, this),
                                    ' ',
                                    "duplicate search",
                                    duplicateKeys.length === 1 ? '' : 'es',
                                    " detected"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/searches/page.tsx",
                                lineNumber: 269,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-zinc-500 mt-0.5",
                                children: "Same city + search term combination searched multiple times. This may result in duplicate contractor entries."
                            }, void 0, false, {
                                fileName: "[project]/src/app/searches/page.tsx",
                                lineNumber: 275,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/searches/page.tsx",
                        lineNumber: 268,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/searches/page.tsx",
                lineNumber: 266,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-lg",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2 mb-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-2 w-2 rounded-full bg-emerald-400 animate-pulse"
                            }, void 0, false, {
                                fileName: "[project]/src/app/searches/page.tsx",
                                lineNumber: 286,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs font-mono uppercase tracking-wider text-zinc-500",
                                children: "Filters"
                            }, void 0, false, {
                                fileName: "[project]/src/app/searches/page.tsx",
                                lineNumber: 287,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/searches/page.tsx",
                        lineNumber: 285,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Suspense"], {
                        fallback: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "h-10 bg-zinc-800/50 rounded animate-pulse"
                        }, void 0, false, {
                            fileName: "[project]/src/app/searches/page.tsx",
                            lineNumber: 293,
                            columnNumber: 13
                        }, void 0),
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$SearchFilters$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SearchFilters"], {
                            states: filterOptions.states,
                            cities: filterOptions.cities,
                            currentState: params.state,
                            currentCity: params.city
                        }, void 0, false, {
                            fileName: "[project]/src/app/searches/page.tsx",
                            lineNumber: 296,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/searches/page.tsx",
                        lineNumber: 291,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/searches/page.tsx",
                lineNumber: 284,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-zinc-900/30 border border-zinc-800/50 rounded-lg overflow-hidden",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 bg-zinc-900/50",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "h-2 w-2 rounded-full bg-cyan-400"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/searches/page.tsx",
                                        lineNumber: 310,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs font-mono uppercase tracking-wider text-zinc-500",
                                        children: "Search Records"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/searches/page.tsx",
                                        lineNumber: 311,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/searches/page.tsx",
                                lineNumber: 309,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs font-mono text-zinc-600",
                                children: [
                                    "Showing ",
                                    searches.length,
                                    " of ",
                                    total.toLocaleString()
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/searches/page.tsx",
                                lineNumber: 315,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/searches/page.tsx",
                        lineNumber: 308,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "overflow-x-auto",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                            className: "w-full text-sm",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        className: "border-b border-zinc-800/50 bg-zinc-950/50",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$SortableHeader$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SortableHeader"], {
                                                column: "city",
                                                label: "Location",
                                                currentSort: sort,
                                                currentOrder: order,
                                                buildSortUrl: buildSortUrl,
                                                className: "px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-zinc-500"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/searches/page.tsx",
                                                lineNumber: 324,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-zinc-500",
                                                children: "Search Term"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/searches/page.tsx",
                                                lineNumber: 332,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$SortableHeader$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SortableHeader"], {
                                                column: "searched_at",
                                                label: "Timestamp",
                                                currentSort: sort,
                                                currentOrder: order,
                                                buildSortUrl: buildSortUrl,
                                                className: "px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-zinc-500"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/searches/page.tsx",
                                                lineNumber: 335,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$SortableHeader$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SortableHeader"], {
                                                column: "contractors_found",
                                                label: "Results",
                                                currentSort: sort,
                                                currentOrder: order,
                                                buildSortUrl: buildSortUrl,
                                                align: "right",
                                                className: "px-4 py-3 text-right font-mono text-xs uppercase tracking-wider text-zinc-500"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/searches/page.tsx",
                                                lineNumber: 343,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/searches/page.tsx",
                                        lineNumber: 323,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/searches/page.tsx",
                                    lineNumber: 322,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                    className: "divide-y divide-zinc-800/30",
                                    children: searches.map((search)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                            className: "hover:bg-zinc-800/20 transition-colors",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-4 py-3",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center gap-2",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__["MapPin"], {
                                                                className: "h-4 w-4 text-zinc-600"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/searches/page.tsx",
                                                                lineNumber: 362,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: "text-zinc-200 font-medium",
                                                                        children: search.city
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/searches/page.tsx",
                                                                        lineNumber: 364,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: "text-xs font-mono text-zinc-600",
                                                                        children: [
                                                                            search.state ? `${search.state}, ` : '',
                                                                            search.country
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/src/app/searches/page.tsx",
                                                                        lineNumber: 367,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/app/searches/page.tsx",
                                                                lineNumber: 363,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/searches/page.tsx",
                                                        lineNumber: 361,
                                                        columnNumber: 21
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/searches/page.tsx",
                                                    lineNumber: 360,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-4 py-3",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center gap-2",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "font-mono text-zinc-300",
                                                                children: search.search_term
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/searches/page.tsx",
                                                                lineNumber: 376,
                                                                columnNumber: 23
                                                            }, this),
                                                            isDuplicate(search) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(DuplicateBadge, {}, void 0, false, {
                                                                fileName: "[project]/src/app/searches/page.tsx",
                                                                lineNumber: 379,
                                                                columnNumber: 47
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/searches/page.tsx",
                                                        lineNumber: 375,
                                                        columnNumber: 21
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/searches/page.tsx",
                                                    lineNumber: 374,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-4 py-3",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "font-mono text-zinc-300 tabular-nums",
                                                                children: formatRelativeTime(search.searched_at)
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/searches/page.tsx",
                                                                lineNumber: 384,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "text-xs font-mono text-zinc-600",
                                                                children: formatDate(search.searched_at)
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/searches/page.tsx",
                                                                lineNumber: 387,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/searches/page.tsx",
                                                        lineNumber: 383,
                                                        columnNumber: 21
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/searches/page.tsx",
                                                    lineNumber: 382,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-4 py-3 text-right",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(ResultsBadge, {
                                                        count: search.contractors_found
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/searches/page.tsx",
                                                        lineNumber: 393,
                                                        columnNumber: 21
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/searches/page.tsx",
                                                    lineNumber: 392,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, search.id, true, {
                                            fileName: "[project]/src/app/searches/page.tsx",
                                            lineNumber: 356,
                                            columnNumber: 17
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/src/app/searches/page.tsx",
                                    lineNumber: 354,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/searches/page.tsx",
                            lineNumber: 321,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/searches/page.tsx",
                        lineNumber: 320,
                        columnNumber: 9
                    }, this),
                    searches.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-12 text-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "inline-flex items-center justify-center h-16 w-16 rounded-full bg-zinc-800/50 border border-zinc-700/50 mb-4",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                                    className: "h-8 w-8 text-zinc-600"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/searches/page.tsx",
                                    lineNumber: 405,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/searches/page.tsx",
                                lineNumber: 404,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-lg font-semibold text-zinc-300 mb-1",
                                children: "No searches found"
                            }, void 0, false, {
                                fileName: "[project]/src/app/searches/page.tsx",
                                lineNumber: 407,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-zinc-500 max-w-md mx-auto",
                                children: params.city || params.state ? 'Try adjusting your filters to see more results.' : 'Search history will appear here once you run the discover script.'
                            }, void 0, false, {
                                fileName: "[project]/src/app/searches/page.tsx",
                                lineNumber: 410,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-4 text-xs font-mono text-zinc-600",
                                children: [
                                    "Table:",
                                    ' ',
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                        className: "px-1.5 py-0.5 bg-zinc-800/50 rounded",
                                        children: "searched_cities"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/searches/page.tsx",
                                        lineNumber: 417,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/searches/page.tsx",
                                lineNumber: 415,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/searches/page.tsx",
                        lineNumber: 403,
                        columnNumber: 11
                    }, this),
                    totalPages > 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between border-t border-zinc-800/50 px-4 py-3 bg-zinc-900/50",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs font-mono text-zinc-500",
                                children: [
                                    "Page",
                                    ' ',
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-zinc-300",
                                        children: [
                                            page,
                                            "/",
                                            totalPages
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/searches/page.tsx",
                                        lineNumber: 429,
                                        columnNumber: 15
                                    }, this),
                                    ' ',
                                    "· ",
                                    total.toLocaleString(),
                                    " total"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/searches/page.tsx",
                                lineNumber: 427,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex gap-2",
                                children: [
                                    page > 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                        href: buildFilterUrl({
                                            page: String(page - 1)
                                        }),
                                        className: "px-3 py-1.5 text-xs font-mono bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 border border-zinc-700/50 rounded transition-colors",
                                        children: "← Prev"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/searches/page.tsx",
                                        lineNumber: 436,
                                        columnNumber: 17
                                    }, this),
                                    page < totalPages && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                        href: buildFilterUrl({
                                            page: String(page + 1)
                                        }),
                                        className: "px-3 py-1.5 text-xs font-mono bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 border border-zinc-700/50 rounded transition-colors",
                                        children: "Next →"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/searches/page.tsx",
                                        lineNumber: 444,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/searches/page.tsx",
                                lineNumber: 434,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/searches/page.tsx",
                        lineNumber: 426,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/searches/page.tsx",
                lineNumber: 306,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/searches/page.tsx",
        lineNumber: 208,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/app/searches/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/searches/page.tsx [app-rsc] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__113ce0db._.js.map