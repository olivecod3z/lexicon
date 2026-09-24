import type { Metadata } from 'next';
import './globals.css';
import './landing-sections.css';
import './step-animation.css';
import './hero-dashboard.css';
export const metadata: Metadata = { title: 'Lexicon — Make it make sense.', description: 'Turn lecture PDFs into clear notes, flashcards, and quizzes. Less overwhelm. More understanding.', icons: { icon: '/favicon.svg' } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><head><link rel="preload" href="/fonts/dm-sans-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" /><link rel="preload" href="/fonts/manrope-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" /><link rel="preload" href="/images/study-landscape.webp" as="image" media="(min-width: 601px)" fetchPriority="high" /><link rel="preload" href="/images/study-landscape-mobile.webp" as="image" media="(max-width: 600px)" fetchPriority="high" /></head><body>{children}</body></html>; }
