import { useState } from 'react'
import Icon from './Icon'

export default function UploadCard({ onUpload, busy }) {
  const [dragging, setDragging] = useState(false)
  return <section className={`upload-card ${dragging ? 'drag-active' : ''}`} aria-busy={busy}
    onDragOver={event => { event.preventDefault(); if (!busy) setDragging(true) }}
    onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false) }}
    onDrop={event => { event.preventDefault(); setDragging(false); if (!busy) onUpload(event.dataTransfer.files[0]) }}>
    <div className="upload-symbol"><Icon name="upload" /></div>
    <h3>{busy ? 'Please wait…' : 'Upload a lecture PDF'}</h3>
    <p>{busy ? 'Finishing your current request.' : 'Drag and drop your PDF here, or choose a file.'}</p>
    <label className={`button primary file-picker ${busy ? 'disabled' : ''}`}>
      <input type="file" aria-label="Upload PDF or lecture material" accept=".pdf,.docx,.pptx,.txt" disabled={busy} onChange={event => { onUpload(event.target.files[0]); event.target.value = '' }} />
      <Icon name="upload" /> {busy ? 'Please wait…' : 'Upload PDF'}
    </label>
    <small>Up to 25 MB · Also accepts DOCX, PPTX and TXT</small>
  </section>
}
