import { useState } from 'react'
import Icon from './Icon'

export function StudyNotes({ notes }) {
  return <article className="study-paper notes-reader"><h2>{notes.title}</h2><p>{notes.overview}</p><section><h3>What you’ll learn</h3><ul>{notes.learning_objectives.map((goal, index) => <li key={index}>{goal}</li>)}</ul></section>{notes.sections.map((section, index) => <section key={index}><h3>{section.heading}</h3><p>{section.explanation}</p><ul>{section.key_points.map((point, i) => <li key={i}>{point}</li>)}</ul></section>)}<p className="source-reminder">Generated from your lecture. Check important details against the original material.</p></article>
}

export function FlashcardReview({ cards }) {
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [ratings, setRatings] = useState({})
  const card = cards.flashcards[index]
  const mastered = Object.values(ratings).filter(value => value === 'got-it').length
  function move(next) { setIndex(next); setRevealed(false) }
  return <section className="study-paper"><div className="section-heading"><h2>{cards.title}</h2><span className="muted">{index + 1} / {cards.flashcards.length}</span></div><p className="eyebrow">{card.topic}</p><button className="flashcard" aria-label={revealed ? 'Hide answer' : 'Reveal answer'} aria-pressed={revealed} onClick={() => setRevealed(!revealed)}><Icon name="layers" /><h2>{revealed ? card.answer : card.question}</h2><span>{revealed ? 'Show question' : 'Click or press Enter to reveal'}</span></button>{revealed && <div className="review-actions"><span>How did you do?</span><button className="button secondary" aria-pressed={ratings[index] === 'again'} onClick={() => setRatings({ ...ratings, [index]: 'again' })}>Review again</button><button className="button primary" aria-pressed={ratings[index] === 'got-it'} onClick={() => setRatings({ ...ratings, [index]: 'got-it' })}>Got it</button></div>}<div className="card-controls"><button className="button secondary" disabled={index === 0} onClick={() => move(index - 1)}>Previous</button><span className="muted" role="status">{mastered} marked “Got it”</span><button className="button secondary" disabled={index === cards.flashcards.length - 1} onClick={() => move(index + 1)}>Next card <Icon name="arrow" /></button></div></section>
}

export function GenerateResource({ type, busy, onGenerate }) {
  const config = {
    notes: ['file', 'Study notes', 'An overview, learning objectives and key ideas from your lecture.', 'Generate study notes'],
    cards: ['layers', 'Flashcards', 'Review your lecture through concept questions and keyword recall.', 'Create flashcards'],
    practice: ['practice', 'Practice & quiz', '5 MCQs, 3 fill-in-the-gap questions and 2 theory prompts.', 'Create practice'],
  }
  const [icon, title, description, action] = config[type]
  return <section className="resource-empty"><span className="large-icon"><Icon name={icon} /></span><h2>{title}</h2><p>{description}</p><button className="button primary" disabled={busy} onClick={onGenerate}>{busy ? 'Generating…' : action}<Icon name="arrow" /></button></section>
}
