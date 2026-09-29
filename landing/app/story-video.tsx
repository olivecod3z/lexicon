'use client';

import { useEffect, useRef, useState } from 'react';
import usePageVisible from './use-page-visible';

export default function StoryVideo() {
  const video = useRef<HTMLVideoElement>(null);
  const pageVisible = usePageVisible();
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [error, setError] = useState(false);
  const playing = visible && pageVisible && !reduced;

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener('change', update);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .2 });
    if (video.current) observer.observe(video.current);
    return () => { media.removeEventListener('change', update); observer.disconnect(); };
  }, []);

  useEffect(() => {
    const player = video.current;
    if (!player) return;
    let active = true;
    if (playing) {
      player.muted = true;
      void player.play().then(() => { if (active) setError(false); }).catch(reason => {
        if (active && reason.name !== 'AbortError') setError(true);
      });
    } else player.pause();
    return () => { active = false; player.pause(); };
  }, [playing]);

  return <section className="story-section wrap" aria-labelledby="story-title">
    <div className="story-copy">
      <h2 id="story-title">See the study routine<br /><span className="heading-continuation">come to life.</span></h2>
      <p>A short introduction to the idea behind Lexicon: turn your lectures into notes, practise what you know, and make room for understanding.</p>
      <p className="story-availability">You can upload and read documents in the live dashboard today. Automated study tools shown in the video are not connected online yet.</p>
      <a className="button lime" href="/dashboard/">Open student dashboard</a>
    </div>
    <figure className="story-figure">
      <div className="story-player">
        <video ref={video} src={reduced ? undefined : '/videos/lexicon-story.mp4'} autoPlay={playing} muted loop playsInline controls={false} preload="metadata" poster="/videos/lexicon-story-poster.jpg" tabIndex={-1} aria-label="Lexicon promotional video, 58 seconds" aria-describedby="story-caption" onError={() => setError(true)} />
      </div>
      <figcaption id="story-caption">A little less overwhelm. A little more clarity.</figcaption>
      {error && <p role="status">Having trouble playing? <a href="/videos/lexicon-story.mp4">Open the video directly</a>.</p>}
    </figure>
  </section>;
}
