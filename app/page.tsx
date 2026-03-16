'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SUPPORTED_LANGUAGES, LangCode, DEFAULT_LANG } from '@/lib/languages';
import { BookOpen, Headphones, Globe, Sparkles, ChevronRight } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [selectedLang, setSelectedLang] = useState<LangCode>(DEFAULT_LANG);

  function handleStart() {
    router.push(`/${selectedLang}/discover`);
  }

  return (
    <div className="min-h-screen bg-lapis-gradient pattern-overlay text-white">
      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-6 pt-16 pb-24">
        {/* Logo */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-7xl md:text-8xl font-display font-bold mb-2">
            <span className="text-gold-gradient">Taban</span>
          </h1>
          <p className="text-4xl font-dari text-amber-300/90 mb-4">تابان</p>
          <p className="text-xl text-white/70 max-w-lg mx-auto">
            Read any book in 10 minutes. AI-powered summaries in 6 languages.
          </p>
        </div>

        {/* Language Selector */}
        <div className="max-w-2xl mx-auto mb-16 animate-slide-up">
          <p className="text-center text-white/50 text-sm mb-4 uppercase tracking-wider">
            Choose your language
          </p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {(Object.values(SUPPORTED_LANGUAGES)).map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelectedLang(lang.code)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-300
                  ${selectedLang === lang.code
                    ? 'bg-amber-500/20 border-2 border-amber-400 scale-105 shadow-lg shadow-amber-500/20'
                    : 'bg-white/5 border-2 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                dir={lang.dir}
              >
                <span className="text-2xl">{lang.flag}</span>
                <span className="text-sm font-medium">{lang.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <div className="text-center mb-20">
          <button
            onClick={handleStart}
            className="group inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-amber-500 to-amber-600 
                       text-taban-navy font-bold text-lg rounded-full shadow-xl shadow-amber-500/30
                       hover:from-amber-400 hover:to-amber-500 hover:shadow-amber-500/50
                       transform hover:scale-105 transition-all duration-300"
          >
            <Sparkles className="w-5 h-5" />
            Start Reading
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {[
            {
              icon: BookOpen,
              title: 'Universal Library',
              desc: 'Every book from global databases — bestsellers, classics, and hidden gems',
            },
            {
              icon: Sparkles,
              title: 'AI Summaries',
              desc: '12 key takeaways per book, crafted by AI with literary precision',
            },
            {
              icon: Globe,
              title: '6 Languages',
              desc: 'فارسی • پښتو • اردو • العربية • हिन्दी • English',
            },
            {
              icon: Headphones,
              title: 'Audio Narration',
              desc: 'Listen to summaries in your language — perfect for commutes',
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="glass-card p-6 rounded-2xl text-center"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <feature.icon className="w-10 h-10 text-amber-400 mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-12 mt-16 text-center">
          {[
            { num: '50,000+', label: 'Books' },
            { num: '6', label: 'Languages' },
            { num: '10', label: 'Min Read' },
          ].map((stat, i) => (
            <div key={i}>
              <p className="text-3xl font-bold text-gold-gradient">{stat.num}</p>
              <p className="text-white/50 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-white/30 text-sm">
        <p>© 2026 Taban.app — Built with ❤️ for readers worldwide</p>
      </footer>
    </div>
  );
}
