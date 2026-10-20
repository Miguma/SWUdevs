export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      user_meetings: {
        Row: { id: string; user_id: string; document: Json; created_at: string; updated_at: string };
        Insert: { id: string; user_id?: string; document: Json; created_at?: string; updated_at?: string };
        Update: { document?: Json; updated_at?: string };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
