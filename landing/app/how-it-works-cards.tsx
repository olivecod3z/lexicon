'use client';

import { useEffect, useRef, useState } from 'react';
import { RotateCw } from './icons';
import StepAnimation from './step-animation';

const steps = [
  {
    type: 'upload',
    title: 'Start with what you have.',
    description: 'Your lecture slides, course notes, that pdf you\u2019ve been putting off. Give it a home in your course.',
    palette: 'lime',
    pattern: 'Glossy green and lime ribbon',
  },
  {
    type: 'generate',
    title: 'Meet your study pack.',
    description: 'Get structured notes, bite-sized flashcards, and practice questions built around your material.',
    palette: 'orange',
    pattern: 'Glossy orange ribbon',
  },
  {
    type: 'improve',
    title: 'Find your next \u201caha.\u201d',
    description: 'Test what you know, spot what needs another look, and come back with a little more confidence.',
    palette: 'blue',
    pattern: 'Glossy blue ribbon',
  },
] as const;

function StepCard({ step, index }: { step: typeof steps[number]; index: number }) {
  const [flipped, setFlipped] = useState(false);
  const [nearViewport, setNearViewport] = useState(false);
  const card = useRef<HTMLDivElement>(null);
  const artwork = useRef<HTMLImageElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setNearViewport(entry.isIntersecting), { rootMargin: '180px' });
    if (card.current) observer.observe(card.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (nearViewport) void artwork.current?.decode().catch(() => {});
  }, [nearViewport]);
  const flip = () => {
    // Keep focus on a control that never rotates away or becomes inert.
    if (document.activeElement !== toggle.current) toggle.current?.focus({ preventScroll: true });
    setFlipped(value => !value);
  };

  return (
    <div
      ref={card}
      className={`step-flip-card step-flip-${step.palette}`}
      data-flipped={flipped}
      data-near-viewport={nearViewport}
      onClick={event => {
        if (!(event.target as HTMLElement).closest('button')) flip();
      }}
    >
      <div className="step-card-turn">
        <article className="step-card-front" aria-hidden={flipped} inert={flipped} aria-labelledby={`step-${step.type}-title`}>
          <div className="step-number">0{index + 1}</div>
          <h3 id={`step-${step.type}-title`}>{step.title}</h3>
          <p>{step.description}</p>
          <StepAnimation type={step.type} suspended={flipped} />
        </article>
        <div className="step-card-back" role="img" aria-label={step.pattern} aria-hidden={!flipped}>
          <img ref={artwork} className="step-card-ribbon" src={`/images/card-back-${step.palette}.webp`} width={768} height={1024} alt="" loading="eager" decoding="async" draggable={false} />
          <span className="step-back-number" aria-hidden="true">0{index + 1}</span>
        </div>
      </div>
      <button
        ref={toggle}
        type="button"
        className="step-flip-toggle"
        onClick={flip}
        aria-label={`Flip card ${index + 1}: ${step.title}`}
        aria-pressed={flipped}
        aria-describedby={`step-${step.type}-tooltip`}
      >
        <RotateCw size={18} aria-hidden="true" />
        <span id={`step-${step.type}-tooltip`} className="step-flip-tooltip" role="tooltip">{flipped ? 'Show details' : 'Flip card'}</span>
      </button>
    </div>
  );
}

export default function HowItWorksCards() {
  return <div className="steps">{steps.map((step, index) => <StepCard key={step.type} step={step} index={index} />)}</div>;
}
