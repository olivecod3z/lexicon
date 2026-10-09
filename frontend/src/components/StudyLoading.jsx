import Icon from './Icon'
import './StudyLoading.css'

export default function StudyLoading({ message = 'Opening your study space\u2026' }) {
  return <main className="study-loading" aria-label="Loading Lexycon">
    <div className="study-loading__content">
      <div className="study-loading__emblem" aria-hidden="true">
        <span className="study-loading__ring" />
        <Icon name="layers" className="study-loading__mark" />
      </div>
      <div className="study-loading__wordmark" aria-hidden="true">lexycon<span>.</span></div>
      <p className="study-loading__status" role="status" aria-live="polite" aria-atomic="true">{message}</p>
    </div>
  </main>
}
