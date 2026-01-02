/**
 * Database types for KnearMe Portfolio.
 * These types match the Supabase database schema.
 *
 * @see /docs/03-architecture/data-model.md for full schema documentation
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      contractors: {
        Row: {
          id: string;
          auth_user_id: string;
          email: string;
          business_name: string | null;
          profile_slug: string | null;
          address: string | null;
          postal_code: string | null;
          phone: string | null;
          website: string | null;
          city: string | null;
          state: string | null;
          city_slug: string | null;
          services: string[] | null;
          service_areas: string[] | null;
          description: string | null;
          profile_photo_url: string | null;
          plan_tier: 'free' | 'pro';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          email: string;
          business_name?: string | null;
          profile_slug?: string | null;
          address?: string | null;
          postal_code?: string | null;
          phone?: string | null;
          website?: string | null;
          city?: string | null;
          state?: string | null;
          city_slug?: string | null;
          services?: string[] | null;
          service_areas?: string[] | null;
          description?: string | null;
          profile_photo_url?: string | null;
          plan_tier?: 'free' | 'pro';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string;
          email?: string;
          business_name?: string | null;
          profile_slug?: string | null;
          address?: string | null;
          postal_code?: string | null;
          phone?: string | null;
          website?: string | null;
          city?: string | null;
          state?: string | null;
          city_slug?: string | null;
          services?: string[] | null;
          service_areas?: string[] | null;
          description?: string | null;
          profile_photo_url?: string | null;
          plan_tier?: 'free' | 'pro';
          created_at?: string;
          updated_at?: string;
        };
      };
      /**
       * Business profiles table - canonical source of truth for business data.
       * CR-DB-1 FIX: Added missing fields (city, state, services, etc.) to match migration 033 schema.
       */
      businesses: {
        Row: {
          id: string;
          auth_user_id: string | null;
          email: string | null;
          name: string | null;
          slug: string | null;
          profile_photo_url: string | null;
          // Location fields (migrated from contractors)
          city: string | null;
          state: string | null;
          city_slug: string | null;
          address: string | null;
          postal_code: string | null;
          phone: string | null;
          website: string | null;
          // Service fields (migrated from contractors)
          services: string[] | null;
          service_areas: string[] | null;
          description: string | null;
          // Plan tier
          plan_tier: 'free' | 'pro';
          // Agentic JSONB fields
          location: Json | null;
          understanding: Json | null;
          context: Json | null;
          discovered_data: Json | null;
          // Google integration
          google_place_id: string | null;
          google_cid: string | null;
          onboarding_method: string | null;
          // Migration link
          legacy_contractor_id: string | null;
          // Timestamps
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          email?: string | null;
          name?: string | null;
          slug?: string | null;
          profile_photo_url?: string | null;
          city?: string | null;
          state?: string | null;
          city_slug?: string | null;
          address?: string | null;
          postal_code?: string | null;
          phone?: string | null;
          website?: string | null;
          services?: string[] | null;
          service_areas?: string[] | null;
          description?: string | null;
          plan_tier?: 'free' | 'pro';
          location?: Json | null;
          understanding?: Json | null;
          context?: Json | null;
          discovered_data?: Json | null;
          google_place_id?: string | null;
          google_cid?: string | null;
          onboarding_method?: string | null;
          legacy_contractor_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string | null;
          email?: string | null;
          name?: string | null;
          slug?: string | null;
          profile_photo_url?: string | null;
          city?: string | null;
          state?: string | null;
          city_slug?: string | null;
          address?: string | null;
          postal_code?: string | null;
          phone?: string | null;
          website?: string | null;
          services?: string[] | null;
          service_areas?: string[] | null;
          description?: string | null;
          plan_tier?: 'free' | 'pro';
          location?: Json | null;
          understanding?: Json | null;
          context?: Json | null;
          discovered_data?: Json | null;
          google_place_id?: string | null;
          google_cid?: string | null;
          onboarding_method?: string | null;
          legacy_contractor_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          contractor_id: string;
          business_id: string;
          title: string | null;
          description: string | null;
          description_blocks: Json | null;
          summary: string | null;
          challenge: string | null;
          solution: string | null;
          results: string | null;
          outcome_highlights: string[] | null;
          project_type: string | null;
          project_type_slug: string | null;
          materials: string[] | null;
          techniques: string[] | null;
          neighborhood: string | null;
          city: string | null;
          state: string | null;
          city_slug: string | null;
          duration: string | null;
          status: 'draft' | 'published' | 'archived';
          slug: string | null;
          seo_title: string | null;
          seo_description: string | null;
          hero_image_id: string | null;
          client_type: 'residential' | 'commercial' | 'municipal' | 'other' | null;
          budget_range: '<5k' | '5k-10k' | '10k-25k' | '25k-50k' | '50k+' | null;
          description_manual: boolean | null;
          tags: string[] | null;
          conversation_summary: string | null;
          ai_context: Json | null;
          created_at: string;
          updated_at: string;
          published_at: string | null;
        };
        Insert: {
          id?: string;
          contractor_id: string;
          business_id: string;
          title?: string | null;
          description?: string | null;
          description_blocks?: Json | null;
          summary?: string | null;
          challenge?: string | null;
          solution?: string | null;
          results?: string | null;
          outcome_highlights?: string[] | null;
          project_type?: string | null;
          project_type_slug?: string | null;
          materials?: string[] | null;
          techniques?: string[] | null;
          neighborhood?: string | null;
          city?: string | null;
          state?: string | null;
          city_slug?: string | null;
          duration?: string | null;
          status?: 'draft' | 'published' | 'archived';
          slug?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          hero_image_id?: string | null;
          client_type?: 'residential' | 'commercial' | 'municipal' | 'other' | null;
          budget_range?: '<5k' | '5k-10k' | '10k-25k' | '25k-50k' | '50k+' | null;
          description_manual?: boolean | null;
          tags?: string[] | null;
          conversation_summary?: string | null;
          ai_context?: Json | null;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
        Update: {
          id?: string;
          contractor_id?: string;
          business_id?: string;
          title?: string | null;
          description?: string | null;
          description_blocks?: Json | null;
          summary?: string | null;
          challenge?: string | null;
          solution?: string | null;
          results?: string | null;
          outcome_highlights?: string[] | null;
          project_type?: string | null;
          project_type_slug?: string | null;
          materials?: string[] | null;
          techniques?: string[] | null;
          neighborhood?: string | null;
          city?: string | null;
          state?: string | null;
          city_slug?: string | null;
          duration?: string | null;
          status?: 'draft' | 'published' | 'archived';
          slug?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          hero_image_id?: string | null;
          client_type?: 'residential' | 'commercial' | 'municipal' | 'other' | null;
          budget_range?: '<5k' | '5k-10k' | '10k-25k' | '25k-50k' | '50k+' | null;
          description_manual?: boolean | null;
          tags?: string[] | null;
          conversation_summary?: string | null;
          ai_context?: Json | null;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
      };
      portfolio_items: {
        Row: {
          id: string;
          business_id: string;
          status: 'draft' | 'published' | 'archived';
          slug: string | null;
          content: Json | null;
          visuals: Json | null;
          layout: Json | null;
          seo: Json | null;
          context: Json | null;
          legacy_project_id: string | null;
          created_at: string;
          updated_at: string;
          published_at: string | null;
        };
        Insert: {
          id?: string;
          business_id: string;
          status?: 'draft' | 'published' | 'archived';
          slug?: string | null;
          content?: Json | null;
          visuals?: Json | null;
          layout?: Json | null;
          seo?: Json | null;
          context?: Json | null;
          legacy_project_id?: string | null;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
        Update: {
          id?: string;
          business_id?: string;
          status?: 'draft' | 'published' | 'archived';
          slug?: string | null;
          content?: Json | null;
          visuals?: Json | null;
          layout?: Json | null;
          seo?: Json | null;
          context?: Json | null;
          legacy_project_id?: string | null;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
      };
      portfolio_images: {
        Row: {
          id: string;
          portfolio_item_id: string;
          storage_path: string;
          role: string | null;
          analysis: Json | null;
          alt_text: string | null;
          display_order: number;
          width: number | null;
          height: number | null;
          legacy_project_image_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          portfolio_item_id: string;
          storage_path: string;
          role?: string | null;
          analysis?: Json | null;
          alt_text?: string | null;
          display_order?: number;
          width?: number | null;
          height?: number | null;
          legacy_project_image_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          portfolio_item_id?: string;
          storage_path?: string;
          role?: string | null;
          analysis?: Json | null;
          alt_text?: string | null;
          display_order?: number;
          width?: number | null;
          height?: number | null;
          legacy_project_image_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      project_images: {
        Row: {
          id: string;
          project_id: string;
          storage_path: string;
          image_type: 'before' | 'after' | 'progress' | 'detail' | null;
          alt_text: string | null;
          display_order: number;
          width: number | null;
          height: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          storage_path: string;
          image_type?: 'before' | 'after' | 'progress' | 'detail' | null;
          alt_text?: string | null;
          display_order?: number;
          width?: number | null;
          height?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          storage_path?: string;
          image_type?: 'before' | 'after' | 'progress' | 'detail' | null;
          alt_text?: string | null;
          display_order?: number;
          width?: number | null;
          height?: number | null;
          created_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          business_id: string;
          portfolio_item_id: string | null;
          purpose: string | null;
          messages: Json | null;
          summary: string | null;
          extracted: Json | null;
          active_agents: string[] | null;
          handoffs: Json | null;
          status: 'active' | 'completed' | 'archived';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          portfolio_item_id?: string | null;
          purpose?: string | null;
          messages?: Json | null;
          summary?: string | null;
          extracted?: Json | null;
          active_agents?: string[] | null;
          handoffs?: Json | null;
          status?: 'active' | 'completed' | 'archived';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          portfolio_item_id?: string | null;
          purpose?: string | null;
          messages?: Json | null;
          summary?: string | null;
          extracted?: Json | null;
          active_agents?: string[] | null;
          handoffs?: Json | null;
          status?: 'active' | 'completed' | 'archived';
          created_at?: string;
          updated_at?: string;
        };
      };
      agent_memory: {
        Row: {
          id: string;
          business_id: string;
          facts: Json | null;
          preferences: Json | null;
          patterns: Json | null;
          relationship_summary: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          facts?: Json | null;
          preferences?: Json | null;
          patterns?: Json | null;
          relationship_summary?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          facts?: Json | null;
          preferences?: Json | null;
          patterns?: Json | null;
          relationship_summary?: string | null;
          updated_at?: string;
        };
      };
      interview_sessions: {
        Row: {
          id: string;
          project_id: string;
          questions: Json | null;
          image_analysis: Json | null;
          raw_transcripts: string[] | null;
          generated_content: Json | null;
          status: 'in_progress' | 'completed' | 'approved';
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          questions?: Json | null;
          image_analysis?: Json | null;
          raw_transcripts?: string[] | null;
          generated_content?: Json | null;
          status?: 'in_progress' | 'completed' | 'approved';
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          questions?: Json | null;
          image_analysis?: Json | null;
          raw_transcripts?: string[] | null;
          generated_content?: Json | null;
          status?: 'in_progress' | 'completed' | 'approved';
          created_at?: string;
        };
      };
      push_subscriptions: {
        Row: {
          id: string;
          contractor_id: string;
          endpoint: string;
          p256dh_key: string;
          auth_key: string;
          user_agent: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          contractor_id: string;
          endpoint: string;
          p256dh_key: string;
          auth_key: string;
          user_agent?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          contractor_id?: string;
          endpoint?: string;
          p256dh_key?: string;
          auth_key?: string;
          user_agent?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_contractor_id_fkey";
            columns: ["contractor_id"];
            isOneToOne: false;
            referencedRelation: "contractors";
            referencedColumns: ["id"];
          }
        ];
      };
      voice_usage: {
        Row: {
          id: string;
          user_id: string;
          contractor_id: string | null;
          session_id: string | null;
          mode: 'voice_text' | 'voice_voice';
          started_at: string;
          ended_at: string | null;
          duration_seconds: number | null;
          token_count: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          contractor_id?: string | null;
          session_id?: string | null;
          mode: 'voice_text' | 'voice_voice';
          started_at?: string;
          ended_at?: string | null;
          duration_seconds?: number | null;
          token_count?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          contractor_id?: string | null;
          session_id?: string | null;
          mode?: 'voice_text' | 'voice_voice';
          started_at?: string;
          ended_at?: string | null;
          duration_seconds?: number | null;
          token_count?: number | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      project_status: 'draft' | 'published' | 'archived';
      image_type: 'before' | 'after' | 'progress' | 'detail';
      interview_status: 'in_progress' | 'completed' | 'approved';
      voice_mode: 'voice_text' | 'voice_voice';
    };
  };
};

// ============================================================================
// Business Types (Primary - Use These)
// ============================================================================

/** Primary business type for the portfolio platform */
export type Business = Database['public']['Tables']['businesses']['Row'];
export type BusinessInsert = Database['public']['Tables']['businesses']['Insert'];
export type BusinessUpdate = Database['public']['Tables']['businesses']['Update'];

// Extended types with relations
export type BusinessWithProjects = Business & {
  projects: Project[];
};

export type ProjectWithBusiness = Project & {
  business: Business;
};

// ============================================================================
// Legacy Contractor Types (Deprecated - Migrate to Business)
// ============================================================================

/**
 * @deprecated Use `Business` instead. Will be removed in Phase 11.12.
 * The `contractors` table is kept for backward compatibility during migration.
 */
export type Contractor = Database['public']['Tables']['contractors']['Row'];

/**
 * @deprecated Use `BusinessInsert` instead. Will be removed in Phase 11.12.
 */
export type ContractorInsert = Database['public']['Tables']['contractors']['Insert'];

/**
 * @deprecated Use `BusinessUpdate` instead. Will be removed in Phase 11.12.
 */
export type ContractorUpdate = Database['public']['Tables']['contractors']['Update'];

/**
 * @deprecated Use `ProjectWithBusiness` instead. Will be removed in Phase 11.12.
 */
export type ProjectWithContractor = Project & {
  contractor: Contractor;
};

/**
 * @deprecated Use `BusinessWithProjects` instead. Will be removed in Phase 11.12.
 */
export type ContractorWithProjects = Contractor & {
  projects: Project[];
};

// ============================================================================
// Project Types
// ============================================================================

export type Project = Database['public']['Tables']['projects']['Row'];
export type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
export type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

export type ProjectImage = Database['public']['Tables']['project_images']['Row'];
export type ProjectImageInsert = Database['public']['Tables']['project_images']['Insert'];

export type ProjectWithImages = Project & {
  project_images: ProjectImage[];
};

// ============================================================================
// Portfolio Item Types (Agentic Architecture)
// ============================================================================

export type PortfolioItem = Database['public']['Tables']['portfolio_items']['Row'];
export type PortfolioItemInsert = Database['public']['Tables']['portfolio_items']['Insert'];
export type PortfolioItemUpdate = Database['public']['Tables']['portfolio_items']['Update'];

export type PortfolioImage = Database['public']['Tables']['portfolio_images']['Row'];
export type PortfolioImageInsert = Database['public']['Tables']['portfolio_images']['Insert'];
export type PortfolioImageUpdate = Database['public']['Tables']['portfolio_images']['Update'];

export type PortfolioItemWithImages = PortfolioItem & {
  portfolio_images: PortfolioImage[];
};

// ============================================================================
// Conversation & Agent Types
// ============================================================================

export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert'];
export type ConversationUpdate = Database['public']['Tables']['conversations']['Update'];

export type AgentMemory = Database['public']['Tables']['agent_memory']['Row'];
export type AgentMemoryInsert = Database['public']['Tables']['agent_memory']['Insert'];
export type AgentMemoryUpdate = Database['public']['Tables']['agent_memory']['Update'];

// ============================================================================
// Interview & Voice Types
// ============================================================================

export type InterviewSession = Database['public']['Tables']['interview_sessions']['Row'];
export type InterviewSessionInsert = Database['public']['Tables']['interview_sessions']['Insert'];

export type VoiceUsage = Database['public']['Tables']['voice_usage']['Row'];
export type VoiceUsageInsert = Database['public']['Tables']['voice_usage']['Insert'];
export type VoiceUsageUpdate = Database['public']['Tables']['voice_usage']['Update'];
