/**
 * Supabase client singleton.
 *
 * Set these two values in a `.env` file at the project root (or in EAS secrets
 * for cloud builds) before the app will connect to your Supabase project:
 *
 *   EXPO_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
 *
 * Until these are set the client points to a placeholder URL and all network
 * requests will fail gracefully — the app continues to work in offline-only mode.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Database = {
  public: {
    Tables: {
      alerts: {
        Row: {
          id: string;
          title: string;
          severity: 'Critical' | 'High' | 'Moderate' | 'Low';
          time: string;
          location: string;
          body: string;
          source: string;
          created_at: string;
          user_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['alerts']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['alerts']['Insert']>;
      };
      public_messages: {
        Row: {
          id: string;
          sender: string;
          text: string;
          timestamp: number;
          hash: string;
          verified: boolean;
          created_at: string;
          user_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['public_messages']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['public_messages']['Insert']>;
      };
      crowd_markers: {
        Row: {
          id: string;
          kind: 'Safe' | 'Danger';
          label: string;
          latitude: number;
          longitude: number;
          time: string;
          created_at: string;
          user_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['crowd_markers']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['crowd_markers']['Insert']>;
      };
    };
  };
};
