'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, Chart, Check, ChevronRight, FileText, Flame, Home, Layers, Search, Settings, Sun, Upload, Zap, MousePointer2, Pause, Play } from './icons';

export default function HeroDashboard() {
  const [phase, setPhase] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ left: 0, top: 0 });
  const [reduced, setReduced] = useState(true);
  const preview = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update(); media.addEventListener('change', update);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .25 });
    if (preview.current) observer.observe(preview.current);
    return () => { media.removeEventListener('change', update); observer.disconnect(); };
  }, []);
  useEffect(() => {
    if (paused || !visible || reduced) return;
    const timer = window.setTimeout(() => setPhase(value => (value + 1) % 6), [1100, 700, 1400, 650, 1700, 1300][phase]);
    return () => window.clearTimeout(timer);
  }, [phase, paused, visible, reduced]);
  useEffect(() => {
    const container = preview.current;
    if (!container || reduced) return;
    const measure = () => {
      const target = container.querySelector<HTMLElement>(phase >= 2 && phase <= 4 ? '[data-demo-answer]' : '.dash-primary');
      if (!target) return;
      let left = target.offsetWidth * .77;
      let top = target.offsetHeight * .6;
      let element: HTMLElement | null = target;
      while (element && element !== container) {
        left += element.offsetLeft;
        top += element.offsetTop;
        element = element.offsetParent as HTMLElement | null;
      }
      setCursorPosition({ left, top });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [phase, reduced]);
  const showingQuiz = phase >= 2 && phase <= 4 && !reduced;
  return <div ref={preview} className={`dashboard-peek refined-dashboard dash-demo phase-${reduced ? 0 : phase} ${paused ? 'demo-paused' : ''}`} aria-label="Autoplay sample dashboard: a student opens a practice question, selects the correct answer, and sees their progress update">
    <aside className="dash-sidebar">
      <span className="dash-brand"><span><Layers size={17} /></span>lexicon.</span>
      <div className="dash-workspace"><span className="dash-avatar">Jo</span><div>Your workspace<small>Personal account</small></div><ChevronRight size={12} /></div>
      <span className="dash-label">Workspace</span>
      <div className="dash-navigation">
        <span className="is-current"><Home size={15} />Overview<span className="dash-active-dot" /></span>
        <span><BookOpen size={15} />My courses<span className="dash-count">4</span></span>
        <span><Layers size={15} />Study packs<span className="dash-count">12</span></span>
        <span><Zap size={15} />Practice quizzes</span>
        <span><Chart size={15} />My progress</span>
      </div>
      <div className="dash-sidebar-note"><strong>Small steps add up.</strong><p>Make a little room for learning today.</p></div>
      <span className="dash-settings"><Settings size={14} /> Settings</span>
    </aside>
    <div className="dash-body">
      <div className="dash-toolbar"><span>Workspace <ChevronRight size={11} /><strong>Overview</strong></span><span className="dash-sample">{reduced ? 'Sample workspace' : 'Autoplay demo'}</span>{!reduced && <button className="dash-demo-toggle" onClick={() => setPaused(!paused)} aria-label={paused ? 'Play dashboard demo' : 'Pause dashboard demo'} aria-pressed={paused}>{paused ? <Play size={12} /> : <Pause size={12} />}</button>}<span className="dash-search" aria-label="Search icon in illustrative preview"><Search size={15} /></span></div>
      <div className="dash-content">
        <div className="dash-greeting"><div><span className="dash-day"><Sun size={12} /> A good day to learn</span><h2>A little progress, every day.</h2><p>Pick up where you left off. Your next lightbulb moment is waiting.</p></div><span className="dash-primary"><Zap size={13} />Quick practice</span></div>
        <div className="dash-metrics">
          <div><span className="dash-metric-icon"><BookOpen size={17} /></span><div><span>Active courses</span><strong>04 <small>This semester</small></strong></div></div>
          <div><span className="dash-metric-icon blue"><Layers size={17} /></span><div><span>Study packs</span><strong>12 <small>Ready to explore</small></strong></div></div>
          <div><span className="dash-metric-icon sand"><Flame size={17} /></span><div><span>Study streak</span><strong>7 <small>days in a row</small></strong></div></div>
        </div>
        <div className="dash-section-title"><h3>Continue studying</h3><span>Your learning, connected <ArrowUpRight size={12} /></span></div>
        <div className="dash-study-grid">
          <article className="dash-course-card">
            <div className="dash-course-top"><span className="dash-book"><BookOpen size={20} /></span><span>Psy 101 <span className="dash-separator">/</span> Chapter 04</span><span className="dash-in-progress">In progress</span></div>
            <h4>How memories are made</h4><p>Introduction to Psychology</p>
            <div className="dash-study-tags"><span><FileText size={11} />Notes</span><span><Layers size={11} />12 flashcards</span><span><Zap size={11} />Quiz</span></div>
            <div className="dash-course-progress"><span>{phase === 5 ? '9' : '8'} of 12 topics reviewed</span><strong>{phase === 5 ? '75%' : '67%'}</strong></div><div className="dash-progress-track"><span /></div>
            <span className="dash-continue">Continue learning <ArrowRight size={13} /></span>
          </article>
          <article className="dash-next-card"><span className="dash-next-label"> Your next step</span><h4>A little more practice.<br />A lot more clarity.</h4><p>Revisit spaced repetition to strengthen what you know.</p><span className="dash-topic"><Check size={12} /> Active recall <small>Looking good</small></span><span className="dash-topic-link">Review a topic <ArrowUpRight size={12} /></span></article>
        </div>
      </div>
      {showingQuiz && <div className="dash-demo-lesson" key="practice">
        <div className="demo-lesson-top"><span><Zap size={12} /> Quick practice</span><span>Psy 101 · 01 / 03</span></div>
        <h3>What helps a new idea stick?</h3><p>A little practice with the science of studying.</p>
        <div className="demo-answer"><span>A</span> Read your notes once</div>
        <div data-demo-answer className={`demo-answer ${phase >= 3 ? 'demo-answer-correct' : ''}`}><span>B</span> Recall it, then revisit it{phase >= 3 && <Check size={14} />}</div>
        <div className="demo-answer"><span>C</span> Highlight every sentence</div>
        {phase === 4 && <div className="demo-answer-feedback"><Check size={13} /><span>Exactly. Spaced practice builds lasting recall.</span></div>}
      </div>}
    </div>
    {!reduced && <span className="dash-auto-cursor" style={cursorPosition} aria-hidden="true"><MousePointer2 size={23} /><i /></span>}
    {phase === 5 && !reduced && <div className="dash-demo-toast"><Check size={14} /> One idea clearer. Progress saved.</div>}
  </div>;
}
