# Card Back Artwork

Created with the built-in image generation tool on September 29, 2026. The existing `landing/public/images/study-ribbon.webp` provided the material/style reference. These are decorative image assets, not generated UI mockups.

## Final Files

- `landing/public/images/card-back-lime.webp`
- `landing/public/images/card-back-orange.webp`
- `landing/public/images/card-back-blue.webp`

Each image is a 768 x 1024 WebP, displayed edge to edge with `object-fit: cover`. The colours and gloss are baked into the images. There are no runtime colour filters. The page loads and decodes the images before a nearby card is flipped.

## Prompts

### Green and Lime

Use case: stylized-concept. Asset type: full-bleed portrait website card-back texture, not a mockup. Reference image is style reference for the glossy lime and green striated ribbon material. Create a close-up flowing pattern of that same polished silky green and electric-lime ribbon, but tightly packed sweeping folds must cover EVERY pixel of the rectangular image edge to edge. Crop into the material, no visible background, no blank white areas, no borders, no isolated ribbon on a white canvas, no text or icons. Portrait 3:4 composition. Broad flowing diagonal S-shaped bands, rich bright green valleys and luminous chartreuse lime crests, fine parallel fiber-like glossy striations with crisp specular reflections, clean premium finish matching reference. Restrained number of broad waves so the pattern isn't noisy. Fill all corners with glossy green/lime folds.

### Orange and White (Original)

Edit target: the supplied full-bleed portrait ribbon pattern. Keep the EXACT flowing fold composition, full-canvas edge-to-edge crop, fine silky striations, photoreal polished gloss and light reflections. Change ONLY the material colours to vivid tangerine orange ribbons interleaved with pearly white ribbons. Approximately 65% saturated orange and 35% glossy pearly white material; the white is curved dimensional ribbon with shadows, NEVER a flat blank background. Orange must look fresh orange, not brown/gold. No green or lime remains, no black shadows, no text, no border. Fill every corner and the whole canvas with ribbon material, same 3:4 portrait.

### Fully Orange (Final Revision)

Edit target: the supplied orange-and-white full-bleed ribbon texture. Change ONLY the colour palette. The user wants this ENTIRELY ORANGE with absolutely NO white ribbons, NO white bands, NO pearly white material, NO silver/cream/beige bands, NO blank background. Replace every white fold with rich saturated tangerine orange. Keep all the same flowing fold shapes, fine silk-like striations and glossy depth. Use vivid tangerine and amber-orange highlights, deeper burnt-orange valleys but avoid brown; every pixel reads orange. Specular highlights should be pale golden orange, not white. Same portrait composition filled edge to edge, no text, icons or border.

### Blue

Edit target: the supplied full-bleed portrait ribbon pattern. Keep the EXACT flowing fold composition, full-canvas edge-to-edge crop, fine silky striations, photoreal polished gloss and crisp light reflections. Change ONLY the material colours to rich cobalt BLUE valleys and luminous bright sky BLUE / icy cyan crests, uniformly and unmistakably blue, absolutely no purple, no green, no lime, no orange. No blank background, no text, no border, no black shadows. Fill every corner and the whole canvas with glossy blue ribbon material, same 3:4 portrait.

## Motion

All animated landing previews loop automatically while visible, including the hero dashboard and the study toolkit. The promotional video loops muted without playback controls. Hidden faces, offscreen cards and background tabs suspend their previews to avoid wasted rendering; returning resumes their loops. Reduced-motion preferences replace the animations with static scenes. There are no play or pause controls on the landing page.

Flips use one evenly eased transform. Nearby cards prepare their rendering layers ahead of interaction. The animated connector lines and answer highlight use transform/opacity instead of repeatedly repainting SVG strokes and background colours.

## Verification

The browser checks cover automatic playback beyond one complete loop, absence of play/pause controls, independent flips, keyboard operation, touch, rapid clicks, stable dimensions, image coverage, six viewport widths (320 through 1440 pixels), and reduced motion. Production builds also validate the TypeScript code.
