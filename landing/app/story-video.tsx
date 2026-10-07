'use client';

import { useEffect, useRef, useState } from 'react';
import usePageVisible from './use-page-visible';

const DESKTOP_VIDEO = '/videos/lexicon-story.mp4';
const MOBILE_VIDEO = '/videos/lexicon-story-mobile.mp4';
const STREAM_VIDEO = '/videos/lexicon-story-mobile-hls/index.m3u8';

export default function StoryVideo() {
  const video = useRef<HTMLVideoElement>(null);
  const fallbackSource = useRef(DESKTOP_VIDEO);
  const pageVisible = usePageVisible();
  const [visible, setVisible] = useState(false);
  const [nearby, setNearby] = useState(false);
  const [mediaSource, setMediaSource] = useState<string>();
  const [reduced, setReduced] = useState(true);
  const [error, setError] = useState(false);
  const source = nearby && !reduced ? mediaSource : undefined;
  const playing = Boolean(source) && visible && pageVisible && !reduced;

  useEffect(() => {
    const player = video.current;
    if (!player) return;
    // Select once: rotating a phone must not replace the stream mid-playback.
    fallbackSource.current = window.matchMedia('(max-width: 700px)').matches ? MOBILE_VIDEO : DESKTOP_VIDEO;
    setMediaSource(player.canPlayType('application/vnd.apple.mpegurl') ? STREAM_VIDEO : fallbackSource.current);
    player.defaultMuted = true;
    player.muted = true;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener('change', update);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .01 });
    const preload = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setNearby(true);
        preload.disconnect();
      }
    }, { rootMargin: '600px 0px' });
    observer.observe(player);
    preload.observe(player);
    return () => { media.removeEventListener('change', update); observer.disconnect(); preload.disconnect(); };
  }, []);

  useEffect(() => {
    const player = video.current;
    if (!player) return;
    if (!playing) { player.pause(); return; }
    let active = true;
    let pending = false;
    const play = () => {
      if (!active || pending || document.hidden || !player.paused) return;
      player.defaultMuted = true;
      player.muted = true;
      pending = true;
      void player.play().then(() => { if (active) setError(false); }).catch(reason => {
        if (active && reason.name !== 'AbortError' && reason.name !== 'NotAllowedError') setError(true);
      }).finally(() => { pending = false; });
    };
    // Some mobile browsers require a ready event or the next gesture to retry.
    player.addEventListener('canplay', play);
    window.addEventListener('pageshow', play);
    document.addEventListener('touchend', play, { passive: true });
    document.addEventListener('pointerup', play, { passive: true });
    play();
    return () => {
      active = false;
      player.removeEventListener('canplay', play);
      window.removeEventListener('pageshow', play);
      document.removeEventListener('touchend', play);
      document.removeEventListener('pointerup', play);
      player.pause();
    };
  }, [playing, source]);

  function handleError() {
    if (mediaSource === STREAM_VIDEO) {
      setMediaSource(fallbackSource.current);
      setError(false);
    } else setError(true);
  }

  return <section className="story-section wrap" aria-labelledby="story-title">
    <div className="story-copy">
      <h2 id="story-title">See the study routine<br /><span className="heading-continuation">come to life.</span></h2>
      <p>A short introduction to the idea behind Lexycon: turn your lectures into notes, practise what you know, and make room for understanding.</p>
      <p className="story-availability">You can upload and read documents in the live dashboard today. Automated study tools shown in the video are not connected online yet.</p>
      <a className="button lime" href="/dashboard/">Open student dashboard</a>
    </div>
    <figure className="story-figure">
      <div className="story-player">
        <video ref={video} src={source} autoPlay={playing} muted loop playsInline controls={false} preload={source ? 'auto' : 'none'} poster="/videos/lexicon-story-poster.jpg" tabIndex={-1} aria-label="Lexycon promotional video, 58 seconds" aria-describedby="story-caption" onError={handleError} />
      </div>
      <figcaption id="story-caption">A little less overwhelm. A little more clarity.</figcaption>
      {error && <p role="status">Having trouble playing? <a href={fallbackSource.current}>Open the video directly</a>.</p>}
    </figure>
  </section>;
}
