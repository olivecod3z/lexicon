import { useState } from 'react'
import Icon from './Icon'

export default function TodayRecall({ cards, progress, busy, onRate }) {
  const [revealed, setRevealed] = useState(false)
  const card = cards[0]

  if (!card) return <section className="recall-empty recall-complete"><span className="recall-complete-mark"><Icon name="check" /></span><p className="eyebrow">Today’s recall</p><h2>{progress.reviewed_today ? 'You showed up for your memory.' : 'You’re all caught up.'}</h2><p>{progress.reviewed_today ? `${progress.reviewed_today} card${progress.reviewed_today === 1 ? '' : 's'} reviewed today${progress.current_streak ? ` · ${progress.current_streak}-day streak` : ''}.` : 'Generate flashcards from a lecture and they’ll appear here when they are due.'}</p></section>

  return <section className="recall-session"><div className="recall-heading"><div><p className="eyebrow">Today’s recall</p><h1>Bring it back to mind.</h1><p>{cards.length} card{cards.length === 1 ? '' : 's'} ready for a quick review.</p></div><div className="recall-summary"><span>{cards.length} left</span>{progress.current_streak > 0 && <small>{progress.current_streak}-day streak</small>}</div></div><article className="recall-card"><p className="eyebrow">{card.topic}</p><button className="flashcard" aria-label={revealed ? 'Hide answer' : 'Reveal answer'} aria-pressed={revealed} onClick={() => setRevealed(!revealed)}><Icon name="layers" /><h2>{revealed ? card.answer : card.question}</h2><span>{revealed ? 'Tap to see the question again' : 'Think of your answer, then reveal it'}</span></button>{revealed && <div className="recall-ratings"><p>How did that feel?</p><div><button className="button secondary" disabled={busy} onClick={() => onRate(card.id, 'again')}>Again <small>Tomorrow</small></button><button className="button secondary" disabled={busy} onClick={() => onRate(card.id, 'hard')}>Hard <small>3 days</small></button><button className="button primary" disabled={busy} onClick={() => onRate(card.id, 'got_it')}>Got it <small>7 days</small></button></div></div>}</article></section>
}
