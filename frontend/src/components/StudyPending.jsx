import Icon from './Icon'
import './StudyPending.css'

export default function StudyPending({ signingIn = false }) {
  return <div className="study-pending">
    <header className="study-pending__header">
      <a href="https://lexycon.site/" className="study-pending__brand"><Icon name="layers" /><span>lexycon.</span></a>
    </header>
    <main className="study-pending__main">
      <h1>Your study space</h1>
      <p role="status">{signingIn ? 'Connecting your account...' : 'Loading your library...'}</p>
      <div className="study-pending__skeleton" aria-hidden="true">
        <div className="study-pending__line study-pending__line--title" />
        <div className="study-pending__line" />
        <div className="study-pending__tools">{[0, 1, 2].map(item => <div key={item} />)}</div>
        <div className="study-pending__rows">{[0, 1, 2].map(item => <div key={item}><span /><span /></div>)}</div>
      </div>
    </main>
  </div>
}
