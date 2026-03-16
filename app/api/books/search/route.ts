import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';

export async function GET(request: NextRequest) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();

  if (!q) {
    return NextResponse.json({ books: [], source: 'empty' });
  }

  // 1. Search local database first
  const { data: localResults } = await supabase
    .from('books')
    .select('*')
    .or(`title.ilike.%${q}%,authors.cs.{${q}},isbn_13.eq.${q}`)
    .order('avg_rating', { ascending: false, nullsFirst: false })
    .limit(20);

  if (localResults && localResults.length > 0) {
    return NextResponse.json({ books: localResults, source: 'database' });
  }

  // 2. Not in DB — fetch from Google Books API on-demand
  try {
    const googleUrl = new URL(GOOGLE_BOOKS_API);
    googleUrl.searchParams.set('q', q);
    googleUrl.searchParams.set('maxResults', '20');
    googleUrl.searchParams.set('orderBy', 'relevance');
    if (process.env.GOOGLE_BOOKS_API_KEY) {
      googleUrl.searchParams.set('key', process.env.GOOGLE_BOOKS_API_KEY);
    }

    const res = await fetch(googleUrl.toString());
    const data = await res.json();

    if (!data.items || data.items.length === 0) {
      return NextResponse.json({ books: [], source: 'not_found' });
    }

    // 3. Map and insert into database
    const books = data.items.map((item: any) => {
      const v = item.volumeInfo;
      const isbn13 = v.industryIdentifiers?.find((i: any) => i.type === 'ISBN_13')?.identifier;
      const coverUrl = v.imageLinks?.large
        || v.imageLinks?.medium
        || v.imageLinks?.thumbnail
        || null;

      return {
        title: v.title || 'Unknown',
        subtitle: v.subtitle || null,
        authors: v.authors || [],
        description: v.description || null,
        categories: v.categories || [],
        isbn_13: isbn13 || null,
        isbn_10: v.industryIdentifiers?.find((i: any) => i.type === 'ISBN_10')?.identifier || null,
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

    // Bulk upsert (skip duplicates)
    const { data: inserted } = await supabase
      .from('books')
      .upsert(
        books.filter((b: any) => b.isbn_13), // Only insert books with ISBN
        { onConflict: 'isbn_13', ignoreDuplicates: true }
      )
      .select();

    // Also insert books without ISBN using google_books_id
    const noIsbn = books.filter((b: any) => !b.isbn_13);
    if (noIsbn.length > 0) {
      await supabase.from('books').insert(noIsbn).select();
    }

    // Re-query to get all results with IDs
    const { data: finalResults } = await supabase
      .from('books')
      .select('*')
      .or(`title.ilike.%${q}%,authors.cs.{${q}}`)
      .order('avg_rating', { ascending: false, nullsFirst: false })
      .limit(20);

    // Queue top result for summary generation
    if (finalResults && finalResults.length > 0) {
      await supabase.from('summary_queue').upsert({
        book_id: finalResults[0].id,
        priority: 100,
        status: 'pending',
      }, { onConflict: 'book_id' }).select();
    }

    return NextResponse.json({
      books: finalResults || books,
      source: 'fetched_live',
      count: finalResults?.length || books.length,
    });

  } catch (err: any) {
    console.error('On-demand fetch error:', err);
    return NextResponse.json({ books: [], source: 'error', error: err.message }, { status: 500 });
  }
}
