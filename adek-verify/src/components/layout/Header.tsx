'use client';

import { useLang } from '@/app/layout';
import Link from 'next/link';

export default function Header() {
  const { lang, setLang, t } = useLang();

  return (
    <header className="bg-adek-navy text-white shadow-lg">
      <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo / Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-adek-gold flex items-center justify-center font-bold text-adek-navy text-lg">
            AD
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">
              {t('نظام التحقق الذكي', 'ADEK-Verify')}
            </h1>
            <p className="text-xs text-adek-gold-light opacity-90">
              {t('ADEK-Verify | مجلس الحكماء', 'Smart Document Verification | Council of Wise Men')}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="px-3 py-1.5 text-sm rounded-md border border-white/20 hover:bg-white/10 transition-colors"
          >
            {lang === 'ar' ? 'EN' : 'عربي'}
          </button>

          {/* Settings Link */}
          <Link
            href="/settings"
            className="p-2 rounded-md hover:bg-white/10 transition-colors"
            title={t('الإعدادات', 'Settings')}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}
