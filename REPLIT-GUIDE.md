# 🚀 TABAN.APP — Replit Step-by-Step Prompt Guide

## How to Use This Guide

You have a complete project folder (`taban-app/`) with all code files ready. 
This guide tells you exactly what to do in Replit, step by step.

**DO NOT paste the entire blueprint MD file into Replit's AI agent.**
Instead, follow these steps in order.

---

## STEP 0: Initial Setup (Manual — Do Before Opening Replit)

### 0A. Create Supabase Project
1. Go to https://supabase.com → New Project
2. Name: `taban-app`
3. Region: Choose closest to your users (e.g., Singapore or Frankfurt)
4. Save these values:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - `anon` public key
   - `service_role` secret key

### 0B. Get Google Books API Key
1. Go to https://console.cloud.google.com
2. Create a new project → Enable "Books API"
3. Create an API key under Credentials
4. Save the API key

### 0C. Get Anthropic API Key
1. Go to https://console.anthropic.com
2. Create an API key
3. Save it

---

## STEP 1: Create Replit Project

### Option A: Upload Files (Recommended)
1. Create a new Replit → Template: **Next.js**
2. Delete all default files
3. Upload the entire `taban-app/` folder contents
4. Or use Replit's Git import if you push to GitHub first

### Option B: Use Replit AI Agent
If you prefer the AI agent to build it, paste this as your FIRST prompt:

```
Create a Next.js 14 app called "Taban" (تابان) — an AI-powered book summary platform.

Tech stack:
- Next.js 14 with App Router
- Supabase (PostgreSQL + Auth + Storage)
- Tailwind CSS
- TypeScript

The app fetches ALL books from Google Books API and Open Library API, 
stores them in Supabase, then generates AI summaries using Claude API 
and translates them into 6 languages: English, Dari/Farsi, Pashto, 
Urdu, Arabic, Hindi.

Start by setting up the project structure with these files:
- package.json with dependencies: next, react, @supabase/supabase-js, framer-motion, lucide-react
- tailwind.config.js with custom colors (taban-navy: #0A1628, taban-gold: #D4A843, taban-cream: #FBF7F0)
- lib/languages.ts with full config for all 6 languages including RTL support
- lib/supabase.ts with typed client

Install and configure everything. Don't write any pages yet.
```

---

## STEP 2: Set Environment Variables

In Replit, go to **Secrets** (lock icon in sidebar) and add:

```
NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key
SUPABASE_SERVICE_ROLE_KEY = your-service-role-key
GOOGLE_BOOKS_API_KEY = your-google-api-key
ANTHROPIC_API_KEY = your-anthropic-api-key
```

---

## STEP 3: Create Database

Go to Supabase Dashboard → SQL Editor → paste and run the contents of:
`scripts/schema.sql`

This creates all tables: books, summaries, users, swipes, bookmarks, 
categories, queues. It also seeds 15 categories in all 6 languages.

**Verify:** Go to Table Editor — you should see all tables created 
with the categories table having 15 rows.

---

## STEP 4: Run Book Ingestion

In Replit Shell, run:

```bash
node scripts/ingest.mjs
```

This will:
- Fetch books from Google Books API (40+ categories × 5 pages each)
- Fetch books from Open Library (20+ queries)
- Deduplicate and store in Supabase
- Takes ~15-30 minutes
- Should give you 5,000-15,000 books

**If you want a quick test first**, edit the script to only do 2-3 categories 
and see if books appear in your Supabase dashboard.

**Troubleshooting:**
- "401 error" → Check your GOOGLE_BOOKS_API_KEY in Secrets
- "Supabase error" → Check your SUPABASE_SERVICE_ROLE_KEY
- Slow/rate limited → The script has built-in delays, just let it run

---

## STEP 5: Generate AI Summaries

After ingestion has some books, run:

```bash
node scripts/generate-summaries.mjs 5
```

The `5` means process 5 books. Each book gets:
- 1 English summary (source of truth)
- 5 translations (Dari, Pashto, Urdu, Arabic, Hindi)
= 6 summaries per book

**Cost estimate:** ~$0.18 per book (all 6 languages)
So 5 books ≈ $0.90 in Claude API costs.

Start small (5-10 books), verify quality, then scale up.

**To generate more later:**
```bash
node scripts/generate-summaries.mjs 50    # 50 books
node scripts/generate-summaries.mjs 100   # 100 books
```

---

## STEP 6: Verify Everything Works

1. **Check Supabase:** 
   - `books` table should have thousands of rows
   - `summaries` table should have rows (6 per processed book)
   - `categories` table should have 15 rows

2. **Start the app:**
   Click "Run" in Replit (or `npm run dev`)

3. **Test pages:**
   - `/` → Landing page with language selector
   - `/fa/discover` → Swipe discovery in Dari
   - `/en/books` → Book grid in English
   - `/fa/books/[id]` → Book detail with summary
   - `/ar/categories` → Categories in Arabic

---

## STEP 7: Improvements (Paste to Replit AI Agent One at a Time)

### 7A. Add Audio (TTS)
```
Add text-to-speech audio generation for book summaries. 
Use edge-tts (free, pip install edge-tts) with these voices:
- Dari/Farsi: fa-IR-DilaraNeural
- Urdu: ur-PK-UzmaNeural  
- Arabic: ar-SA-ZariyahNeural
- Hindi: hi-IN-SwaraNeural
- English: en-US-JennyNeural

Create a script at scripts/generate-tts.mjs that:
1. Reads summaries from Supabase that don't have audio_url
2. Converts summary text to speech using edge-tts CLI
3. Uploads MP3 to Supabase Storage bucket "book-audio"
4. Updates the summary row with the audio URL

Also add a persistent audio player bar at the bottom of the book detail page.
```

### 7B. Add Supabase Auth
```
Add Supabase Auth to the app:
1. Enable Google OAuth in Supabase Dashboard > Authentication > Providers
2. Create an AuthProvider component that wraps the app
3. Add sign-in button to the navigation (top right)
4. When user signs in, create/update their row in the users table
5. Store their preferred_language selection
6. Enable bookmark and swipe saving to database (currently just UI)
```

### 7C. Add PWA Support
```
Make this app a Progressive Web App:
1. Add a manifest.json with name "Taban", theme_color "#0A1628"
2. Add appropriate meta tags and icons
3. Add a service worker for offline caching of already-viewed summaries
4. Add install prompt on mobile
```

### 7D. Improve Search with On-Demand Fetch
```
Improve the search page at app/[lang]/search/page.tsx:
1. When user searches and no results found in local DB
2. Show "Searching global library..." loading state
3. Call /api/books/search which auto-fetches from Google Books API
4. Display newly fetched results
5. Show a "Request Summary" button on books that don't have summaries yet
6. When clicked, add to summary_queue with high priority
```

### 7E. Add Category Book Pages
```
Create a page at app/[lang]/categories/[slug]/page.tsx that:
1. Shows all books in the selected category
2. Uses the categories table for localized names
3. Matches books using the categories array column (contains filter)
4. Has pagination (load more button)
5. Shows book count at the top
```

### 7F. Dark Mode
```
Add dark mode toggle to the app:
1. Add a sun/moon toggle button in the navigation bar
2. Use Tailwind's dark: variant classes
3. Store preference in localStorage
4. Dark mode colors: bg-taban-navy (#0A1628) background, 
   taban-sand (#E8DDD0) text, taban-gold (#D4A843) accents
```

---

## STEP 8: Scaling Ingestion

Once the MVP is working, scale the book database:

### Run larger ingestion batches:
```bash
# Edit ingest.mjs to increase pages per category from 5 to 25
# This will fetch ~40,000+ books
node scripts/ingest.mjs
```

### Set up a cron job for continuous ingestion:
In Replit, you can use a scheduled deployment or add this to your app:
```
Add a Supabase Edge Function or a cron-like endpoint at /api/admin/cron 
that runs every 24 hours and:
1. Fetches new bestseller lists from Google Books API
2. Processes 20 books through the summary pipeline
3. Generates TTS for new summaries
This keeps the library growing automatically.
```

---

## STEP 9: Deploy

1. In Replit → Click **Deploy** button (top right)
2. Choose "Static + Server" deployment
3. Your app will be live at `your-repl-name.repl.co`
4. Later, connect custom domain `taban.app` in Replit Deployments settings

---

## Quick Reference: Project Structure

```
taban-app/
├── app/
│   ├── globals.css              ← Fonts + RTL + custom utilities
│   ├── layout.tsx               ← Root HTML layout
│   ├── page.tsx                 ← Landing page (language selector)
│   ├── [lang]/
│   │   ├── layout.tsx           ← Navigation + RTL provider
│   │   ├── discover/page.tsx    ← Swipe cards
│   │   ├── books/page.tsx       ← Book grid
│   │   ├── books/[id]/page.tsx  ← Book detail + summary reader
│   │   ├── categories/page.tsx  ← Category grid
│   │   ├── search/page.tsx      ← Search with on-demand fetch
│   │   └── library/page.tsx     ← User's saved books
│   └── api/
│       └── books/
│           ├── route.ts         ← List books API
│           ├── search/route.ts  ← Search + on-demand fetch
│           ├── discover/route.ts← Random books for swipe
│           └── [id]/summary/route.ts ← Get summary by language
├── lib/
│   ├── languages.ts             ← 6 language configs + UI strings
│   └── supabase.ts              ← DB client + TypeScript types
├── scripts/
│   ├── schema.sql               ← Run in Supabase SQL Editor
│   ├── ingest.mjs               ← Fetch books from APIs
│   └── generate-summaries.mjs   ← AI summaries + translations
├── .env.example                 ← Environment variables template
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── next.config.js
└── postcss.config.js
```

## API Keys Needed

| Service | URL | Free Tier |
|---------|-----|-----------|
| Supabase | supabase.com | 500MB DB, 1GB storage |
| Google Books | console.cloud.google.com | 1,000 req/day |
| Anthropic Claude | console.anthropic.com | Pay per use (~$0.03/summary) |

## Estimated Costs

| Scale | Books | Summaries | Claude API Cost | Monthly |
|-------|-------|-----------|-----------------|---------|
| MVP | 100 | 600 | ~$18 one-time | ~$25 (Supabase) |
| Launch | 1,000 | 6,000 | ~$180 one-time | ~$25 |
| Scale | 10,000 | 60,000 | ~$1,800 one-time | ~$50 |

---

*Built for Khadim Hussain Rasooli — Taban.app*
*March 2026*
