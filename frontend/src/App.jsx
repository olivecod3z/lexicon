import { useEffect, useRef, useState } from 'react'
import { api, browserLibrary } from './api'
import Icon from './components/Icon'
import UploadCard from './components/UploadCard'
import Practice from './components/Practice'
import DocumentReader from './components/DocumentReader'
import { StudyNotes, FlashcardReview, GenerateResource } from './components/StudyResources'
import './App.css'
import './components/Practice.css'
import '../../shared/design-system.css'
import './design-system.css'


const navigation = [['overview', 'home', 'Dashboard'], ['materials', 'book', 'My materials'], ['study', 'layers', 'Study workspace'], ['progress', 'progress', 'My progress']]
const tabs = [...(browserLibrary ? [['document', 'file', 'Original lecture']] : []), ['notes', 'file', 'Study notes'], ['cards', 'layers', 'Flashcards'], ['practice', 'practice', 'Practice & quiz']]

export default function App() {
  const [view, setView] = useState('overview')
  const [tab, setTab] = useState(browserLibrary ? 'document' : 'notes')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [materials, setMaterials] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  // Keep each lecture's generated resources and answers together when switching views.
  const [resources, setResources] = useState({})
  const [loadingLibrary, setLoadingLibrary] = useState(true)
  const [libraryError, setLibraryError] = useState('')
  const [notice, setNotice] = useState(null)
  const [pending, setPending] = useState(null)
  const heading = useRef(null)
  const uploadInput = useRef(null)
  const busy = !!pending
  const material = materials.find(item => item.id === selectedId)
  const current = resources[selectedId] || {}
  const practice = current.session?.practice
  const mcqAnswers = current.mcqAnswers || {}
  const gapAnswers = current.gapAnswers || {}
  const theoryAnswers = current.theoryAnswers || {}
  const result = current.result

  useEffect(() => {
    let active = true
    api('/materials').then(items => {
      if (!active) return
      setMaterials(previous => [...previous, ...items.filter(item => !previous.some(existing => existing.id === item.id))])
    }).catch(error => { if (active) setLibraryError(error.message) }).finally(() => { if (active) setLoadingLibrary(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const closeMenu = event => { if (event.key === 'Escape') setMobileOpen(false) }
    document.addEventListener('keydown', closeMenu)
    return () => document.removeEventListener('keydown', closeMenu)
  }, [])

  useEffect(() => {
    if (!mobileOpen) return
    const menu = document.querySelector('.mobile-menu')
    const sidebar = document.querySelector('.sidebar')
    sidebar?.querySelector('a, button')?.focus()
    const trap = event => {
      if (event.key !== 'Tab') return
      const items = [...sidebar.querySelectorAll('a, button'), menu].filter(Boolean)
      const first = items[0], last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', trap)
    return () => { document.removeEventListener('keydown', trap); menu?.focus() }
  }, [mobileOpen])

  function navigate(next) {
    setView(next); setMobileOpen(false)
    requestAnimationFrame(() => { heading.current?.focus(); window.scrollTo({ top: 0, behavior: 'instant' }) })
  }
  function updateResource(id, changes) {
    setResources(previous => ({ ...previous, [id]: { ...previous[id], ...changes } }))
  }
  function openMaterial(item, nextTab = browserLibrary ? 'document' : view === 'study' ? tab : 'notes') {
    setSelectedId(item.id); setTab(nextTab); setNotice(null); navigate('study')
  }
  async function reloadLibrary() {
    setLoadingLibrary(true); setLibraryError('')
    try { setMaterials(await api('/materials')) }
    catch (error) { setLibraryError(error.message) }
    finally { setLoadingLibrary(false) }
  }
  async function uploadFiles(files) {
    if (busy) return
    const items = Array.isArray(files) ? files : [files]
    let saved = 0
    for (const file of items) if (await uploadFile(file)) saved++
    if (items.length > 1) setNotice({ error: saved !== items.length, text: `${saved} of ${items.length} lectures saved.${saved !== items.length ? ' Some files could not be read. Retry those files individually for details.' : ''}` })
  }
  async function uploadFile(file) {
    if (!file || busy) return
    if (browserLibrary && !/\.(pdf|txt)$/i.test(file.name)) return setNotice({ error: true, text: 'Choose a pdf or utf-8 txt file.' })
    if (!/\.(pdf|docx|pptx|txt)$/i.test(file.name)) return setNotice({ error: true, text: 'Choose a pdf, docx, pptx or txt file.' })
    if (!file.size) return setNotice({ error: true, text: 'This file is empty. Please choose another file.' })
    if (file.size > 25 * 1024 * 1024) return setNotice({ error: true, text: 'Please choose a file that is 25 megabytes or smaller.' })
    setPending('upload'); setNotice({ text: 'Reading and saving your lecture…' })
    try {
      const body = new FormData(); body.append('file', file)
      const uploaded = await api('/materials', { method: 'POST', body, onProgress: text => setNotice({ text }) })
      setMaterials(previous => [uploaded, ...previous.filter(item => item.id !== uploaded.id)])
      openMaterial(uploaded)
      return true
    } catch (error) { setNotice({ error: true, text: error.message }) }
    finally { setPending(null) }
  }
  async function removeFile(item) {
    if (!window.confirm(`Remove "${item.filename}" from this browser library? Your original file on disk is not affected.`)) return
    setPending('remove')
    try {
      await api(`/materials/${item.id}`, { method: 'DELETE' })
      setMaterials(previous => previous.filter(value => value.id !== item.id))
      if (selectedId === item.id) { setSelectedId(null); navigate('materials') }
      setNotice({ text: 'Lecture removed from this browser.' })
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

  function renderLibrary(limit) {
    return <section className="materials-section"><div className="section-heading"><h2>{limit ? 'Your recent materials' : 'Your materials'}</h2>{limit && materials.length > limit && <button className="text-button" onClick={() => navigate('materials')}>View all <Icon name="arrow" /></button>}</div>{loadingLibrary && <p className="muted" role="status">Loading your library…</p>}{libraryError && <div className="library-error" role="alert"><p>{libraryError}</p><button className="text-button" onClick={reloadLibrary} disabled={loadingLibrary}>Retry loading library</button></div>}{materials.length ? <div className="material-list">{materials.slice(0, limit || materials.length).map(item => <article className="material-row" key={item.id}><span className="file-symbol"><Icon name="file" /></span><div><h3>{item.filename}</h3><p>{new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {resources[item.id]?.notes ? 'Notes ready' : 'Ready to study'}{resources[item.id]?.cards ? ' · Flashcards ready' : ''}</p></div><button className="button secondary" disabled={busy} onClick={() => openMaterial(item)}>Open <Icon name="arrow" /></button>{browserLibrary && <button className="text-button" disabled={busy} aria-label={`Remove ${item.filename}`} onClick={() => removeFile(item)}>Remove</button>}</article>)}</div> : !loadingLibrary && !libraryError && <div className="empty-materials"><Icon name="book" /><div><h3>No lectures uploaded yet</h3><p>Your uploaded materials will appear here.</p></div></div>}</section>
  }

  return <div className="workspace focused-workspace"><a className="skip-link" href="#main-content">Skip to content</a><aside className={`sidebar ${mobileOpen ? 'is-open' : ''}`}><a className="brand" href="#" onClick={event => { event.preventDefault(); navigate('overview') }}><Icon name="layers" /><span>lexicon.</span></a><p className="nav-caption">My workspace</p><nav aria-label="Main navigation">{navigation.map(([id, icon, label]) => <button key={id} className={view === id ? 'active' : ''} aria-current={view === id ? 'page' : undefined} onClick={() => navigate(id)}><Icon name={icon} />{label}</button>)}</nav><div className="sidebar-bottom"><a className="text-button" href="/">Back to Lexicon home</a><p>Your study tools</p>{tabs.map(([id, icon, label]) => <button className="tool-link" key={id} onClick={() => { setTab(id); navigate('study') }}><Icon name={icon} />{label}</button>)}</div></aside>{mobileOpen && <button tabIndex={-1} className="nav-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}<div className="workspace-main"><header className="topbar"><button className="icon-button mobile-menu" aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}><Icon name={mobileOpen ? 'close' : 'menu'} /></button><div className="breadcrumb"><b>{navigation.find(item => item[0] === view)?.[2]}</b></div>{material && view === 'study' && <span className="current-file">{material.filename}</span>}<input ref={uploadInput} type="file" multiple hidden accept={browserLibrary ? ".pdf,.txt" : ".pdf,.docx,.pptx,.txt"} onChange={event => { uploadFiles(Array.from(event.target.files)); event.target.value = '' }} /><button className="button primary" disabled={busy} onClick={() => uploadInput.current?.click()}><Icon name="upload" />Upload pdf</button></header><main inert={mobileOpen} id="main-content" tabIndex="-1" ref={heading} className="main-content">{browserLibrary && <section className="hosting-preview" aria-label="Document storage information"><strong>Your private browser library</strong><p>Drop a pdf to read and save it on this device. Files stay in this browser, not in a cloud account. Clearing browser data removes them; keep your original copies.</p><a href="/#demo">Try the interactive sample study pack</a></section>}<div className={`status-message ${notice?.error ? 'error' : ''}`} role={notice?.error ? 'alert' : 'status'} hidden={!notice}>{notice?.text}</div>
    {view === 'overview' && <><div className="page-heading"><div><h1>Your study dashboard</h1><p>{browserLibrary ? "Add your pdfs. Read your lectures. Keep them together." : "Upload a lecture. Study your notes. Test what you know."}</p></div></div><UploadCard onUpload={uploadFiles} busy={busy} browserLibrary={browserLibrary} /><div className="tool-overview">{tabs.map(([id, icon, label]) => <button key={id} onClick={() => { setTab(id); navigate('study') }}><Icon name={icon} /><div><b>{label}</b><span>{id === 'document' ? 'Read your saved pdfs and text' : id === 'notes' ? 'Key ideas from your lectures' : id === 'cards' ? 'Recall and review key concepts' : 'multiple-choice questions, keyword gaps and theory'}</span></div><Icon name="arrow" /></button>)}</div>{material && <section className="resume-strip"><div><span className="muted">Continue studying</span><h3>{material.filename}</h3></div><button className="button dark" onClick={() => navigate('study')}>Resume <Icon name="arrow" /></button></section>}{renderLibrary(5)}</>}
    {view === 'materials' && <><div className="page-heading"><div><h1>My materials</h1><p>Your saved lectures. Open a file to access its study tools.</p></div></div>{renderLibrary()}<div className="compact-upload"><UploadCard onUpload={uploadFiles} busy={busy} browserLibrary={browserLibrary} /></div></>}
    {view === 'study' && (!material ? <><div className="page-heading"><div><h1>{tabs.find(item => item[0] === tab)[2]}</h1><p>Choose a lecture from your library or upload a pdf to get started.</p></div></div><UploadCard onUpload={uploadFiles} busy={busy} browserLibrary={browserLibrary} /><div className="library-spacing">{renderLibrary()}</div></> : <><div className="page-heading study-heading"><div><button className="text-button" onClick={() => navigate('materials')}>← My materials</button><h1>{material.filename}</h1><p>{browserLibrary ? "Read your original lecture. Automated study tools are not connected yet." : "Study tools built from this lecture."}</p></div></div><div className="segmented" aria-label="Lecture study tools">{tabs.map(([id, icon, label]) => <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)}><Icon name={icon} />{label}</button>)}</div>{tab === 'document' && browserLibrary && <DocumentReader key={selectedId} material={material} />}{tab === 'notes' && (current.notes ? <StudyNotes notes={current.notes} /> : <GenerateResource unavailable={browserLibrary} type="notes" busy={busy} onGenerate={() => generate('notes')} />)}{tab === 'cards' && (current.cards ? <FlashcardReview key={selectedId} cards={current.cards} /> : <GenerateResource unavailable={browserLibrary} type="cards" busy={busy} onGenerate={() => generate('cards')} />)}{tab === 'practice' && (practice ? <Practice {...{ practice, mcqAnswers, gapAnswers, theoryAnswers, result, submitPractice }} setMcqAnswers={answers => updateResource(selectedId, { mcqAnswers: answers, result: null })} setGapAnswers={answers => updateResource(selectedId, { gapAnswers: answers, result: null })} setTheoryAnswers={answers => updateResource(selectedId, { theoryAnswers: answers })} setResult={value => updateResource(selectedId, { result: value })} isSubmitting={pending === 'submit'} /> : <GenerateResource unavailable={browserLibrary} type="practice" busy={busy} onGenerate={() => generate('practice')} />)}<p className="session-footnote">{browserLibrary ? "Your original document stays in this browser until you remove it or clear browser data. Automated generation is not connected yet." : "Generated resources and answers remain available during this visit. Your uploaded lecture is saved in your local library."}</p></>)}
    {view === 'progress' && <><div className="page-heading"><div><h1>My progress</h1><p>Practice results from your current visit.</p></div></div>{Object.entries(resources).filter(([, value]) => value.result).length ? Object.entries(resources).filter(([, value]) => value.result).map(([id, value]) => <article className="result-row" key={id}><div><h2>{materials.find(item => item.id === id)?.filename}</h2><p>{value.result.correct_mcqs} / 5 multiple-choice questions · {value.result.correct_gaps} / 3 keyword gaps</p></div><strong>{value.result.percentage}%</strong><button className="button secondary" onClick={() => openMaterial(materials.find(item => item.id === id), 'practice')}>Review</button></article>) : <section className="resource-empty"><Icon name="progress" /><h2>No practice results yet</h2><p>Complete a quiz on your lecture to see your score here.</p><button className="button primary" onClick={() => { setTab('practice'); navigate('study') }}>Start practice <Icon name="arrow" /></button></section>}<p className="session-footnote">Theory prompts are for self-review. Topic-level analysis and saved progress across visits are not connected yet.</p></>}
    </main></div></div>
}
