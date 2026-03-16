// ============================================
// lib/supabase.ts — Supabase Client
// ============================================

import { createClient } from '@supabase/supabase-js';

// Browser client (uses anon key — respects RLS)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Server client (uses service role — bypasses RLS)
// Only use in API routes and scripts, NEVER in client code
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─── Type Definitions ───

export interface Book {
  id: string;
  title: string;
  subtitle: string | null;
  authors: string[];
  description: string | null;
  categories: string[];
  isbn_13: string | null;
  isbn_10: string | null;
  page_count: number | null;
  published_date: string | null;
  publisher: string | null;
  language_original: string;
  cover_url_original: string | null;
  cover_full: string | null;
  cover_card: string | null;
  cover_thumbnail: string | null;
  avg_rating: number | null;
  rating_count: number;
  status: string;
  created_at: string;
}

export interface Summary {
  id: string;
  book_id: string;
  lang: string;
  hook: string;
  overview: string;
  key_takeaways: { number: number; title: string; body: string }[];
  who_should_read: string | null;
  topics: string[];
  mood: string | null;
  audio_url: string | null;
  audio_duration_seconds: number | null;
  status: string;
}

export interface Category {
  id: string;
  slug: string;
  name_en: string;
  name_fa: string;
  name_ps: string | null;
  name_ur: string | null;
  name_ar: string | null;
  name_hi: string | null;
  icon: string;
  sort_order: number;
}
