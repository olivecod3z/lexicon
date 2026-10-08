import { useEffect, useRef, useState } from 'react'
import sealPoster from '../assets/lexycon-study-seal.webp'
import sealMotion from '../assets/lexycon-study-reveal.mp4'
import './StudyLoading.css'

export default function StudyLoading({ active = true, children, message = 'Opening your study space\u2026' }) {
  const video = useRef(null)
  const [motionAllowed, setMotionAllowed] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [wasActive, setWasActive] = useState(active)
  const [leaving, setLeaving] = useState(false)
  if (wasActive !== active) {
    setWasActive(active)
    setLeaving(!active)
  }
  const visible = active || (leaving && motionAllowed)

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      setMotionAllowed(!preference.matches)
      setPlaying(false)
    }
    update()
    preference.addEventListener('change', update)
    return () => preference.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const player = video.current
    if (!player) return
    let active = true
    let requesting = false
    const play = () => {
      if (!active || requesting || document.hidden || player.ended || !player.paused) return
      player.defaultMuted = true
      player.muted = true
      requesting = true
      // Autoplay can be blocked on mobile; the still remains visible until playback starts.
      player.play().catch(() => { if (active) setPlaying(false) }).finally(() => { requesting = false })
    }
    const updateVisibility = () => { if (document.hidden) player.pause(); else play() }
    player.addEventListener('canplay', play)
    document.addEventListener('visibilitychange', updateVisibility)
    document.addEventListener('pointerup', play, { passive: true })
    document.addEventListener('touchend', play, { passive: true })
    window.addEventListener('pageshow', play)
    updateVisibility()
    return () => {
      active = false
      player.removeEventListener('canplay', play)
      document.removeEventListener('visibilitychange', updateVisibility)
      document.removeEventListener('pointerup', play)
      document.removeEventListener('touchend', play)
      window.removeEventListener('pageshow', play)
      player.pause()
    }
  }, [motionAllowed, visible])

  return <>
    {!active && children}
    {visible && <main
      className={`study-loading${!active ? ' is-leaving' : ''}`}
      aria-label="Loading Lexycon"
      aria-hidden={!active || undefined}
      onAnimationEnd={event => {
        if (event.target === event.currentTarget && !active) setLeaving(false)
      }}
    >
    <div className="study-loading__content">
      <div className="study-loading__emblem" aria-hidden="true">
        <img className="study-loading__poster" src={sealPoster} alt="" width="960" height="960" decoding="async" fetchPriority="high" />
        {motionAllowed && <video
          ref={video}
          className={`study-loading__video${playing ? ' is-playing' : ''}`}
          src={sealMotion}
          poster={sealPoster}
          autoPlay muted playsInline controls={false} preload="auto"
          disablePictureInPicture disableRemotePlayback tabIndex={-1}
          onPlaying={() => setPlaying(true)}
          onEnded={() => setPlaying(false)}
          onError={() => setPlaying(false)}
        />}
      </div>
      <p className="study-loading__status" role="status" aria-live="polite" aria-atomic="true">{message}</p>
    </div>
    </main>}
  </>
}
