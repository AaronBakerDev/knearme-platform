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
"[project]/src/components/dashboard/PageHeader.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PageHeader",
    ()=>PageHeader
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$database$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Database$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/database.js [app-rsc] (ecmascript) <export default as Database>");
;
;
const badgeColors = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
};
function PageHeader({ title, subtitle, icon: Icon, badge, badgeColor = 'emerald', recordCount, tableName, actions }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                                    Icon && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                        className: "h-5 w-5 text-emerald-400"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/dashboard/PageHeader.tsx",
                                        lineNumber: 63,
                                        columnNumber: 22
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        className: "text-2xl font-bold text-zinc-100 tracking-tight",
                                        children: title
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/dashboard/PageHeader.tsx",
                                        lineNumber: 64,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/dashboard/PageHeader.tsx",
                                lineNumber: 62,
                                columnNumber: 11
                            }, this),
                            badge && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: `px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest border rounded ${badgeColors[badgeColor]}`,
                                children: badge
                            }, void 0, false, {
                                fileName: "[project]/src/components/dashboard/PageHeader.tsx",
                                lineNumber: 69,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/dashboard/PageHeader.tsx",
                        lineNumber: 61,
                        columnNumber: 9
                    }, this),
                    (subtitle || recordCount !== undefined) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-zinc-500 font-mono",
                        children: [
                            subtitle,
                            subtitle && recordCount !== undefined && ' \u00B7 ',
                            recordCount !== undefined && `${recordCount.toLocaleString()} records`
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/dashboard/PageHeader.tsx",
                        lineNumber: 77,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/dashboard/PageHeader.tsx",
                lineNumber: 60,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-3",
                children: [
                    actions,
                    tableName && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border border-zinc-800/50 rounded-lg",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$database$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Database$3e$__["Database"], {
                                className: "h-4 w-4 text-zinc-500"
                            }, void 0, false, {
                                fileName: "[project]/src/components/dashboard/PageHeader.tsx",
                                lineNumber: 89,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs font-mono text-zinc-500",
                                children: tableName
                            }, void 0, false, {
                                fileName: "[project]/src/components/dashboard/PageHeader.tsx",
                                lineNumber: 90,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/dashboard/PageHeader.tsx",
                        lineNumber: 88,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/dashboard/PageHeader.tsx",
                lineNumber: 85,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/dashboard/PageHeader.tsx",
        lineNumber: 59,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/components/dashboard/StatBlock.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "StatBlock",
    ()=>StatBlock,
    "StatBlockGrid",
    ()=>StatBlockGrid
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
;
const colorClasses = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
};
function StatBlock({ label, value, icon: Icon, color = 'emerald', subtitle }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex items-center gap-3 px-4 py-3 bg-zinc-900/50 border border-zinc-800/50 rounded-lg",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `flex items-center justify-center h-10 w-10 rounded-lg border ${colorClasses[color]}`,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                    className: "h-5 w-5"
                }, void 0, false, {
                    fileName: "[project]/src/components/dashboard/StatBlock.tsx",
                    lineNumber: 50,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/dashboard/StatBlock.tsx",
                lineNumber: 47,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-2xl font-bold font-mono text-zinc-100 tabular-nums",
                        children: typeof value === 'number' ? value.toLocaleString() : value
                    }, void 0, false, {
                        fileName: "[project]/src/components/dashboard/StatBlock.tsx",
                        lineNumber: 53,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs font-medium text-zinc-500 uppercase tracking-wider",
                        children: label
                    }, void 0, false, {
                        fileName: "[project]/src/components/dashboard/StatBlock.tsx",
                        lineNumber: 56,
                        columnNumber: 9
                    }, this),
                    subtitle && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs text-zinc-600 mt-0.5",
                        children: subtitle
                    }, void 0, false, {
                        fileName: "[project]/src/components/dashboard/StatBlock.tsx",
                        lineNumber: 60,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/dashboard/StatBlock.tsx",
                lineNumber: 52,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/dashboard/StatBlock.tsx",
        lineNumber: 46,
        columnNumber: 5
    }, this);
}
function StatBlockGrid({ children, columns = 4 }) {
    const gridCols = {
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-2 lg:grid-cols-4'
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `grid ${gridCols[columns]} gap-3`,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/components/dashboard/StatBlock.tsx",
        lineNumber: 82,
        columnNumber: 10
    }, this);
}
}),
"[project]/src/app/reviews/ReviewsFilters.tsx [app-rsc] (client reference proxy) <module evaluation>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ReviewsFilters",
    ()=>ReviewsFilters
]);
// This file is generated by next-core EcmascriptClientReferenceModule.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const ReviewsFilters = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call ReviewsFilters() from the server but ReviewsFilters is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/app/reviews/ReviewsFilters.tsx <module evaluation>", "ReviewsFilters");
}),
"[project]/src/app/reviews/ReviewsFilters.tsx [app-rsc] (client reference proxy)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ReviewsFilters",
    ()=>ReviewsFilters
]);
// This file is generated by next-core EcmascriptClientReferenceModule.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const ReviewsFilters = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call ReviewsFilters() from the server but ReviewsFilters is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/app/reviews/ReviewsFilters.tsx", "ReviewsFilters");
}),
"[project]/src/app/reviews/ReviewsFilters.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$reviews$2f$ReviewsFilters$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/app/reviews/ReviewsFilters.tsx [app-rsc] (client reference proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$reviews$2f$ReviewsFilters$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__ = __turbopack_context__.i("[project]/src/app/reviews/ReviewsFilters.tsx [app-rsc] (client reference proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$reviews$2f$ReviewsFilters$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__);
}),
"[project]/src/app/reviews/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ReviewsPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.react-server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$queries$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase/queries.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$PageHeader$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/dashboard/PageHeader.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$StatBlock$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/dashboard/StatBlock.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$reviews$2f$ReviewsFilters$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/reviews/ReviewsFilters.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/star.js [app-rsc] (ecmascript) <export default as Star>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$square$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageSquare$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/message-square.js [app-rsc] (ecmascript) <export default as MessageSquare>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/user.js [app-rsc] (ecmascript) <export default as User>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$building$2d$2$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Building2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/building-2.js [app-rsc] (ecmascript) <export default as Building2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/calendar.js [app-rsc] (ecmascript) <export default as Calendar>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trending-up.js [app-rsc] (ecmascript) <export default as TrendingUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$percent$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Percent$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/percent.js [app-rsc] (ecmascript) <export default as Percent>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-rsc] (ecmascript) <export default as X>");
;
;
;
;
;
;
;
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
}
/**
 * Rating badge with star display - Mission Control styling.
 */ function RatingBadge({ rating }) {
    const getColor = (r)=>{
        if (r >= 4) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        if (r >= 3) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        return 'bg-red-500/10 text-red-400 border-red-500/20';
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border ${getColor(rating)}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__["Star"], {
                className: "h-3 w-3 fill-current"
            }, void 0, false, {
                fileName: "[project]/src/app/reviews/page.tsx",
                lineNumber: 77,
                columnNumber: 7
            }, this),
            rating,
            ".0"
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/reviews/page.tsx",
        lineNumber: 74,
        columnNumber: 5
    }, this);
}
function buildQueryString(params, overrides = {}) {
    const merged = {
        ...params,
        ...overrides
    };
    const searchParams = new URLSearchParams();
    Object.entries(merged).forEach(([key, value])=>{
        if (value !== undefined && value !== '' && value !== 'all') {
            searchParams.set(key, String(value));
        }
    });
    return searchParams.toString() ? `?${searchParams.toString()}` : '';
}
/**
 * Generate page numbers to display in pagination
 */ function getPageNumbers(currentPage, totalPages) {
    const pages = [];
    if (totalPages <= 7) {
        for(let i = 1; i <= totalPages; i++){
            pages.push(i);
        }
    } else {
        pages.push(1);
        if (currentPage > 3) {
            pages.push('ellipsis');
        }
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);
        for(let i = start; i <= end; i++){
            pages.push(i);
        }
        if (currentPage < totalPages - 2) {
            pages.push('ellipsis');
        }
        if (totalPages > 1) {
            pages.push(totalPages);
        }
    }
    return pages;
}
/**
 * Pagination component with Mission Control styling.
 */ function Pagination({ currentPage, totalPages, totalCount, currentParams }) {
    const pageNumbers = getPageNumbers(currentPage, totalPages);
    // Build params without page for link building
    const baseParams = {
        ...currentParams
    };
    delete baseParams.page;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex items-center justify-between border-t border-zinc-800/50 px-4 py-3 bg-zinc-900/50",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs font-mono text-zinc-500",
                children: [
                    "Page ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-zinc-300",
                        children: [
                            currentPage,
                            "/",
                            totalPages
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/reviews/page.tsx",
                        lineNumber: 156,
                        columnNumber: 14
                    }, this),
                    " · ",
                    totalCount.toLocaleString(),
                    " total"
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/reviews/page.tsx",
                lineNumber: 155,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-2",
                children: [
                    currentPage > 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                        href: `/reviews${buildQueryString(baseParams, {
                            page: currentPage - 1
                        })}`,
                        className: "px-3 py-1.5 text-xs font-mono bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 border border-zinc-700/50 rounded transition-colors",
                        children: "← Prev"
                    }, void 0, false, {
                        fileName: "[project]/src/app/reviews/page.tsx",
                        lineNumber: 161,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "hidden sm:flex items-center gap-1",
                        children: pageNumbers.map((page, index)=>{
                            if (page === 'ellipsis') {
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "px-2 text-zinc-600 font-mono",
                                    children: "..."
                                }, `ellipsis-${index}`, false, {
                                    fileName: "[project]/src/app/reviews/page.tsx",
                                    lineNumber: 173,
                                    columnNumber: 17
                                }, this);
                            }
                            const isCurrentPage = page === currentPage;
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                href: `/reviews${buildQueryString(baseParams, {
                                    page
                                })}`,
                                className: `h-8 w-8 flex items-center justify-center text-xs font-mono rounded border transition-colors ${isCurrentPage ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-zinc-800/50 text-zinc-400 border-zinc-700/50 hover:bg-zinc-700/50 hover:text-zinc-200'}`,
                                children: page
                            }, page, false, {
                                fileName: "[project]/src/app/reviews/page.tsx",
                                lineNumber: 182,
                                columnNumber: 15
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/src/app/reviews/page.tsx",
                        lineNumber: 169,
                        columnNumber: 9
                    }, this),
                    currentPage < totalPages && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                        href: `/reviews${buildQueryString(baseParams, {
                            page: currentPage + 1
                        })}`,
                        className: "px-3 py-1.5 text-xs font-mono bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 border border-zinc-700/50 rounded transition-colors",
                        children: "Next →"
                    }, void 0, false, {
                        fileName: "[project]/src/app/reviews/page.tsx",
                        lineNumber: 198,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/reviews/page.tsx",
                lineNumber: 159,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/reviews/page.tsx",
        lineNumber: 154,
        columnNumber: 5
    }, this);
}
async function ReviewsPage({ searchParams }) {
    const params = await searchParams;
    const page = parseInt(params.page || '1', 10);
    const limit = 20;
    // Build filters from URL params
    const filters = {};
    if (params.rating && params.rating !== 'all') {
        filters.rating = parseInt(params.rating, 10);
    }
    if (params.search) {
        filters.search = params.search;
    }
    if (params.hasResponse === 'true') {
        filters.hasOwnerResponse = true;
    } else if (params.hasResponse === 'false') {
        filters.hasOwnerResponse = false;
    }
    if (params.location && params.location !== 'all') {
        filters.location = params.location;
    }
    if (params.category && params.category !== 'all') {
        filters.category = params.category;
    }
    if (params.searchTerm && params.searchTerm !== 'all') {
        filters.searchTerm = params.searchTerm;
    }
    if (params.service && params.service !== 'all') {
        filters.services = [
            params.service
        ];
    }
    const [reviewsResult, locationsRaw, categories, searchTerms, detectedServices] = await Promise.all([
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$queries$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getReviews"])(filters, page, limit),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$queries$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCachedLocations"])(),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$queries$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCachedCategories"])(),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$queries$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCachedSearchTerms"])(),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$queries$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCachedDetectedServices"])()
    ]);
    const locations = (locationsRaw || []).map((location)=>({
            value: `${location.city}||${location.state ?? ''}`,
            label: location.state ? `${location.city}, ${location.state}` : location.city
        })).sort((a, b)=>a.label.localeCompare(b.label));
    const { data: reviews, total, stats } = reviewsResult;
    const totalPages = Math.ceil(total / limit);
    const hasFilters = params.rating && params.rating !== 'all' || params.search && params.search !== '' || params.hasResponse && params.hasResponse !== 'all' || params.location && params.location !== 'all' || params.category && params.category !== 'all' || params.searchTerm && params.searchTerm !== 'all' || params.service && params.service !== 'all';
    // Current params for pagination links
    const currentParams = {
        rating: params.rating,
        search: params.search,
        hasResponse: params.hasResponse,
        location: params.location,
        category: params.category,
        searchTerm: params.searchTerm,
        service: params.service
    };
    const locationLabelMap = new Map(locations.map((location)=>[
            location.value,
            location.label
        ]));
    const activeFilters = [];
    if (params.search) {
        activeFilters.push({
            key: 'search',
            label: `Search: ${params.search}`
        });
    }
    if (params.location && params.location !== 'all') {
        activeFilters.push({
            key: 'location',
            label: `Location: ${locationLabelMap.get(params.location) || params.location}`
        });
    }
    if (params.category && params.category !== 'all') {
        activeFilters.push({
            key: 'category',
            label: `Category: ${params.category}`
        });
    }
    if (params.searchTerm && params.searchTerm !== 'all') {
        activeFilters.push({
            key: 'searchTerm',
            label: `Search Term: ${params.searchTerm}`
        });
    }
    if (params.rating && params.rating !== 'all') {
        activeFilters.push({
            key: 'rating',
            label: `Rating: ${params.rating}★`
        });
    }
    if (params.hasResponse === 'true') {
        activeFilters.push({
            key: 'hasResponse',
            label: 'Has Response'
        });
    } else if (params.hasResponse === 'false') {
        activeFilters.push({
            key: 'hasResponse',
            label: 'No Response'
        });
    }
    if (params.service && params.service !== 'all') {
        activeFilters.push({
            key: 'service',
            label: `Service: ${params.service}`
        });
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$PageHeader$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PageHeader"], {
                title: "Reviews",
                subtitle: "Browse all collected reviews across contractors",
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$square$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageSquare$3e$__["MessageSquare"],
                badge: "Data",
                badgeColor: "amber",
                recordCount: total,
                tableName: "review_reviews"
            }, void 0, false, {
                fileName: "[project]/src/app/reviews/page.tsx",
                lineNumber: 319,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$StatBlock$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["StatBlockGrid"], {
                columns: 3,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$StatBlock$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["StatBlock"], {
                        label: "Total Reviews",
                        value: total,
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$square$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageSquare$3e$__["MessageSquare"],
                        color: "amber"
                    }, void 0, false, {
                        fileName: "[project]/src/app/reviews/page.tsx",
                        lineNumber: 331,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$StatBlock$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["StatBlock"], {
                        label: "Avg Rating",
                        value: stats.avgRating.toFixed(1),
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"],
                        color: "emerald",
                        subtitle: "out of 5.0"
                    }, void 0, false, {
                        fileName: "[project]/src/app/reviews/page.tsx",
                        lineNumber: 337,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$StatBlock$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["StatBlock"], {
                        label: "Response Rate",
                        value: `${stats.responseRate.toFixed(0)}%`,
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$percent$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Percent$3e$__["Percent"],
                        color: "cyan"
                    }, void 0, false, {
                        fileName: "[project]/src/app/reviews/page.tsx",
                        lineNumber: 344,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/reviews/page.tsx",
                lineNumber: 330,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-lg",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2 mb-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-2 w-2 rounded-full bg-amber-400 animate-pulse"
                            }, void 0, false, {
                                fileName: "[project]/src/app/reviews/page.tsx",
                                lineNumber: 355,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs font-mono uppercase tracking-wider text-zinc-500",
                                children: "Filters"
                            }, void 0, false, {
                                fileName: "[project]/src/app/reviews/page.tsx",
                                lineNumber: 356,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/reviews/page.tsx",
                        lineNumber: 354,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$reviews$2f$ReviewsFilters$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ReviewsFilters"], {
                        locations: locations,
                        categories: categories,
                        searchTerms: searchTerms,
                        services: detectedServices
                    }, void 0, false, {
                        fileName: "[project]/src/app/reviews/page.tsx",
                        lineNumber: 360,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/reviews/page.tsx",
                lineNumber: 353,
                columnNumber: 7
            }, this),
            activeFilters.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-wrap items-center gap-2 px-4 py-2 text-xs font-mono text-zinc-400",
                children: [
                    activeFilters.map((filter)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                            href: `/reviews${buildQueryString(currentParams, {
                                [filter.key]: undefined
                            })}`,
                            className: "inline-flex items-center gap-1.5 rounded-full border border-zinc-700/50 bg-zinc-900/60 px-3 py-1 text-zinc-300 hover:text-zinc-100 hover:border-zinc-500/60 transition-colors",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "truncate max-w-[180px]",
                                    children: filter.label
                                }, void 0, false, {
                                    fileName: "[project]/src/app/reviews/page.tsx",
                                    lineNumber: 376,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                    className: "h-3 w-3 text-zinc-500"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/reviews/page.tsx",
                                    lineNumber: 377,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, `${filter.key}-${filter.label}`, true, {
                            fileName: "[project]/src/app/reviews/page.tsx",
                            lineNumber: 371,
                            columnNumber: 13
                        }, this)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                        href: "/reviews",
                        className: "inline-flex items-center gap-1.5 rounded-full border border-zinc-700/50 px-3 py-1 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500/60 transition-colors",
                        children: "Clear all"
                    }, void 0, false, {
                        fileName: "[project]/src/app/reviews/page.tsx",
                        lineNumber: 380,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/reviews/page.tsx",
                lineNumber: 369,
                columnNumber: 9
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
                                        className: "h-2 w-2 rounded-full bg-emerald-400"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/reviews/page.tsx",
                                        lineNumber: 394,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs font-mono uppercase tracking-wider text-zinc-500",
                                        children: "Review Records"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/reviews/page.tsx",
                                        lineNumber: 395,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/reviews/page.tsx",
                                lineNumber: 393,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs font-mono text-zinc-600",
                                children: [
                                    "Showing ",
                                    reviews.length,
                                    " of ",
                                    total.toLocaleString()
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/reviews/page.tsx",
                                lineNumber: 399,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/reviews/page.tsx",
                        lineNumber: 392,
                        columnNumber: 9
                    }, this),
                    reviews.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-12 text-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "inline-flex items-center justify-center h-16 w-16 rounded-full bg-zinc-800/50 border border-zinc-700/50 mb-4",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$square$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageSquare$3e$__["MessageSquare"], {
                                    className: "h-8 w-8 text-zinc-600"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/reviews/page.tsx",
                                    lineNumber: 407,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/reviews/page.tsx",
                                lineNumber: 406,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-lg font-semibold text-zinc-300 mb-1",
                                children: "No reviews found"
                            }, void 0, false, {
                                fileName: "[project]/src/app/reviews/page.tsx",
                                lineNumber: 409,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-zinc-500 max-w-md mx-auto",
                                children: hasFilters ? 'No reviews match your current filters. Try adjusting your search criteria.' : 'Reviews will appear here once collected by the agent.'
                            }, void 0, false, {
                                fileName: "[project]/src/app/reviews/page.tsx",
                                lineNumber: 412,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-4 text-xs font-mono text-zinc-600",
                                children: [
                                    "Table: ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                        className: "px-1.5 py-0.5 bg-zinc-800/50 rounded",
                                        children: "review_reviews"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/reviews/page.tsx",
                                        lineNumber: 418,
                                        columnNumber: 22
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/reviews/page.tsx",
                                lineNumber: 417,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/reviews/page.tsx",
                        lineNumber: 405,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "divide-y divide-zinc-800/30",
                        children: reviews.map((review)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "px-4 py-4 hover:bg-zinc-800/30 transition-colors",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-start justify-between gap-4 mb-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-3",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800/50 border border-zinc-700/50",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__["User"], {
                                                            className: "h-5 w-5 text-zinc-500"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/reviews/page.tsx",
                                                            lineNumber: 432,
                                                            columnNumber: 23
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/reviews/page.tsx",
                                                        lineNumber: 431,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "font-medium text-zinc-200",
                                                                children: review.reviewer_name || 'Anonymous'
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/reviews/page.tsx",
                                                                lineNumber: 435,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex items-center gap-2 text-xs text-zinc-500 font-mono mt-0.5",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__["Calendar"], {
                                                                        className: "h-3 w-3 text-zinc-600"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/reviews/page.tsx",
                                                                        lineNumber: 439,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    formatDate(review.review_date)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/app/reviews/page.tsx",
                                                                lineNumber: 438,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/reviews/page.tsx",
                                                        lineNumber: 434,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/reviews/page.tsx",
                                                lineNumber: 430,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(RatingBadge, {
                                                rating: review.rating
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/reviews/page.tsx",
                                                lineNumber: 444,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/reviews/page.tsx",
                                        lineNumber: 429,
                                        columnNumber: 17
                                    }, this),
                                    review.review_text && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm text-zinc-400 leading-relaxed mb-3 line-clamp-3",
                                        children: review.review_text
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/reviews/page.tsx",
                                        lineNumber: 449,
                                        columnNumber: 19
                                    }, this),
                                    review.contractor && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                        href: `/contractors/${review.contractor.id}`,
                                        className: "inline-flex items-center gap-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$building$2d$2$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Building2$3e$__["Building2"], {
                                                className: "h-3.5 w-3.5"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/reviews/page.tsx",
                                                lineNumber: 460,
                                                columnNumber: 21
                                            }, this),
                                            review.contractor.business_name,
                                            review.contractor.city && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-zinc-600",
                                                children: [
                                                    "• ",
                                                    review.contractor.city,
                                                    ", ",
                                                    review.contractor.state
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/reviews/page.tsx",
                                                lineNumber: 463,
                                                columnNumber: 23
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/reviews/page.tsx",
                                        lineNumber: 456,
                                        columnNumber: 19
                                    }, this),
                                    review.owner_response && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-4 pl-4 border-l-2 border-violet-500/50 bg-violet-500/5 rounded-r-lg p-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-[10px] font-mono uppercase tracking-widest text-violet-400 mb-1",
                                                children: "Owner Response"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/reviews/page.tsx",
                                                lineNumber: 473,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-sm text-zinc-400",
                                                children: review.owner_response
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/reviews/page.tsx",
                                                lineNumber: 476,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/reviews/page.tsx",
                                        lineNumber: 472,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, review.id, true, {
                                fileName: "[project]/src/app/reviews/page.tsx",
                                lineNumber: 424,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/app/reviews/page.tsx",
                        lineNumber: 422,
                        columnNumber: 11
                    }, this),
                    totalPages > 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(Pagination, {
                        currentPage: page,
                        totalPages: totalPages,
                        totalCount: total,
                        currentParams: currentParams
                    }, void 0, false, {
                        fileName: "[project]/src/app/reviews/page.tsx",
                        lineNumber: 488,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/reviews/page.tsx",
                lineNumber: 390,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/reviews/page.tsx",
        lineNumber: 317,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/app/reviews/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/reviews/page.tsx [app-rsc] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__e1b2bf62._.js.map