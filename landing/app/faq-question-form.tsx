'use client';

import { useState } from 'react';
import { ArrowRight } from './icons';

type Props = {
  onSubmit: (question: string) => Promise<void>;
  confirmation: string;
};

export default function FaqQuestionForm({ onSubmit, confirmation }: Props) {
  const [question, setQuestion] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  return <form className="faq-ask" onSubmit={async event => {
    event.preventDefault();
    if (!question.trim() || status === 'sending') return;
    setStatus('sending');
    try {
      await onSubmit(question.trim());
      setQuestion('');
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  }}>
    <label htmlFor="faq-question">Ask anything</label>
    <p id="faq-question-hint">Something else on your mind? Ask us about Lexicon.</p>
    <div className="faq-question-field">
      <textarea id="faq-question" name="question" required maxLength={300} rows={3}
        placeholder="What would you like to know?" aria-describedby="faq-question-hint"
        value={question} onChange={event => { setQuestion(event.target.value); setStatus('idle'); }}
        disabled={status === 'sending'} />
      <div className="faq-question-actions"><span>{question.length}/300</span><button className="button charcoal" type="submit" disabled={!question.trim() || status === 'sending'}>{status === 'sending' ? 'Sending…' : 'Ask a question'}<ArrowRight size={15} /></button></div>
    </div>
    <p className="faq-question-status" role="status">{status === 'sent' ? confirmation : status === 'error' ? 'Your question couldn’t be sent. Please try again.' : ''}</p>
  </form>;
}
