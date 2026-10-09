import { useEffect, useRef, useState } from 'react'
import unitPoster from '../assets/lexycon-study-unit.webp'
import sealMotion from '../assets/lexycon-study-reveal.mp4'
import './StudyLoading.css'

export default function StudyLoading({ active = true, children, fallback, message = 'Opening your study space\u2026' }) {
  const video = useRef(null)
  const [motionAllowed, setMotionAllowed] = useState(null)
  const [phase, setPhase] = useState(active ? 'waiting' : 'complete')
  const [dismissed, setDismissed] = useState(!active)
  if (motionAllowed === false && !dismissed) setDismissed(true)
  const settled = phase === 'complete' || phase === 'fallback' || motionAllowed === false
  // The intro finishes once per visit; network requests continue in the page.
  const leaving = settled
  const visible = !dismissed && motionAllowed !== false
  const covered = active || (visible && !leaving)
  const showStill = phase === 'fallback' || motionAllowed === false

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      setMotionAllowed(!preference.matches)
      if (preference.matches) setPhase('fallback')
    }
    update()
    preference.addEventListener('change', update)
    return () => preference.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const player = video.current
    if (!player) return
    let alive = true
    let finished = false
    let requesting = false
    let started = false
    // A stalled media download must never trap the user behind the intro.
    // Cold mobile/CDN downloads can take several seconds before the first frame.
    let deadline = window.setTimeout(() => finish('fallback'), 8000)
    function finish(next) {
      if (!alive || finished) return
      finished = true
      window.clearTimeout(deadline)
      player.pause()
      setPhase(next)
    }
    const complete = () => finish('complete')
    const fail = () => finish('fallback')
    const play = () => {
      if (!alive || finished || requesting || document.hidden) return
      if (player.ended) { complete(); return }
      player.defaultMuted = true
      player.muted = true
      requesting = true
      player.play().then(() => {
        if (alive && !finished && !started) {
          started = true
          window.clearTimeout(deadline)
          deadline = window.setTimeout(() => finish('fallback'), 6000)
          setPhase('playing')
        }
      }).catch(fail).finally(() => { requesting = false })
    }
    const updateVisibility = () => { if (document.hidden) player.pause(); else play() }
    player.addEventListener('canplay', play)
    player.addEventListener('ended', complete)
    player.addEventListener('error', fail)
    document.addEventListener('visibilitychange', updateVisibility)
    window.addEventListener('pageshow', play)
    updateVisibility()
    return () => {
      alive = false
      window.clearTimeout(deadline)
      player.removeEventListener('canplay', play)
      player.removeEventListener('ended', complete)
      player.removeEventListener('error', fail)
      document.removeEventListener('visibilitychange', updateVisibility)
      window.removeEventListener('pageshow', play)
      player.pause()
    }
  }, [motionAllowed, visible])

  return <>
    {children && <div className="study-loading__destination" hidden={covered} inert={covered} aria-hidden={covered || undefined}>{children}</div>}
    {active && (!visible || leaving) && fallback}
    {visible && <main
      className={`study-loading${leaving ? ' is-leaving' : ''}`}
      data-phase={showStill ? 'fallback' : phase}
      aria-label="Loading Lexycon"
      aria-hidden={leaving || undefined}
      onAnimationEnd={event => {
        if (event.target === event.currentTarget && leaving) setDismissed(true)
      }}
    >
    <div className="study-loading__content">
      <div className="study-loading__emblem" aria-hidden="true">
        <img className="study-loading__poster" src={unitPoster} alt="" width="960" height="960" decoding="async" fetchPriority="high" />
        {motionAllowed && !showStill && <video
          ref={video}
          className={`study-loading__video${phase === 'playing' || phase === 'complete' ? ' is-playing' : ''}`}
          src={sealMotion}
          poster={unitPoster}
          autoPlay muted playsInline controls={false} preload="auto"
          disablePictureInPicture disableRemotePlayback tabIndex={-1}
        />}
      </div>
      <p className="study-loading__status" role="status" aria-live="polite" aria-atomic="true">{message}</p>
    </div>
    </main>}
  </>
}
