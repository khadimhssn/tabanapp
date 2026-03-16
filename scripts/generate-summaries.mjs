// ============================================
// scripts/generate-summaries.mjs
// Run: node scripts/generate-summaries.mjs
// ============================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = 'claude-sonnet-4-20250514';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ─── LANGUAGE CONFIG ───

const LANGUAGES = {
  fa: { name: 'Dari/Farsi', notes: 'Use Dari vocabulary where it differs from Iranian Farsi (e.g., پوهنتون not دانشگاه). Write in Persian script.' },
  ps: { name: 'Pashto', notes: 'Use standard Pashto. Write in Pashto script. Use Pashto vocabulary distinct from Dari.' },
  ur: { name: 'Urdu', notes: 'Use standard Pakistani Urdu with Nastaliq-style conventions. Write in Urdu script.' },
  ar: { name: 'Arabic', notes: 'Use Modern Standard Arabic (فصحى). Avoid regional dialect. Write in Arabic script.' },
  hi: { name: 'Hindi', notes: 'Use शुद्ध Hindi with Devanagari script. Avoid excessive English loanwords.' },
};


// ─── CLAUDE API CALL ───

async function callClaude(system, userMessage, maxTokens = 4000) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.content[0].text;
}

function parseJSON(text) {
  const cleaned = text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
  return JSON.parse(cleaned);
}


// ─── STEP 1: GENERATE ENGLISH SUMMARY ───

const SUMMARY_SYSTEM = `You are Taban, an expert literary analyst. Generate a comprehensive book summary.

OUTPUT: Return ONLY valid JSON (no markdown, no backticks):
{
  "hook": "One compelling sentence (max 20 words)",
  "overview": "3-4 paragraph overview (400-500 words total)",
  "key_takeaways": [
    { "number": 1, "title": "Short title (3-6 words)", "body": "2-3 sentence explanation" },
    ... (exactly 12 takeaways)
  ],
  "who_should_read": "2-3 sentences describing the ideal reader",
  "topics": ["topic1", "topic2", "topic3"],
  "mood": "inspiring|thought-provoking|emotional|practical|entertaining|dark|uplifting"
}

RULES:
- Exactly 12 key takeaways, each self-contained and insightful
- Paraphrase everything — never reproduce exact copyrighted text
- For fiction: themes, character arcs, cultural significance
- For non-fiction: actionable insights, core arguments, applications
- Each takeaway body: 2-3 sentences max
- Total reading time: ~10 minutes`;

async function generateEnglishSummary(book) {
  const userMsg = `Generate a summary for:

Title: ${book.title}${book.subtitle ? ` — ${book.subtitle}` : ''}
Author(s): ${book.authors?.join(', ') || 'Unknown'}
Description: ${book.description || 'No description available'}
Categories: ${book.categories?.join(', ') || 'General'}
Page Count: ${book.page_count || 'Unknown'}
Published: ${book.published_date || 'Unknown'}

Return ONLY the JSON object.`;

  const text = await callClaude(SUMMARY_SYSTEM, userMsg, 4000);
  return parseJSON(text);
}


// ─── STEP 2: TRANSLATE TO TARGET LANGUAGE ───

async function translateSummary(englishSummary, langCode, bookTitle) {
  const lang = LANGUAGES[langCode];
  if (!lang) throw new Error(`Unknown language: ${langCode}`);

  const system = `You are a professional literary translator specializing in ${lang.name}.

TASK: Translate the English book summary into ${lang.name}.

RULES:
- ${lang.notes}
- Translate ALL text: hook, overview, all 12 takeaways, who_should_read, topics
- Keep the exact same JSON structure — only translate string values
- This must read naturally, not like machine translation
- Book title should be transliterated/translated appropriately
- Do NOT translate JSON keys
- Numbers stay as-is
- Return ONLY valid JSON (no markdown, no backticks)`;

  const userMsg = `Book: "${bookTitle}"
Target: ${lang.name}

Translate this summary:
${JSON.stringify(englishSummary, null, 2)}

Return ONLY the translated JSON.`;

  const text = await callClaude(system, userMsg, 6000);
  return parseJSON(text);
}


// ─── STORE SUMMARY ───

async function storeSummary(bookId, lang, summaryData) {
  const { data, error } = await supabase
    .from('summaries')
    .upsert({
      book_id: bookId,
      lang: lang,
      hook: summaryData.hook,
      overview: summaryData.overview,
      key_takeaways: summaryData.key_takeaways,
      who_should_read: summaryData.who_should_read,
      topics: summaryData.topics || [],
      mood: summaryData.mood || null,
      ai_model: MODEL,
      status: 'published',
    }, { onConflict: 'book_id,lang' })
    .select()
    .single();

  if (error) throw new Error(`DB error: ${error.message}`);
  return data;
}


// ─── PROCESS ONE BOOK ───

async function processBook(book) {
  console.log(`\n📖 Processing: "${book.title}"`);
  console.log(`   Authors: ${book.authors?.join(', ')}`);

  // Step 1: Generate English summary
  console.log('   📝 Generating English summary...');
  let englishSummary;
  try {
    englishSummary = await generateEnglishSummary(book);
    await storeSummary(book.id, 'en', englishSummary);
    console.log('   ✅ English summary stored');
  } catch (err) {
    console.error(`   ❌ English summary failed: ${err.message}`);
    return false;
  }

  await sleep(2000); // Rate limit

  // Step 2: Translate to all target languages
  for (const langCode of Object.keys(LANGUAGES)) {
    try {
      console.log(`   🌐 Translating to ${LANGUAGES[langCode].name}...`);
      const translated = await translateSummary(englishSummary, langCode, book.title);
      await storeSummary(book.id, langCode, translated);
      console.log(`   ✅ ${LANGUAGES[langCode].name} stored`);
      await sleep(2000);
    } catch (err) {
      console.error(`   ❌ ${LANGUAGES[langCode].name} failed: ${err.message}`);
      // Continue with other languages
    }
  }

  // Update book status
  await supabase
    .from('books')
    .update({ status: 'summarized' })
    .eq('id', book.id);

  return true;
}


// ─── MAIN ───

async function main() {
  const batchSize = parseInt(process.argv[2] || '10');
  
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   TABAN.APP — Summary Generation         ║');
  console.log(`║   Batch size: ${String(batchSize).padEnd(27)}║`);
  console.log('╚══════════════════════════════════════════╝');

  // Get books that need summaries (highest rated first)
  const { data: books } = await supabase
    .from('books')
    .select('*')
    .eq('status', 'metadata_ready')
    .not('description', 'is', null) // Need description to generate good summary
    .order('avg_rating', { ascending: false, nullsFirst: false })
    .order('rating_count', { ascending: false })
    .limit(batchSize);

  if (!books || books.length === 0) {
    console.log('\n⚠️  No books pending summary generation.');
    console.log('   Run the ingestion script first: node scripts/ingest.mjs');
    return;
  }

  console.log(`\n📋 Found ${books.length} books to process\n`);

  let success = 0;
  let failed = 0;

  for (const book of books) {
    try {
      const ok = await processBook(book);
      if (ok) success++;
      else failed++;
    } catch (err) {
      console.error(`\n❌ Fatal error for "${book.title}": ${err.message}`);
      failed++;
    }
  }

  console.log('\n╔══════════════════════════════════════════╗');
  console.log(`║  ✅ BATCH COMPLETE                        ║`);
  console.log(`║  📊 Success: ${String(success).padEnd(28)}║`);
  console.log(`║  ❌ Failed: ${String(failed).padEnd(29)}║`);
  console.log(`║  📚 Summaries: ${String(success * 6).padEnd(26)}║`);
  console.log(`║     (${success} books × 6 languages)${' '.repeat(14)}║`);
  console.log('╚══════════════════════════════════════════╝');
}

main().catch(console.error);
