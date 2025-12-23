/**
 * MCP Tool Definitions for KnearMe Contractor ChatGPT App.
 *
 * This file exports all tool definitions and handlers for the MCP server.
 * Tools map to the portfolio API and follow the contracts in MCP_CONTRACTOR_INTERFACE.md.
 *
 * @see /docs/chatgpt-apps-sdk/MCP_CONTRACTOR_INTERFACE.md
 */
import { z } from 'zod';
import type { AuthContext, CreateProjectDraftOutput, AddProjectMediaOutput, MediaUpdateOutput, UpdateProjectSectionsOutput, UpdateProjectMetaOutput, FinalizeProjectOutput, ListContractorProjectsOutput, GetProjectStatusOutput } from '../types/mcp.js';
export declare const createProjectDraftSchema: z.ZodObject<{
    project_type: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodString>;
    summary: z.ZodOptional<z.ZodString>;
    challenge: z.ZodOptional<z.ZodString>;
    solution: z.ZodOptional<z.ZodString>;
    results: z.ZodOptional<z.ZodString>;
    outcome_highlights: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    summary?: string | undefined;
    challenge?: string | undefined;
    solution?: string | undefined;
    results?: string | undefined;
    project_type?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    outcome_highlights?: string[] | undefined;
}, {
    summary?: string | undefined;
    challenge?: string | undefined;
    solution?: string | undefined;
    results?: string | undefined;
    project_type?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    outcome_highlights?: string[] | undefined;
}>;
export declare const addProjectMediaSchema: z.ZodObject<{
    project_id: z.ZodString;
    files: z.ZodArray<z.ZodObject<{
        file_id: z.ZodString;
        filename: z.ZodString;
        content_type: z.ZodString;
        image_type: z.ZodOptional<z.ZodEnum<["before", "after", "progress", "detail"]>>;
    }, "strip", z.ZodTypeAny, {
        file_id: string;
        filename: string;
        content_type: string;
        image_type?: "before" | "after" | "progress" | "detail" | undefined;
    }, {
        file_id: string;
        filename: string;
        content_type: string;
        image_type?: "before" | "after" | "progress" | "detail" | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    project_id: string;
    files: {
        file_id: string;
        filename: string;
        content_type: string;
        image_type?: "before" | "after" | "progress" | "detail" | undefined;
    }[];
}, {
    project_id: string;
    files: {
        file_id: string;
        filename: string;
        content_type: string;
        image_type?: "before" | "after" | "progress" | "detail" | undefined;
    }[];
}>;
export declare const reorderProjectMediaSchema: z.ZodObject<{
    project_id: z.ZodString;
    image_ids: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    project_id: string;
    image_ids: string[];
}, {
    project_id: string;
    image_ids: string[];
}>;
export declare const setProjectHeroMediaSchema: z.ZodObject<{
    project_id: z.ZodString;
    hero_image_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    hero_image_id: string;
    project_id: string;
}, {
    hero_image_id: string;
    project_id: string;
}>;
export declare const setProjectMediaLabelsSchema: z.ZodObject<{
    project_id: z.ZodString;
    labels: z.ZodArray<z.ZodObject<{
        image_id: z.ZodString;
        image_type: z.ZodOptional<z.ZodNullable<z.ZodEnum<["before", "after", "progress", "detail"]>>>;
        alt_text: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        image_id: string;
        image_type?: "before" | "after" | "progress" | "detail" | null | undefined;
        alt_text?: string | null | undefined;
    }, {
        image_id: string;
        image_type?: "before" | "after" | "progress" | "detail" | null | undefined;
        alt_text?: string | null | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    project_id: string;
    labels: {
        image_id: string;
        image_type?: "before" | "after" | "progress" | "detail" | null | undefined;
        alt_text?: string | null | undefined;
    }[];
}, {
    project_id: string;
    labels: {
        image_id: string;
        image_type?: "before" | "after" | "progress" | "detail" | null | undefined;
        alt_text?: string | null | undefined;
    }[];
}>;
export declare const updateProjectSectionsSchema: z.ZodObject<{
    project_id: z.ZodString;
    summary: z.ZodOptional<z.ZodString>;
    challenge: z.ZodOptional<z.ZodString>;
    solution: z.ZodOptional<z.ZodString>;
    results: z.ZodOptional<z.ZodString>;
    outcome_highlights: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    project_id: string;
    summary?: string | undefined;
    challenge?: string | undefined;
    solution?: string | undefined;
    results?: string | undefined;
    outcome_highlights?: string[] | undefined;
}, {
    project_id: string;
    summary?: string | undefined;
    challenge?: string | undefined;
    solution?: string | undefined;
    results?: string | undefined;
    outcome_highlights?: string[] | undefined;
}>;
export declare const updateProjectMetaSchema: z.ZodObject<{
    project_id: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    project_type: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodString>;
    duration: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    materials: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    techniques: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    seo_title: z.ZodOptional<z.ZodString>;
    seo_description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    project_id: string;
    title?: string | undefined;
    project_type?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    materials?: string[] | undefined;
    techniques?: string[] | undefined;
    duration?: string | undefined;
    tags?: string[] | undefined;
    seo_title?: string | undefined;
    seo_description?: string | undefined;
}, {
    project_id: string;
    title?: string | undefined;
    project_type?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    materials?: string[] | undefined;
    techniques?: string[] | undefined;
    duration?: string | undefined;
    tags?: string[] | undefined;
    seo_title?: string | undefined;
    seo_description?: string | undefined;
}>;
export declare const finalizeProjectSchema: z.ZodObject<{
    project_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    project_id: string;
}, {
    project_id: string;
}>;
export declare const listContractorProjectsSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["draft", "published", "archived"]>>;
    limit: z.ZodOptional<z.ZodNumber>;
    offset: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status?: "draft" | "published" | "archived" | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
}, {
    status?: "draft" | "published" | "archived" | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
}>;
export declare const getProjectStatusSchema: z.ZodObject<{
    project_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    project_id: string;
}, {
    project_id: string;
}>;
export declare const toolDefinitions: ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            project_type: {
                type: string;
                description: string;
            };
            city: {
                type: string;
                description: string;
            };
            state: {
                type: string;
                description: string;
            };
            summary: {
                type: string;
                description: string;
            };
            challenge: {
                type: string;
                description: string;
            };
            solution: {
                type: string;
                description: string;
            };
            results: {
                type: string;
                description: string;
            };
            outcome_highlights: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            project_id?: undefined;
            files?: undefined;
            image_ids?: undefined;
            hero_image_id?: undefined;
            labels?: undefined;
            title?: undefined;
            duration?: undefined;
            tags?: undefined;
            materials?: undefined;
            techniques?: undefined;
            seo_title?: undefined;
            seo_description?: undefined;
            status?: undefined;
            limit?: undefined;
            offset?: undefined;
        };
        required: never[];
    };
    hints: {
        readOnlyHint: boolean;
        destructiveHint?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            project_id: {
                type: string;
                description: string;
            };
            files: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        file_id: {
                            type: string;
                            description: string;
                        };
                        filename: {
                            type: string;
                            description: string;
                        };
                        content_type: {
                            type: string;
                            description: string;
                        };
                        image_type: {
                            type: string;
                            enum: string[];
                            description: string;
                        };
                    };
                    required: string[];
                };
            };
            project_type?: undefined;
            city?: undefined;
            state?: undefined;
            summary?: undefined;
            challenge?: undefined;
            solution?: undefined;
            results?: undefined;
            outcome_highlights?: undefined;
            image_ids?: undefined;
            hero_image_id?: undefined;
            labels?: undefined;
            title?: undefined;
            duration?: undefined;
            tags?: undefined;
            materials?: undefined;
            techniques?: undefined;
            seo_title?: undefined;
            seo_description?: undefined;
            status?: undefined;
            limit?: undefined;
            offset?: undefined;
        };
        required: string[];
    };
    hints: {
        readOnlyHint: boolean;
        destructiveHint?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            project_id: {
                type: string;
                description: string;
            };
            image_ids: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            project_type?: undefined;
            city?: undefined;
            state?: undefined;
            summary?: undefined;
            challenge?: undefined;
            solution?: undefined;
            results?: undefined;
            outcome_highlights?: undefined;
            files?: undefined;
            hero_image_id?: undefined;
            labels?: undefined;
            title?: undefined;
            duration?: undefined;
            tags?: undefined;
            materials?: undefined;
            techniques?: undefined;
            seo_title?: undefined;
            seo_description?: undefined;
            status?: undefined;
            limit?: undefined;
            offset?: undefined;
        };
        required: string[];
    };
    hints: {
        readOnlyHint: boolean;
        destructiveHint?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            project_id: {
                type: string;
                description: string;
            };
            hero_image_id: {
                type: string;
                description: string;
            };
            project_type?: undefined;
            city?: undefined;
            state?: undefined;
            summary?: undefined;
            challenge?: undefined;
            solution?: undefined;
            results?: undefined;
            outcome_highlights?: undefined;
            files?: undefined;
            image_ids?: undefined;
            labels?: undefined;
            title?: undefined;
            duration?: undefined;
            tags?: undefined;
            materials?: undefined;
            techniques?: undefined;
            seo_title?: undefined;
            seo_description?: undefined;
            status?: undefined;
            limit?: undefined;
            offset?: undefined;
        };
        required: string[];
    };
    hints: {
        readOnlyHint: boolean;
        destructiveHint?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            project_id: {
                type: string;
                description: string;
            };
            labels: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        image_id: {
                            type: string;
                            description: string;
                        };
                        image_type: {
                            type: string;
                            enum: string[];
                            description: string;
                        };
                        alt_text: {
                            type: string;
                            description: string;
                        };
                    };
                    required: string[];
                };
            };
            project_type?: undefined;
            city?: undefined;
            state?: undefined;
            summary?: undefined;
            challenge?: undefined;
            solution?: undefined;
            results?: undefined;
            outcome_highlights?: undefined;
            files?: undefined;
            image_ids?: undefined;
            hero_image_id?: undefined;
            title?: undefined;
            duration?: undefined;
            tags?: undefined;
            materials?: undefined;
            techniques?: undefined;
            seo_title?: undefined;
            seo_description?: undefined;
            status?: undefined;
            limit?: undefined;
            offset?: undefined;
        };
        required: string[];
    };
    hints: {
        readOnlyHint: boolean;
        destructiveHint?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            project_id: {
                type: string;
                description: string;
            };
            summary: {
                type: string;
                description: string;
            };
            challenge: {
                type: string;
                description: string;
            };
            solution: {
                type: string;
                description: string;
            };
            results: {
                type: string;
                description: string;
            };
            outcome_highlights: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            project_type?: undefined;
            city?: undefined;
            state?: undefined;
            files?: undefined;
            image_ids?: undefined;
            hero_image_id?: undefined;
            labels?: undefined;
            title?: undefined;
            duration?: undefined;
            tags?: undefined;
            materials?: undefined;
            techniques?: undefined;
            seo_title?: undefined;
            seo_description?: undefined;
            status?: undefined;
            limit?: undefined;
            offset?: undefined;
        };
        required: string[];
    };
    hints: {
        readOnlyHint: boolean;
        destructiveHint?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            project_id: {
                type: string;
                description: string;
            };
            title: {
                type: string;
                description: string;
            };
            project_type: {
                type: string;
                description: string;
            };
            city: {
                type: string;
                description: string;
            };
            state: {
                type: string;
                description: string;
            };
            duration: {
                type: string;
                description: string;
            };
            tags: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            materials: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            techniques: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            seo_title: {
                type: string;
                description: string;
            };
            seo_description: {
                type: string;
                description: string;
            };
            summary?: undefined;
            challenge?: undefined;
            solution?: undefined;
            results?: undefined;
            outcome_highlights?: undefined;
            files?: undefined;
            image_ids?: undefined;
            hero_image_id?: undefined;
            labels?: undefined;
            status?: undefined;
            limit?: undefined;
            offset?: undefined;
        };
        required: string[];
    };
    hints: {
        readOnlyHint: boolean;
        destructiveHint?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            project_id: {
                type: string;
                description: string;
            };
            project_type?: undefined;
            city?: undefined;
            state?: undefined;
            summary?: undefined;
            challenge?: undefined;
            solution?: undefined;
            results?: undefined;
            outcome_highlights?: undefined;
            files?: undefined;
            image_ids?: undefined;
            hero_image_id?: undefined;
            labels?: undefined;
            title?: undefined;
            duration?: undefined;
            tags?: undefined;
            materials?: undefined;
            techniques?: undefined;
            seo_title?: undefined;
            seo_description?: undefined;
            status?: undefined;
            limit?: undefined;
            offset?: undefined;
        };
        required: string[];
    };
    hints: {
        readOnlyHint: boolean;
        destructiveHint: boolean;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            status: {
                type: string;
                enum: string[];
                description: string;
            };
            limit: {
                type: string;
                description: string;
            };
            offset: {
                type: string;
                description: string;
            };
            project_type?: undefined;
            city?: undefined;
            state?: undefined;
            summary?: undefined;
            challenge?: undefined;
            solution?: undefined;
            results?: undefined;
            outcome_highlights?: undefined;
            project_id?: undefined;
            files?: undefined;
            image_ids?: undefined;
            hero_image_id?: undefined;
            labels?: undefined;
            title?: undefined;
            duration?: undefined;
            tags?: undefined;
            materials?: undefined;
            techniques?: undefined;
            seo_title?: undefined;
            seo_description?: undefined;
        };
        required: never[];
    };
    hints: {
        readOnlyHint: boolean;
        destructiveHint?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            project_id: {
                type: string;
                description: string;
            };
            project_type?: undefined;
            city?: undefined;
            state?: undefined;
            summary?: undefined;
            challenge?: undefined;
            solution?: undefined;
            results?: undefined;
            outcome_highlights?: undefined;
            files?: undefined;
            image_ids?: undefined;
            hero_image_id?: undefined;
            labels?: undefined;
            title?: undefined;
            duration?: undefined;
            tags?: undefined;
            materials?: undefined;
            techniques?: undefined;
            seo_title?: undefined;
            seo_description?: undefined;
            status?: undefined;
            limit?: undefined;
            offset?: undefined;
        };
        required: string[];
    };
    hints: {
        readOnlyHint: boolean;
        destructiveHint?: undefined;
    };
})[];
export type ToolResult<T> = {
    success: true;
    result: T;
} | {
    success: false;
    error: string;
};
/**
 * Handle create_project_draft tool.
 */
export declare function handleCreateProjectDraft(input: z.infer<typeof createProjectDraftSchema>, auth: AuthContext, baseUrl: string): Promise<ToolResult<CreateProjectDraftOutput>>;
/**
 * Handle add_project_media tool.
 * Note: In production, this would download files from ChatGPT and upload to Supabase.
 * For now, we implement the API structure but file handling needs ChatGPT runtime.
 */
export declare function handleAddProjectMedia(input: z.infer<typeof addProjectMediaSchema>, auth: AuthContext, baseUrl: string): Promise<ToolResult<AddProjectMediaOutput>>;
/**
 * Handle reorder_project_media tool.
 */
export declare function handleReorderProjectMedia(input: z.infer<typeof reorderProjectMediaSchema>, auth: AuthContext, baseUrl: string): Promise<ToolResult<MediaUpdateOutput>>;
/**
 * Handle set_project_hero_media tool.
 */
export declare function handleSetProjectHeroMedia(input: z.infer<typeof setProjectHeroMediaSchema>, auth: AuthContext, baseUrl: string): Promise<ToolResult<MediaUpdateOutput>>;
/**
 * Handle set_project_media_labels tool.
 */
export declare function handleSetProjectMediaLabels(input: z.infer<typeof setProjectMediaLabelsSchema>, auth: AuthContext, baseUrl: string): Promise<ToolResult<MediaUpdateOutput>>;
/**
 * Handle update_project_sections tool.
 */
export declare function handleUpdateProjectSections(input: z.infer<typeof updateProjectSectionsSchema>, auth: AuthContext, baseUrl: string): Promise<ToolResult<UpdateProjectSectionsOutput>>;
/**
 * Handle update_project_meta tool.
 */
export declare function handleUpdateProjectMeta(input: z.infer<typeof updateProjectMetaSchema>, auth: AuthContext, baseUrl: string): Promise<ToolResult<UpdateProjectMetaOutput>>;
/**
 * Handle finalize_project tool.
 */
export declare function handleFinalizeProject(input: z.infer<typeof finalizeProjectSchema>, auth: AuthContext, baseUrl: string): Promise<ToolResult<FinalizeProjectOutput>>;
/**
 * Handle list_contractor_projects tool.
 */
export declare function handleListContractorProjects(input: z.infer<typeof listContractorProjectsSchema>, auth: AuthContext, baseUrl: string): Promise<ToolResult<ListContractorProjectsOutput>>;
/**
 * Handle get_project_status tool.
 */
export declare function handleGetProjectStatus(input: z.infer<typeof getProjectStatusSchema>, auth: AuthContext, baseUrl: string): Promise<ToolResult<GetProjectStatusOutput>>;
//# sourceMappingURL=index.d.ts.map