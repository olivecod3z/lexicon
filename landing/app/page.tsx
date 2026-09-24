'use client';

import { useEffect, useRef, useState } from 'react';
import StepAnimation from './step-animation';
import HeroDashboard from './hero-dashboard';
import Pricing from './pricing';
import FocusFeatures from './focus-features';
import { ArrowUpRight, ArrowRight, BookOpen, Layers, Check, ChevronDown, ChevronLeft, ChevronRight, Upload, FileText, X, Menu, RotateCw, CheckCircle2, Zap, Pause, Play } from './icons';

const cards = [
  { question: 'What is active recall?', answer: 'Retrieving information from memory instead of simply rereading it. Test yourself, then check what you missed.' },
  { question: 'What is spaced repetition?', answer: 'Revisiting information at increasing intervals to help it stay in your long-term memory.' },
  { question: 'Why review your mistakes?', answer: 'Mistakes reveal gaps in understanding, so your next study session can focus on what needs attention.' },
];

export default function Home() {
  const [tab, setTab] = useState('Notes');
  const [previewReplay, setPreviewReplay] = useState(0);
  const toolkitStage = useRef<HTMLDivElement>(null);
  const [toolkitVisible, setToolkitVisible] = useState(false);
  const [toolkitPaused, setToolkitPaused] = useState(false);
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
  const [notice, setNotice] = useState(false);
  const selectToolkit = (name: string) => {
    setTab(name);
    setCard(0);
    setFlipped(false);
    setAnswer(null);
    setPreviewReplay(value => value + 1);
  };
  const toolkitPlaying = toolkitVisible && !toolkitPaused && !reduceMotion;
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
    <main>
      <section className="landscape-hero" aria-labelledby="hero-title">
        <div className="landscape-background" aria-hidden="true" />
        <header className="landscape-header">
          <a className="wordmark" href="#" aria-label="Lexicon home">lexicon<span className="brand-dot">.</span></a>
          <nav aria-label="Main navigation" className={menu ? 'nav open' : 'nav'}>
            <a href="#how-it-works" onClick={() => setMenu(false)}>How it works</a><a href="#features" onClick={() => setMenu(false)}>Features</a><a href="#demo" onClick={() => setMenu(false)}>Study demo</a><a href="#pricing" onClick={() => setMenu(false)}>Pricing</a><a href="#faq" onClick={() => setMenu(false)}>Questions</a>
          </nav>
          <a className="button lime header-cta" href="/dashboard/">Get started <ArrowUpRight size={14} /></a>
          <button className="menu-toggle" onClick={() => setMenu(!menu)} aria-label={menu ? 'Close menu' : 'Open menu'} aria-expanded={menu}>{menu ? <X /> : <Menu />}</button>
        </header>
        <div className="landscape-copy">
          <h1 id="hero-title">Turn your lecture PDFs into<br />{' '}notes, flashcards, and quizzes</h1>
          <p>Understand the big ideas, test what you know,<br className="desktop-break" /> and focus on what needs another look.</p>
          <div className="landscape-actions"><a className="button lime" href="/dashboard/">Open student dashboard <ArrowRight size={15} /></a><a className="button charcoal" href="#how-it-works">See how it works</a></div>
        </div>
        <HeroDashboard />
        <div className="landscape-foreground" aria-hidden="true" />
        <div className="landscape-caption"><span>A little clearer. A little more confident.</span><div><span><FileText size={17} /> Your notes.</span><span><Layers size={17} /> Your pace.</span><span><CheckCircle2 size={17} /> Your lightbulb moment.</span></div></div>
      </section>


      <section id="how-it-works" className="section wrap">
        <div className="section-heading"><div><div className="eyebrow">How it works</div><h2>From “all this?”<br />to <span className="heading-continuation">“I’ve got this.”</span></h2></div><p>You bring the lecture. Lexicon helps you turn it into a study session with a clear next step.</p></div>
        <div className="steps">
          <article><div className="step-number">01</div><h3>Start with what you have.</h3><p>Your lecture slides, course notes, that PDF you’ve been putting off. Give it a home in your course.</p><StepAnimation type="upload" /></article>
          <article><div className="step-number">02</div><h3>Meet your study pack.</h3><p>Get structured notes, bite-sized flashcards, and practice questions built around your material.</p><StepAnimation type="generate" /></article>
          <article><div className="step-number">03</div><h3>Find your next “aha.”</h3><p>Test what you know, spot what needs another look, and come back with a little more confidence.</p><StepAnimation type="improve" /></article>
        </div>
      </section>

      <section id="demo" className="toolkit-section wrap">
        <div className="toolkit-heading"><div><div className="eyebrow">Your study toolkit</div><h2>One lecture.<br />A whole new way to learn.</h2><a href="#study-panel" className="button lime">Explore the study pack <ArrowRight size={15} /></a></div><p>Turn a lecture into a connected study experience. Find the big ideas, make them stick, and see what needs another look—all in one place.</p></div>
        <div ref={toolkitStage} className={`toolkit-stage ${toolkitVisible ? 'toolkit-visible' : ''}`} data-preview={tab}>
          <div className="toolkit-ribbon" aria-hidden="true" />
          <div className="toolkit-window">
            <aside className="toolkit-sidebar" aria-label="Sample course information"><span className="toolkit-logo"><Layers size={19} /> lexicon.</span><span className="toolkit-sidebar-label">Your study space</span><span><BookOpen size={14} /> My courses</span><span className="toolkit-sidebar-current"><Layers size={14} /> Study pack</span><span><Zap size={14} /> My progress</span><div className="toolkit-course"><span>Psy 101</span><strong>The science<br />of studying</strong><small>Sample lecture · Chapter 01</small></div></aside>
            <div className="demo-card"><div className="demo-card-header"><span><span className="tiny-logo">l.</span> The science of studying</span><span className="sample-badge">Sample pack</span></div><div id="study-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="demo-content toolkit-panel" key={previewReplay} tabIndex={0}>
          {tab === 'Notes' && <><div className="note-meta"><span>Psychology</span><span>01 / Study notes</span></div><h3>Learn it. Then make it last.</h3><p>Understanding something today is a great start. Remembering it tomorrow takes a little practice.</p><h4><span>01</span> Active recall</h4><p>Close your notes and try to explain the idea from memory. Then check your answer and fill in the gaps.</p><div className="note-exercise"><span>Try this</span><p>After a lecture, write down three things you remember before you open your notes.</p></div><h4><span>02</span> Spaced repetition</h4><p>Return to an idea across several study sessions, giving yourself time between each review.</p><div className="note-footer"><CheckCircle2 size={15} /> A little structure goes a long way.</div></>}
          {tab === 'Flashcards' && <><div className="note-meta"><span>Active recall</span><span>{card + 1} / {cards.length} cards</span></div><button className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)} aria-label={`${flipped ? 'Answer' : 'Question'}: ${flipped ? cards[card].answer : cards[card].question}. Click to flip.`}><Layers size={25} /><span>{flipped ? cards[card].answer : cards[card].question}</span><small><RotateCw size={14} /> Click to {flipped ? 'see question' : 'reveal answer'}</small></button><div className="card-controls"><button onClick={() => moveCard(-1)} aria-label="Previous flashcard"><ChevronLeft size={20} /></button><span>{card + 1} of {cards.length}</span><button onClick={() => moveCard(1)} aria-label="Next flashcard"><ChevronRight size={20} /></button></div><p className="flashcard-tip">Try saying your answer out loud before flipping.</p></>}
          {tab === 'Quiz' && <><div className="note-meta"><span>Check your understanding</span><span>01 / 01</span></div><h3>Which is an example of active recall?</h3><div className="answers">{['Reading the same paragraph five times', 'Explaining a concept with your notes closed', 'Highlighting every important sentence'].map((option, index) => <button key={option} disabled={answer !== null} onClick={() => setAnswer(index)} className={answer !== null && index === 1 ? 'correct' : answer === index ? 'incorrect' : ''}><span>{String.fromCharCode(65 + index)}</span>{option}{answer !== null && index === 1 && <Check size={18} />}</button>)}</div>{answer !== null ? <div className="quiz-feedback" role="status"><strong>{answer === 1 ? 'That’s your lightbulb moment.' : 'A useful gap to discover.'}</strong><p>Explaining from memory makes you retrieve the information. Rereading and highlighting don’t require that same recall.</p><button className="text-link" onClick={() => setAnswer(null)}>Try again <RotateCw size={14} /></button></div> : <p className="flashcard-tip">Choose an answer. This is a safe place to get it wrong.</p>}</>}
        </div></div>
          </div>
          <div className="toolkit-callout callout-notes"><span className="callout-symbol"><FileText size={17} /></span><div><strong>The big ideas, made clear.</strong><p>Structured notes from your material.</p><span>Read. Understand. Connect.</span></div></div>
          <div className="toolkit-callout callout-flashcards"><span className="callout-symbol"><Layers size={17} /></span><div><strong>A little memory workout.</strong><p>Flip a card. Find out what’s sticking.</p><span>Small steps. Stronger recall.</span></div></div>
          <div className="toolkit-callout callout-quiz"><span className="callout-symbol"><Zap size={17} /></span><div><strong>Your next step, a little clearer.</strong><p>Practice questions with useful feedback.</p><span>Test. Reflect. Try again.</span></div></div>
          <div className="toolkit-playback"><span>{tab === 'Notes' ? 'Find the key ideas' : tab === 'Flashcards' ? 'Recall, then reveal' : 'Practice and get feedback'}</span><button onClick={() => selectToolkit(tab)} aria-label="Replay current preview"><RotateCw size={14} /></button>{!reduceMotion && <button onClick={() => setToolkitPaused(value => !value)} aria-label={toolkitPaused ? 'Play toolkit preview' : 'Pause toolkit preview'}>{toolkitPaused ? <Play size={14} /> : <Pause size={14} />}</button>}</div>
        </div>
        <div className="demo-tabs" role="tablist" aria-label="Study pack preview">{['Notes', 'Flashcards', 'Quiz'].map((name, index) => <button id={`tab-${name}`} role="tab" aria-selected={tab === name} aria-controls="study-panel" tabIndex={tab === name ? 0 : -1} onKeyDown={event => { if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const names = ['Notes', 'Flashcards', 'Quiz']; const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (index + (event.key === 'ArrowRight' ? 1 : 2)) % 3; selectToolkit(names[next]); document.getElementById(`tab-${names[next]}`)?.focus(); } }} className={tab === name ? 'active' : ''} key={name} onClick={() => selectToolkit(name)}>{tab === name && !reduceMotion && <i key={previewReplay} className="toolkit-tab-progress" style={{ animationPlayState: toolkitPlaying ? 'running' : 'paused' }} aria-hidden="true" />}{index === 0 ? <FileText size={19} /> : index === 1 ? <Layers size={19} /> : <Zap size={19} />}<span>{name}<small>{['Find the important stuff', 'Give your memory a little workout', 'See what’s sticking'][index]}</small></span><ArrowUpRight size={18} /></button>)}</div>
        <p className="toolkit-sample-note">Explore a sample study pack. No account needed.</p>
      </section>

      <FocusFeatures />

      <Pricing />

      <section id="faq" className="faq-section wrap"><div><div className="eyebrow">A little more clarity</div><h2>Good <span className="heading-continuation">questions.</span></h2><p>Every great study session starts with one.</p></div><div className="faq-list">{[
        ['What is Lexicon?', 'Lexicon is a study platform being built to turn lecture PDFs into organized notes, flashcards, and quizzes, so you can study and revise in one place.'],
        ['Can I upload my own lectures yet?', 'This page includes a sample study pack you can explore now. Account creation, PDF uploads, and AI generation are not connected in this preview.'],
        ['What file types will it support?', 'The first release is focused on PDF lecture material. Upload size and document limits will be confirmed before launch.'],
        ['How much will it cost?', 'The launch plans are Free at ₦0/month for 3 learning packs, Student at ₦3,000/month for 30 packs, and Pro at ₦7,000/month for 75 packs. Features marked as planned will be added when released. Subscriptions are not open yet; you can explore the sample without payment.'],
        ['Should I still check my lecture notes?', 'Yes. AI-generated study material can contain mistakes. Use your original lecture notes and course guidance to check important details.'],
      ].map(([question, response]) => <details key={question}><summary>{question}<ChevronDown size={19} /></summary><p>{response}</p></details>)}</div></section>

      <section className="final-section wrap"><div className="eyebrow">Your next “aha” is waiting.</div><h2>Make room for<br /><span className="heading-continuation">a little understanding.</span></h2><p>Start with one idea. See where it takes you.</p><a href="#demo" className="button lime">Try the sample study pack <ArrowUpRight size={18} /></a></section>
      <footer className="wrap footer"><div><a className="wordmark" href="#">lexicon<span className="brand-dot">.</span></a><p>A little clearer, every day.</p></div><div className="footer-links"><a href="#how-it-works">How it works</a><a href="#features">The toolkit</a><a href="#pricing">Pricing</a><a href="#faq">Questions</a><button onClick={() => setNotice(true)}>Project status <ArrowUpRight size={13} /></button></div><span className="copyright">© {new Date().getFullYear()} Lexicon</span></footer>
      {notice && <div className="modal-backdrop" onClick={() => setNotice(false)}><div role="dialog" aria-modal="true" aria-labelledby="notice-title" className="notice-modal"><h3 id="notice-title">A study space in the making.</h3><p>This is the Lexicon landing page preview. You can explore the sample notes, flashcards, and quiz. The full study platform is still being built.</p><button autoFocus className="button lime" onClick={() => setNotice(false)} onKeyDown={e => { if (e.key === 'Escape') setNotice(false); if (e.key === 'Tab') e.preventDefault(); }}>Got it <Check size={16} /></button></div></div>}
    </main>
  );
}
