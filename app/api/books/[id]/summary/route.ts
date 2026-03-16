import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get('lang') || 'en';
  const bookId = params.id;

  // 1. Try to get summary in requested language
  const { data: summary } = await supabase
    .from('summaries')
    .select('*')
    .eq('book_id', bookId)
    .eq('lang', lang)
    .single();

  if (summary) {
    return NextResponse.json(summary);
  }

  // 2. Fallback to English
  const { data: enSummary } = await supabase
    .from('summaries')
    .select('*')
    .eq('book_id', bookId)
    .eq('lang', 'en')
    .single();

  if (enSummary) {
    // Queue on-demand translation
    // In production, this would trigger a translation job
    // For now, return English with a flag
    return NextResponse.json({
      ...enSummary,
      _fallback: true,
      _requested_lang: lang,
      _message: `Summary not yet available in ${lang}. Showing English version.`,
    });
  }

  // 3. No summary at all
  return NextResponse.json(
    { error: 'No summary available for this book yet', book_id: bookId },
    { status: 404 }
  );
}
