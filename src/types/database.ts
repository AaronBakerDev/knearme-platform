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
      projects: {
        Row: {
          id: string;
          contractor_id: string;
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

// Helper types for easier usage
export type Contractor = Database['public']['Tables']['contractors']['Row'];
export type ContractorInsert = Database['public']['Tables']['contractors']['Insert'];
export type ContractorUpdate = Database['public']['Tables']['contractors']['Update'];

export type Project = Database['public']['Tables']['projects']['Row'];
export type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
export type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

export type ProjectImage = Database['public']['Tables']['project_images']['Row'];
export type ProjectImageInsert = Database['public']['Tables']['project_images']['Insert'];

export type InterviewSession = Database['public']['Tables']['interview_sessions']['Row'];
export type InterviewSessionInsert = Database['public']['Tables']['interview_sessions']['Insert'];

export type VoiceUsage = Database['public']['Tables']['voice_usage']['Row'];
export type VoiceUsageInsert = Database['public']['Tables']['voice_usage']['Insert'];
export type VoiceUsageUpdate = Database['public']['Tables']['voice_usage']['Update'];

// Extended types with relations
export type ProjectWithImages = Project & {
  project_images: ProjectImage[];
};

export type ProjectWithContractor = Project & {
  contractor: Contractor;
};

export type ContractorWithProjects = Contractor & {
  projects: Project[];
};
