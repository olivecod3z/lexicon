import { useEffect, useState } from 'react'
import { getDocument } from '../browser-library'

export default function DocumentReader({ material }) {
  const [document, setDocument] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true, url
    getDocument(material.id).then(item => {
      if (!active) return
      url = URL.createObjectURL(new Blob([item.file], { type: item.type === 'pdf' ? 'application/pdf' : 'text/plain' }))
      setDocument({ ...item, url })
    }).catch(e => { if (active) setError(e.message) })
    return () => { active = false; if (url) URL.revokeObjectURL(url) }
  }, [material.id])
  if (error) return <p role="alert">{error}</p>
  if (!document) return <p role="status">Opening your lecture…</p>
  return <section className="document-reader study-paper">
    <div className="section-heading"><div><h2>Original lecture</h2><p>{document.type === 'pdf' ? `${document.unit_count} ${document.unit_count === 1 ? "page" : "pages"} · ` : ''}{(document.size / 1024 / 1024).toFixed(2)} megabytes · Saved in this browser</p></div><a className="button secondary" href={document.url} download={document.filename}>Download original</a></div>
    {document.type === 'pdf' && <><object data={document.url} type="application/pdf" className="pdf-viewer" aria-label={`pdf reader: ${document.filename}`}><p>Your browser cannot display this pdf inline. Use Download original or read the extracted text below.</p></object><p className="session-footnote">If the pdf viewer is unavailable, download the original or use the text below.</p></>}
    <details open={document.type === 'txt'} className="document-text"><summary>Read extracted text</summary>{document.source_text ? <pre>{document.source_text}</pre> : <p>This pdf has no extractable text. You can view the original above. Scanned pages will need text recognition before text-based study tools can read them.</p>}</details>
  </section>
}
