import { useState } from 'react'
import Icon from './Icon'

export default function UploadCard({ onUpload, busy, browserLibrary = false }) {
  const [dragging, setDragging] = useState(false)
  return <section className={`upload-card ${dragging ? 'drag-active' : ''}`} aria-busy={busy}
    onDragOver={event => { event.preventDefault(); if (!busy) setDragging(true) }}
    onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false) }}
    onDrop={event => { event.preventDefault(); setDragging(false); if (!busy) onUpload(Array.from(event.dataTransfer.files)) }}>
    <div className="upload-symbol"><Icon name="upload" /></div>
    <h3>{busy ? 'Please wait…' : 'Upload a lecture pdf'}</h3>
    <p>{busy ? 'Finishing your current request.' : 'Drag and drop your pdf here, or choose a file.'}</p>
    <label className={`button primary file-picker ${busy ? 'disabled' : ''}`}>
      <input type="file" multiple aria-label="Upload pdf or lecture material" accept={browserLibrary ? ".pdf,.txt" : ".pdf,.docx,.pptx,.txt"} disabled={busy} onChange={event => { onUpload(Array.from(event.target.files)); event.target.value = '' }} />
      <Icon name="upload" /> {busy ? 'Please wait…' : 'Upload pdf'}
    </label>
    <small>{browserLibrary ? "Up to 25 megabytes · pdf and txt · Saved on this device" : "Up to 25 megabytes · Also accepts docx, pptx and txt"}</small>
  </section>
}
