import { useEffect, useId, useRef, useState } from 'react'
import './InitialOnboarding.css'

const DEFAULT_STORAGE_KEY = 'lexicon.onboarding.v1'

const STUDY_STAGES = [
  '100 Level',
  '200 Level',
  '300 Level',
  '400 Level',
  '500 Level',
  '600 Level',
  'Postgraduate',
  'Other',
]

const GOALS = [
  { value: 'understand', label: 'Understand difficult topics', description: 'Turn lectures into clearer explanations.' },
  { value: 'remember', label: 'Remember what I learn', description: 'Use active recall and flashcards.' },
  { value: 'exams', label: 'Prepare for an exam', description: 'Practise questions before test day.' },
  { value: 'routine', label: 'Build a study routine', description: 'Make steady progress each week.' },
]

const COURSE_LEVELS = ['', ...STUDY_STAGES]

const COURSE_COLOURS = [
  { value: 'green', label: 'Green', swatch: '#a5eb69' },
  { value: 'blue', label: 'Blue', swatch: '#8dd1dc' },
  { value: 'rose', label: 'Rose', swatch: '#efb5ad' },
  { value: 'yellow', label: 'Yellow', swatch: '#f5d779' },
]

function firstNameFrom(value) {
  return typeof value === 'string' ? value.trim().split(/\s+/)[0] || '' : ''
}

function safeText(value, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function createInitialProfile(storageKey, defaultName) {
  const fallback = {
    firstName: firstNameFrom(defaultName),
    stage: '',
    university: '',
    goals: [],
    minutes: 20,
    course: '',
    courseCode: '',
    level: '',
    color: 'green',
  }

  if (!storageKey || typeof window === 'undefined') return fallback

  try {
    const saved = JSON.parse(window.localStorage.getItem(storageKey))
    const profile = saved?.profile
    if (!profile || typeof profile !== 'object' || Array.isArray(profile)) return fallback

    const savedGoals = Array.isArray(profile.goals)
      ? profile.goals.filter(goal => GOALS.some(option => option.value === goal))
      : []
    const savedMinutes = Number(profile.minutes ?? profile.dailyMinutes)
    const savedStage = safeText(profile.stage)
    const savedLevel = safeText(profile.level)
    const savedColour = safeText(profile.color, 'green')

    return {
      ...fallback,
      firstName: firstNameFrom(profile.firstName || profile.name || defaultName),
      stage: STUDY_STAGES.includes(savedStage) ? savedStage : '',
      university: safeText(profile.university),
      goals: savedGoals,
      minutes: [10, 20, 30].includes(savedMinutes) ? savedMinutes : fallback.minutes,
      course: safeText(profile.course),
      courseCode: safeText(profile.courseCode),
      level: COURSE_LEVELS.includes(savedLevel) ? savedLevel : '',
      color: COURSE_COLOURS.some(option => option.value === savedColour) ? savedColour : 'green',
    }
  } catch {
    return fallback
  }
}

function validationFor(step, profile) {
  const errors = {}

  if (step === 1) {
    if (!profile.firstName.trim()) errors.firstName = 'Add the name you would like Lexycon to use.'
    if (!profile.stage) errors.stage = 'Choose your degree level.'
  }

  if (step === 2 && !profile.goals.length) {
    errors.goals = 'Choose at least one study goal.'
  }

  if (step === 3 && !profile.course.trim()) {
    errors.course = 'Add the course you want to start with.'
  }

  return errors
}

function makeSetup(profile) {
  const courseName = profile.course.trim()
  const courseCode = profile.courseCode.trim()

  return {
    profile: {
      firstName: profile.firstName.trim(),
      stage: profile.stage,
      university: profile.university.trim(),
      goals: [...profile.goals],
      dailyMinutes: profile.minutes,
    },
    course: {
      name: courseName,
      code: courseCode,
      level: profile.level,
      color: profile.color,
    },
  }
}

function saveProfile(storageKey, setup) {
  if (!storageKey || typeof window === 'undefined') return () => {}

  const previous = window.localStorage.getItem(storageKey)
  const profile = {
    // Keep these aliases so the dashboard's existing local onboarding reader can
    // recognise the richer profile without needing any backend change.
    name: setup.profile.firstName,
    firstName: setup.profile.firstName,
    stage: setup.profile.stage,
    university: setup.profile.university,
    goals: setup.profile.goals,
    minutes: setup.profile.dailyMinutes,
    dailyMinutes: setup.profile.dailyMinutes,
    course: setup.course.name,
    courseCode: setup.course.code,
    level: setup.course.level,
    color: setup.course.color,
  }

  window.localStorage.setItem(storageKey, JSON.stringify({ version: 1, complete: true, profile }))

  return () => {
    try {
      if (previous === null) window.localStorage.removeItem(storageKey)
      else window.localStorage.setItem(storageKey, previous)
    } catch {
      // A failed rollback should not hide the original course-creation error.
    }
  }
}

/**
 * A presentational onboarding flow. It never creates a course itself: its parent
 * receives the normalised setup object through onComplete and owns API calls.
 */
export default function InitialOnboarding({
  onComplete,
  storageKey = DEFAULT_STORAGE_KEY,
  defaultName = '',
}) {
  const formRef = useRef(null)
  const headingRef = useRef(null)
  const idPrefix = useId().replace(/:/g, '')
  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState(() => createInitialProfile(storageKey, defaultName))
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [complete, setComplete] = useState(false)

  useEffect(() => {
    headingRef.current?.focus()
  }, [step, complete])

  function updateProfile(field, value) {
    setProfile(current => ({ ...current, [field]: value }))
    setErrors(current => ({ ...current, [field]: undefined }))
    setSubmitError('')
  }

  function focusFirstInvalid() {
    requestAnimationFrame(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus())
  }

  function moveForward() {
    const nextErrors = validationFor(step, profile)
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      focusFirstInvalid()
      return
    }
    setErrors({})
    setStep(current => Math.min(current + 1, 3))
  }

  function toggleGoal(goal) {
    setProfile(current => ({
      ...current,
      goals: current.goals.includes(goal)
        ? current.goals.filter(value => value !== goal)
        : [...current.goals, goal],
    }))
    setErrors(current => ({ ...current, goals: undefined }))
    setSubmitError('')
  }

  async function finish(event) {
    event.preventDefault()
    const nextErrors = validationFor(3, profile)
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      focusFirstInvalid()
      return
    }

    const setup = makeSetup(profile)
    let rollback = () => {}
    setSubmitting(true)
    setSubmitError('')

    try {
      rollback = saveProfile(storageKey, setup)
      if (typeof onComplete === 'function') await onComplete(setup)
      setComplete(true)
    } catch (error) {
      rollback()
      setSubmitError(error instanceof Error && error.message ? error.message : 'Your study space could not be created. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const stepTitle = ['Let’s make this yours', 'What would help most?', 'Choose your first course'][step - 1]

  if (complete) {
    return <section className="initial-onboarding" aria-labelledby={`${idPrefix}-complete-title`}>
      <div className="initial-onboarding__card initial-onboarding__success" aria-live="polite">
        <span className="initial-onboarding__success-mark" aria-hidden="true">✓</span>
        <p className="eyebrow">STUDY SPACE READY</p>
        <h2 id={`${idPrefix}-complete-title`} ref={headingRef} tabIndex="-1">You’re ready to begin, {profile.firstName.trim()}.</h2>
        <p>Your course and study preferences have been saved for this browser.</p>
      </div>
    </section>
  }

  return <section className="initial-onboarding" aria-labelledby={`${idPrefix}-title`}>
    <div className="initial-onboarding__card">
      <div className="initial-onboarding__header">
        <div>
          <p className="eyebrow">WELCOME TO LEXYCON</p>
          <h2 id={`${idPrefix}-title`} ref={headingRef} tabIndex="-1">{stepTitle}</h2>
        </div>
        <span className="initial-onboarding__step-count">Step {step} of 3</span>
      </div>

      <ol className="initial-onboarding__progress" aria-label={`Onboarding progress: step ${step} of 3`}>
        {[1, 2, 3].map(number => <li key={number} className={number === step ? 'is-current' : number < step ? 'is-complete' : ''}><span>{number < step ? '✓' : number}</span></li>)}
      </ol>

      <form ref={formRef} onSubmit={finish} noValidate>
        <div className="initial-onboarding__panel" key={step}>
          {step === 1 && <>
            <p className="initial-onboarding__intro">A few details help Lexycon shape your study space around you.</p>
            <div className="initial-onboarding__field-grid">
              <label className="initial-onboarding__field">
                <span>First name <b aria-hidden="true">*</b></span>
                <input
                  aria-invalid={Boolean(errors.firstName)}
                  aria-describedby={errors.firstName ? `${idPrefix}-first-name-error` : undefined}
                  autoComplete="given-name"
                  maxLength="40"
                  value={profile.firstName}
                  onChange={event => updateProfile('firstName', event.target.value)}
                  placeholder="e.g. Olive"
                />
                {errors.firstName && <small id={`${idPrefix}-first-name-error`} role="alert">{errors.firstName}</small>}
              </label>
              <label className="initial-onboarding__field">
                <span>Degree level <b aria-hidden="true">*</b></span>
                <select
                  aria-invalid={Boolean(errors.stage)}
                  aria-describedby={errors.stage ? `${idPrefix}-stage-error` : undefined}
                  value={profile.stage}
                  onChange={event => updateProfile('stage', event.target.value)}
                >
                  <option value="">Choose your degree level</option>
                  {STUDY_STAGES.map(stage => <option key={stage} value={stage}>{stage}</option>)}
                </select>
                {errors.stage && <small id={`${idPrefix}-stage-error`} role="alert">{errors.stage}</small>}
              </label>
            </div>
            <label className="initial-onboarding__field">
              <span>University <em>Optional</em></span>
              <input
                autoComplete="organization"
                maxLength="100"
                value={profile.university}
                onChange={event => updateProfile('university', event.target.value)}
                placeholder="e.g. University of Lagos"
              />
            </label>
          </>}

          {step === 2 && <>
            <p className="initial-onboarding__intro">Pick what you want to improve first. You can adjust this later.</p>
            <fieldset className="initial-onboarding__goals" aria-describedby={errors.goals ? `${idPrefix}-goals-error` : undefined} aria-invalid={Boolean(errors.goals)} tabIndex={errors.goals ? '-1' : undefined}>
              <legend>My study goals <b aria-hidden="true">*</b></legend>
              <div>
                {GOALS.map(goal => {
                  const selected = profile.goals.includes(goal.value)
                  return <label className={`initial-onboarding__goal${selected ? ' is-selected' : ''}`} key={goal.value}>
                    <input type="checkbox" checked={selected} onChange={() => toggleGoal(goal.value)} />
                    <span className="initial-onboarding__goal-check" aria-hidden="true">✓</span>
                    <span><strong>{goal.label}</strong><small>{goal.description}</small></span>
                  </label>
                })}
              </div>
              {errors.goals && <small className="initial-onboarding__error" id={`${idPrefix}-goals-error`} role="alert">{errors.goals}</small>}
            </fieldset>
            <fieldset className="initial-onboarding__pace">
              <legend>A comfortable daily pace</legend>
              <div>
                {[10, 20, 30].map(minutes => <label className={profile.minutes === minutes ? 'is-selected' : ''} key={minutes}>
                  <input type="radio" name={`${idPrefix}-pace`} value={minutes} checked={profile.minutes === minutes} onChange={() => updateProfile('minutes', minutes)} />
                  <strong>{minutes} min</strong>
                  <small>{minutes === 10 ? 'A quick reset' : minutes === 20 ? 'A focused session' : 'A deeper review'}</small>
                </label>)}
              </div>
            </fieldset>
          </>}

          {step === 3 && <>
            <p className="initial-onboarding__intro">Start with the first course you want to bring into Lexycon today.</p>
            <label className="initial-onboarding__field">
              <span>First course <b aria-hidden="true">*</b></span>
              <input
                aria-invalid={Boolean(errors.course)}
                aria-describedby={errors.course ? `${idPrefix}-course-error` : undefined}
                maxLength="100"
                value={profile.course}
                onChange={event => updateProfile('course', event.target.value)}
                placeholder="e.g. Introduction to Computer Science"
              />
              {errors.course && <small id={`${idPrefix}-course-error`} role="alert">{errors.course}</small>}
            </label>
            <div className="initial-onboarding__field-grid">
              <label className="initial-onboarding__field">
                <span>Course code <em>Optional</em></span>
                <input maxLength="16" value={profile.courseCode} onChange={event => updateProfile('courseCode', event.target.value)} placeholder="e.g. CSC 201" />
              </label>
              <label className="initial-onboarding__field">
                <span>Course level <em>Optional</em></span>
                <select value={profile.level} onChange={event => updateProfile('level', event.target.value)}>
                  <option value="">Choose a level</option>
                  {COURSE_LEVELS.slice(1).map(level => <option key={level} value={level}>{level}</option>)}
                </select>
              </label>
            </div>
            <fieldset className="initial-onboarding__colours">
              <legend>Course colour</legend>
              <div>
                {COURSE_COLOURS.map(colour => <button
                  aria-label={`${colour.label} course colour`}
                  aria-pressed={profile.color === colour.value}
                  className={profile.color === colour.value ? 'is-selected' : ''}
                  key={colour.value}
                  onClick={() => updateProfile('color', colour.value)}
                  style={{ '--course-colour': colour.swatch }}
                  type="button"
                ><span aria-hidden="true" /></button>)}
              </div>
            </fieldset>
          </>}
        </div>

        {submitError && <p className="initial-onboarding__submit-error" role="alert">{submitError}</p>}

        <div className="initial-onboarding__actions">
          {step > 1 && <button className="button secondary" disabled={submitting} type="button" onClick={() => { setStep(current => current - 1); setErrors({}); setSubmitError('') }}>Back</button>}
          {step < 3
            ? <button className="button primary" type="button" onClick={moveForward}>Continue</button>
            : <button className="button primary" disabled={submitting} type="submit">{submitting ? 'Creating your study space…' : 'Create my study space'}</button>}
        </div>
      </form>
    </div>
  </section>
}
