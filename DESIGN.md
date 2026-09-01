---
name: Achar seu Pet
description: Uma rede local para transformar pistas em caminhos de volta.
colors:
  forest: "#234f4b"
  accent-caramel: "#c8793d"
  accent-caramel-dark: "#9d542d"
  eye-blue: "#79b9d2"
  eye-blue-deep: "#397e9c"
  sun: "#f3c56e"
  paper: "#f6f2eb"
  surface: "#fffdf9"
  surface-blue: "#e7f1f4"
  text: "#273239"
  muted: "#667075"
  border: "#d9cec0"
typography:
  display:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "clamp(42px, 5.3vw, 70px)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "normal"
  body:
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
rounded:
  xs: "3px"
  sm: "4px"
  md: "5px"
spacing:
  xs: "8px"
  sm: "14px"
  md: "20px"
  lg: "34px"
components:
  button-primary:
    backgroundColor: "{colors.accent-caramel}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    padding: "0 17px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.forest}"
    rounded: "{rounded.sm}"
    padding: "0 17px"
    height: "44px"
  input-field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.text}"
    rounded: "{rounded.xs}"
    padding: "10px 12px"
    height: "44px"
---

# Design System: Achar seu Pet

## Overview

**Creative North Star: "O Atlas de Reencontros"**

The interface treats a missing-pet search like a living route atlas: information is organized for quick scanning, while photographs and human copy keep the experience personal. It is warm without becoming childish, operational without becoming cold, and local without exposing private addresses.

The visual world is built from the Lobinha reference: deep blue-green for trust, caramel for a person taking action, powder blue for geography, and paper tones for calm. The old generic card-and-form language is replaced by editorial spacing, asymmetric composition, route-like dividers and a small number of purposeful surfaces.

**Key Characteristics:**
- Real pet imagery is part of the navigation story, not decoration.
- Dense controls use a clear grid; quiet narrative areas use generous rhythm.
- Copy speaks directly about searching, noticing, registering and sharing.
- Motion is short, interruptible and reduced when the user requests it.

## Colors

The palette pairs a blue-green field with caramel action and a cool blue signal system, grounded by paper neutrals.

### Primary
- **Deep Trust Green** (#234f4b): Hero field, high-emphasis narrative sections and the product's strongest anchor.
- **Lobinha Caramel** (#c8793d): Primary actions, emphasis and warm interaction cues.

### Secondary
- **Caramel Shadow** (#9d542d): Links, compact emphasis and action hover states.
- **Eye Blue** (#79b9d2): Focus accents, map language and geography cues.

### Tertiary
- **Sun Marker** (#f3c56e): High-visibility status and the warm highlight inside dark compositions.

### Neutral
- **Paper** (#f6f2eb): Global page ground and calm reading field.
- **Warm Surface** (#fffdf9): Cards, forms and modal surfaces.
- **Powder Surface** (#e7f1f4): Map, privacy and trust callouts.
- **Ink** (#273239): Primary reading color.
- **Muted Ink** (#667075): Supporting copy and metadata.
- **Quiet Border** (#d9cec0): Dividers and control strokes.

### Named Rules
**The Signal Scarcity Rule.** Caramel and marker yellow are reserved for actions, status and moments that need attention; they should not become a blanket decoration.

## Typography

**Display Font:** Newsreader (with Georgia fallback)
**Body Font:** Outfit (with ui-sans-serif fallback)
**Label/Mono Font:** Outfit for labels; no mono costume is used.

**Character:** Newsreader gives the product a human editorial voice, while Outfit keeps search, forms and metadata clean at small sizes. Display type carries the emotional weight; body type carries the operational load.

### Hierarchy
- **Display** (700, clamp(42px, 5.3vw, 70px), 0.98): Product thesis and page-level emotional statements.
- **Headline** (700, clamp(30px, 4vw, 46px), 1.05): Section openings and meaningful page groups.
- **Title** (700, 24px to 34px, 1.05): Pet names, maps and sighting sections.
- **Body** (400, 16px to 18px, 1.6): Explanations and human guidance, with short readable measures.
- **Label** (700, 11px to 13px, 1.2, normal case): Navigation, form labels and compact status context.

### Named Rules
**The Two-Voice Rule.** Newsreader owns meaning and memory; Outfit owns action and precision. Do not reverse their jobs to create arbitrary contrast.

## Layout

The main container is capped at 1240px with 24px minimum side gutters. The Home uses a full-bleed image hero, then a 4-column dense signal grid whose 2x2, 1x1, 1x1 and 2x1 blocks fill all eight cells. Browse screens prioritize controls and three-column pet cards, collapsing to one column at 560px. Detail screens pair a portrait pet image with a readable information column, then move into call-to-action, map and timeline chapters.

Spacing uses 8px, 14px, 20px and 34px working steps, with major sections in the 58px to 90px range. Navigation collapses into a two-column mobile menu at 800px and the filter grid becomes a single column at 560px.

## Elevation & Depth

Depth is a hybrid of tonal layering and restrained ambient shadows. Dark green and powder-blue fields establish hierarchy before shadow is added. Shadows appear on the hero brand mark and pet cards with a real offset and soft blur; no hard offset block shadows are used.

### Shadow Vocabulary
- **Ambient content** (`0 18px 48px rgba(39, 50, 57, 0.08)`): Pet cards and major content surfaces at rest.
- **Brand lift** (`0 8px 18px rgba(35, 79, 75, 0.18)`): Small brand mark separation from the header field.
- **Map marker** (`0 3px 12px rgba(39, 50, 57, 0.3)`): Photo marker legibility over map tiles.

### Named Rules
**The Layer Before Shadow Rule.** Reach for background tone, dividers and composition before increasing elevation.

## Shapes

The system uses compact 3px to 5px corners for controls, cards and imagery. Rounded pills are limited to statuses and the inline image gesture in the hero. Inputs have quiet strokes and paper backgrounds; active states use an accessible blue focus ring rather than a glow.

## Components

### Buttons
- **Shape:** Compact 4px corners, 44px minimum height.
- **Primary:** Caramel fill with paper text and 17px horizontal padding.
- **Hover / Focus:** Targeted color and transform transitions; visible blue focus ring; `scale(0.97)` on press.
- **Secondary / Ghost / Tertiary:** Paper fill with quiet border and forest text; hover shifts to the pale forest surface.

### Chips
- **Style:** Status-only pills using marker yellow for missing pets and success green for found pets.
- **State:** They communicate state, never serve as decorative tags.

### Cards / Containers
- **Corner Style:** 5px for pet and sighting cards.
- **Background:** Warm surface or tonal powder/forest sections.
- **Shadow Strategy:** Ambient content shadow for pet cards; flat surfaces elsewhere.
- **Border:** Quiet 1px border at rest, blue-green hint on desktop card hover.
- **Internal Padding:** 18px to 20px for content, 22px for filter surfaces.

### Inputs / Fields
- **Style:** Paper background, 1px quiet border, 3px radius and 44px minimum height.
- **Focus:** Blue-green border and a 3px translucent focus outline.
- **Error / Disabled:** Error uses warm red on a pale warm surface; disabled actions reduce opacity and keep the wait cursor.

### Navigation
- **Style:** Full-width sticky paper header with a split brand and text navigation.
- **States:** Forest active state on a pale forest surface; compact 4px corners; keyboard focus is visible.
- **Mobile:** Menu button opens a two-column navigation grid below the header and closes after route selection.

### Route Atlas Grid
The Home signal grid gives geography the largest visual footprint, places search and community help beside it, and reserves a wide privacy block for the promise that makes the map trustworthy. It uses `grid-auto-flow: dense` and deliberately collapses instead of squeezing labels.

### Motion Language
GSAP reveals the hero in a short stagger, fades sections in as they enter the viewport, scales the story image from a visible 0.84 state to full size, and pins the story copy on larger screens. Framer Motion continues to handle route and pet-list transitions. `prefers-reduced-motion` removes movement and keeps content immediately readable.

## Do's and Don'ts

### Do:
- **Do** keep one clear action hierarchy: caramel for taking action, forest for trust, blue for geography.
- **Do** use actual pet photography where a person needs to recognize the animal or understand the network.
- **Do** keep form controls aligned to a stable grid and collapse them before labels wrap awkwardly.
- **Do** treat loading, empty, success and error states as part of the same paper-and-border language.
- **Do** preserve approximate location and optional contact as product behavior, not merely copy.

### Don't:
- **Don't** add decorative gradients, bokeh, generic statistics or fictional social proof.
- **Don't** introduce section numbers or eyebrow labels above headings.
- **Don't** fill every region with a card; use dividers, type and negative space where they communicate better.
- **Don't** turn status chips into general-purpose decoration.
- **Don't** expose a precise address in the map or redesign the privacy rule for visual effect.
