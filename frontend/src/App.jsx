import { useEffect, useRef, useState } from 'react'
import { api } from './api'
import Icon from './components/Icon'
import AuthGate, { SignOutButton } from './components/AuthGate'
import LibraryState from './components/LibraryState'
import StudyLoading from './components/StudyLoading'
import UploadCard from './components/UploadCard'
import Practice from './components/Practice'
import AccountAllowance from './components/AccountAllowance'
import TodayRecall from './components/TodayRecall'
import { StudyNotes, FlashcardReview, GenerateResource } from './components/StudyResources'
import OriginalOnboarding from './components/OriginalOnboarding'

import './App.css'
import './components/Practice.css'

const navigation = [['overview', 'home', 'Dashboard'], ['recall', 'layers', "Today's recall"], ['materials', 'book', 'My materials'], ['study', 'layers', 'Study workspace'], ['progress', 'progress', 'My progress']]
const tabs = [['notes', 'file', 'Study notes'], ['cards', 'layers', 'Flashcards'], ['practice', 'practice', 'Practice & quiz']]

function StudyDashboard() {
  const [profile, setProfile] = useState(null)
  const [setupOpen, setSetupOpen] = useState(false)
  const [startupAttempt, setStartupAttempt] = useState(0)
  const [view, setView] = useState('overview')
  const [tab, setTab] = useState('notes')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [materials, setMaterials] = useState([])
  const [courses, setCourses] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  // Keep each lecture's generated resources and answers together when switching views.
  const [resources, setResources] = useState({})
  const [reviewCards, setReviewCards] = useState([])
  const [recallProgress, setRecallProgress] = useState({ reviewed_today: 0, current_streak: 0 })
  const [loadingLibrary, setLoadingLibrary] = useState(true)
  const [libraryError, setLibraryError] = useState('')
  const [notice, setNotice] = useState(null)
  const [pending, setPending] = useState(null)
  const heading = useRef(null)
  const uploadInput = useRef(null)
  const busy = !!pending
  const selectedCourse = courses.find(course => course.id === selectedCourseId)
  const material = materials.find(item => item.id === selectedId)
  const current = resources[selectedId] || {}
  const practice = current.session?.practice
  const mcqAnswers = current.mcqAnswers || {}
  const gapAnswers = current.gapAnswers || {}
  const theoryAnswers = current.theoryAnswers || {}
  const result = current.result

  useEffect(() => {
    let active = true
    Promise.all([api('/account/profile'), api('/courses'), api('/materials'), api('/reviews/today'), api('/reviews/progress')]).then(([account, savedCourses, items, dueCards, progress]) => {
      if (!active) return
      setProfile(account.profile)
      setSetupOpen(!account.profile?.onboarding_complete)
      setCourses(savedCourses)
      setSelectedCourseId(savedCourses[0]?.id || null)
      setMaterials(previous => [...previous, ...items.filter(item => !previous.some(existing => existing.id === item.id))])
      setReviewCards(dueCards)
      setRecallProgress(progress)
    }).catch(error => { if (active) setLibraryError(error.message) }).finally(() => { if (active) setLoadingLibrary(false) })
    return () => { active = false }
  }, [startupAttempt])

  useEffect(() => {
    const closeMenu = event => { if (event.key === 'Escape') setMobileOpen(false) }
    document.addEventListener('keydown', closeMenu)
    return () => document.removeEventListener('keydown', closeMenu)
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Animate the existing view without remounting forms or resetting study state.
    const animation = heading.current?.animate([
      { opacity: .65, transform: 'translate3d(0, 4px, 0)' },
      { opacity: 1, transform: 'translate3d(0, 0, 0)' },
    ], { duration: 320, easing: 'cubic-bezier(.22, .68, .25, 1)' })
    return () => animation?.cancel()
  }, [view, tab])

  function navigate(next) {
    setView(next); setMobileOpen(false)
    requestAnimationFrame(() => { heading.current?.focus(); window.scrollTo({ top: 0, behavior: 'instant' }) })
  }
  function updateResource(id, changes) {
    setResources(previous => ({ ...previous, [id]: { ...previous[id], ...changes } }))
  }
  function openMaterial(item, nextTab = view === 'study' ? tab : 'notes') {
    setSelectedId(item.id); setTab(nextTab); setNotice(null); navigate('study')
  }
  async function reloadLibrary() {
    setLoadingLibrary(true); setLibraryError('')
    try { setMaterials(await api('/materials')) }
    catch (error) { setLibraryError(error.message) }
    finally { setLoadingLibrary(false) }
  }
  async function reloadRecall() {
    try {
      const [cards, progress] = await Promise.all([api('/reviews/today'), api('/reviews/progress')])
      setReviewCards(cards); setRecallProgress(progress)
    }
    catch (error) { setNotice({ error: true, text: error.message }) }
  }
  async function completeInitialSetup(answers) {
    // A prior course save can succeed even if the profile save fails.
    let savedCourses = await api('/courses')
    if (!savedCourses.length) {
      const course = await api('/courses', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: answers.course, code: answers.courseCode, color: answers.color, level: answers.level }),
      })
      savedCourses = [course]
    }
    setCourses(savedCourses)
    setSelectedCourseId(savedCourses[0].id)
    const { name, institution, stage, level, goals, minutes } = answers
    const account = await api('/account/profile', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, institution, stage, level, goals, minutes }),
    })
    setProfile(account.profile)
  }
  async function uploadFile(file) {
    if (!file || busy) return
    if (!selectedCourseId) return setNotice({ error: true, text: 'Create your course before uploading a lecture.' })
    if (!/\.(pdf|docx|pptx|txt)$/i.test(file.name)) return setNotice({ error: true, text: 'Choose a pdf, docx, pptx or txt file.' })
    if (!file.size) return setNotice({ error: true, text: 'This file is empty. Please choose another file.' })
    if (file.size > 25 * 1024 * 1024) return setNotice({ error: true, text: 'Please choose a file that is 25 megabytes or smaller.' })
    setPending('upload'); setNotice({ text: 'Reading and saving your lecture…' })
    try {
      const body = new FormData(); body.append('file', file); body.append('course_id', selectedCourseId)
      const uploaded = await api('/materials', { method: 'POST', body })
      setMaterials(previous => [uploaded, ...previous.filter(item => item.id !== uploaded.id)])
      openMaterial(uploaded)
    } catch (error) { setNotice({ error: true, text: error.message }) }
    finally { setPending(null) }
  }
  async function generate(type) {
    if (busy || !material) return
    const id = material.id
    const endpoint = { notes: 'study-pack', cards: 'flashcards', practice: 'practice-session' }[type]
    setPending(type); setNotice({ text: `Creating ${type === 'notes' ? 'study notes' : type === 'cards' ? 'flashcards' : 'practice questions'} from your lecture. This may take a moment…` })
    try {
      const data = await api(`/materials/${id}/${endpoint}`, { method: 'POST' })
      updateResource(id, { [type === 'practice' ? 'session' : type]: data })
      if (type === 'cards') await reloadRecall()
      setNotice(null)
    } catch (error) { setNotice({ error: true, text: error.message }) }
    finally { setPending(null) }
  }
  async function submitPractice() {
    if (busy) return
    const id = selectedId
    setPending('submit'); setNotice({ text: 'Checking your answers…' })
    try {
      const score = await api(`/practice-sessions/${current.session.practice_id}/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mcq_answers: practice.mcqs.map((_, i) => mcqAnswers[i] || ''), gap_answers: practice.fill_in_the_gaps.map((_, i) => gapAnswers[i] || '') }) })
      updateResource(id, { result: score }); setNotice(null)
    } catch (error) { setNotice({ error: true, text: error.message }) }
    finally { setPending(null) }
  }
  async function rateRecallCard(cardId, rating) {
    if (busy) return
    setPending('review')
    try {
      await api(`/reviews/${cardId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rating }) })
      setReviewCards(cards => cards.filter(card => card.id !== cardId))
      setRecallProgress(await api('/reviews/progress'))
      setNotice(null)
    } catch (error) { setNotice({ error: true, text: error.message }) }
    finally { setPending(null) }
  }

  function renderLibrary(limit) {
    return <section className="materials-section"><div className="section-heading"><h2>{limit ? 'Your recent materials' : 'Your materials'}</h2>{limit && materials.length > limit && <button className="text-button" onClick={() => navigate('materials')}>View all <Icon name="arrow" /></button>}</div>{loadingLibrary && <p className="muted" role="status">Loading your library…</p>}{libraryError && <LibraryState unavailable onRetry={reloadLibrary} loading={loadingLibrary} />}{materials.length ? <div className="material-list">{materials.slice(0, limit || materials.length).map(item => <article className="material-row" key={item.id}><span className="file-symbol"><Icon name="file" /></span><div><h3>{item.filename}</h3><p>{new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {resources[item.id]?.notes ? 'Notes ready' : 'Ready to study'}{resources[item.id]?.cards ? ' · Flashcards ready' : ''}</p></div><button className="button secondary" disabled={busy} onClick={() => openMaterial(item)}>Open <Icon name="arrow" /></button></article>)}</div> : !loadingLibrary && !libraryError && <LibraryState />}</section>
  }

  if (loadingLibrary) return <StudyLoading />
  if (libraryError) return <main className="auth-page"><section className="auth-card"><h1>Let’s reconnect your study space</h1><p role="alert">{libraryError}</p><button className="button primary" onClick={() => { setLoadingLibrary(true); setLibraryError(''); setStartupAttempt(value => value + 1) }}>Try again</button><SignOutButton /></section></main>
  if (setupOpen || !profile?.onboarding_complete) return <OriginalOnboarding
    savedProfile={profile} existingCourse={courses[0]}
    onSave={completeInitialSetup} onOpen={() => { setSetupOpen(false); navigate('overview') }}
  />

  return <div className="workspace focused-workspace"><a className="skip-link" href="#main-content">Skip to content</a><aside className={`sidebar ${mobileOpen ? 'is-open' : ''}`}><a className="brand" href="#" onClick={event => { event.preventDefault(); navigate('overview') }}><Icon name="layers" /><span>lexycon.</span></a><p className="nav-caption">My workspace</p><nav aria-label="Main navigation">{navigation.map(([id, icon, label]) => <button key={id} className={view === id ? 'active' : ''} aria-current={view === id ? 'page' : undefined} onClick={() => navigate(id)}><Icon name={icon} />{label}</button>)}</nav><div className="sidebar-bottom"><p>Your study tools</p>{tabs.map(([id, icon, label]) => <button className="tool-link" key={id} onClick={() => { setTab(id); navigate('study') }}><Icon name={icon} />{label}</button>)}<SignOutButton /></div></aside><button className={`nav-scrim ${mobileOpen ? 'is-open' : ''}`} aria-label="Close navigation" aria-hidden={!mobileOpen} inert={!mobileOpen} onClick={() => setMobileOpen(false)} /><div className="workspace-main"><header className="topbar"><button className="icon-button mobile-menu" aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}><Icon name={mobileOpen ? 'close' : 'menu'} /></button><div className="breadcrumb"><b>{navigation.find(item => item[0] === view)?.[2]}</b>{selectedCourse && <span>· {selectedCourse.code || selectedCourse.name}{selectedCourse.level && ` · ${selectedCourse.level}`}</span>}</div>{material && view === 'study' && <span className="current-file">{material.filename}</span>}<input ref={uploadInput} type="file" hidden accept=".pdf,.docx,.pptx,.txt" onChange={event => { uploadFile(event.target.files[0]); event.target.value = '' }} /><button className="button primary" disabled={busy || !selectedCourseId} onClick={() => uploadInput.current?.click()}><Icon name="upload" />Upload pdf</button></header><main id="main-content" tabIndex="-1" ref={heading} className="main-content"><div className={`status-message ${notice?.error ? 'error' : ''}`} role={notice?.error ? 'alert' : 'status'} hidden={!notice}>{notice?.text}</div>
    <AccountAllowance refreshKey={pending} />
    {view === 'overview' && <section aria-label="Your study preferences"><p>Your focus: {profile.goals.map(goal => ({ understand: 'Understand my lectures', remember: 'Remember what I learn', exams: 'Feel ready for exams', routine: 'Build a study routine' })[goal]).join(' · ')}</p><button className="text-button" onClick={() => setSetupOpen(true)}>Edit my study setup</button></section>}
    {view === 'overview' && <><div className="page-heading"><div><h1>Hi, {profile.name}</h1><p>{selectedCourse?.name} · {profile.level}{profile.institution && ` · ${profile.institution}`} · Your daily goal: {profile.minutes} minutes</p></div></div><UploadCard onUpload={uploadFile} busy={busy} /><div className="tool-overview">{tabs.map(([id, icon, label]) => <button key={id} onClick={() => { setTab(id); navigate('study') }}><Icon name={icon} /><div><b>{label}</b><span>{id === 'notes' ? 'Key ideas from your lectures' : id === 'cards' ? 'Recall and review key concepts' : 'mcqs, keyword gaps and theory'}</span></div><Icon name="arrow" /></button>)}</div>{material && <section className="resume-strip"><div><span className="muted">Continue studying</span><h3>{material.filename}</h3></div><button className="button dark" onClick={() => navigate('study')}>Resume <Icon name="arrow" /></button></section>}{renderLibrary(5)}</>}
    {view === 'recall' && <TodayRecall key={reviewCards[0]?.id || 'complete'} cards={reviewCards} progress={recallProgress} busy={busy} onRate={rateRecallCard} />}
    {view === 'materials' && <><div className="page-heading"><div><h1>My materials</h1><p>Your saved lectures. Open a file to access its study tools.</p></div></div>{renderLibrary()}<div className="compact-upload"><UploadCard onUpload={uploadFile} busy={busy} /></div></>}
    {view === 'study' && (!material ? <><div className="page-heading"><div><h1>{tabs.find(item => item[0] === tab)[2]}</h1><p>Choose a lecture from your library or upload a pdf to get started.</p></div></div><UploadCard onUpload={uploadFile} busy={busy} /><div className="library-spacing">{renderLibrary()}</div></> : <><div className="page-heading study-heading"><div><button className="text-button" onClick={() => navigate('materials')}>← My materials</button><h1>{material.filename}</h1><p>Study tools built from this lecture.</p></div></div><div className="segmented" aria-label="Lecture study tools">{tabs.map(([id, icon, label]) => <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)}><Icon name={icon} />{label}</button>)}</div>{tab === 'notes' && (current.notes ? <StudyNotes notes={current.notes} /> : <GenerateResource type="notes" busy={busy} onGenerate={() => generate('notes')} />)}{tab === 'cards' && (current.cards ? <FlashcardReview key={selectedId} cards={current.cards} /> : <GenerateResource type="cards" busy={busy} onGenerate={() => generate('cards')} />)}{tab === 'practice' && (practice ? <Practice {...{ practice, mcqAnswers, gapAnswers, theoryAnswers, result, submitPractice }} setMcqAnswers={answers => updateResource(selectedId, { mcqAnswers: answers, result: null })} setGapAnswers={answers => updateResource(selectedId, { gapAnswers: answers, result: null })} setTheoryAnswers={answers => updateResource(selectedId, { theoryAnswers: answers })} setResult={value => updateResource(selectedId, { result: value })} isSubmitting={pending === 'submit'} /> : <GenerateResource type="practice" busy={busy} onGenerate={() => generate('practice')} />)}<p className="session-footnote">Generated resources are saved to your account. Reopening them uses no extra pack allowance. Your current practice answers remain available during this visit.</p></>)}
    {view === 'progress' && <><div className="page-heading"><div><h1>My progress</h1><p>Practice results from your current visit.</p></div></div>{Object.entries(resources).filter(([, value]) => value.result).length ? Object.entries(resources).filter(([, value]) => value.result).map(([id, value]) => <article className="result-row" key={id}><div><h2>{materials.find(item => item.id === id)?.filename}</h2><p>{value.result.correct_mcqs} / 5 mcqs · {value.result.correct_gaps} / 3 keyword gaps</p></div><strong>{value.result.percentage}%</strong><button className="button secondary" onClick={() => openMaterial(materials.find(item => item.id === id), 'practice')}>Review</button></article>) : <section className="resource-empty"><Icon name="progress" /><h2>No practice results yet</h2><p>Complete a quiz on your lecture to see your score here.</p><button className="button primary" onClick={() => { setTab('practice'); navigate('study') }}>Start practice <Icon name="arrow" /></button></section>}<p className="session-footnote">Theory prompts are for self-review. Topic-level analysis and saved progress across visits are not connected yet.</p></>}
    </main></div></div>
}

export default function App() {
  return <AuthGate><StudyDashboard /></AuthGate>
}
