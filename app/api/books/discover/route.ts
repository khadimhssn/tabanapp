import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');

  // Get random high-rated books with covers
  // Using a simple approach: order by random-ish (created_at + rating mix)
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .not('cover_url_original', 'is', null)
    .gte('avg_rating', 3.5)
    .order('rating_count', { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Shuffle results for variety
  const shuffled = (data || [])
    .sort(() => Math.random() - 0.5)
    .slice(0, limit);

  return NextResponse.json({ books: shuffled });
}
