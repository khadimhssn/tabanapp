// ============================================
// scripts/ingest.mjs — Universal Book Fetcher
// Run: node scripts/ingest.mjs
// ============================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GOOGLE_API_KEY = process.env.GOOGLE_BOOKS_API_KEY;
const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ─── ALL CATEGORIES TO CRAWL ───
const CATEGORIES = [
  'fiction', 'science fiction', 'fantasy', 'mystery', 'thriller',
  'romance', 'horror', 'historical fiction', 'adventure',
  'biography', 'autobiography', 'history', 'science', 'technology',
  'business', 'economics', 'self-help', 'psychology', 'philosophy',
  'religion', 'spirituality', 'politics', 'education', 'health',
  'cooking', 'travel', 'art', 'music', 'poetry',
  'mathematics', 'engineering', 'medicine', 'law',
  'afghan literature', 'persian literature', 'arabic literature',
  'urdu literature', 'hindi literature', 'islamic studies',
  'young adult', 'children', 'graphic novels',
];

const POPULAR_SEARCHES = [
  'bestseller 2025', 'bestseller 2024', 'bestseller 2023',
  'most read books', 'classic literature', 'award winning novels',
  'pulitzer prize', 'booker prize', 'nobel literature',
  'new york times bestseller',
  'Khaled Hosseini', 'Rumi poetry', 'Paulo Coelho', 'Yuval Harari',
  'Malcolm Gladwell', 'James Clear', 'Robert Greene', 'Dale Carnegie',
  'Atomic Habits', 'Thinking Fast and Slow', 'Sapiens',
  'Rich Dad Poor Dad', '48 Laws of Power', 'The Alchemist',
  'Harry Potter', 'Lord of the Rings', '1984 Orwell',
  'Stephen King', 'Agatha Christie', 'Dan Brown',
  'startup business', 'artificial intelligence', 'machine learning',
  'meditation mindfulness', 'stoic philosophy',
];


// ─── GOOGLE BOOKS FETCHER ───

async function fetchGoogleBooks(query, startIndex = 0, maxResults = 40) {
  const url = new URL(GOOGLE_BOOKS_API);
  url.searchParams.set('q', query);
  url.searchParams.set('startIndex', String(startIndex));
  url.searchParams.set('maxResults', String(maxResults));
  url.searchParams.set('orderBy', 'relevance');
  url.searchParams.set('printType', 'books');
  if (GOOGLE_API_KEY) url.searchParams.set('key', GOOGLE_API_KEY);

  const res = await fetch(url.toString());
  if (!res.ok) {
    console.error(`  Google API error: ${res.status}`);
    return [];
  }

  const data = await res.json();
  if (!data.items) return [];

  return data.items.map(item => {
    const v = item.volumeInfo;
    const isbn13 = v.industryIdentifiers?.find(i => i.type === 'ISBN_13')?.identifier;
    const isbn10 = v.industryIdentifiers?.find(i => i.type === 'ISBN_10')?.identifier;
    const coverUrl = v.imageLinks?.large
      || v.imageLinks?.medium
      || v.imageLinks?.thumbnail
      || v.imageLinks?.smallThumbnail
      || null;

    return {
      title: v.title || 'Unknown',
      subtitle: v.subtitle || null,
      authors: v.authors || [],
      description: v.description || null,
      categories: v.categories || [],
      isbn_13: isbn13 || null,
      isbn_10: isbn10 || null,
      page_count: v.pageCount || null,
      published_date: v.publishedDate || null,
      publisher: v.publisher || null,
      language_original: v.language || 'en',
      cover_url_original: coverUrl ? coverUrl.replace('http:', 'https:') : null,
      avg_rating: v.averageRating || null,
      rating_count: v.ratingsCount || 0,
      google_books_id: item.id,
      sources: ['google_books'],
      status: 'metadata_ready',
    };
  });
}


// ─── OPEN LIBRARY FETCHER ───

async function fetchOpenLibrary(query, limit = 100) {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) return [];

  const data = await res.json();
  return (data.docs || []).map(doc => ({
    title: doc.title || 'Unknown',
    authors: doc.author_name || [],
    isbn_13: doc.isbn?.find(i => i.length === 13) || null,
    isbn_10: doc.isbn?.find(i => i.length === 10) || null,
    cover_url_original: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
      : null,
    published_date: doc.first_publish_year?.toString() || null,
    categories: doc.subject?.slice(0, 10) || [],
    publisher: doc.publisher?.[0] || null,
    language_original: doc.language?.[0] || 'en',
    page_count: doc.number_of_pages_median || null,
    avg_rating: doc.ratings_average || null,
    rating_count: doc.ratings_count || 0,
    open_library_key: doc.key || null,
    sources: ['open_library'],
    status: 'metadata_ready',
  }));
}


// ─── BULK UPSERT ───

async function bulkUpsert(books) {
  // Split into books with ISBN and without
  const withIsbn = books.filter(b => b.isbn_13);
  const withoutIsbn = books.filter(b => !b.isbn_13);

  let insertedCount = 0;

  // Upsert books with ISBN (deduplicate by ISBN)
  if (withIsbn.length > 0) {
    const { data, error } = await supabase
      .from('books')
      .upsert(withIsbn, { onConflict: 'isbn_13', ignoreDuplicates: true })
      .select('id');

    if (error) {
      console.error(`  Upsert error (ISBN): ${error.message}`);
    } else {
      insertedCount += data?.length || 0;
    }
  }

  // Insert books without ISBN (may create duplicates — acceptable for now)
  if (withoutIsbn.length > 0) {
    // Check for existing titles to avoid duplicates
    for (const book of withoutIsbn.slice(0, 20)) { // Limit to avoid too many inserts
      const { data: existing } = await supabase
        .from('books')
        .select('id')
        .eq('title', book.title)
        .limit(1);

      if (!existing || existing.length === 0) {
        const { error } = await supabase.from('books').insert(book);
        if (!error) insertedCount++;
      }
    }
  }

  return insertedCount;
}


// ─── MAIN ORCHESTRATOR ───

async function runIngestion() {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   TABAN.APP — Universal Book Ingestion   ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');

  let totalIngested = 0;
  const startTime = Date.now();

  // ─── PHASE 1: Google Books by Category ───
  console.log('━━━ PHASE 1: Google Books — Categories ━━━\n');

  for (const category of CATEGORIES) {
    console.log(`📚 Category: "${category}"`);

    for (let page = 0; page < 5; page++) { // 5 pages × 40 = 200 per category
      const startIndex = page * 40;
      const books = await fetchGoogleBooks(`subject:${category}`, startIndex, 40);

      if (books.length === 0) {
        console.log(`   Page ${page + 1}: no more results`);
        break;
      }

      const inserted = await bulkUpsert(books);
      totalIngested += inserted;
      console.log(`   Page ${page + 1}: fetched ${books.length} → inserted ${inserted}`);

      await sleep(1200); // Rate limit
    }

    await sleep(500);
  }

  // ─── PHASE 2: Google Books by Popular Searches ───
  console.log('\n━━━ PHASE 2: Google Books — Popular Searches ━━━\n');

  for (const query of POPULAR_SEARCHES) {
    console.log(`🔍 Search: "${query}"`);
    const books = await fetchGoogleBooks(query, 0, 40);

    if (books.length > 0) {
      const inserted = await bulkUpsert(books);
      totalIngested += inserted;
      console.log(`   Fetched ${books.length} → inserted ${inserted}`);
    } else {
      console.log(`   No results`);
    }

    await sleep(1200);
  }

  // ─── PHASE 3: Open Library ───
  console.log('\n━━━ PHASE 3: Open Library ━━━\n');

  const OL_QUERIES = [
    'bestseller', 'classic literature', 'science fiction',
    'self help', 'business', 'psychology', 'philosophy',
    'biography', 'history', 'poetry', 'persian', 'arabic',
    'thriller', 'romance', 'technology', 'health',
    'children books', 'young adult', 'fantasy',
    'cooking', 'travel', 'art', 'music',
  ];

  for (const query of OL_QUERIES) {
    console.log(`📖 OL Search: "${query}"`);
    const books = await fetchOpenLibrary(query, 100);

    if (books.length > 0) {
      const inserted = await bulkUpsert(books);
      totalIngested += inserted;
      console.log(`   Fetched ${books.length} → inserted ${inserted}`);
    }

    await sleep(1500);
  }

  // ─── DONE ───
  const duration = Math.round((Date.now() - startTime) / 1000);
  console.log('\n╔══════════════════════════════════════════╗');
  console.log(`║  ✅ INGESTION COMPLETE                    ║`);
  console.log(`║  📊 Total ingested: ${String(totalIngested).padEnd(20)}║`);
  console.log(`║  ⏱️  Duration: ${String(duration + 's').padEnd(25)}║`);
  console.log('╚══════════════════════════════════════════╝');

  // Print DB stats
  const { count } = await supabase
    .from('books')
    .select('*', { count: 'exact', head: true });
  console.log(`\n📊 Total books in database: ${count}`);
}

runIngestion().catch(console.error);
