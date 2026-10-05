import { useEffect, useState } from 'react'
import Icon from './Icon'

export default function TodayRecall({ cards, busy, onRate }) {
  const [revealed, setRevealed] = useState(false)
  const card = cards[0]

  useEffect(() => setRevealed(false), [card?.id])

  if (!card) return <section className="recall-empty"><Icon name="layers" /><p className="eyebrow">TODAY'S RECALL</p><h2>You’re all caught up.</h2><p>Generate flashcards from a lecture and they’ll appear here when they are due.</p></section>

  return <section className="recall-session"><div className="recall-heading"><div><p className="eyebrow">TODAY'S RECALL</p><h1>Bring it back to mind.</h1><p>{cards.length} card{cards.length === 1 ? '' : 's'} ready for a quick review.</p></div><span>{cards.length} left</span></div><article className="recall-card"><p className="eyebrow">{card.topic}</p><button className="flashcard" aria-label={revealed ? 'Hide answer' : 'Reveal answer'} aria-pressed={revealed} onClick={() => setRevealed(!revealed)}><Icon name="layers" /><h2>{revealed ? card.answer : card.question}</h2><span>{revealed ? 'Tap to see the question again' : 'Think of your answer, then reveal it'}</span></button>{revealed && <div className="recall-ratings"><p>How did that feel?</p><div><button className="button secondary" disabled={busy} onClick={() => onRate(card.id, 'again')}>Again <small>Tomorrow</small></button><button className="button secondary" disabled={busy} onClick={() => onRate(card.id, 'hard')}>Hard <small>3 days</small></button><button className="button primary" disabled={busy} onClick={() => onRate(card.id, 'got_it')}>Got it <small>7 days</small></button></div></div>}</article></section>
}
