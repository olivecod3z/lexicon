import { useEffect, useState } from 'react'
import Icon from './Icon'
import { api } from '../api'

export function StudyNotes({ notes }) {
  return <article className="study-paper notes-reader"><h2>{notes.title}</h2><p>{notes.overview}</p><section><h3>What you’ll learn</h3><ul>{notes.learning_objectives.map((goal, index) => <li key={index}>{goal}</li>)}</ul></section>{notes.sections.map((section, index) => <section key={index}><h3>{section.heading}</h3><p>{section.explanation}</p><ul>{section.key_points.map((point, i) => <li key={i}>{point}</li>)}</ul></section>)}<p className="source-reminder">Check important details against the original lecture material.</p></article>
}

export function FlashcardReview({ cards }) {
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [ratings, setRatings] = useState({})
  const card = cards.flashcards[index]
  const mastered = Object.values(ratings).filter(value => value === 'got-it').length
  function move(next) { setIndex(next); setRevealed(false) }
  return <section className="study-paper"><div className="section-heading"><h2>{cards.title}</h2><span className="muted">{index + 1} / {cards.flashcards.length}</span></div><p className="eyebrow">{card.topic}</p><button className="flashcard" aria-label={revealed ? 'Hide answer' : 'Reveal answer'} aria-pressed={revealed} onClick={() => setRevealed(!revealed)}><Icon name="layers" /><h2 className="motion-content" key={`${index}-${revealed}`}>{revealed ? card.answer : card.question}</h2><span>{revealed ? 'Show question' : 'Click or press Enter to reveal'}</span></button>{revealed && <div className="review-actions"><span>How did you do?</span><button className="button secondary" aria-pressed={ratings[index] === 'again'} onClick={() => setRatings({ ...ratings, [index]: 'again' })}>Review again</button><button className="button primary" aria-pressed={ratings[index] === 'got-it'} onClick={() => setRatings({ ...ratings, [index]: 'got-it' })}>Got it</button></div>}<div className="card-controls"><button className="button secondary" disabled={index === 0} onClick={() => move(index - 1)}>Previous</button><span className="muted" role="status">{mastered} marked “Got it”</span><button className="button secondary" disabled={index === cards.flashcards.length - 1} onClick={() => move(index + 1)}>Next card <Icon name="arrow" /></button></div></section>
}

export function GenerateResource({ type, busy, onGenerate, materialId }) {
  const [entitlements, setEntitlements] = useState(null)
  const [sections, setSections] = useState([])
  const [error, setError] = useState('')
  const [options, setOptions] = useState({ question_count: 10, preset: 'balanced', coverage: 'balanced', selected_sections: [], question_types: ['mcq', 'gap', 'theory'] })
  useEffect(() => {
    if (type !== 'practice') return
    let active = true
    Promise.all([api('/account/entitlements'), api(`/materials/${materialId}/practice-sections`)]).then(([plan, source]) => {
      if (active) { setEntitlements(plan); setSections(source) }
    }).catch(error => { if (active) setError(error.message) })
    return () => { active = false }
  }, [type, materialId])
  const custom = entitlements?.custom_practice

  const config = {
    notes: ['file', 'Study notes', 'An overview, learning objectives and key ideas from your lecture.', 'Generate study notes'],
    cards: ['layers', 'Flashcards', 'Review your lecture through concept questions and keyword recall.', 'Create flashcards'],
    practice: ['practice', 'Practice & quiz', 'Choose your practice mix, or use the included 5 MCQs, 3 gaps and 2 theory prompts.', 'Create practice'],
  }
  const [icon, title, description, action] = config[type]
  return <section className="resource-empty"><span className="large-icon"><Icon name={icon} /></span><h2>{title}</h2><p>{description}</p>{type === 'practice' && <fieldset className="practice-options" disabled={busy || !custom}><legend>Practice preferences</legend><label>Number of questions<input type="number" min="1" max={entitlements?.practice_questions || 10} value={options.question_count} onChange={event => setOptions({ ...options, question_count: Number(event.target.value) })} /></label><label>Revision preset<select value={options.preset} onChange={event => setOptions({ ...options, preset: event.target.value })}><option value="balanced">Balanced</option><option value="mcq-heavy">MCQ-heavy</option><option value="theory-heavy">Theory-heavy</option></select></label>{[["mcq", "Multiple choice"], ["gap", "Keyword gaps"], ["theory", "Theory prompts"]].map(([kind, label]) => <label key={kind}><input type="checkbox" checked={options.question_types.includes(kind)} onChange={event => setOptions({ ...options, question_types: event.target.checked ? [...options.question_types, kind] : options.question_types.filter(value => value !== kind) })} />{label}</label>)}<label>Topic coverage<select value={options.coverage} onChange={event => setOptions({ ...options, coverage: event.target.value, selected_sections: [] })}><option value="balanced">Balanced coverage</option><option value="selected">Selected source sections</option><option value="exam-style">Exam-style practice</option></select></label>{options.coverage === 'selected' && sections.map(section => <label key={section.id}><input type="checkbox" checked={options.selected_sections.includes(section.id)} onChange={event => setOptions({ ...options, selected_sections: event.target.checked ? [...options.selected_sections, section.id] : options.selected_sections.filter(id => id !== section.id) })} />{section.label}</label>)}</fieldset>}{type === 'practice' && <p>{error || (entitlements ? `${entitlements.name}: up to ${entitlements.practice_questions} questions per set. ${custom ? 'New mixes use AI generation capacity; saved retries use no AI calls.' : 'Free includes 5 MCQs, 3 gaps and 2 theory prompts. Custom mixes await paid-plan release.'}` : 'Loading practice limits…')}</p>}<button className="button primary" disabled={busy || (type === 'practice' && (!entitlements || !Number.isInteger(options.question_count) || options.question_count < 1 || options.question_count > entitlements.practice_questions || !options.question_types.length || (options.coverage === 'selected' && !options.selected_sections.length)))} onClick={() => onGenerate(type === 'practice' ? options : undefined)}>{busy ? 'Generating…' : action}<Icon name="arrow" /></button></section>
}
