'use client';

import { useId, useState } from 'react';
import { ChevronDown } from './icons';

export default function FaqItem({ question, response }: { question: string; response: string }) {
  const [expanded, setExpanded] = useState(false);
  const answerId = useId();

  return <div className="faq-item" data-expanded={expanded}>
    <h3><button type="button" aria-expanded={expanded} aria-controls={answerId} onClick={() => setExpanded(value => !value)}>
      {question}<ChevronDown size={19} aria-hidden="true" />
    </button></h3>
    <div id={answerId} className="faq-answer" inert={!expanded} aria-hidden={!expanded}>
      <div><p>{response}</p></div>
    </div>
  </div>;
}
