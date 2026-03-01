'use client';

import './globals.css';
import { Cairo } from 'next/font/google';
import { useState, useEffect, createContext, useContext } from 'react';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-cairo',
  display: 'swap',
});
import { loadSettings } from '@/lib/storage';

type Language = 'ar' | 'en';

interface LangContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: (ar: string, en: string) => string;
}

export const LangContext = createContext<LangContextType>({
  lang: 'ar',
  setLang: () => {},
  t: (ar) => ar,
});

export const useLang = () => useContext(LangContext);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [lang, setLang] = useState<Language>('ar');

  useEffect(() => {
    const settings = loadSettings();
    setLang(settings.language || 'ar');
  }, []);

  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={lang} dir={dir}>
      <head>
        <title>ADEK-Verify | نظام التحقق الذكي</title>
        <meta name="description" content="ADEK Smart Document Verification System" />
      </head>
      <body className={`${cairo.variable} min-h-screen bg-adek-bg font-cairo`}>
        <LangContext.Provider value={{ lang, setLang, t }}>
          {children}
        </LangContext.Provider>
      </body>
    </html>
  );
}
