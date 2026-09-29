import type { Metadata } from 'next';
import Onboarding from './onboarding';
import './onboarding.css';

export const metadata: Metadata = {
  title: 'Your study setup | Lexicon',
  description: 'Make a little room for learning. Set up your Lexicon study preferences.',
};

export default function OnboardingPage() {
  return <Onboarding />;
}
