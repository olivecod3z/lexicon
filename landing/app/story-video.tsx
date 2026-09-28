'use client';

import { useRef, useState } from 'react';
import { Play } from './icons';

export default function StoryVideo() {
  const video = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState(false);

  async function start() {
    const player = video.current;
    if (!player) return;

    setError(false);
    player.controls = true;

    try { await player.play(); player.focus(); }
    catch { setError(true); }
  }

  return <section className="story-section wrap" aria-labelledby="story-title">
    <div className="story-copy">
      <h2 id="story-title">See the study routine<br /><span className="heading-continuation">come to life.</span></h2>
      <p>A short introduction to the idea behind Lexicon: turn your lectures into notes, practise what you know, and make room for understanding.</p>
      <p className="story-availability">You can upload and read documents in the live dashboard today. Automated study tools shown in the video are not connected online yet.</p>
      <a className="button lime" href="/dashboard/">Open student dashboard</a>
    </div>
    <figure className="story-figure">
      <div className="story-player">
        <video ref={video} src="/videos/lexicon-story.mp4" autoPlay muted loop controls playsInline preload="metadata" onPlaying={() => setStarted(true)} poster="/videos/lexicon-story-poster.jpg" tabIndex={0} aria-label="Lexicon promotional video, 57 seconds" aria-describedby="story-caption" onError={() => setError(true)} />
        {!started && <button className="story-play" onClick={start} aria-label="Watch Lexicon in action, 57 seconds"><span className="story-play-icon"><Play size={26} /></span><span>Watch Lexicon in action<small>57 sec · Starts muted</small></span></button>}
      </div>
      <figcaption id="story-caption">A little less overwhelm. A little more clarity.</figcaption>
      {error && <p role="status">Having trouble playing? <a href="/videos/lexicon-story.mp4">Open the video directly</a>.</p>}
    </figure>
  </section>;
}
