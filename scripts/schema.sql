-- ============================================
-- TABAN.APP — Complete Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── BOOKS ───
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subtitle TEXT,
  authors TEXT[] NOT NULL DEFAULT '{}',
  description TEXT,
  categories TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  language_original TEXT DEFAULT 'en',
  isbn_13 TEXT UNIQUE,
  isbn_10 TEXT,
  google_books_id TEXT,
  open_library_key TEXT,
  goodreads_url TEXT,
  sources TEXT[] DEFAULT '{}',
  cover_url_original TEXT,
  cover_full TEXT,
  cover_card TEXT,
  cover_thumbnail TEXT,
  page_count INTEGER,
  published_date TEXT,
  publisher TEXT,
  avg_rating DECIMAL(3,2),
  rating_count INTEGER DEFAULT 0,
  preview_link TEXT,
  info_link TEXT,
  status TEXT DEFAULT 'metadata_ready' CHECK (status IN (
    'metadata_ready', 'summary_queued', 'summarized', 'audio_ready', 'published', 'error'
  )),
  priority INTEGER DEFAULT 0,
  error_log TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SUMMARIES (one per book per language) ───
CREATE TABLE IF NOT EXISTS summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  lang TEXT NOT NULL,
  hook TEXT NOT NULL,
  overview TEXT NOT NULL,
  key_takeaways JSONB NOT NULL,
  who_should_read TEXT,
  topics TEXT[] DEFAULT '{}',
  mood TEXT,
  audio_url TEXT,
  audio_duration_seconds INTEGER,
  ai_model TEXT,
  quality_score DECIMAL(3,2),
  status TEXT DEFAULT 'generated' CHECK (status IN ('generated', 'reviewed', 'published', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(book_id, lang)
);

-- ─── USERS ───
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'fa' CHECK (preferred_language IN ('en', 'fa', 'ps', 'ur', 'ar', 'hi')),
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  plan_expires_at TIMESTAMPTZ,
  auth_provider TEXT,
  auth_uid TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SWIPES ───
CREATE TABLE IF NOT EXISTS swipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('right', 'left')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- ─── BOOKMARKS ───
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'saved' CHECK (status IN ('saved', 'reading', 'finished')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- ─── CATEGORIES ───
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_fa TEXT NOT NULL,
  name_ps TEXT,
  name_ur TEXT,
  name_ar TEXT,
  name_hi TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0
);

INSERT INTO categories (slug, name_en, name_fa, name_ps, name_ur, name_ar, name_hi, icon, sort_order) VALUES
  ('fiction',     'Fiction',           'داستان',        'کیسه',          'افسانہ',        'رواية',         'उपन्यास',      '📖', 1),
  ('poetry',      'Poetry',           'شعر',           'شعر',           'شاعری',         'شعر',           'कविता',        '🎭', 2),
  ('history',     'History',          'تاریخ',          'تاریخ',          'تاریخ',          'تاريخ',          'इतिहास',       '🏛️', 3),
  ('philosophy',  'Philosophy',       'فلسفه',          'فلسفه',          'فلسفہ',          'فلسفة',          'दर्शन',        '💭', 4),
  ('biography',   'Biography',        'زندگینامه',       'ژوندلیک',        'سوانح عمری',      'سيرة ذاتية',     'जीवनी',        '👤', 5),
  ('self-help',   'Self-Help',        'خودسازی',        'ځان جوړونه',     'خود مدد',        'تطوير الذات',    'स्व-सहायता',    '🌱', 6),
  ('science',     'Science',          'علم',            'ساینس',          'سائنس',          'علوم',           'विज्ञान',       '🔬', 7),
  ('business',    'Business',         'تجارت',          'سوداګری',        'کاروبار',         'أعمال',          'व्यापार',       '💼', 8),
  ('religion',    'Religion',         'دین و معنویت',    'دین او روحانیت',  'دین و روحانیت',   'دين وروحانية',   'धर्म',         '🕌', 9),
  ('psychology',  'Psychology',       'روانشناسی',       'رواپوهنه',       'نفسیات',         'علم النفس',      'मनोविज्ञान',    '🧠', 10),
  ('romance',     'Romance',          'عاشقانه',        'مینه ییز',       'رومانوی',         'رومانسية',       'प्रेम कथा',    '❤️', 11),
  ('thriller',    'Thriller',         'هیجان‌انگیز',     'هیجاني',         'سنسنی خیز',      'إثارة',          'रोमांचक',      '🔍', 12),
  ('technology',  'Technology',       'تکنالوژی',       'ټکنالوژي',       'ٹیکنالوجی',      'تكنولوجيا',      'प्रौद्योगिकी',  '💻', 13),
  ('children',    'Children & Youth', 'کودک و نوجوان',   'ماشومان او ځوانان', 'بچے اور نوجوان',  'أطفال وشباب',    'बच्चे और युवा', '🧒', 14),
  ('culture',     'Culture & Heritage','فرهنگ و میراث',   'کلتور او میراث',  'ثقافت اور ورثہ',  'ثقافة وتراث',    'संस्कृति',     '🌍', 15)
ON CONFLICT (slug) DO NOTHING;

-- ─── PROCESSING QUEUES ───
CREATE TABLE IF NOT EXISTS summary_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE UNIQUE,
  priority INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  error_log TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tts_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  summary_id UUID REFERENCES summaries(id) ON DELETE CASCADE,
  lang TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  error_log TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── BOOK REQUESTS ───
CREATE TABLE IF NOT EXISTS book_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  query TEXT NOT NULL,
  matched_book_id UUID REFERENCES books(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'found', 'not_found', 'summarized')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INDEXES ───
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_books_categories ON books USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_books_isbn13 ON books(isbn_13);
CREATE INDEX IF NOT EXISTS idx_books_google_id ON books(google_books_id);
CREATE INDEX IF NOT EXISTS idx_books_rating ON books(avg_rating DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_books_priority ON books(priority DESC);
CREATE INDEX IF NOT EXISTS idx_summaries_book ON summaries(book_id);
CREATE INDEX IF NOT EXISTS idx_summaries_lang ON summaries(lang);
CREATE INDEX IF NOT EXISTS idx_summaries_book_lang ON summaries(book_id, lang);
CREATE INDEX IF NOT EXISTS idx_swipes_user ON swipes(user_id);
CREATE INDEX IF NOT EXISTS idx_summary_queue_status ON summary_queue(status, priority DESC);
CREATE INDEX IF NOT EXISTS idx_tts_queue_status ON tts_queue(status);

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_books_fts ON books USING GIN(
  to_tsvector('simple',
    coalesce(title, '') || ' ' ||
    coalesce(subtitle, '') || ' ' ||
    coalesce(array_to_string(authors, ' '), '') || ' ' ||
    coalesce(array_to_string(categories, ' '), '')
  )
);

-- ─── ROW LEVEL SECURITY ───
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "public_read_books" ON books FOR SELECT USING (true);
CREATE POLICY "public_read_summaries" ON summaries FOR SELECT USING (true);
CREATE POLICY "public_read_categories" ON categories FOR SELECT USING (true);

-- Users manage own data
CREATE POLICY "users_own_swipes" ON swipes FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "users_own_bookmarks" ON bookmarks FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "users_read_self" ON users FOR SELECT USING (auth.uid()::text = auth_uid);
CREATE POLICY "users_update_self" ON users FOR UPDATE USING (auth.uid()::text = auth_uid);

-- ============================================
-- DONE! Your Taban database is ready.
-- ============================================
