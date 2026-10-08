export default function LibraryState({ unavailable = false, onRetry, loading = false }) {
  return <div className="library-state">
    <div className="library-book" aria-hidden="true">
      <span className="book-cover" /><span className="book-left" /><span className="book-right" />
      <span className="book-leaf leaf-one" /><span className="book-leaf leaf-two" /><span className="book-leaf leaf-three" />
    </div>
    <h3>{unavailable ? 'Your materials are unavailable right now' : 'Your next chapter starts here'}</h3>
    <p>{unavailable ? 'We couldn’t load your library. Try again in a moment.' : 'Upload your first lecture to start filling your study library.'}</p>
    {unavailable && <button className="button secondary" onClick={onRetry} disabled={loading}>{loading ? 'Trying again…' : 'Try again'}</button>}
  </div>
}