import { useState } from 'react'
import Icon from './Icon'

export default function UploadCard({ onUpload, busy, unavailable = false }) {
  const [dragging, setDragging] = useState(false)
  return <section className={`upload-card ${dragging ? 'drag-active' : ''}`} aria-busy={busy}
    onDragOver={event => { event.preventDefault(); if (!busy && !unavailable) setDragging(true) }}
    onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false) }}
    onDrop={event => { event.preventDefault(); setDragging(false); if (!busy && !unavailable) onUpload(event.dataTransfer.files[0]) }}>
    <div className="upload-symbol"><Icon name="upload" /></div>
    <h3>{unavailable ? 'Uploads are coming soon' : busy ? 'Please wait…' : 'Upload a lecture PDF'}</h3>
    <p>{unavailable ? 'Explore the dashboard while we connect the study service.' : busy ? 'Finishing your current request.' : 'Drag and drop your PDF here, or choose a file.'}</p>
    <label className={`button primary file-picker ${busy || unavailable ? 'disabled' : ''}`}>
      <input type="file" aria-label="Upload PDF or lecture material" accept=".pdf,.docx,.pptx,.txt" disabled={busy || unavailable} onChange={event => { onUpload(event.target.files[0]); event.target.value = '' }} />
      <Icon name="upload" /> {busy ? 'Please wait…' : 'Upload PDF'}
    </label>
    <small>Up to 25 MB · Also accepts DOCX, PPTX and TXT</small>
  </section>
}
