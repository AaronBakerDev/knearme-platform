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
"[project]/src/components/dashboard/PipelineProgress.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PipelineProgress",
    ()=>PipelineProgress
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$git$2d$branch$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__GitBranch$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/git-branch.js [app-rsc] (ecmascript) <export default as GitBranch>");
;
;
function PipelineProgress({ stages }) {
    const getStatusStyles = (status)=>{
        switch(status){
            case 'complete':
                return {
                    border: 'border-emerald-500/50',
                    bg: 'bg-emerald-500/10',
                    text: 'text-emerald-400',
                    bar: 'bg-emerald-500'
                };
            case 'in-progress':
                return {
                    border: 'border-amber-500/50',
                    bg: 'bg-amber-500/10',
                    text: 'text-amber-400',
                    bar: 'bg-amber-500'
                };
            case 'pending':
                return {
                    border: 'border-zinc-700/50',
                    bg: 'bg-zinc-800/50',
                    text: 'text-zinc-500',
                    bar: 'bg-zinc-700'
                };
        }
    };
    const getPercentage = (count, total)=>{
        if (total === 0) return 0;
        return Math.round(count / total * 100);
    };
    const overallProgress = getPercentage(stages.reduce((sum, s)=>sum + s.count, 0), stages.reduce((sum, s)=>sum + s.total, 0));
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-zinc-900/30 border border-zinc-800/50 rounded-lg overflow-hidden",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 bg-zinc-900/50",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-2 w-2 rounded-full bg-violet-400 animate-pulse"
                            }, void 0, false, {
                                fileName: "[project]/src/components/dashboard/PipelineProgress.tsx",
                                lineNumber: 65,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs font-mono uppercase tracking-wider text-zinc-500",
                                children: "Pipeline Health"
                            }, void 0, false, {
                                fileName: "[project]/src/components/dashboard/PipelineProgress.tsx",
                                lineNumber: 66,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/dashboard/PipelineProgress.tsx",
                        lineNumber: 64,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$git$2d$branch$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__GitBranch$3e$__["GitBranch"], {
                                className: "h-4 w-4 text-zinc-500"
                            }, void 0, false, {
                                fileName: "[project]/src/components/dashboard/PipelineProgress.tsx",
                                lineNumber: 71,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs font-mono text-zinc-400",
                                children: [
                                    overallProgress,
                                    "% complete"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/dashboard/PipelineProgress.tsx",
                                lineNumber: 72,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/dashboard/PipelineProgress.tsx",
                        lineNumber: 70,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/dashboard/PipelineProgress.tsx",
                lineNumber: 63,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "p-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between",
                        children: stages.map((stage, index)=>{
                            const percentage = getPercentage(stage.count, stage.total);
                            const styles = getStatusStyles(stage.status);
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center flex-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex flex-col items-center",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: `flex h-16 w-16 items-center justify-center rounded-full border-2 ${styles.border} ${styles.bg}`,
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: `text-lg font-bold font-mono tabular-nums ${styles.text}`,
                                                    children: [
                                                        percentage,
                                                        "%"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/dashboard/PipelineProgress.tsx",
                                                    lineNumber: 90,
                                                    columnNumber: 21
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/dashboard/PipelineProgress.tsx",
                                                lineNumber: 87,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "mt-3 text-sm font-medium text-zinc-200",
                                                children: stage.name
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/dashboard/PipelineProgress.tsx",
                                                lineNumber: 94,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-xs font-mono text-zinc-600 tabular-nums",
                                                children: [
                                                    stage.count.toLocaleString(),
                                                    " / ",
                                                    stage.total.toLocaleString()
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/dashboard/PipelineProgress.tsx",
                                                lineNumber: 95,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/dashboard/PipelineProgress.tsx",
                                        lineNumber: 86,
                                        columnNumber: 17
                                    }, this),
                                    index < stages.length - 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex-1 px-4",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "relative h-1 w-full bg-zinc-800 rounded-full overflow-hidden",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: `absolute left-0 top-0 h-full ${styles.bar} rounded-full transition-all duration-500`,
                                                style: {
                                                    width: `${percentage}%`
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/dashboard/PipelineProgress.tsx",
                                                lineNumber: 104,
                                                columnNumber: 23
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/dashboard/PipelineProgress.tsx",
                                            lineNumber: 103,
                                            columnNumber: 21
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/dashboard/PipelineProgress.tsx",
                                        lineNumber: 102,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, stage.name, true, {
                                fileName: "[project]/src/components/dashboard/PipelineProgress.tsx",
                                lineNumber: 84,
                                columnNumber: 15
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/src/components/dashboard/PipelineProgress.tsx",
                        lineNumber: 78,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-8 pt-6 border-t border-zinc-800/50",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-between text-sm mb-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs font-mono uppercase tracking-wider text-zinc-500",
                                        children: "Overall Progress"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/dashboard/PipelineProgress.tsx",
                                        lineNumber: 119,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs font-mono text-zinc-300 tabular-nums",
                                        children: [
                                            overallProgress,
                                            "%"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/dashboard/PipelineProgress.tsx",
                                        lineNumber: 122,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/dashboard/PipelineProgress.tsx",
                                lineNumber: 118,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-2 w-full bg-zinc-800 rounded-full overflow-hidden",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "h-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-violet-500 rounded-full transition-all duration-500",
                                    style: {
                                        width: `${overallProgress}%`
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/src/components/dashboard/PipelineProgress.tsx",
                                    lineNumber: 127,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/dashboard/PipelineProgress.tsx",
                                lineNumber: 126,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/dashboard/PipelineProgress.tsx",
                        lineNumber: 117,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/dashboard/PipelineProgress.tsx",
                lineNumber: 76,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/dashboard/PipelineProgress.tsx",
        lineNumber: 61,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/components/dashboard/RecentActivity.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RecentActivity",
    ()=>RecentActivity
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/user.js [app-rsc] (ecmascript) <export default as User>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/star.js [app-rsc] (ecmascript) <export default as Star>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$lightbulb$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Lightbulb$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/lightbulb.js [app-rsc] (ecmascript) <export default as Lightbulb>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/file-text.js [app-rsc] (ecmascript) <export default as FileText>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-right.js [app-rsc] (ecmascript) <export default as ChevronRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$activity$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Activity$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/activity.js [app-rsc] (ecmascript) <export default as Activity>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.react-server.js [app-rsc] (ecmascript)");
;
;
;
/**
 * Activity type configuration with Mission Control colors.
 * Uses cyan, amber, violet, emerald to match the design system.
 */ const activityConfig = {
    contractor: {
        Icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__["User"],
        bgColor: 'bg-cyan-500/10',
        textColor: 'text-cyan-400',
        borderColor: 'border-cyan-500/20'
    },
    review: {
        Icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__["Star"],
        bgColor: 'bg-amber-500/10',
        textColor: 'text-amber-400',
        borderColor: 'border-amber-500/20'
    },
    analysis: {
        Icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$lightbulb$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Lightbulb$3e$__["Lightbulb"],
        bgColor: 'bg-violet-500/10',
        textColor: 'text-violet-400',
        borderColor: 'border-violet-500/20'
    },
    article: {
        Icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__["FileText"],
        bgColor: 'bg-emerald-500/10',
        textColor: 'text-emerald-400',
        borderColor: 'border-emerald-500/20'
    }
};
function RecentActivity({ activities }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-zinc-900/30 border border-zinc-800/50 rounded-lg overflow-hidden",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 bg-zinc-900/50",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-2 w-2 rounded-full bg-amber-400 animate-pulse"
                            }, void 0, false, {
                                fileName: "[project]/src/components/dashboard/RecentActivity.tsx",
                                lineNumber: 57,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs font-mono uppercase tracking-wider text-zinc-500",
                                children: "Recent Activity"
                            }, void 0, false, {
                                fileName: "[project]/src/components/dashboard/RecentActivity.tsx",
                                lineNumber: 58,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/dashboard/RecentActivity.tsx",
                        lineNumber: 56,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                        href: "/logs",
                        className: "text-xs font-mono text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider",
                        children: "View All"
                    }, void 0, false, {
                        fileName: "[project]/src/components/dashboard/RecentActivity.tsx",
                        lineNumber: 62,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/dashboard/RecentActivity.tsx",
                lineNumber: 55,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "p-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-3 relative",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute left-4 top-2 bottom-2 w-px bg-zinc-800/50 hidden sm:block"
                            }, void 0, false, {
                                fileName: "[project]/src/components/dashboard/RecentActivity.tsx",
                                lineNumber: 73,
                                columnNumber: 11
                            }, this),
                            activities.map((activity)=>{
                                const config = activityConfig[activity.type];
                                const Icon = config.Icon;
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "group flex items-start gap-3 relative",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: `flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${config.borderColor} ${config.bgColor} ${config.textColor} z-10 transition-transform group-hover:scale-105`,
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                className: "h-4 w-4"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/dashboard/RecentActivity.tsx",
                                                lineNumber: 83,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/dashboard/RecentActivity.tsx",
                                            lineNumber: 80,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex-1 min-w-0 bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/30 group-hover:border-zinc-700/50 group-hover:bg-zinc-800/50 transition-all",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center justify-between gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-sm font-medium text-zinc-200 truncate",
                                                            children: activity.action
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/dashboard/RecentActivity.tsx",
                                                            lineNumber: 87,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-[10px] whitespace-nowrap text-zinc-500 font-mono bg-zinc-900/50 px-2 py-0.5 rounded border border-zinc-700/30 tabular-nums",
                                                            children: activity.timestamp
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/dashboard/RecentActivity.tsx",
                                                            lineNumber: 90,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/dashboard/RecentActivity.tsx",
                                                    lineNumber: 86,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-sm text-zinc-500 mt-1 truncate font-mono",
                                                    children: activity.target
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/dashboard/RecentActivity.tsx",
                                                    lineNumber: 94,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/dashboard/RecentActivity.tsx",
                                            lineNumber: 85,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "self-center hidden sm:block",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                                                className: "h-4 w-4 text-zinc-700 group-hover:text-emerald-400 transition-all group-hover:translate-x-1"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/dashboard/RecentActivity.tsx",
                                                lineNumber: 99,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/dashboard/RecentActivity.tsx",
                                            lineNumber: 98,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, activity.id, true, {
                                    fileName: "[project]/src/components/dashboard/RecentActivity.tsx",
                                    lineNumber: 79,
                                    columnNumber: 15
                                }, this);
                            })
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/dashboard/RecentActivity.tsx",
                        lineNumber: 71,
                        columnNumber: 9
                    }, this),
                    activities.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col items-center justify-center py-12 text-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-14 w-14 rounded-lg bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center mb-4",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$activity$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Activity$3e$__["Activity"], {
                                    className: "h-7 w-7 text-zinc-600"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/dashboard/RecentActivity.tsx",
                                    lineNumber: 109,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/dashboard/RecentActivity.tsx",
                                lineNumber: 108,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-sm font-medium text-zinc-300 mb-1",
                                children: "No activity yet"
                            }, void 0, false, {
                                fileName: "[project]/src/components/dashboard/RecentActivity.tsx",
                                lineNumber: 111,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-zinc-500 font-mono",
                                children: "Pipeline activity will appear here once you run the discover script."
                            }, void 0, false, {
                                fileName: "[project]/src/components/dashboard/RecentActivity.tsx",
                                lineNumber: 114,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/dashboard/RecentActivity.tsx",
                        lineNumber: 107,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/dashboard/RecentActivity.tsx",
                lineNumber: 70,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/dashboard/RecentActivity.tsx",
        lineNumber: 53,
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
"[project]/src/app/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>DashboardPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.react-server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$PipelineProgress$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/dashboard/PipelineProgress.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$RecentActivity$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/dashboard/RecentActivity.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$PageHeader$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/dashboard/PageHeader.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$StatBlock$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/dashboard/StatBlock.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$queries$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase/queries.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/users.js [app-rsc] (ecmascript) <export default as Users>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/star.js [app-rsc] (ecmascript) <export default as Star>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$lightbulb$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Lightbulb$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/lightbulb.js [app-rsc] (ecmascript) <export default as Lightbulb>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/file-text.js [app-rsc] (ecmascript) <export default as FileText>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/refresh-cw.js [app-rsc] (ecmascript) <export default as RefreshCw>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/plus.js [app-rsc] (ecmascript) <export default as Plus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Download$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/download.js [app-rsc] (ecmascript) <export default as Download>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/settings.js [app-rsc] (ecmascript) <export default as Settings>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-right.js [app-rsc] (ecmascript) <export default as ChevronRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$activity$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Activity$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/activity.js [app-rsc] (ecmascript) <export default as Activity>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$database$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Database$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/database.js [app-rsc] (ecmascript) <export default as Database>");
;
;
;
;
;
;
;
;
/**
 * Helper to format relative time from ISO date string
 */ function formatRelativeTime(dateString) {
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
/**
 * Fetches and transforms data for the dashboard page
 */ async function getDashboardData() {
    const [stats, activity] = await Promise.all([
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$queries$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getPipelineStats"])(),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$queries$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getRecentActivity"])(5)
    ]);
    const recentActivityItems = [];
    activity.recentContractors.forEach((contractor)=>{
        recentActivityItems.push({
            id: `contractor-${contractor.id}`,
            type: 'contractor',
            action: 'Business Found',
            target: `${contractor.business_name}`,
            timestamp: contractor.discovered_at
        });
    });
    activity.recentAnalyses.forEach((analysis)=>{
        recentActivityItems.push({
            id: `analysis-${analysis.id}`,
            type: 'analysis',
            action: 'Analysis Done',
            target: analysis.contractor?.business_name || 'Business Record',
            timestamp: analysis.analyzed_at
        });
    });
    activity.recentArticles.forEach((article)=>{
        recentActivityItems.push({
            id: `article-${article.id}`,
            type: 'article',
            action: 'Article Ready',
            target: article.contractor?.business_name || 'Business Record',
            timestamp: article.generated_at
        });
    });
    const sortedActivity = recentActivityItems.sort((a, b)=>new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5).map((activity)=>({
            ...activity,
            timestamp: formatRelativeTime(activity.timestamp)
        }));
    const pipelineStages = [
        {
            name: 'Discover',
            count: stats.contractors,
            total: stats.contractors,
            status: stats.contractors > 0 ? 'complete' : 'pending'
        },
        {
            name: 'Collect',
            count: stats.reviews,
            total: stats.reviews,
            status: stats.reviews > 0 ? 'complete' : 'pending'
        },
        {
            name: 'Analyze',
            count: stats.analyses,
            total: stats.contractors,
            status: stats.analyses >= stats.contractors ? 'complete' : stats.analyses > 0 ? 'in-progress' : 'pending'
        },
        {
            name: 'Generate',
            count: stats.articles,
            total: stats.contractors,
            status: stats.articles >= stats.contractors ? 'complete' : stats.articles > 0 ? 'in-progress' : 'pending'
        }
    ];
    return {
        contractors: {
            total: stats.contractors,
            trend: 'up'
        },
        reviews: {
            total: stats.reviews,
            trend: 'up'
        },
        analyses: {
            completed: stats.analyses,
            total: stats.contractors,
            percentage: Math.round(stats.analysisRate),
            trend: stats.analysisRate > 50 ? 'up' : 'neutral'
        },
        articles: {
            generated: stats.articles,
            total: stats.contractors,
            percentage: Math.round(stats.articleRate),
            trend: stats.articleRate > 50 ? 'up' : 'neutral'
        },
        pipeline: pipelineStages,
        recentActivity: sortedActivity
    };
}
async function DashboardPage() {
    const stats = await getDashboardData();
    // Calculate overall pipeline health
    const totalProcessed = stats.pipeline.reduce((sum, s)=>sum + s.count, 0);
    const totalCapacity = stats.pipeline.reduce((sum, s)=>sum + s.total, 0);
    const overallHealth = totalCapacity > 0 ? Math.round(totalProcessed / totalCapacity * 100) : 0;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$PageHeader$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PageHeader"], {
                title: "Pipeline Intelligence",
                subtitle: "Real-time monitoring of AI review discovery, analysis, and content generation",
                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$activity$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Activity$3e$__["Activity"],
                badge: "Live",
                badgeColor: "emerald",
                actions: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                    href: "/exports",
                    className: "px-3 py-1.5 text-xs font-mono bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg transition-colors uppercase tracking-wider",
                    children: "Export JSON"
                }, void 0, false, {
                    fileName: "[project]/src/app/page.tsx",
                    lineNumber: 158,
                    columnNumber: 11
                }, void 0)
            }, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 151,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$StatBlock$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["StatBlockGrid"], {
                columns: 4,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$StatBlock$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["StatBlock"], {
                        label: "Businesses",
                        value: stats.contractors.total,
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__["Users"],
                        color: "cyan",
                        subtitle: "Discovered contractors"
                    }, void 0, false, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 169,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$StatBlock$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["StatBlock"], {
                        label: "Reviews",
                        value: stats.reviews.total,
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__["Star"],
                        color: "amber",
                        subtitle: "Collected records"
                    }, void 0, false, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 176,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$StatBlock$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["StatBlock"], {
                        label: "Analyses",
                        value: `${stats.analyses.percentage}%`,
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$lightbulb$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Lightbulb$3e$__["Lightbulb"],
                        color: "violet",
                        subtitle: `${stats.analyses.completed} processed`
                    }, void 0, false, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 183,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$StatBlock$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["StatBlock"], {
                        label: "Articles",
                        value: `${stats.articles.percentage}%`,
                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__["FileText"],
                        color: "emerald",
                        subtitle: `${stats.articles.generated} generated`
                    }, void 0, false, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 190,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 168,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$PipelineProgress$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PipelineProgress"], {
                stages: stats.pipeline
            }, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 200,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-1 lg:grid-cols-5 gap-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "lg:col-span-3",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$dashboard$2f$RecentActivity$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["RecentActivity"], {
                            activities: stats.recentActivity
                        }, void 0, false, {
                            fileName: "[project]/src/app/page.tsx",
                            lineNumber: 205,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 204,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "lg:col-span-2 space-y-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-2 mb-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "h-2 w-2 rounded-full bg-cyan-400 animate-pulse"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 212,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs font-mono uppercase tracking-wider text-zinc-500",
                                                children: "Action Center"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 213,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 211,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/pipeline",
                                                className: "group flex items-center justify-between rounded-lg bg-zinc-800/30 px-4 py-3 border border-zinc-700/30 hover:border-emerald-500/30 hover:bg-zinc-800/50 transition-all",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center gap-3",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "p-2 rounded-lg bg-zinc-700/50 text-zinc-400 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 transition-all",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"], {
                                                                    className: "h-4 w-4"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/page.tsx",
                                                                    lineNumber: 224,
                                                                    columnNumber: 21
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/page.tsx",
                                                                lineNumber: 223,
                                                                columnNumber: 19
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: "text-sm font-medium text-zinc-200",
                                                                        children: "Synchronize Pipeline"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/page.tsx",
                                                                        lineNumber: 227,
                                                                        columnNumber: 21
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: "text-[10px] text-zinc-500 font-mono uppercase tracking-wider",
                                                                        children: "Triggers new AI crawling cycle"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/page.tsx",
                                                                        lineNumber: 228,
                                                                        columnNumber: 21
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/app/page.tsx",
                                                                lineNumber: 226,
                                                                columnNumber: 19
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/page.tsx",
                                                        lineNumber: 222,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                                                        className: "h-4 w-4 text-zinc-600 group-hover:text-emerald-400 transition-all group-hover:translate-x-1"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/page.tsx",
                                                        lineNumber: 231,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 218,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/contractors",
                                                className: "group flex items-center justify-between rounded-lg bg-zinc-800/30 px-4 py-3 border border-zinc-700/30 hover:border-cyan-500/30 hover:bg-zinc-800/50 transition-all",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center gap-3",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "p-2 rounded-lg bg-zinc-700/50 text-zinc-400 group-hover:bg-cyan-500/10 group-hover:text-cyan-400 transition-all",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                                                                    className: "h-4 w-4"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/page.tsx",
                                                                    lineNumber: 240,
                                                                    columnNumber: 21
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/page.tsx",
                                                                lineNumber: 239,
                                                                columnNumber: 19
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: "text-sm font-medium text-zinc-200",
                                                                        children: "Import Contractor"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/page.tsx",
                                                                        lineNumber: 243,
                                                                        columnNumber: 21
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: "text-[10px] text-zinc-500 font-mono uppercase tracking-wider",
                                                                        children: "Manual GMB/Yelp profile entry"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/page.tsx",
                                                                        lineNumber: 244,
                                                                        columnNumber: 21
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/app/page.tsx",
                                                                lineNumber: 242,
                                                                columnNumber: 19
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/page.tsx",
                                                        lineNumber: 238,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                                                        className: "h-4 w-4 text-zinc-600 group-hover:text-cyan-400 transition-all group-hover:translate-x-1"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/page.tsx",
                                                        lineNumber: 247,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 234,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "pt-3 mt-3 border-t border-zinc-800/50 grid grid-cols-2 gap-3",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                                        href: "/exports",
                                                        className: "flex items-center justify-center gap-2 py-2.5 rounded-lg bg-zinc-800/30 text-xs font-mono text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200 transition-all border border-zinc-700/30",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Download$3e$__["Download"], {
                                                                className: "h-3.5 w-3.5"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/page.tsx",
                                                                lineNumber: 255,
                                                                columnNumber: 19
                                                            }, this),
                                                            "Archive"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/page.tsx",
                                                        lineNumber: 251,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        className: "flex items-center justify-center gap-2 py-2.5 rounded-lg bg-zinc-800/30 text-xs font-mono text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200 transition-all border border-zinc-700/30",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"], {
                                                                className: "h-3.5 w-3.5"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/page.tsx",
                                                                lineNumber: 259,
                                                                columnNumber: 19
                                                            }, this),
                                                            "Configure"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/page.tsx",
                                                        lineNumber: 258,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 250,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 217,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 210,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center justify-center h-12 w-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$activity$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Activity$3e$__["Activity"], {
                                                    className: "h-6 w-6 text-emerald-400"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/page.tsx",
                                                    lineNumber: 270,
                                                    columnNumber: 17
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 269,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center gap-2",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-lg font-bold font-mono text-zinc-100",
                                                                children: [
                                                                    overallHealth,
                                                                    "%"
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/app/page.tsx",
                                                                lineNumber: 274,
                                                                columnNumber: 19
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded",
                                                                children: "Healthy"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/page.tsx",
                                                                lineNumber: 275,
                                                                columnNumber: 19
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/page.tsx",
                                                        lineNumber: 273,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-xs text-zinc-500",
                                                        children: "Pipeline Health"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/page.tsx",
                                                        lineNumber: 279,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 272,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 268,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-4",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center gap-2 text-xs text-zinc-500 font-mono",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$database$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Database$3e$__["Database"], {
                                                    className: "h-3.5 w-3.5"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/page.tsx",
                                                    lineNumber: 284,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: "All crawler nodes operating normally"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/page.tsx",
                                                    lineNumber: 285,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/page.tsx",
                                            lineNumber: 283,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 282,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 267,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 208,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 203,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/page.tsx",
        lineNumber: 149,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/app/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/page.tsx [app-rsc] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__d397f001._.js.map