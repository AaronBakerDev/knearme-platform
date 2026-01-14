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
"[project]/src/app/pipeline/loading.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/pipeline/loading.tsx [app-rsc] (ecmascript)"));
}),
"[project]/src/components/dashboard/PipelineDiagram.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * PipelineDiagram Component
 *
 * Visual flow diagram showing the 4-stage contractor review pipeline:
 * Discover -> Collect -> Analyze -> Generate
 *
 * Each stage displays as a card with count/progress and colored status indicators:
 * - Complete (green): Stage finished
 * - In-progress (teal/primary): Currently processing
 * - Pending (gray): Not yet started
 *
 * @see /Users/aaronbaker/knearme-workspace/review-agent-dashboard/src/app/pipeline/page.tsx
 */ __turbopack_context__.s([
    "PipelineDiagram",
    ()=>PipelineDiagram
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
;
function PipelineDiagram({ stages }) {
    const getStatusColors = (status)=>{
        switch(status){
            case 'complete':
                return {
                    bg: 'bg-[var(--success)]/10',
                    border: 'border-[var(--success)]',
                    text: 'text-[var(--success)]',
                    dot: 'bg-[var(--success)]',
                    arrow: 'bg-[var(--success)]'
                };
            case 'in-progress':
                return {
                    bg: 'bg-[var(--primary)]/10',
                    border: 'border-[var(--primary)]',
                    text: 'text-[var(--primary)]',
                    dot: 'bg-[var(--primary)]',
                    arrow: 'bg-[var(--primary)]'
                };
            case 'pending':
                return {
                    bg: 'bg-[var(--muted)]/50',
                    border: 'border-[var(--muted)]',
                    text: 'text-[var(--muted-foreground)]',
                    dot: 'bg-[var(--muted-foreground)]',
                    arrow: 'bg-[var(--muted)]'
                };
        }
    };
    const getStatusLabel = (status)=>{
        switch(status){
            case 'complete':
                return 'Complete';
            case 'in-progress':
                return 'In Progress';
            case 'pending':
                return 'Pending';
        }
    };
    const getProgressPercentage = (count, total)=>{
        if (total === 0) return 0;
        return Math.round(count / total * 100);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "rounded-xl bg-[var(--card)] border border-[var(--border)] p-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                className: "text-lg font-semibold text-[var(--foreground)] mb-6",
                children: "Pipeline Flow"
            }, void 0, false, {
                fileName: "[project]/src/components/dashboard/PipelineDiagram.tsx",
                lineNumber: 77,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col lg:flex-row items-stretch lg:items-center gap-4 lg:gap-0",
                children: stages.map((stage, index)=>{
                    const colors = getStatusColors(stage.status);
                    const percentage = getProgressPercentage(stage.count, stage.total);
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col lg:flex-row items-center flex-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `relative w-full lg:w-auto lg:min-w-[160px] rounded-xl border-2 ${colors.border} ${colors.bg} p-4 transition-all hover:scale-[1.02]`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "absolute -top-1.5 -right-1.5",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: `h-3 w-3 rounded-full ${colors.dot}`,
                                            children: stage.status === 'in-progress' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "absolute inset-0 rounded-full bg-[var(--primary)] animate-ping opacity-75"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/dashboard/PipelineDiagram.tsx",
                                                lineNumber: 95,
                                                columnNumber: 23
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/dashboard/PipelineDiagram.tsx",
                                            lineNumber: 93,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/dashboard/PipelineDiagram.tsx",
                                        lineNumber: 92,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: `flex h-10 w-10 items-center justify-center rounded-lg ${colors.bg} ${colors.text} mb-3`,
                                        children: stage.icon
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/dashboard/PipelineDiagram.tsx",
                                        lineNumber: 101,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                        className: "font-semibold text-[var(--foreground)]",
                                        children: stage.name
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/dashboard/PipelineDiagram.tsx",
                                        lineNumber: 106,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs text-[var(--muted-foreground)] mb-3",
                                        children: stage.description
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/dashboard/PipelineDiagram.tsx",
                                        lineNumber: 107,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-baseline gap-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: `text-2xl font-bold ${colors.text}`,
                                                children: stage.count.toLocaleString()
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/dashboard/PipelineDiagram.tsx",
                                                lineNumber: 111,
                                                columnNumber: 19
                                            }, this),
                                            stage.total !== stage.count && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-sm text-[var(--muted-foreground)]",
                                                children: [
                                                    "/ ",
                                                    stage.total.toLocaleString()
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/dashboard/PipelineDiagram.tsx",
                                                lineNumber: 115,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/dashboard/PipelineDiagram.tsx",
                                        lineNumber: 110,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-3 h-1.5 w-full bg-[var(--secondary)] rounded-full overflow-hidden",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: `h-full ${colors.dot} rounded-full transition-all duration-500`,
                                            style: {
                                                width: `${percentage}%`
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/dashboard/PipelineDiagram.tsx",
                                            lineNumber: 123,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/dashboard/PipelineDiagram.tsx",
                                        lineNumber: 122,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: `mt-2 text-xs font-medium ${colors.text}`,
                                        children: [
                                            getStatusLabel(stage.status),
                                            " - ",
                                            percentage,
                                            "%"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/dashboard/PipelineDiagram.tsx",
                                        lineNumber: 130,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/dashboard/PipelineDiagram.tsx",
                                lineNumber: 88,
                                columnNumber: 15
                            }, this),
                            index < stages.length - 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "hidden lg:flex items-center px-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: `h-0.5 w-8 ${colors.arrow}`
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/dashboard/PipelineDiagram.tsx",
                                                lineNumber: 140,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                className: `w-4 h-4 -ml-1 ${colors.text}`,
                                                fill: "currentColor",
                                                viewBox: "0 0 20 20",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    fillRule: "evenodd",
                                                    d: "M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z",
                                                    clipRule: "evenodd"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/dashboard/PipelineDiagram.tsx",
                                                    lineNumber: 146,
                                                    columnNumber: 23
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/dashboard/PipelineDiagram.tsx",
                                                lineNumber: 141,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/dashboard/PipelineDiagram.tsx",
                                        lineNumber: 139,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex lg:hidden items-center justify-center py-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: `w-0.5 h-6 ${colors.arrow}`
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/dashboard/PipelineDiagram.tsx",
                                                lineNumber: 155,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                className: `w-4 h-4 -mt-1 absolute ${colors.text}`,
                                                fill: "currentColor",
                                                viewBox: "0 0 20 20",
                                                style: {
                                                    transform: 'rotate(90deg)'
                                                },
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    fillRule: "evenodd",
                                                    d: "M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z",
                                                    clipRule: "evenodd"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/dashboard/PipelineDiagram.tsx",
                                                    lineNumber: 162,
                                                    columnNumber: 23
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/dashboard/PipelineDiagram.tsx",
                                                lineNumber: 156,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/dashboard/PipelineDiagram.tsx",
                                        lineNumber: 154,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true)
                        ]
                    }, stage.id, true, {
                        fileName: "[project]/src/components/dashboard/PipelineDiagram.tsx",
                        lineNumber: 86,
                        columnNumber: 13
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/src/components/dashboard/PipelineDiagram.tsx",
                lineNumber: 80,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-6 pt-6 border-t border-[var(--border)]",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between text-sm mb-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[var(--muted-foreground)]",
                                children: "End-to-end Pipeline Progress"
                            }, void 0, false, {
                                fileName: "[project]/src/components/dashboard/PipelineDiagram.tsx",
                                lineNumber: 179,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "font-medium text-[var(--foreground)]",
                                children: [
                                    stages.filter((s)=>s.status === 'complete').length,
                                    " of ",
                                    stages.length,
                                    " stages complete"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/dashboard/PipelineDiagram.tsx",
                                lineNumber: 180,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/dashboard/PipelineDiagram.tsx",
                        lineNumber: 178,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex gap-1",
                        children: stages.map((stage)=>{
                            const colors = getStatusColors(stage.status);
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `flex-1 h-2 rounded-full ${colors.dot}`,
                                title: `${stage.name}: ${getStatusLabel(stage.status)}`
                            }, stage.id, false, {
                                fileName: "[project]/src/components/dashboard/PipelineDiagram.tsx",
                                lineNumber: 188,
                                columnNumber: 15
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/src/components/dashboard/PipelineDiagram.tsx",
                        lineNumber: 184,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/dashboard/PipelineDiagram.tsx",
                lineNumber: 177,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/dashboard/PipelineDiagram.tsx",
        lineNumber: 76,
        columnNumber: 5
    }, this);
}
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
    "getCachedCities",
    ()=>getCachedCities,
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
    if (filters?.city) {
        query = query.ilike('city', `%${filters.city}%`);
    }
    if (filters?.state) {
        query = query.eq('state', filters.state);
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
      review_url,
      collected_at,
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
    if (filters?.city) {
        query = query.ilike('city', `%${filters.city}%`);
    }
    if (filters?.state) {
        query = query.eq('state', filters.state);
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
}),
"[project]/src/app/pipeline/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PipelinePage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.react-server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$PipelineDiagram$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/dashboard/PipelineDiagram.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$PageHeader$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/dashboard/PageHeader.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$queries$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase/queries.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/search.js [app-rsc] (ecmascript) <export default as Search>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/star.js [app-rsc] (ecmascript) <export default as Star>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$lightbulb$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Lightbulb$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/lightbulb.js [app-rsc] (ecmascript) <export default as Lightbulb>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/file-text.js [app-rsc] (ecmascript) <export default as FileText>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$external$2d$link$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__ExternalLink$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/external-link.js [app-rsc] (ecmascript) <export default as ExternalLink>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$git$2d$branch$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__GitBranch$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/git-branch.js [app-rsc] (ecmascript) <export default as GitBranch>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/triangle-alert.js [app-rsc] (ecmascript) <export default as AlertTriangle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/clock.js [app-rsc] (ecmascript) <export default as Clock>");
;
;
;
;
;
;
/**
 * Format duration in milliseconds to human-readable string
 */ function formatDuration(ms) {
    if (ms === null) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.round(ms / 60000)}m`;
}
/**
 * Fetches pipeline status data from Supabase.
 */ async function getPipelineData() {
    const [stats, timingStats, searchHistoryResult, contractorsSnapshot] = await Promise.all([
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$queries$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getPipelineStats"])(),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$queries$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getPipelineTimingStats"])(),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$queries$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getSearchHistory"])({}, 1, 5),
        // Get a larger snapshot to find contractors needing attention
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$queries$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getContractors"])(undefined, 1, 100)
    ]);
    // Build contractors needing attention list
    const contractorsNeedingAttention = [];
    const sortedContractors = contractorsSnapshot.data.slice().sort((a, b)=>new Date(a.last_synced_at).getTime() - new Date(b.last_synced_at).getTime());
    const contractorsNoReviews = sortedContractors.filter((c)=>c.reviewCount === 0).slice(0, 3);
    const contractorsNoAnalysis = sortedContractors.filter((c)=>c.reviewCount > 0 && !c.hasAnalysis).slice(0, 3);
    const contractorsNoArticle = sortedContractors.filter((c)=>c.hasAnalysis && !c.hasArticle).slice(0, 3);
    contractorsNoReviews.forEach((c)=>{
        contractorsNeedingAttention.push({
            id: c.id,
            name: c.business_name,
            city: c.city,
            state: c.state || '',
            issue: 'no_reviews',
            lastUpdated: c.last_synced_at
        });
    });
    contractorsNoAnalysis.forEach((c)=>{
        contractorsNeedingAttention.push({
            id: c.id,
            name: c.business_name,
            city: c.city,
            state: c.state || '',
            issue: 'no_analysis',
            lastUpdated: c.last_synced_at
        });
    });
    contractorsNoArticle.forEach((c)=>{
        contractorsNeedingAttention.push({
            id: c.id,
            name: c.business_name,
            city: c.city,
            state: c.state || '',
            issue: 'no_article',
            lastUpdated: c.last_synced_at
        });
    });
    // Determine pipeline stage statuses
    const stages = [
        {
            id: 'discover',
            name: 'Discover',
            description: 'Find contractors via search',
            count: stats.contractors,
            total: stats.contractors,
            status: stats.contractors > 0 ? 'complete' : 'pending',
            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                className: "h-5 w-5"
            }, void 0, false, {
                fileName: "[project]/src/app/pipeline/page.tsx",
                lineNumber: 120,
                columnNumber: 13
            }, this)
        },
        {
            id: 'collect',
            name: 'Collect',
            description: 'Gather reviews from sources',
            count: stats.reviews,
            total: stats.reviews,
            status: stats.reviews > 0 ? 'complete' : 'pending',
            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__["Star"], {
                className: "h-5 w-5"
            }, void 0, false, {
                fileName: "[project]/src/app/pipeline/page.tsx",
                lineNumber: 129,
                columnNumber: 13
            }, this)
        },
        {
            id: 'analyze',
            name: 'Analyze',
            description: 'Run sentiment analysis',
            count: stats.analyses,
            total: stats.contractors,
            status: stats.analyses >= stats.contractors ? 'complete' : stats.analyses > 0 ? 'in-progress' : 'pending',
            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$lightbulb$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Lightbulb$3e$__["Lightbulb"], {
                className: "h-5 w-5"
            }, void 0, false, {
                fileName: "[project]/src/app/pipeline/page.tsx",
                lineNumber: 143,
                columnNumber: 13
            }, this)
        },
        {
            id: 'generate',
            name: 'Generate',
            description: 'Create article content',
            count: stats.articles,
            total: stats.contractors,
            status: stats.articles >= stats.contractors ? 'complete' : stats.articles > 0 ? 'in-progress' : 'pending',
            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__["FileText"], {
                className: "h-5 w-5"
            }, void 0, false, {
                fileName: "[project]/src/app/pipeline/page.tsx",
                lineNumber: 157,
                columnNumber: 13
            }, this)
        }
    ];
    // Stage details with REAL timing data from ai_usage_log
    const stageDetails = [
        {
            id: 'discover',
            name: 'Discover',
            total: stats.contractors,
            success: stats.contractors,
            failed: 0,
            avgTime: formatDuration(timingStats.discover.avgDuration),
            lastRun: timingStats.discover.lastRun || null,
            totalRuns: timingStats.discover.totalRuns
        },
        {
            id: 'collect',
            name: 'Collect',
            total: stats.reviews,
            success: stats.reviews,
            failed: 0,
            avgTime: '-',
            lastRun: null,
            totalRuns: 0
        },
        {
            id: 'analyze',
            name: 'Analyze',
            total: stats.analyses,
            success: stats.analyses,
            failed: stats.contractors - stats.analyses,
            avgTime: formatDuration(timingStats.analyze.avgDuration),
            lastRun: timingStats.analyze.lastRun || null,
            totalRuns: timingStats.analyze.totalRuns
        },
        {
            id: 'generate',
            name: 'Generate',
            total: stats.articles,
            success: stats.articles,
            failed: stats.contractors - stats.articles,
            avgTime: formatDuration(timingStats.generate.avgDuration),
            lastRun: timingStats.generate.lastRun || null,
            totalRuns: timingStats.generate.totalRuns
        }
    ];
    // Transform search history from searched_cities table
    const searchHistory = searchHistoryResult.data.map((search)=>({
            id: search.id,
            city: search.city,
            state: search.state || '',
            searchTerm: search.search_term,
            contractorsFound: search.contractors_found || 0,
            timestamp: search.searched_at
        }));
    return {
        stages,
        stageDetails,
        contractorsNeedingAttention,
        searchHistory,
        runHistory: []
    };
}
/**
 * Helper to format relative time
 */ function formatRelativeTime(dateString) {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}
async function PipelinePage() {
    const data = await getPipelineData();
    // Group contractors by issue type
    const groupedContractors = {
        no_reviews: data.contractorsNeedingAttention.filter((c)=>c.issue === 'no_reviews'),
        no_analysis: data.contractorsNeedingAttention.filter((c)=>c.issue === 'no_analysis'),
        no_article: data.contractorsNeedingAttention.filter((c)=>c.issue === 'no_article')
    };
    const issueLabels = {
        no_reviews: 'No Reviews Collected',
        no_analysis: 'No Analysis Generated',
        no_article: 'No Article Generated'
    };
    const issueColors = {
        no_reviews: 'text-red-400',
        no_analysis: 'text-amber-400',
        no_article: 'text-cyan-400'
    };
    const issueBgColors = {
        no_reviews: 'bg-red-500/10 border-red-500/20',
        no_analysis: 'bg-amber-500/10 border-amber-500/20',
        no_article: 'bg-cyan-500/10 border-cyan-500/20'
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$PageHeader$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PageHeader"], {
                title: "Pipeline Status",
                subtitle: "Monitor the contractor review analysis pipeline in detail",
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$git$2d$branch$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__GitBranch$3e$__["GitBranch"],
                badge: "Live",
                badgeColor: "emerald"
            }, void 0, false, {
                fileName: "[project]/src/app/pipeline/page.tsx",
                lineNumber: 291,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$PipelineDiagram$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PipelineDiagram"], {
                stages: data.stages
            }, void 0, false, {
                fileName: "[project]/src/app/pipeline/page.tsx",
                lineNumber: 300,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2 mb-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-2 w-2 rounded-full bg-cyan-400 animate-pulse"
                            }, void 0, false, {
                                fileName: "[project]/src/app/pipeline/page.tsx",
                                lineNumber: 305,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs font-mono uppercase tracking-wider text-zinc-500",
                                children: "Stage Details"
                            }, void 0, false, {
                                fileName: "[project]/src/app/pipeline/page.tsx",
                                lineNumber: 306,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/pipeline/page.tsx",
                        lineNumber: 304,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
                        children: data.stageDetails.map((stage)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "rounded-lg bg-zinc-800/50 border border-zinc-700/50 p-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                        className: "font-medium text-zinc-200 mb-3",
                                        children: stage.name
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/pipeline/page.tsx",
                                        lineNumber: 316,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex justify-between text-sm",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-zinc-500 font-mono text-xs",
                                                        children: "Total"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/pipeline/page.tsx",
                                                        lineNumber: 319,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "font-medium text-zinc-200 font-mono text-xs",
                                                        children: stage.total.toLocaleString()
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/pipeline/page.tsx",
                                                        lineNumber: 320,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/pipeline/page.tsx",
                                                lineNumber: 318,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex justify-between text-sm",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-zinc-500 font-mono text-xs",
                                                        children: "Success"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/pipeline/page.tsx",
                                                        lineNumber: 325,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "font-medium text-emerald-400 font-mono text-xs",
                                                        children: stage.success.toLocaleString()
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/pipeline/page.tsx",
                                                        lineNumber: 326,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/pipeline/page.tsx",
                                                lineNumber: 324,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex justify-between text-sm",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-zinc-500 font-mono text-xs",
                                                        children: "Failed"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/pipeline/page.tsx",
                                                        lineNumber: 331,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: `font-medium font-mono text-xs ${stage.failed > 0 ? 'text-red-400' : 'text-zinc-600'}`,
                                                        children: stage.failed
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/pipeline/page.tsx",
                                                        lineNumber: 332,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/pipeline/page.tsx",
                                                lineNumber: 330,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex justify-between text-sm",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-zinc-500 font-mono text-xs",
                                                        children: "Avg Time"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/pipeline/page.tsx",
                                                        lineNumber: 339,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "font-medium text-zinc-300 font-mono text-xs",
                                                        children: stage.avgTime
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/pipeline/page.tsx",
                                                        lineNumber: 340,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/pipeline/page.tsx",
                                                lineNumber: 338,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "pt-2 border-t border-zinc-700/50",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex justify-between text-xs",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-zinc-600 font-mono",
                                                            children: "Last Run"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/pipeline/page.tsx",
                                                            lineNumber: 346,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-zinc-500 font-mono",
                                                            children: stage.lastRun ? formatRelativeTime(stage.lastRun) : '-'
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/pipeline/page.tsx",
                                                            lineNumber: 347,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/pipeline/page.tsx",
                                                    lineNumber: 345,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/pipeline/page.tsx",
                                                lineNumber: 344,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/pipeline/page.tsx",
                                        lineNumber: 317,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, stage.id, true, {
                                fileName: "[project]/src/app/pipeline/page.tsx",
                                lineNumber: 312,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/app/pipeline/page.tsx",
                        lineNumber: 310,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/pipeline/page.tsx",
                lineNumber: 303,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2 mb-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"], {
                                className: "h-4 w-4 text-amber-400"
                            }, void 0, false, {
                                fileName: "[project]/src/app/pipeline/page.tsx",
                                lineNumber: 361,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs font-mono uppercase tracking-wider text-zinc-500",
                                children: "Contractors Needing Attention"
                            }, void 0, false, {
                                fileName: "[project]/src/app/pipeline/page.tsx",
                                lineNumber: 362,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs font-mono text-zinc-600",
                                children: [
                                    "(",
                                    data.contractorsNeedingAttention.length,
                                    " total)"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/pipeline/page.tsx",
                                lineNumber: 365,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/pipeline/page.tsx",
                        lineNumber: 360,
                        columnNumber: 9
                    }, this),
                    data.contractorsNeedingAttention.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-center py-8",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "inline-flex items-center justify-center h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-3",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__["Star"], {
                                    className: "h-5 w-5 text-emerald-400"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/pipeline/page.tsx",
                                    lineNumber: 373,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/pipeline/page.tsx",
                                lineNumber: 372,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-zinc-400",
                                children: "All contractors are up to date. No action needed."
                            }, void 0, false, {
                                fileName: "[project]/src/app/pipeline/page.tsx",
                                lineNumber: 375,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/pipeline/page.tsx",
                        lineNumber: 371,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-6",
                        children: Object.entries(groupedContractors).map(([issueKey, contractors])=>{
                            if (contractors.length === 0) return null;
                            const issue = issueKey;
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-2 mb-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-widest border ${issueBgColors[issue]} ${issueColors[issue]}`,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "w-1.5 h-1.5 rounded-full bg-current"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/pipeline/page.tsx",
                                                        lineNumber: 391,
                                                        columnNumber: 25
                                                    }, this),
                                                    issueLabels[issue]
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/pipeline/page.tsx",
                                                lineNumber: 388,
                                                columnNumber: 23
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs text-zinc-600 font-mono",
                                                children: [
                                                    contractors.length,
                                                    " contractors"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/pipeline/page.tsx",
                                                lineNumber: 394,
                                                columnNumber: 23
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/pipeline/page.tsx",
                                        lineNumber: 387,
                                        columnNumber: 21
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "overflow-x-auto",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                            className: "w-full text-sm",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                        className: "border-b border-zinc-800/50",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                className: "text-left py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-zinc-500",
                                                                children: "Contractor"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/pipeline/page.tsx",
                                                                lineNumber: 402,
                                                                columnNumber: 29
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                className: "text-left py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-zinc-500",
                                                                children: "Location"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/pipeline/page.tsx",
                                                                lineNumber: 405,
                                                                columnNumber: 29
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                className: "text-left py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-zinc-500",
                                                                children: "Last Updated"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/pipeline/page.tsx",
                                                                lineNumber: 408,
                                                                columnNumber: 29
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                className: "text-right py-2 px-3 text-[10px] font-mono uppercase tracking-wider text-zinc-500",
                                                                children: "Action"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/pipeline/page.tsx",
                                                                lineNumber: 411,
                                                                columnNumber: 29
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/pipeline/page.tsx",
                                                        lineNumber: 401,
                                                        columnNumber: 27
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/pipeline/page.tsx",
                                                    lineNumber: 400,
                                                    columnNumber: 25
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                                    children: contractors.map((contractor)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                            className: "border-b border-zinc-800/30 last:border-b-0 hover:bg-zinc-800/30",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "py-2.5 px-3 text-zinc-200 text-sm",
                                                                    children: contractor.name
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/pipeline/page.tsx",
                                                                    lineNumber: 422,
                                                                    columnNumber: 31
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "py-2.5 px-3 text-zinc-500 font-mono text-xs",
                                                                    children: [
                                                                        contractor.city,
                                                                        ", ",
                                                                        contractor.state
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/pipeline/page.tsx",
                                                                    lineNumber: 425,
                                                                    columnNumber: 31
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "py-2.5 px-3 text-zinc-500 font-mono text-xs",
                                                                    children: formatRelativeTime(contractor.lastUpdated)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/pipeline/page.tsx",
                                                                    lineNumber: 428,
                                                                    columnNumber: 31
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "py-2.5 px-3 text-right",
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                                                        href: `/contractors/${contractor.id}`,
                                                                        className: "inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-xs font-mono transition-colors",
                                                                        children: [
                                                                            "View",
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$external$2d$link$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__ExternalLink$3e$__["ExternalLink"], {
                                                                                className: "h-3 w-3"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/pipeline/page.tsx",
                                                                                lineNumber: 437,
                                                                                columnNumber: 35
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/src/app/pipeline/page.tsx",
                                                                        lineNumber: 432,
                                                                        columnNumber: 33
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/pipeline/page.tsx",
                                                                    lineNumber: 431,
                                                                    columnNumber: 31
                                                                }, this)
                                                            ]
                                                        }, contractor.id, true, {
                                                            fileName: "[project]/src/app/pipeline/page.tsx",
                                                            lineNumber: 418,
                                                            columnNumber: 29
                                                        }, this))
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/pipeline/page.tsx",
                                                    lineNumber: 416,
                                                    columnNumber: 25
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/pipeline/page.tsx",
                                            lineNumber: 399,
                                            columnNumber: 23
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/pipeline/page.tsx",
                                        lineNumber: 398,
                                        columnNumber: 21
                                    }, this)
                                ]
                            }, issue, true, {
                                fileName: "[project]/src/app/pipeline/page.tsx",
                                lineNumber: 386,
                                columnNumber: 19
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/src/app/pipeline/page.tsx",
                        lineNumber: 380,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/pipeline/page.tsx",
                lineNumber: 359,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-1 lg:grid-cols-2 gap-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2 mb-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                                        className: "h-4 w-4 text-zinc-500"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/pipeline/page.tsx",
                                        lineNumber: 458,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs font-mono uppercase tracking-wider text-zinc-500",
                                        children: "Search History"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/pipeline/page.tsx",
                                        lineNumber: 459,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/pipeline/page.tsx",
                                lineNumber: 457,
                                columnNumber: 11
                            }, this),
                            data.searchHistory.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-3",
                                children: [
                                    data.searchHistory.map((search)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center justify-between py-3 border-b border-zinc-800/50 last:border-b-0",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center gap-3",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800/50 border border-zinc-700/50",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                                                                className: "h-4 w-4 text-zinc-500"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/pipeline/page.tsx",
                                                                lineNumber: 472,
                                                                columnNumber: 23
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/pipeline/page.tsx",
                                                            lineNumber: 471,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                    className: "text-sm font-medium text-zinc-200",
                                                                    children: [
                                                                        search.city,
                                                                        search.state ? `, ${search.state}` : ''
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/pipeline/page.tsx",
                                                                    lineNumber: 475,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                    className: "text-xs text-zinc-500 font-mono",
                                                                    children: [
                                                                        '"',
                                                                        search.searchTerm,
                                                                        '"'
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/pipeline/page.tsx",
                                                                    lineNumber: 478,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/pipeline/page.tsx",
                                                            lineNumber: 474,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/pipeline/page.tsx",
                                                    lineNumber: 470,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-right",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-sm font-medium text-zinc-200 font-mono",
                                                            children: [
                                                                search.contractorsFound,
                                                                " found"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/pipeline/page.tsx",
                                                            lineNumber: 484,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-xs text-zinc-500 font-mono",
                                                            children: formatRelativeTime(search.timestamp)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/pipeline/page.tsx",
                                                            lineNumber: 487,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/pipeline/page.tsx",
                                                    lineNumber: 483,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, search.id, true, {
                                            fileName: "[project]/src/app/pipeline/page.tsx",
                                            lineNumber: 466,
                                            columnNumber: 17
                                        }, this)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                        href: "/searches",
                                        className: "block text-center text-xs font-mono text-cyan-400 hover:text-cyan-300 pt-2 transition-colors",
                                        children: "View all searches →"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/pipeline/page.tsx",
                                        lineNumber: 493,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/pipeline/page.tsx",
                                lineNumber: 464,
                                columnNumber: 13
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-center py-8",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "inline-flex items-center justify-center h-12 w-12 rounded-full bg-zinc-800/50 border border-zinc-700/50 mb-3",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                                            className: "h-5 w-5 text-zinc-600"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/pipeline/page.tsx",
                                            lineNumber: 503,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/pipeline/page.tsx",
                                        lineNumber: 502,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm text-zinc-500",
                                        children: "No search history available."
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/pipeline/page.tsx",
                                        lineNumber: 505,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs text-zinc-600 font-mono mt-1",
                                        children: "Run the discover script to populate this data."
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/pipeline/page.tsx",
                                        lineNumber: 508,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/pipeline/page.tsx",
                                lineNumber: 501,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/pipeline/page.tsx",
                        lineNumber: 456,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2 mb-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"], {
                                        className: "h-4 w-4 text-zinc-500"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/pipeline/page.tsx",
                                        lineNumber: 518,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs font-mono uppercase tracking-wider text-zinc-500",
                                        children: "Run History"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/pipeline/page.tsx",
                                        lineNumber: 519,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/pipeline/page.tsx",
                                lineNumber: 517,
                                columnNumber: 11
                            }, this),
                            data.runHistory.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-3",
                                children: data.runHistory.map((run)=>{
                                    const statusColors = {
                                        running: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
                                        completed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                                        failed: 'text-red-400 bg-red-500/10 border-red-500/20'
                                    };
                                    const statusLabels = {
                                        running: 'Running',
                                        completed: 'Completed',
                                        failed: 'Failed'
                                    };
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center justify-between py-3 border-b border-zinc-800/50 last:border-b-0",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-3",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono uppercase tracking-widest border ${statusColors[run.status]}`,
                                                            children: [
                                                                run.status === 'running' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "w-1.5 h-1.5 rounded-full bg-current animate-pulse"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/pipeline/page.tsx",
                                                                    lineNumber: 547,
                                                                    columnNumber: 29
                                                                }, this),
                                                                statusLabels[run.status]
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/pipeline/page.tsx",
                                                            lineNumber: 543,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-xs text-zinc-500 font-mono capitalize",
                                                            children: run.type
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/pipeline/page.tsx",
                                                            lineNumber: 551,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/pipeline/page.tsx",
                                                    lineNumber: 542,
                                                    columnNumber: 23
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/pipeline/page.tsx",
                                                lineNumber: 541,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-6",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-right",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-sm text-zinc-200 font-mono",
                                                            children: [
                                                                run.contractorsProcessed,
                                                                " processed"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/pipeline/page.tsx",
                                                            lineNumber: 558,
                                                            columnNumber: 25
                                                        }, this),
                                                        run.errors > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-xs text-red-400 font-mono",
                                                            children: [
                                                                run.errors,
                                                                " errors"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/pipeline/page.tsx",
                                                            lineNumber: 562,
                                                            columnNumber: 27
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/pipeline/page.tsx",
                                                    lineNumber: 557,
                                                    columnNumber: 23
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/pipeline/page.tsx",
                                                lineNumber: 556,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, run.id, true, {
                                        fileName: "[project]/src/app/pipeline/page.tsx",
                                        lineNumber: 537,
                                        columnNumber: 19
                                    }, this);
                                })
                            }, void 0, false, {
                                fileName: "[project]/src/app/pipeline/page.tsx",
                                lineNumber: 524,
                                columnNumber: 13
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-center py-8",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "inline-flex items-center justify-center h-12 w-12 rounded-full bg-zinc-800/50 border border-zinc-700/50 mb-3",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"], {
                                            className: "h-5 w-5 text-zinc-600"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/pipeline/page.tsx",
                                            lineNumber: 575,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/pipeline/page.tsx",
                                        lineNumber: 574,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm text-zinc-500",
                                        children: "Run history is tracked in the Logs page."
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/pipeline/page.tsx",
                                        lineNumber: 577,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                        href: "/logs",
                                        className: "inline-block mt-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors",
                                        children: "View execution logs →"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/pipeline/page.tsx",
                                        lineNumber: 580,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/pipeline/page.tsx",
                                lineNumber: 573,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/pipeline/page.tsx",
                        lineNumber: 516,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/pipeline/page.tsx",
                lineNumber: 454,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/pipeline/page.tsx",
        lineNumber: 289,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/app/pipeline/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/pipeline/page.tsx [app-rsc] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__3fca995d._.js.map