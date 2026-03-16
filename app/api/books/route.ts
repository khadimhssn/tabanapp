import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get('page') || '0');
  const limit = parseInt(searchParams.get('limit') || '24');
  const category = searchParams.get('category');
  const sort = searchParams.get('sort') || 'rating';

  let query = supabase
    .from('books')
    .select('*', { count: 'exact' })
    .range(page * limit, (page + 1) * limit - 1);

  if (category) {
    query = query.contains('categories', [category]);
  }

  if (sort === 'rating') {
    query = query.order('avg_rating', { ascending: false, nullsFirst: false });
  } else if (sort === 'newest') {
    query = query.order('created_at', { ascending: false });
  } else if (sort === 'title') {
    query = query.order('title');
  }

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    books: data,
    total: count,
    page,
    hasMore: (data?.length || 0) === limit,
  });
}
