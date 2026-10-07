'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import usePageVisible from './use-page-visible';
import HowItWorksCards from './how-it-works-cards';
import HeroDashboard from './hero-dashboard';
import Pricing from './pricing';
import StoryVideo from './story-video';
import FocusFeatures from './focus-features';
import { ArrowUpRight, ArrowRight, BookOpen, Layers, Check, ChevronDown, ChevronLeft, ChevronRight, Upload, FileText, X, Menu, RotateCw, CheckCircle2, Zap } from './icons';

const cards = [
  { question: 'What is active recall?', answer: 'Retrieving information from memory instead of simply rereading it. Test yourself, then check what you missed.' },
  { question: 'What is spaced repetition?', answer: 'Revisiting information at increasing intervals to help it stay in your long-term memory.' },
  { question: 'Why review your mistakes?', answer: 'Mistakes reveal gaps in understanding, so your next study session can focus on what needs attention.' },
];

export default function Home() {
  const pageVisible = usePageVisible();
  const [tab, setTab] = useState('Notes');
  const [previewReplay, setPreviewReplay] = useState(0);
  const toolkitStage = useRef<HTMLDivElement>(null);
  const [toolkitVisible, setToolkitVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(true);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setToolkitVisible(entry.isIntersecting);
    }, { threshold: 0.2 });
    if (toolkitStage.current) observer.observe(toolkitStage.current);
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => { observer.disconnect(); media.removeEventListener('change', update); };
  }, []);
  const [card, setCard] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [answer, setAnswer] = useState<number | null>(null);
  const [menu, setMenu] = useState(false);
  const noticeDialog = useRef<HTMLDialogElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape' && menu) { setMenu(false); menuButton.current?.focus(); } };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [menu]);
  const selectToolkit = (name: string) => {
    setTab(name);
    setCard(0);
    setFlipped(false);
    setAnswer(null);
    setPreviewReplay(value => value + 1);
  };
  const toolkitPlaying = toolkitVisible && pageVisible && !reduceMotion;
  useEffect(() => {
    if (!toolkitPlaying) return;
    const action = window.setTimeout(() => {
      if (tab === 'Flashcards') setFlipped(true);
      if (tab === 'Quiz') setAnswer(value => value ?? 1);
    }, 2400);
    const advance = window.setTimeout(() => {
      selectToolkit(tab === 'Notes' ? 'Flashcards' : tab === 'Flashcards' ? 'Quiz' : 'Notes');
    }, 6000);
    return () => { window.clearTimeout(action); window.clearTimeout(advance); };
  }, [tab, previewReplay, toolkitPlaying]);
  const moveCard = (direction: number) => { setCard((card + direction + cards.length) % cards.length); setFlipped(false); };

  return (
    <main id="main-content" tabIndex={-1}><a className="skip-link" href="#how-it-works">Skip to main content</a>
      <section className="landscape-hero" aria-labelledby="hero-title">
        <div className="landscape-background" aria-hidden="true" />
        <header className="landscape-header">
          <a className="wordmark" href="#" aria-label="Lexycon home">lexycon<span className="brand-dot">.</span></a>
          <nav id="landing-navigation" aria-label="Main navigation" className={menu ? 'nav open' : 'nav'}>
            <a href="#how-it-works" onClick={() => setMenu(false)}>How it works</a><a href="#features" onClick={() => setMenu(false)}>Features</a><a href="#demo" onClick={() => setMenu(false)}>Study demo</a><a href="#pricing" onClick={() => setMenu(false)}>Pricing</a><a href="#faq" onClick={() => setMenu(false)}>Questions</a>
          </nav>
          <Link className="button lime header-cta" href="/onboarding">Get started <ArrowUpRight size={14} /></Link>
          <button ref={menuButton} aria-controls="landing-navigation" className="menu-toggle" onClick={() => setMenu(!menu)} aria-label={menu ? 'Close menu' : 'Open menu'} aria-expanded={menu}>{menu ? <X /> : <Menu />}</button>
        </header>
        <div className="landscape-copy">
          <h1 id="hero-title">Turn your lecture pdfs into<br />{' '}notes, flashcards, and quizzes</h1>
          <p>Understand the big ideas, test what you know,<br className="desktop-break" /> and focus on what needs another look.</p>
          <div className="landscape-actions"><Link className="button lime" href="/onboarding">Get started <ArrowRight size={15} /></Link><a className="button charcoal" href="#how-it-works">See how it works</a></div>
        </div>
        <HeroDashboard />
        <div className="landscape-foreground" aria-hidden="true" />
      </section>


      <section id="how-it-works" className="section wrap" tabIndex={-1}>
        <div className="section-heading"><div><div className="eyebrow">How it works</div><h2>From “all this?”<br />to <span className="heading-continuation">“I’ve got this.”</span></h2></div><p>You bring the lecture. Lexycon helps you turn it into a study session with a clear next step.</p></div>
        <HowItWorksCards />
      </section>

      <StoryVideo />

      <section id="demo" className="toolkit-section wrap">
        <div className="toolkit-heading"><div><div className="eyebrow">Your study toolkit</div><h2>One lecture.<br />A whole new way to learn.</h2><a href="#study-panel" className="button lime">Explore the study pack <ArrowRight size={15} /></a></div><p>Turn a lecture into a connected study experience. Find the big ideas, make them stick, and see what needs another look—all in one place.</p></div>
        <div ref={toolkitStage} className={`toolkit-stage ${toolkitVisible ? 'toolkit-visible' : ''}`} data-preview={tab}>
          <div className="toolkit-ribbon" aria-hidden="true" />
          <div className="toolkit-window">
            <aside className="toolkit-sidebar" aria-label="Sample course information"><span className="toolkit-logo"><Layers size={19} /> lexycon.</span><span className="toolkit-sidebar-label">Your study space</span><span><BookOpen size={14} /> My courses</span><span className="toolkit-sidebar-current"><Layers size={14} /> Study pack</span><span><Zap size={14} /> My progress</span><div className="toolkit-course"><span>Psy 101</span><strong>The science<br />of studying</strong><small>Sample lecture · Chapter 01</small></div></aside>
            <div className="demo-card"><div className="demo-card-header"><span><span className="tiny-logo">l.</span> The science of studying</span><span className="sample-badge">Sample pack</span></div><div id="study-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="demo-content toolkit-panel" key={previewReplay} tabIndex={0}>
          {tab === 'Notes' && <><div className="note-meta"><span>Psychology</span><span>01 / Study notes</span></div><h3>Learn it. Then make it last.</h3><p>Understanding something today is a great start. Remembering it tomorrow takes a little practice.</p><h4><span>01</span> Active recall</h4><p>Close your notes and try to explain the idea from memory. Then check your answer and fill in the gaps.</p><div className="note-exercise"><span>Try this</span><p>After a lecture, write down three things you remember before you open your notes.</p></div><h4><span>02</span> Spaced repetition</h4><p>Return to an idea across several study sessions, giving yourself time between each review.</p><div className="note-footer"><CheckCircle2 size={15} /> A little structure goes a long way.</div></>}
          {tab === 'Flashcards' && <><div className="note-meta"><span>Active recall</span><span>{card + 1} / {cards.length} cards</span></div><button className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)} aria-label={`${flipped ? 'Answer' : 'Question'}: ${flipped ? cards[card].answer : cards[card].question}. Click to flip.`}><Layers size={25} /><span>{flipped ? cards[card].answer : cards[card].question}</span><small><RotateCw size={14} /> Click to {flipped ? 'see question' : 'reveal answer'}</small></button><div className="card-controls"><button onClick={() => moveCard(-1)} aria-label="Previous flashcard"><ChevronLeft size={20} /></button><span>{card + 1} of {cards.length}</span><button onClick={() => moveCard(1)} aria-label="Next flashcard"><ChevronRight size={20} /></button></div><p className="flashcard-tip">Try saying your answer out loud before flipping.</p></>}
          {tab === 'Quiz' && <><div className="note-meta"><span>Check your understanding</span><span>01 / 01</span></div><h3>Which is an example of active recall?</h3><div className="answers">{['Reading the same paragraph five times', 'Explaining a concept with your notes closed', 'Highlighting every important sentence'].map((option, index) => <button key={option} aria-label={`${String.fromCharCode(65 + index)} ${option}${answer !== null ? index === 1 ? ". Correct answer." : answer === index ? ". Your answer, incorrect." : "" : ""}`} disabled={answer !== null} onClick={() => setAnswer(index)} className={answer !== null && index === 1 ? 'correct' : answer === index ? 'incorrect' : ''}><span>{String.fromCharCode(65 + index)}</span>{option}{answer !== null && index === 1 && <Check size={18} />}</button>)}</div>{answer !== null ? <div className="quiz-feedback" role="status"><strong>{answer === 1 ? 'Correct. That’s your lightbulb moment.' : 'Not quite. The correct answer is B.'}</strong><p>Explaining from memory makes you retrieve the information. Rereading and highlighting don’t require that same recall.</p><button className="text-link" onClick={() => setAnswer(null)}>Try again <RotateCw size={14} /></button></div> : <p className="flashcard-tip">Choose an answer. This is a safe place to get it wrong.</p>}</>}
        </div></div>
          </div>
          <div className="toolkit-callout callout-notes"><span className="callout-symbol"><FileText size={17} /></span><div><strong>The big ideas, made clear.</strong><p>Structured notes from your material.</p><span>Read. Understand. Connect.</span></div></div>
          <div className="toolkit-callout callout-flashcards"><span className="callout-symbol"><Layers size={17} /></span><div><strong>A little memory workout.</strong><p>Flip a card. Find out what’s sticking.</p><span>Small steps. Stronger recall.</span></div></div>
          <div className="toolkit-callout callout-quiz"><span className="callout-symbol"><Zap size={17} /></span><div><strong>Your next step, a little clearer.</strong><p>Practice questions with useful feedback.</p><span>Test. Reflect. Try again.</span></div></div>
        </div>
        <div className="demo-tabs" role="tablist" aria-label="Study pack preview">{['Notes', 'Flashcards', 'Quiz'].map((name, index) => <button id={`tab-${name}`} role="tab" aria-selected={tab === name} aria-controls="study-panel" tabIndex={tab === name ? 0 : -1} onKeyDown={event => { if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const names = ['Notes', 'Flashcards', 'Quiz']; const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (index + (event.key === 'ArrowRight' ? 1 : 2)) % 3; selectToolkit(names[next]); document.getElementById(`tab-${names[next]}`)?.focus(); } }} className={tab === name ? 'active' : ''} key={name} onClick={() => selectToolkit(name)}>{tab === name && !reduceMotion && <i key={previewReplay} className="toolkit-tab-progress" style={{ animationPlayState: toolkitPlaying ? 'running' : 'paused' }} aria-hidden="true" />}{index === 0 ? <FileText size={19} /> : index === 1 ? <Layers size={19} /> : <Zap size={19} />}<span>{name}<small>{['Find the important stuff', 'Give your memory a little workout', 'See what’s sticking'][index]}</small></span><ArrowUpRight size={18} /></button>)}</div>
        <p className="toolkit-sample-note">Explore a sample study pack. No account needed.</p>
      </section>

      <FocusFeatures />

      <Pricing />

      <section id="faq" className="faq-section wrap"><div><div className="eyebrow">A little more clarity</div><h2>Good <span className="heading-continuation">questions.</span></h2><p>Every great study session starts with one.</p></div><div className="faq-list">{[
        ['What is Lexycon?', 'Lexycon turns your lecture materials into organized notes, flashcards, and quizzes, so you can study and revise in one place.'],
        ['Can I upload my own lectures yet?', 'Yes. Create an account, choose your free course, and upload a supported lecture file. Your study materials and generated resources are saved privately to your account.'],
        ['What file types will it support?', 'The browser library accepts pdf and utf-8 txt files up to 25 megabytes each, with a 100-megabyte local-library limit. Scanned pdfs can be viewed, but text extraction requires selectable text.'],
        ['How much will it cost?', 'The launch plans are Free at ₦0/month for 3 learning packs, Student at ₦3,000/month for 30 packs, and Pro at ₦7,000/month for 75 packs. Features marked as planned will be added when released. Subscriptions are not open yet; you can explore the sample without payment.'],
        ['Should I still check my lecture notes?', 'Yes. Automated-generated study material can contain mistakes. Use your original lecture notes and course guidance to check important details.'],
      ].map(([question, response]) => <details key={question}><summary>{question}<ChevronDown size={19} /></summary><p>{response}</p></details>)}</div></section>

      <section className="final-section wrap"><div className="eyebrow">Your next “aha” is waiting.</div><h2>Make room for<br /><span className="heading-continuation">a little understanding.</span></h2><p>Start with one idea. See where it takes you.</p><a href="#demo" className="button lime">Try the sample study pack <ArrowUpRight size={18} /></a></section>
      <footer className="wrap footer"><div><a className="wordmark" href="#">lexycon<span className="brand-dot">.</span></a><p>A little clearer, every day.</p></div><div className="footer-links"><a href="#how-it-works">How it works</a><a href="#features">The toolkit</a><a href="#pricing">Pricing</a><a href="#faq">Questions</a><button onClick={() => noticeDialog.current?.showModal()}>Project status <ArrowUpRight size={13} /></button></div><span className="copyright">© {new Date().getFullYear()} Lexycon</span></footer>
      <dialog ref={noticeDialog} aria-labelledby="notice-title" className="notice-modal"><h2 id="notice-title">A study space in the making.</h2><p>You can create a private account, upload lecture material, and generate notes, flashcards, and practice in the student dashboard. Payments and paid-plan upgrades are still being built.</p><form method="dialog"><button className="button lime">Got it <Check size={16} /></button></form></dialog>
    </main>
  );
}
