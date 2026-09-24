# Accessibility verification

Target: WCAG 2.2 AA. This is an implementation and test record, not a conformance certificate.

## Checks completed (September 24, 2026)

- Both production builds and the dashboard linter pass.
- Shared normal-text palette pairs pass 4.5:1 (lowest measured pair: 5.42:1).
  Repeat with `node scripts/check-design-contrast.mjs`.
- axe-core checks using WCAG A/AA tags reported no violations on the dashboard
  overview and no violations on the corrected landing-page default state.
- Reviewed the landing page's additional ARIA-label findings and supplied group/image roles.
- Inspected rendered solid-background text contrast and corrected faint preview labels.
- Keyboard: study tabs respond to arrows; the project-status dialog closes with
  Escape and restores its trigger; mobile dashboard focus wraps and returns to
  the menu trigger on Escape.
- Landing and dashboard fit a 320px-wide viewport without horizontal page overflow.
- Sample quiz feedback uses text and an icon as well as color.
- Motion starts paused, has play/pause controls, and is disabled by reduced-motion styles.

## Still requires broader manual evaluation

The landing page uses images and gradients. axe cannot resolve those backgrounds
reliably and returns incomplete contrast checks; a zero-violation report is not
proof that every visual state passes. Test screen-reader use (VoiceOver/NVDA),
200% text resizing, 400% zoom, custom text spacing, and generated study content
before claiming full conformance. The hosted dashboard supports device-local document uploads and reading. The
original-document viewer depends on browser PDF accessibility and the uploaded
source; generated study tools still require a connected service. The earlier
hosted scan predates the upload flow.

## Maintenance

Keep semantic colors/type/motion in `shared/design-system.css`; map component
roles in each application's `design-system.css`. Use MingCute Core Regular.
Repeat checks whenever adding components, imagery or interaction states.
