'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUp, BookOpen, Check, FileText, Layers, MousePointer2, Pause, Play, Zap } from './icons';

type Step = 'upload' | 'generate' | 'improve';
const descriptions = {
  upload: 'A lecture PDF drops into an upload tray and receives a confirmation check.',
  generate: 'A lecture is transformed into notes, flashcards, and a quiz.',
  improve: 'A practice answer is checked, then learning progress grows.',
};

export default function StepAnimation({ type }: { type: Step }) {
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(true);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.15 });
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  return <div ref={container} className={`step-motion motion-${type} ${paused || !visible ? 'motion-paused' : ''}`}>
    <div className="motion-scene" role="img" aria-label={descriptions[type]}>
      {type === 'upload' && <>
        <div className="motion-halo" />
        <div className="upload-tray"><div className="tray-arrow"><ArrowUp size={19} /></div><span>Drop your lecture here</span><div className="tray-meter"><i /></div></div>
        <div className="flying-pdf"><span className="pdf-fold" /><span className="pdf-label">File</span><FileText size={26} /><div className="paper-lines"><i /><i /><i /></div><span className="paper-caption">Lecture 04</span></div>
        <MousePointer2 className="upload-cursor" size={24} color="#263d24" />
        <div className="upload-complete"><span><Check size={13} /></span> Ready to learn</div>
      </>}
      {type === 'generate' && <>
        <svg className="pack-connectors" viewBox="0 0 300 220" aria-hidden="true"><path d="M150 82 V106 M150 106 H57 V127 M150 106 V127 M150 106 H243 V127" /></svg>
        <div className="source-chip"><FileText size={13} /><span>Your lecture</span></div>
        <div className="pack-engine"><Layers size={22} /><span className="engine-ring" /></div>
        <div className="pack-output output-notes"><span className="output-icon"><BookOpen size={20} /></span><span className="output-lines"><i /><i /></span><strong>Notes</strong><span className="output-check"><Check size={10} /></span></div>
        <div className="pack-output output-cards"><span className="output-icon"><Layers size={20} /></span><span className="output-lines"><i /><i /></span><strong>Flashcards</strong><span className="output-check"><Check size={10} /></span></div>
        <div className="pack-output output-quiz"><span className="output-icon"><Zap size={20} /></span><span className="output-lines"><i /><i /></span><strong>Quiz</strong><span className="output-check"><Check size={10} /></span></div>
      </>}
      {type === 'improve' && <>
        <div className="practice-mini"><div className="practice-heading"><span>Quick check</span><span>01 / 03</span></div><strong>What’s starting to stick?</strong><div className="practice-option"><span>A</span><i /></div><div className="practice-option selected-answer"><span>B</span><i /><Check className="answer-tick" size={13} /></div></div>
        <MousePointer2 className="practice-cursor" size={22} color="#263d24" />
        <div className="progress-mini"><div className="progress-heading"><span>A little clearer.</span><span className="progress-badge"><Check size={10} /> Got it</span></div><div className="animated-bars">{[0, 1, 2, 3, 4, 5].map(n => <i key={n} style={{ '--bar': n } as React.CSSProperties} />)}</div><div className="progress-baseline" /></div>
      </>}
    </div>
    <button className="motion-control" onClick={() => setPaused(!paused)} aria-label={`${paused ? 'Play' : 'Pause'} ${type} animation`} aria-pressed={paused}>{paused ? <Play size={12} /> : <Pause size={12} />}</button>
  </div>;
}
